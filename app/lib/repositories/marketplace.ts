/**
 * Marketplace Repository
 *
 * Centralizes all database operations for digital products, purchases, and transactions.
 * Follows the billing.ts pattern: typed, throws on error, RPC wrappers.
 *
 * Key features:
 * - Soft delete support for products (deleted_at IS NULL filtering)
 * - Atomic sale recording via database RPC
 * - Download token validation with structured results
 * - Single source of truth for commission calculation
 *
 * @module lib/repositories/marketplace
 */

import type { SupabaseClient } from "@supabase/supabase-js";

// ============================================================================
// Types
// ============================================================================

export interface DigitalProduct {
	id: string;
	tutor_id: string;
	slug: string;
	title: string;
	description: string | null;
	price_cents: number;
	currency: string;
	fulfillment_type: "file" | "link";
	storage_path: string | null;
	external_url: string | null;
	stripe_product_id: string | null;
	stripe_price_id: string | null;
	published: boolean;
	category: string | null;
	language: string | null;
	level: string | null;
	created_at: string;
	updated_at: string;
	deleted_at: string | null;
	// Marketplace stats
	total_sales?: number | null;
	total_revenue_cents?: number | null;
}

export interface DigitalProductWithTutor extends DigitalProduct {
	tutor: {
		stripe_account_id: string | null;
		full_name: string | null;
		username: string | null;
	} | null;
}

export interface DigitalProductPurchase {
	id: string;
	product_id: string;
	tutor_id: string;
	buyer_email: string;
	buyer_name: string | null;
	download_token: string;
	download_count: number;
	download_limit: number;
	status: "pending" | "paid" | "refunded";
	stripe_session_id: string | null;
	stripe_payment_intent_id: string | null;
	created_at: string;
}

export interface MarketplaceTransaction {
	id: string;
	tutor_id: string;
	purchase_id: string;
	gross_amount_cents: number;
	platform_commission_cents: number;
	net_amount_cents: number;
	commission_rate: number;
	status: "pending" | "completed" | "refunded";
	stripe_charge_id: string | null;
	created_at: string;
}

export interface CreatePurchaseParams {
	productId: string;
	tutorId: string;
	buyerEmail: string;
	buyerName: string | null;
	downloadToken: string;
	downloadLimit?: number;
}

export interface RecordTransactionParams {
	tutorId: string;
	purchaseId: string;
	grossAmountCents: number;
	platformCommissionCents: number;
	netAmountCents: number;
	commissionRate: number;
	stripeChargeId?: string | null;
	status?: "pending" | "completed" | "refunded";
}

export interface CreateProductParams {
	tutorId: string;
	slug: string;
	title: string;
	description: string | null;
	priceCents: number;
	currency: string;
	fulfillmentType: "file" | "link";
	storagePath: string | null;
	externalUrl: string | null;
	stripeProductId: string;
	stripePriceId: string;
	category: string;
	language: string | null;
	level: string | null;
}

// Atomic sale recording types
export interface RecordSaleInput {
	purchaseId: string;
	productId: string;
	tutorId: string;
	grossAmountCents: number;
	stripePaymentIntentId: string;
}

export interface RecordSaleResult {
	transactionId: string;
	commissionRate: number;
	platformCommissionCents: number;
	netAmountCents: number;
}

// Download token validation types
export type DownloadValidationReason =
	| "not_found"
	| "not_paid"
	| "limit_reached"
	| "product_missing";

export interface DownloadValidationResult {
	valid: boolean;
	reason?: DownloadValidationReason;
	purchase?: {
		id: string;
		productId: string;
		downloadCount: number;
		downloadLimit: number;
		tutorId: string;
	};
	product?: {
		storagePath: string | null;
		fulfillmentType: string | null;
		externalUrl: string | null;
		tutorId: string;
	};
}

// Marketplace summary type
export interface MarketplaceSummary {
	totalGross: number;
	totalCommission: number;
	totalNet: number;
	transactionCount: number;
}

// ============================================================================
// Product Operations
// ============================================================================

/**
 * Get a product by ID.
 * Excludes soft-deleted records.
 */
export async function getProductById(
	client: SupabaseClient,
	productId: string
): Promise<DigitalProduct | null> {
	const { data, error } = await client
		.from("digital_products")
		.select("*")
		.eq("id", productId)
		.is("deleted_at", null)
		.single();

	if (error?.code === "PGRST116" || !data) {
		return null;
	}
	if (error) throw error;

	return data as DigitalProduct;
}

