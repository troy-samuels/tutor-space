"use server";

/**
 * Marketplace Sales Module - CRITICAL FINANCIAL OPERATIONS
 *
 * This module handles purchase operations with full safety measures:
 * - Idempotency protection via withIdempotency()
 * - Audit trail with before/after state via recordAudit()
 * - Structured logging with traceId, IP tracking
 * - Repository pattern for all database operations
 *
 * SECURITY: All purchase operations are audited for GDPR/SOC2 compliance.
 *
 * @module lib/actions/marketplace/sales
 */

import { randomBytes } from "crypto";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { withIdempotency } from "@/lib/utils/idempotency";
import { recordAudit } from "@/lib/repositories/audit";
import {
	getProductWithTutor,
	createPurchaseRecord,
	getPurchaseBySessionId,
	updatePurchaseStatus,
	recordMarketplaceTransaction,
	calculateCommission,
} from "@/lib/repositories/marketplace";
import {
	getTraceId,
	createRequestLogger,
	logStep,
	logStepError,
} from "@/lib/logger";
import type {
	ActionResult,
	InitiatePurchaseParams,
	InitiatePurchaseResult,
	RecordPurchaseParams,
	RecordPurchaseResult,
	CommissionCalculation,
	TIER_THRESHOLD_CENTS,
	STANDARD_COMMISSION_RATE,
	REDUCED_COMMISSION_RATE,
} from "./types";

// ============================================================================
// Internal Helpers
// ============================================================================

/**
 * Get client IP from request headers.
 */
async function getClientIp(): Promise<string> {
	const headersList = await headers();
	return (
		headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
		headersList.get("x-real-ip") ||
		"unknown"
	);
}

// ============================================================================
// Commission Calculation
// ============================================================================

/**
 * Calculate commission for a purchase.
 *
 * Commission tiers:
 * - Standard (15%): Lifetime sales < $500
 * - Reduced (10%): Lifetime sales >= $500
 *
 * @param tutorId - Tutor ID
 * @param priceCents - Product price in cents
 * @returns Commission calculation details
 */
export async function getCommissionDetails(
	tutorId: string,
	priceCents: number
): Promise<ActionResult<CommissionCalculation>> {
	const traceId = await getTraceId();
	const log = createRequestLogger(traceId, tutorId);

	logStep(log, "getCommission:start", { tutorId, priceCents });

	const adminClient = createServiceRoleClient();
	if (!adminClient) {
		return { error: "Database connection failed." };
	}

	try {
		const commission = await calculateCommission(adminClient, tutorId, priceCents);

		const result: CommissionCalculation = {
			...commission,
			lifetimeSalesCents: 0, // We'll get this separately
			tierName: commission.commissionRate === 0.10 ? "reduced" : "standard",
		};

		logStep(log, "getCommission:success", {
			tutorId,
			commissionRate: commission.commissionRate,
			platformFee: commission.platformFeeCents,
		});

		return { data: result, success: true };
	} catch (error) {
		logStepError(log, "getCommission:error", error, { tutorId, priceCents });
		return { error: "Failed to calculate commission." };
	}
}

// ============================================================================
// Purchase Initiation
// ============================================================================

/**
 * Initiate a digital product purchase.
 *
 * Creates a pending purchase record and redirects to Stripe checkout.
 * Uses Stripe Connect destination charges for direct tutor payouts.
 *
 * @param params - Purchase initiation parameters
 * @returns Checkout URL or error
 */
