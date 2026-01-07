/**
 * Marketplace Actions - Barrel Export
 *
 * This module consolidates all marketplace operations:
 * - Product CRUD (create, list, update, delete, publish)
 * - Purchase flow (initiate, record with idempotency)
 * - Delivery (validate, serve with rate limiting)
 *
 * @module lib/actions/marketplace
 */

// ============================================================================
// Product Operations
// ============================================================================

export {
	createDigitalProduct,
	listDigitalProductsForTutor,
	toggleDigitalProductPublish,
	deleteDigitalProduct,
	updateProductPrice,
} from "./products";

// ============================================================================
// Sales/Purchase Operations
// ============================================================================

export {
	initiatePurchase,
	recordPurchase,
	buyDigitalProduct,
	getCommissionDetails,
} from "./sales";

// ============================================================================
// Delivery/Download Operations
// ============================================================================

export {
	validateDownloadAccess,
	serveDownload,
	handleDownload,
} from "./delivery";

// ============================================================================
// Types
// ============================================================================

export type {
	ActionResult,
	ProductFormState,
	ProductFormData,
	CreateProductResult,
	InitiatePurchaseParams,
	InitiatePurchaseResult,
	RecordPurchaseParams,
	RecordPurchaseResult,
	CommissionCalculation,
	ValidateDownloadParams,
	ValidateDownloadResult,
	ServeDownloadResult,
} from "./types";

export {
	productSchema,
	TIER_THRESHOLD_CENTS,
	STANDARD_COMMISSION_RATE,
	REDUCED_COMMISSION_RATE,
	DOWNLOAD_RATE_LIMIT,
	DOWNLOAD_RATE_LIMIT_CONFIG,
} from "./types";