/**
 * Get a product by ID with tutor profile info.
 * Excludes soft-deleted records.
 */
export async function getProductWithTutor(
	client: SupabaseClient,
	productId: string
): Promise<DigitalProductWithTutor | null> {
	const { data, error } = await client
		.from("digital_products")
		.select(`
			*,
			tutor:profiles!tutor_id (
				stripe_account_id,
				full_name,
				username
			)
		`)
		.eq("id", productId)
		.is("deleted_at", null)
		.single();

	if (error?.code === "PGRST116" || !data) {
		return null;
	}
	if (error) throw error;

	return data as unknown as DigitalProductWithTutor;
}

/**
 * Get product by slug and tutor ID.
 * Excludes soft-deleted records.
 */
export async function getProductBySlug(
	client: SupabaseClient,
	tutorId: string,
	slug: string
): Promise<DigitalProduct | null> {
	const { data, error } = await client
		.from("digital_products")
		.select("*")
		.eq("tutor_id", tutorId)
		.eq("slug", slug)
		.is("deleted_at", null)
		.maybeSingle();

	if (error && error.code !== "PGRST116") throw error;
	if (!data) return null;

	return data as DigitalProduct;
}

/**
 * List all products for a tutor.
 * Excludes soft-deleted records.
 */
export async function listProductsByTutor(
	client: SupabaseClient,
	tutorId: string,
	options?: { includeUnpublished?: boolean }
): Promise<DigitalProduct[]> {
	let query = client
		.from("digital_products")
		.select("*")
		.eq("tutor_id", tutorId)
		.is("deleted_at", null)
		.order("created_at", { ascending: false });

	if (!options?.includeUnpublished) {
		query = query.eq("published", true);
	}

	const { data, error } = await query;

	if (error) {
		throw error;
	}

	return (data ?? []) as DigitalProduct[];
}

/**
 * Create a new digital product.
 */
export async function createProduct(
	client: SupabaseClient,
	params: CreateProductParams
): Promise<DigitalProduct> {
	const { data, error } = await client
		.from("digital_products")
		.insert({
			tutor_id: params.tutorId,
			slug: params.slug,
			title: params.title,
			description: params.description,
			price_cents: params.priceCents,
			currency: params.currency,
			fulfillment_type: params.fulfillmentType,
			storage_path: params.storagePath,
			external_url: params.externalUrl,
			stripe_product_id: params.stripeProductId,
			stripe_price_id: params.stripePriceId,
			category: params.category,
			language: params.language,
			level: params.level,
		})
		.select()
		.single();

	if (error) {
		throw error;
	}

	return data as DigitalProduct;
}

/**
 * Update a product.
 */
export async function updateProduct(
	client: SupabaseClient,
	productId: string,
	tutorId: string,
	updates: Partial<{
		title: string;
		description: string | null;
		price_cents: number;
		published: boolean;
		category: string;
		language: string | null;
		level: string | null;
		stripe_price_id: string;
	}>
): Promise<void> {
	const { error } = await client
		.from("digital_products")
		.update({
			...updates,
			updated_at: new Date().toISOString(),
		})
		.eq("id", productId)
		.eq("tutor_id", tutorId);

	if (error) {
		throw error;
	}
}

/**
 * Soft delete a product.
 * Sets deleted_at timestamp and unpublishes the product.
 * Preserves purchase history integrity.
 */
export async function softDeleteProduct(
	client: SupabaseClient,
	productId: string,
	tutorId: string
): Promise<{ success: boolean; error?: string }> {
	const { error } = await client
		.from("digital_products")
		.update({
			deleted_at: new Date().toISOString(),
			published: false,
		})
		.eq("id", productId)
		.eq("tutor_id", tutorId)
		.is("deleted_at", null);

	if (error) {
		return { success: false, error: error.message };
	}
	return { success: true };
}

/**
 * Hard delete a product (legacy, prefer softDeleteProduct).
 * @deprecated Use softDeleteProduct instead
 */
export async function deleteProduct(
	client: SupabaseClient,
	productId: string,
	tutorId: string
): Promise<void> {
	const { error } = await client
		.from("digital_products")
		.delete()
		.eq("id", productId)
		.eq("tutor_id", tutorId);

	if (error) {
		throw error;
	}
}

// ============================================================================
// Commission Operations
// ============================================================================

