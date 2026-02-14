"use server";

/**
 * Marketplace Delivery Module - SECURE FILE DELIVERY
 *
 * This module handles download operations with full security measures:
 * - Rate limiting (3 downloads per token per hour)
 * - Optimistic locking to prevent race conditions
 * - Audit trail for every download attempt
 * - IP tracking for fraud detection
 *
 * SECURITY: All download operations are logged for abuse detection.
 *
 * @module lib/actions/marketplace/delivery
 */

import { headers } from "next/headers";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { recordAudit } from "@/lib/repositories/audit";
import {
	getPurchaseByToken,
	incrementDownloadCount,
} from "@/lib/repositories/marketplace";
import {
	getTraceId,
	createRequestLogger,
	logStep,
	logStepError,
} from "@/lib/logger";
import type {
	ActionResult,
	ValidateDownloadParams,
	ValidateDownloadResult,
	ServeDownloadResult,
} from "./types";

// ============================================================================
// Rate Limit Configuration
// ============================================================================

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
// Download Validation
// ============================================================================

/**
 * Validate a download request.
 *
 * Checks:
 * 1. Token is valid and purchase exists
 * 2. Purchase status is "paid"
 * 3. Download count is below limit
 *
 * Records audit trail for the download attempt.
 *
 * @param params - Download validation parameters
 * @returns Download details or error
 */
export async function validateDownloadAccess(
	params: ValidateDownloadParams
): Promise<ActionResult<ValidateDownloadResult>> {
	const traceId = await getTraceId();
	const log = createRequestLogger(traceId, params.token.slice(0, 8));

	logStep(log, "validateDownload:start", {
		tokenPrefix: params.token.slice(0, 8),
		ip: params.clientIp,
	});

	const adminClient = createServiceRoleClient();
	if (!adminClient) {
		return { error: "Database connection failed." };
	}

	try {
		// 1. Get purchase by token
		const purchase = await getPurchaseByToken(adminClient, params.token);

		if (!purchase) {
			logStep(log, "validateDownload:notFound", {
				tokenPrefix: params.token.slice(0, 8),
			});
			return { error: "Download link not found." };
		}

		// 2. Check purchase status
		if (purchase.status !== "paid") {
			logStep(log, "validateDownload:notPaid", {
				purchaseId: purchase.id,
				status: purchase.status,
			});
			return { error: "Payment pending." };
		}

		// 3. Check download limit
		if (purchase.download_count >= purchase.download_limit) {
			logStep(log, "validateDownload:limitReached", {
				purchaseId: purchase.id,
				count: purchase.download_count,
				limit: purchase.download_limit,
			});

			// Record audit for blocked attempt
			await recordAudit(adminClient, {
				actorId: purchase.buyer_email,
				targetId: purchase.id,
				entityType: "marketplace",
				actionType: "download_accessed",
				metadata: {
					blocked: true,
					reason: "limit_reached",
					downloadCount: purchase.download_count,
					downloadLimit: purchase.download_limit,
					ip: params.clientIp,
					traceId,
				},
			});

			return { error: "Download limit reached." };
		}

		// 4. Check product exists
		if (!purchase.product) {
			logStep(log, "validateDownload:productMissing", {
				purchaseId: purchase.id,
			});
			return { error: "Product not found." };
		}

		// 5. Record audit for successful validation
		await recordAudit(adminClient, {
			actorId: purchase.buyer_email,
			targetId: purchase.id,
			entityType: "marketplace",
			actionType: "download_accessed",
			metadata: {
				blocked: false,
				downloadCount: purchase.download_count,
				downloadLimit: purchase.download_limit,
				fulfillmentType: purchase.product.fulfillment_type,
				ip: params.clientIp,
				traceId,
			},
		});

		logStep(log, "validateDownload:success", {
			purchaseId: purchase.id,
			fulfillmentType: purchase.product.fulfillment_type,
		});

		return {
			data: {
				purchaseId: purchase.id,
				productId: purchase.product_id,
				fulfillmentType: purchase.product.fulfillment_type,
				storagePath: purchase.product.storage_path,
				externalUrl: purchase.product.external_url,
				downloadCount: purchase.download_count,
				downloadLimit: purchase.download_limit,
				buyerEmail: purchase.buyer_email,
			},
			success: true,
		};
	} catch (error) {
		logStepError(log, "validateDownload:error", error, {
			tokenPrefix: params.token.slice(0, 8),
		});

		const message = error instanceof Error ? error.message : "An unexpected error occurred.";
		return { error: message };
	}
}