export async function initiatePurchase(
	params: InitiatePurchaseParams
): Promise<ActionResult<InitiatePurchaseResult>> {
	const traceId = await getTraceId();
	const clientIp = await getClientIp();
	const log = createRequestLogger(traceId, params.productId);

	logStep(log, "initiatePurchase:start", {
		productId: params.productId,
		buyerEmail: params.buyerEmail,
		ip: clientIp,
	});

	const adminClient = createServiceRoleClient();
	if (!adminClient) {
		return { error: "Database connection failed." };
	}

	try {
		// 1. Get product with tutor info
		const product = await getProductWithTutor(adminClient, params.productId);

		if (!product || !product.published) {
			logStep(log, "initiatePurchase:notFound", { productId: params.productId });
			return { error: "Product not available." };
		}

		if (!product.stripe_price_id || !product.price_cents) {
			return { error: "Product not ready for checkout." };
		}

		const tutorStripeAccount = product.tutor?.stripe_account_id;
		if (!tutorStripeAccount) {
			return { error: "Tutor is not ready to receive payments." };
		}

		// 2. Calculate commission
		const commission = await calculateCommission(
			adminClient,
			product.tutor_id,
			product.price_cents
		);

		// 3. Generate download token
		const downloadToken = randomBytes(32).toString("hex");

		// 4. Create purchase record
		const purchase = await createPurchaseRecord(adminClient, {
			productId: product.id,
			tutorId: product.tutor_id,
			buyerEmail: params.buyerEmail,
			buyerName: params.buyerName,
			downloadToken,
			downloadLimit: 3,
		});

		// 5. Record audit for purchase initiation
		await recordAudit(adminClient, {
			actorId: params.buyerEmail,
			targetId: purchase.id,
			entityType: "marketplace",
			actionType: "purchase_initiated",
			afterState: {
				productId: product.id,
				productTitle: product.title,
				priceCents: product.price_cents,
				commissionRate: commission.commissionRate,
			},
			metadata: {
				tutorId: product.tutor_id,
				ip: clientIp,
				traceId,
			},
		});

		// 6. Create Stripe checkout session
		const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.tutorlingua.co";
		const successUrl = `${appUrl}/student/library?purchase_success=true`;
		const cancelUrl = `${appUrl}/student/library?purchase_canceled=1`;

		const session = await stripe.checkout.sessions.create({
			mode: "payment",
			customer_email: params.buyerEmail,
			line_items: [{ price: product.stripe_price_id, quantity: 1 }],
			success_url: successUrl,
			cancel_url: cancelUrl,
			payment_intent_data: {
				application_fee_amount: commission.platformFeeCents,
				transfer_data: {
					destination: tutorStripeAccount,
				},
			},
			metadata: {
				digital_product_purchase_id: purchase.id,
				product_type: "digital_download",
				tutorId: product.tutor_id,
				studentUserId: params.buyerUserId ?? "",
				productId: product.id,
			},
		});

		// 7. Update purchase with Stripe session ID
		await updatePurchaseStatus(adminClient, purchase.id, "pending", {
			stripe_session_id: session.id,
		});

		logStep(log, "initiatePurchase:success", {
			purchaseId: purchase.id,
			sessionId: session.id,
		});

		return {
			data: {
				purchaseId: purchase.id,
				checkoutUrl: session.url ?? "",
			},
			success: true,
		};
	} catch (error) {
		logStepError(log, "initiatePurchase:error", error, {
			productId: params.productId,
			buyerEmail: params.buyerEmail,
		});

		const message = error instanceof Error ? error.message : "An unexpected error occurred.";
		return { error: message };
	}
}

// ============================================================================
// Purchase Recording (Webhook Handler)
// ============================================================================

/**
 * Record a completed purchase from Stripe webhook.
 *
 * CRITICAL: This function modifies financial state and includes:
 * - Idempotency protection (prevents double-recording on webhook retries)
 * - Audit trail (records commission calculation for compliance)
 * - Structured logging with traceId
 *
 * @param params - Purchase recording parameters from Stripe webhook
 * @returns Success with purchase ID, or error
 */