/** Commission tier threshold in cents ($500 = 50000 cents) */
const TIER_THRESHOLD_CENTS = 50000;

/** Standard commission rate (15%) */
const STANDARD_COMMISSION_RATE = 0.15;

/** Reduced commission rate (10%) */
const REDUCED_COMMISSION_RATE = 0.10;

/**
 * Get tutor's lifetime sales in cents.
 */
export async function getTutorLifetimeSales(
	client: SupabaseClient,
	tutorId: string
): Promise<number> {
	const { data, error } = await client
		.from("marketplace_transactions")
		.select("gross_amount_cents")
		.eq("tutor_id", tutorId)
		.eq("status", "completed");

	if (error) {
		throw error;
	}

	return (data ?? []).reduce(
		(sum, row) => sum + (row.gross_amount_cents || 0),
		0
	);
}

/**
 * Calculate commission rate based on lifetime sales.
 * - Below $500: 15%
 * - $500 and above: 10%
 */
export function calculateCommissionRate(lifetimeSalesCents: number): number {
	return lifetimeSalesCents >= TIER_THRESHOLD_CENTS
		? REDUCED_COMMISSION_RATE
		: STANDARD_COMMISSION_RATE;
}

/**
 * Calculate commission details for a purchase.
 */
export interface CommissionDetails {
	grossAmountCents: number;
	commissionRate: number;
	platformFeeCents: number;
	netAmountCents: number;
}

export async function calculateCommission(
	client: SupabaseClient,
	tutorId: string,
	priceCents: number
): Promise<CommissionDetails> {
	const lifetimeSales = await getTutorLifetimeSales(client, tutorId);
	const commissionRate = calculateCommissionRate(lifetimeSales);
	const platformFeeCents = Math.round(priceCents * commissionRate);
	const netAmountCents = priceCents - platformFeeCents;

	return {
		grossAmountCents: priceCents,
		commissionRate,
		platformFeeCents,
		netAmountCents,
	};
}

// ============================================================================
// Purchase Operations
// ============================================================================

/**
 * Create a purchase record.
 */
export async function createPurchaseRecord(
	client: SupabaseClient,
	params: CreatePurchaseParams
): Promise<DigitalProductPurchase> {
	const { data, error } = await client
		.from("digital_product_purchases")
		.insert({
			product_id: params.productId,
			tutor_id: params.tutorId,
			buyer_email: params.buyerEmail,
			buyer_name: params.buyerName,
			download_token: params.downloadToken,
			download_limit: params.downloadLimit ?? 3,
			download_count: 0,
			status: "pending",
		})
		.select()
		.single();

	if (error) {
		throw error;
	}

	return data as DigitalProductPurchase;
}

/**
 * Get purchase by ID.
 */
export async function getPurchaseById(
	client: SupabaseClient,
	purchaseId: string
): Promise<DigitalProductPurchase | null> {
	const { data, error } = await client
		.from("digital_product_purchases")
		.select("*")
		.eq("id", purchaseId)
		.single();

	if (error || !data) {
		return null;
	}

	return data as DigitalProductPurchase;
}

/**
 * Get purchase by Stripe session ID.
 */
export async function getPurchaseBySessionId(
	client: SupabaseClient,
	sessionId: string
): Promise<DigitalProductPurchase | null> {
	const { data, error } = await client
		.from("digital_product_purchases")
		.select("*")
		.eq("stripe_session_id", sessionId)
		.single();

	if (error || !data) {
		return null;
	}

	return data as DigitalProductPurchase;
}

/**
 * Get purchase by download token.
 */
export async function getPurchaseByToken(
	client: SupabaseClient,
	token: string
): Promise<(DigitalProductPurchase & {
	product: DigitalProduct | null;
}) | null> {
	const { data, error } = await client
		.from("digital_product_purchases")
		.select(`
			*,
			product:digital_products (*)
		`)
		.eq("download_token", token)
		.single();

	if (error || !data) {
		return null;
	}

	return data as unknown as DigitalProductPurchase & { product: DigitalProduct | null };
}

/**
 * Update purchase status.
 */
export async function updatePurchaseStatus(
	client: SupabaseClient,
	purchaseId: string,
	status: "pending" | "paid" | "refunded",
	additionalUpdates?: {
		stripe_session_id?: string;
		stripe_payment_intent_id?: string;
	}
): Promise<void> {
	const { error } = await client
		.from("digital_product_purchases")
		.update({
			status,
			...additionalUpdates,
		})
		.eq("id", purchaseId);

	if (error) {
		throw error;
	}
}