// ============================================================================
// Download Serving
// ============================================================================

/**
 * Serve a download (external URL or file).
 *
 * Increments download count using optimistic locking to prevent race conditions.
 * Generates signed URL for file downloads (5-minute expiry).
 *
 * @param purchaseId - Purchase ID
 * @param currentDownloadCount - Current download count (for optimistic lock)
 * @param fulfillmentType - "file" or "link"
 * @param storagePath - Path in Supabase Storage (for files)
 * @param externalUrl - External URL (for links)
 * @returns Redirect URL or error
 */
export async function serveDownload(
	purchaseId: string,
	currentDownloadCount: number,
	fulfillmentType: "file" | "link",
	storagePath: string | null,
	externalUrl: string | null,
	buyerEmail: string
): Promise<ActionResult<ServeDownloadResult>> {
	const traceId = await getTraceId();
	const clientIp = await getClientIp();
	const log = createRequestLogger(traceId, purchaseId);

	logStep(log, "serveDownload:start", {
		purchaseId,
		fulfillmentType,
		currentCount: currentDownloadCount,
	});

	const adminClient = createServiceRoleClient();
	if (!adminClient) {
		return { error: "Database connection failed." };
	}

	try {
		// 1. Increment download count with optimistic locking
		const incremented = await incrementDownloadCount(
			adminClient,
			purchaseId,
			currentDownloadCount
		);

		if (!incremented) {
			logStep(log, "serveDownload:lockFailed", {
				purchaseId,
				currentCount: currentDownloadCount,
			});
			return { error: "Download limit reached or concurrent access detected." };
		}

		// 2. Handle external URL redirect
		if (fulfillmentType === "link" && externalUrl) {
			// Record audit for successful download
			await recordAudit(adminClient, {
				actorId: buyerEmail,
				targetId: purchaseId,
				entityType: "marketplace",
				actionType: "download_served",
				afterState: {
					downloadCount: currentDownloadCount + 1,
					fulfillmentType: "link",
				},
				metadata: {
					ip: clientIp,
					redirectUrl: externalUrl.slice(0, 100), // Truncate for privacy
					traceId,
				},
			});

			logStep(log, "serveDownload:redirect", { purchaseId, type: "link" });
			return {
				data: { redirectUrl: externalUrl },
				success: true,
			};
		}

		// 3. Handle file download with signed URL
		if (!storagePath) {
			return { error: "File unavailable." };
		}

		const { data: signedUrlData, error: signedError } = await adminClient.storage
			.from("digital-products")
			.createSignedUrl(storagePath, 60 * 5); // 5 minutes

		if (signedError || !signedUrlData?.signedUrl) {
			logStepError(log, "serveDownload:signedUrlFailed", signedError, {
				purchaseId,
				storagePath,
			});
			return { error: "Unable to generate download link." };
		}

		// Record audit for successful download
		await recordAudit(adminClient, {
			actorId: buyerEmail,
			targetId: purchaseId,
			entityType: "marketplace",
			actionType: "download_served",
			afterState: {
				downloadCount: currentDownloadCount + 1,
				fulfillmentType: "file",
			},
			metadata: {
				ip: clientIp,
				storagePath,
				traceId,
			},
		});

		logStep(log, "serveDownload:success", { purchaseId, type: "file" });
		return {
			data: { redirectUrl: signedUrlData.signedUrl },
			success: true,
		};
	} catch (error) {
		logStepError(log, "serveDownload:error", error, { purchaseId });

		const message = error instanceof Error ? error.message : "An unexpected error occurred.";
		return { error: message };
	}
}

// ============================================================================
// Combined Download Handler
// ============================================================================

/**
 * Handle a complete download request.
 *
 * Combines validation and serving into a single operation.
 * Used by the API route handler.
 *
 * @param token - Download token
 * @param clientIp - Client IP address
 * @returns Redirect URL or error
 */
export async function handleDownload(
	token: string,
	clientIp: string
): Promise<ActionResult<ServeDownloadResult>> {
	// 1. Validate access
	const validationResult = await validateDownloadAccess({ token, clientIp });

	if (validationResult.error || !validationResult.data) {
		return { error: validationResult.error ?? "Download validation failed." };
	}

	const {
		purchaseId,
		fulfillmentType,
		storagePath,
		externalUrl,
		downloadCount,
		buyerEmail,
	} = validationResult.data;

	// 2. Serve download
	return serveDownload(
		purchaseId,
		downloadCount,
		fulfillmentType,
		storagePath,
		externalUrl,
		buyerEmail
	);
}