export async function recordPurchase(
	params: RecordPurchaseParams
): Promise<ActionResult<RecordPurchaseResult>> {
	const traceId = await getTraceId();
	const log = createRequestLogger(traceId, params.stripeSessionId);

	logStep(log, "recordPurchase:start", {
		sessionId: params.stripeSessionId,
		tutorId: params.tutorId,
		grossAmount: params.grossAmountCents,
	});

	const adminClient = createServiceRoleClient();
	if (!adminClient) {
		return { error: "Database connection failed." };
	}

	// Idempotency key based on Stripe session ID - prevents double-recording
	const idempotencyKey = `purchase:${params.stripeSessionId}`;

	try {
		const { cached, response } = await withIdempotency(
			adminClient,
			idempotencyKey,
			async (): Promise<RecordPurchaseResult> => {
				// 1. Get purchase record
				const purchase = await getPurchaseBySessionId(
					adminClient,
					params.stripeSessionId
				);

				if (!purchase) {
					throw new Error("Purchase record not found for session.");
				}

				// 2. Calculate commission at recording time (single source of truth)
				const commission = await calculateCommission(
					adminClient,
					params.tutorId,
					params.grossAmountCents
				);

				// 3. Update purchase status to paid
				await updatePurchaseStatus(adminClient, purchase.id, "paid", {
					stripe_payment_intent_id: params.stripeChargeId,
				});

				// 4. Record marketplace transaction
				await recordMarketplaceTransaction(adminClient, {
					tutorId: params.tutorId,
					purchaseId: purchase.id,
					grossAmountCents: params.grossAmountCents,
					platformCommissionCents: commission.platformFeeCents,
					netAmountCents: commission.netAmountCents,
					commissionRate: commission.commissionRate,
					stripeChargeId: params.stripeChargeId,
					status: "completed",
				});

				// 5. Record audit trail for purchase completion
				await recordAudit(adminClient, {
					actorId: params.buyerEmail,
					targetId: purchase.id,
					entityType: "marketplace",
					actionType: "purchase_completed",
					afterState: {
						grossAmountCents: params.grossAmountCents,
						commissionRate: commission.commissionRate,
						platformFeeCents: commission.platformFeeCents,
						netToTutorCents: commission.netAmountCents,
					},
					metadata: {
						stripeSessionId: params.stripeSessionId,
						stripeChargeId: params.stripeChargeId,
						productId: purchase.product_id,
						tutorId: params.tutorId,
						traceId,
					},
				});

				// 6. Record audit trail for commission calculation
				await recordAudit(adminClient, {
					actorId: "system",
					targetId: purchase.id,
					entityType: "marketplace",
					actionType: "commission_calculated",
					afterState: {
						commissionRate: commission.commissionRate,
						tierName: commission.commissionRate === 0.10 ? "reduced" : "standard",
						platformFeeCents: commission.platformFeeCents,
					},
					metadata: {
						tutorId: params.tutorId,
						grossAmountCents: params.grossAmountCents,
						traceId,
					},
				});

				return {
					success: true,
					purchaseId: purchase.id,
				};
			},
			traceId
		);

		if (cached) {
			logStep(log, "recordPurchase:cached", {
				sessionId: params.stripeSessionId,
				purchaseId: response.purchaseId,
			});
		} else {
			logStep(log, "recordPurchase:success", {
				sessionId: params.stripeSessionId,
				purchaseId: response.purchaseId,
			});
		}

		return {
			data: { ...response, cached },
			success: true,
		};
	} catch (error) {
		logStepError(log, "recordPurchase:error", error, {
			sessionId: params.stripeSessionId,
			tutorId: params.tutorId,
		});

		const message = error instanceof Error ? error.message : "An unexpected error occurred.";
		return { error: message };
	}
}

// ============================================================================
// Legacy Compatibility
// ============================================================================

/**
 * Buy a digital product (legacy action for authenticated users).
 *
 * This wraps initiatePurchase for backward compatibility with existing UI.
 */
export async function buyDigitalProduct(
	productId: string
): Promise<{ url?: string; error?: string }> {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user?.email) {
		return { error: "Sign in to purchase." };
	}

	const result = await initiatePurchase({
		productId,
		buyerEmail: user.email,
		buyerName: user.user_metadata?.full_name ?? null,
		buyerUserId: user.id,
	});

	if (result.error) {
		return { error: result.error };
	}

	return { url: result.data?.checkoutUrl };
}