/**
 * Increment download count with optimistic locking.
 * Returns true if successful, false if count was already at limit.
 */
export async function incrementDownloadCount(
	client: SupabaseClient,
	purchaseId: string,
	currentCount: number
): Promise<boolean> {
	const { data, error } = await client
		.from("digital_product_purchases")
		.update({ download_count: currentCount + 1 })
		.eq("id", purchaseId)
		.eq("download_count", currentCount) // Optimistic lock
		.select("download_count")
		.single();

	if (error || !data) {
		return false;
	}

	return true;
}

// ============================================================================
// Transaction Operations
// ============================================================================

/**
 * Record a marketplace transaction.
 */
export async function recordMarketplaceTransaction(
	client: SupabaseClient,
	params: RecordTransactionParams
): Promise<MarketplaceTransaction> {
	const { data, error } = await client
		.from("marketplace_transactions")
		.insert({
			tutor_id: params.tutorId,
			purchase_id: params.purchaseId,
			gross_amount_cents: params.grossAmountCents,
			platform_commission_cents: params.platformCommissionCents,
			net_amount_cents: params.netAmountCents,
			commission_rate: params.commissionRate,
			stripe_charge_id: params.stripeChargeId ?? null,
			status: params.status ?? "completed",
		})
		.select()
		.single();

	if (error) {
		throw error;
	}

	return data as MarketplaceTransaction;
}

/**
 * Get transaction by purchase ID.
 */
export async function getTransactionByPurchaseId(
	client: SupabaseClient,
	purchaseId: string
): Promise<MarketplaceTransaction | null> {
	const { data, error } = await client
		.from("marketplace_transactions")
		.select("*")
		.eq("purchase_id", purchaseId)
		.single();

	if (error || !data) {
		return null;
	}

	return data as MarketplaceTransaction;
}

// ============================================================================
// Download History
// ============================================================================

/**
 * Get download history for a purchase (for audit/debugging).
 */
export async function getDownloadHistory(
	client: SupabaseClient,
	purchaseId: string
): Promise<{ download_count: number; download_limit: number }> {
	const { data, error } = await client
		.from("digital_product_purchases")
		.select("download_count, download_limit")
		.eq("id", purchaseId)
		.single();

	if (error || !data) {
		return { download_count: 0, download_limit: 3 };
	}

	return data;
}

// ============================================================================
// Atomic RPC Operations
// ============================================================================

/**
 * Mark a purchase as paid atomically.
 * Uses database RPC for consistency.
 */
export async function markPurchasePaid(
	client: SupabaseClient,
	purchaseId: string,
	stripeSessionId: string
): Promise<void> {
	const { error } = await client.rpc("mark_purchase_paid", {
		p_purchase_id: purchaseId,
		p_stripe_session_id: stripeSessionId,
	});

	if (error) throw error;
}

/**
 * Record a marketplace sale atomically.
 * Uses database RPC to ensure commission calculation, transaction creation,
 * and stats update happen in a single atomic operation.
 *
 * This is the preferred method for recording sales - it prevents:
 * - Race conditions in commission tier calculation
 * - Partial failures leaving purchase paid but transaction unrecorded
 * - Stats/transaction mismatch
 */
export async function recordMarketplaceSale(
	client: SupabaseClient,
	input: RecordSaleInput
): Promise<RecordSaleResult> {
	const { data, error } = await client.rpc("record_marketplace_sale", {
		p_purchase_id: input.purchaseId,
		p_product_id: input.productId,
		p_tutor_id: input.tutorId,
		p_gross_amount_cents: input.grossAmountCents,
		p_stripe_payment_intent_id: input.stripePaymentIntentId,
	});

	if (error) {
		throw error;
	}

	const result = Array.isArray(data) ? data[0] : data;
	if (!result) {
		throw new Error("Sale recording returned no data");
	}

	return {
		transactionId: result.transaction_id,
		commissionRate: parseFloat(result.commission_rate),
		platformCommissionCents: result.platform_commission_cents,
		netAmountCents: result.net_amount_cents,
	};
}

/**
 * Validate a download token and return structured result.
 * Uses database RPC for consistent validation.
 */
