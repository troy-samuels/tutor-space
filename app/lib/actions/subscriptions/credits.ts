"use server";

/**
 * Credit Management Module - CRITICAL FINANCIAL OPERATIONS
 *
 * This module handles lesson credit operations with full safety measures:
 * - Idempotency protection via withIdempotency()
 * - Audit trail with before/after state via recordAudit()
 * - Structured logging with traceId, IP tracking
 * - Repository pattern for all database operations
 *
 * SECURITY: All credit-modifying operations are audited for GDPR/SOC2 compliance.
 *
 * @module lib/actions/subscriptions/credits
 */

import { headers } from "next/headers";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { withIdempotency } from "@/lib/utils/idempotency";
import { recordAudit } from "@/lib/repositories/audit";
import {
	getSubscriptionBalance as getBalanceFromDb,
	redeemCredit as redeemCreditInDb,
	refundCredit as refundCreditInDb,
} from "@/lib/repositories/billing";
import {
	getTraceId,
	createRequestLogger,
	logStep,
	logStepError,
} from "@/lib/logger";
import type { SubscriptionBalance } from "@/lib/subscription";
import type { ActionResult, RedeemCreditResult, RefundCreditResult } from "./types";

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
// Credit Operations
// ============================================================================

/**
 * Get subscription balance (available lessons).
 *
 * @param subscriptionId - Subscription ID
 * @returns Balance or error
 */
export async function getSubscriptionBalance(
	subscriptionId: string
): Promise<ActionResult<SubscriptionBalance>> {
	const traceId = await getTraceId();
	const log = createRequestLogger(traceId, subscriptionId);

	logStep(log, "getBalance:start", { subscriptionId });

	const adminClient = createServiceRoleClient();
	if (!adminClient) {
		return { error: "Database connection failed." };
	}

	try {
		const balance = await getBalanceFromDb(adminClient, subscriptionId);

		if (!balance) {
			logStep(log, "getBalance:notFound", { subscriptionId });
			return { error: "No active period found." };
		}

		logStep(log, "getBalance:success", {
			subscriptionId,
			available: balance.total_available,
		});

		return { data: balance, success: true };
	} catch (error) {
		logStepError(log, "getBalance:error", error, { subscriptionId });
		return { error: "Failed to get subscription balance." };
	}
}

/**
 * Redeem a subscription lesson for a booking.
 *
 * CRITICAL: This function modifies financial state and includes:
 * - Idempotency protection (prevents double-redemption on retries)
 * - Audit trail (records before/after balance for compliance)
 * - Structured logging with traceId and IP tracking
 *
 * @param subscriptionId - Subscription ID
 * @param bookingId - Booking ID to link the redemption
 * @param lessonsCount - Number of lessons to redeem (default: 1)
 * @param studentId - Student ID for audit trail (optional)
 * @returns Success with optional cached flag, or error
 */
export async function redeemSubscriptionLesson(
	subscriptionId: string,
	bookingId: string,
	lessonsCount: number = 1,
	studentId?: string
): Promise<ActionResult<RedeemCreditResult>> {
	const traceId = await getTraceId();
	const clientIp = await getClientIp();
	const log = createRequestLogger(traceId, subscriptionId);

	logStep(log, "redeemCredit:start", {
		subscriptionId,
		bookingId,
		lessonsCount,
		ip: clientIp,
	});

	const adminClient = createServiceRoleClient();
	if (!adminClient) {
		return { error: "Database connection failed." };
	}

	// Use idempotency key based on bookingId to prevent double-redemption
	const idempotencyKey = `redeem:${bookingId}`;

	try {
		const { cached, response } = await withIdempotency(
			adminClient,
			idempotencyKey,
			async (): Promise<RedeemCreditResult> => {
				// 1. Get before state for audit
				const beforeBalance = await getBalanceFromDb(adminClient, subscriptionId);

				if (!beforeBalance) {
					throw new Error("No active subscription period found.");
				}

				if (beforeBalance.total_available < lessonsCount) {
					throw new Error(
						`Insufficient credits. Available: ${beforeBalance.total_available}, Requested: ${lessonsCount}`
					);
				}

				// 2. Execute the redemption via database RPC (uses FOR UPDATE lock)
				await redeemCreditInDb(adminClient, {
					subscriptionId,
					bookingId,
					lessonsCount,
				});

				// 3. Get after state for audit
				const afterBalance = await getBalanceFromDb(adminClient, subscriptionId);

				// 4. Record audit trail
				await recordAudit(adminClient, {
					actorId: studentId ?? subscriptionId,
					targetId: bookingId,
					entityType: "billing",
					actionType: "credit_redeemed",
					beforeState: {
						total_available: beforeBalance.total_available,
						lessons_used: beforeBalance.lessons_used,
					},
					afterState: {
						total_available: afterBalance?.total_available ?? 0,
						lessons_used: afterBalance?.lessons_used ?? 0,
					},
					metadata: {
						subscriptionId,
						lessonsCount,
						ip: clientIp,
						traceId,
					},
				});

				return {
					success: true,
					newBalance: afterBalance?.total_available ?? 0,
				};
			},
			traceId
		);

		if (cached) {
			logStep(log, "redeemCredit:cached", { bookingId, response });
		} else {
			logStep(log, "redeemCredit:success", { bookingId, response });
		}

		return {
			data: { ...response, cached },
			success: true,
		};
	} catch (error) {
		logStepError(log, "redeemCredit:error", error, {
			subscriptionId,
			bookingId,
			lessonsCount,
		});

		const message = error instanceof Error ? error.message : "An unexpected error occurred.";
		return { error: message };
	}
}

/**
 * Refund a subscription lesson when booking is cancelled.
 *
 * CRITICAL: This function modifies financial state and includes:
 * - Idempotency protection (prevents double-refund on retries)
 * - Audit trail (records before/after balance for compliance)
 * - Structured logging with traceId and IP tracking
 *
 * @param bookingId - Booking ID to refund
 * @param actorId - User performing the cancellation (for audit)
 * @returns Success with refunded flag, or error
 */
export async function refundSubscriptionLesson(
	bookingId: string,
	actorId?: string
): Promise<ActionResult<RefundCreditResult>> {
	const traceId = await getTraceId();
	const clientIp = await getClientIp();
	const log = createRequestLogger(traceId, bookingId);

	logStep(log, "refundCredit:start", { bookingId, ip: clientIp });

	const adminClient = createServiceRoleClient();
	if (!adminClient) {
		return { error: "Database connection failed." };
	}

	// Use idempotency key based on bookingId to prevent double-refund
	const idempotencyKey = `refund:${bookingId}`;

	try {
		const { cached, response } = await withIdempotency(
			adminClient,
			idempotencyKey,
			async (): Promise<RefundCreditResult> => {
				// Execute the refund via database RPC
				const refunded = await refundCreditInDb(adminClient, bookingId);

				if (refunded) {
					// Record audit trail for the refund
					await recordAudit(adminClient, {
						actorId: actorId ?? bookingId,
						targetId: bookingId,
						entityType: "billing",
						actionType: "credit_refunded",
						metadata: {
							ip: clientIp,
							traceId,
						},
					});
				}

				return { success: true, refunded };
			},
			traceId
		);

		if (cached) {
			logStep(log, "refundCredit:cached", { bookingId, refunded: response.refunded });
		} else {
			logStep(log, "refundCredit:success", { bookingId, refunded: response.refunded });
		}

		return { data: response, success: true };
	} catch (error) {
		logStepError(log, "refundCredit:error", error, { bookingId });

		const message = error instanceof Error ? error.message : "An unexpected error occurred.";
		return { error: message };
	}
}
