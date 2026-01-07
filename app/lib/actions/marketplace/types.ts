/**
 * Marketplace Module Types
 *
 * Shared types for digital products, purchases, and delivery operations.
 *
 * @module lib/actions/marketplace/types
 */

import { z } from "zod";

// ============================================================================
// Action Result Types
// ============================================================================

export interface ActionResult<T = void> {
	data?: T;
	success?: boolean;
	error?: string;
}

// ============================================================================
// Product Types
// ============================================================================

export const productSchema = z.object({
	title: z.string().min(3, "Title is required"),
	description: z.string().max(2000).optional(),
	price: z.coerce.number().min(1, "Price must be at least $1"),
	currency: z.string().min(3).default("usd"),
	fulfillment_type: z.enum(["file", "link"]).default("file"),
	external_url: z.string().url().optional(),
	category: z.string().default("worksheet"),
	language: z.string().optional(),
	level: z.enum(["beginner", "intermediate", "advanced", "all"]).optional(),
});

export type ProductFormData = z.infer<typeof productSchema>;

export interface ProductFormState {
	error?: string;
	success?: string;
}

export interface CreateProductResult {
	productId: string;
	slug: string;
}

export interface UpdateProductResult {
	success: boolean;
}

// ============================================================================
// Purchase Types
// ============================================================================

export interface InitiatePurchaseParams {
	productId: string;
	buyerEmail: string;
	buyerName: string | null;
	buyerUserId?: string;
}

export interface InitiatePurchaseResult {
	purchaseId: string;
	checkoutUrl: string;
}

export interface RecordPurchaseParams {
	stripeSessionId: string;
	tutorId: string;
	buyerEmail: string;
	grossAmountCents: number;
	stripeChargeId?: string;
}

export interface RecordPurchaseResult {
	success: boolean;
	purchaseId: string;
	cached?: boolean;
}

// ============================================================================
// Commission Types
// ============================================================================

/** Commission tier threshold in cents ($500 = 50000 cents) */
export const TIER_THRESHOLD_CENTS = 50000;

/** Standard commission rate (15%) for lifetime sales < $500 */
export const STANDARD_COMMISSION_RATE = 0.15;

/** Reduced commission rate (10%) for lifetime sales >= $500 */
export const REDUCED_COMMISSION_RATE = 0.10;

export interface CommissionCalculation {
	grossAmountCents: number;
	commissionRate: number;
	platformFeeCents: number;
	netAmountCents: number;
	lifetimeSalesCents: number;
	tierName: "standard" | "reduced";
}

// ============================================================================
// Download/Delivery Types
// ============================================================================

/** Rate limit for downloads: 3 per hour per token */
export const DOWNLOAD_RATE_LIMIT = {
	maxDownloads: 3,
	windowMs: 60 * 60 * 1000, // 1 hour in milliseconds
} as const;

export const DOWNLOAD_RATE_LIMIT_CONFIG = DOWNLOAD_RATE_LIMIT;

export interface ValidateDownloadParams {
	token: string;
	clientIp: string;
}

export interface ValidateDownloadResult {
	purchaseId: string;
	productId: string;
	fulfillmentType: "file" | "link";
	storagePath: string | null;
	externalUrl: string | null;
	downloadCount: number;
	downloadLimit: number;
	buyerEmail: string;
}

export interface ServeDownloadResult {
	redirectUrl: string;
}

// ============================================================================
// Audit Metadata Types
// ============================================================================

export interface ProductAuditMetadata {
	productId: string;
	productTitle: string;
	tutorId: string;
	traceId: string;
}

export interface PurchaseAuditMetadata {
	purchaseId: string;
	productId: string;
	tutorId: string;
	stripeSessionId: string;
	buyerEmail: string;
	traceId: string;
}

export interface DownloadAuditMetadata {
	purchaseId: string;
	productId: string;
	downloadCount: number;
	ip: string;
	traceId: string;
}

export interface PriceChangeAuditState {
	price_cents: number;
	currency?: string;
}