export async function validateDownloadToken(
	client: SupabaseClient,
	token: string
): Promise<DownloadValidationResult> {
	const { data, error } = await client.rpc("validate_download_token", {
		p_token: token,
	});

	if (error) throw error;

	const result = Array.isArray(data) ? data[0] : data;
	if (!result) {
		return { valid: false, reason: "not_found" };
	}

	if (!result.valid) {
		return {
			valid: false,
			reason: result.reason as DownloadValidationReason,
			purchase: result.purchase_id
				? {
						id: result.purchase_id,
						productId: result.product_id,
						downloadCount: result.download_count,
						downloadLimit: result.download_limit,
						tutorId: result.tutor_id,
					}
				: undefined,
		};
	}

	return {
		valid: true,
		purchase: {
			id: result.purchase_id,
			productId: result.product_id,
			downloadCount: result.download_count,
			downloadLimit: result.download_limit,
			tutorId: result.tutor_id,
		},
		product: {
			storagePath: result.storage_path,
			fulfillmentType: result.fulfillment_type,
			externalUrl: result.external_url,
			tutorId: result.tutor_id,
		},
	};
}

/**
 * Increment download count atomically with optimistic locking.
 * Uses database RPC to prevent race conditions.
 * Returns false if concurrent access detected.
 */
export async function incrementDownloadCountRpc(
	client: SupabaseClient,
	purchaseId: string,
	currentCount: number
): Promise<boolean> {
	const { data, error } = await client.rpc("increment_download_count", {
		p_purchase_id: purchaseId,
		p_current_count: currentCount,
	});

	if (error) throw error;
	return Boolean(data);
}

/**
 * Get tutor's current commission rate.
 * Uses database function for single source of truth.
 *
 * @returns Commission rate as decimal (0.10 or 0.15)
 */
export async function getTutorCommissionRate(
	client: SupabaseClient,
	tutorId: string
): Promise<number> {
	const { data, error } = await client.rpc("get_tutor_commission_rate", {
		p_tutor_id: tutorId,
	});

	if (error) throw error;
	return parseFloat(data);
}

/**
 * Get marketplace summary statistics for a tutor.
 */
export async function getMarketplaceSummary(
	client: SupabaseClient,
	tutorId: string
): Promise<MarketplaceSummary> {
	const { data, error } = await client
		.from("marketplace_transactions")
		.select("gross_amount_cents, platform_commission_cents, net_amount_cents")
		.eq("tutor_id", tutorId)
		.eq("status", "completed");

	if (error) throw error;

	const transactions = data ?? [];
	return {
		totalGross: transactions.reduce(
			(sum, t) => sum + (t.gross_amount_cents || 0),
			0
		),
		totalCommission: transactions.reduce(
			(sum, t) => sum + (t.platform_commission_cents || 0),
			0
		),
		totalNet: transactions.reduce(
			(sum, t) => sum + (t.net_amount_cents || 0),
			0
		),
		transactionCount: transactions.length,
	};
}

/**
 * List transactions with product details for dashboard.
 */
export async function listTransactionsWithProducts(
	client: SupabaseClient,
	tutorId: string,
	options?: { limit?: number }
): Promise<
	(MarketplaceTransaction & {
		product: Pick<DigitalProduct, "id" | "title" | "slug" | "category"> | null;
	})[]
> {
	const { data, error } = await client
		.from("marketplace_transactions")
		.select(
			`
			*,
			product:digital_products (id, title, slug, category)
		`
		)
		.eq("tutor_id", tutorId)
		.order("created_at", { ascending: false })
		.limit(options?.limit ?? 50);

	if (error) throw error;

	return (data ?? []).map((row) => ({
		...(row as MarketplaceTransaction),
		product: Array.isArray(row.product) ? row.product[0] : row.product,
	}));
}

/**
 * Get commission tier info for a tutor.
 * @returns Object with current rate, lifetime sales, and next tier threshold
 */
export async function getCommissionTierInfo(
	client: SupabaseClient,
	tutorId: string
): Promise<{
	currentRate: number;
	lifetimeSales: number;
	nextTierThreshold: number | null;
	isTopTier: boolean;
}> {
	const lifetimeSales = await getTutorLifetimeSales(client, tutorId);
	const isTopTier = lifetimeSales >= 50000;

	return {
		currentRate: isTopTier ? 0.1 : 0.15,
		lifetimeSales,
		nextTierThreshold: isTopTier ? null : 50000,
		isTopTier,
	};
}
