"use server";

/**
 * Marketplace Products Module
 *
 * This module handles product CRUD operations with:
 * - Audit trail for price changes
 * - Structured logging with traceId
 * - Repository pattern for all database operations
 *
 * @module lib/actions/marketplace/products
 */

import { Buffer } from "buffer";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";
import { slugifyKebab } from "@/lib/utils/slug";
import { recordAudit } from "@/lib/repositories/audit";
import {
	getProductById,
	getProductBySlug,
	listProductsByTutor,
	createProduct,
	updateProduct,
	deleteProduct,
} from "@/lib/repositories/marketplace";
import {
	getTraceId,
	createRequestLogger,
	logStep,
	logStepError,
} from "@/lib/logger";
import {
	productSchema,
	type ProductFormState,
	type ActionResult,
	type CreateProductResult,
} from "./types";

// ============================================================================
// Constants
// ============================================================================

const BUCKET = "digital-products";
const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024; // 100MB

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

/**
 * Upload a file to Supabase Storage.
 */
async function uploadDigitalFile(userId: string, file: File): Promise<string> {
	const supabase = await createClient();
	const arrayBuffer = await file.arrayBuffer();
	const buffer = Buffer.from(arrayBuffer);
	const path = `${userId}/${Date.now()}-${file.name}`;

	const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, {
		contentType: file.type || "application/octet-stream",
		upsert: true,
	});

	if (error) {
		throw new Error(error.message);
	}

	return path;
}

// ============================================================================
// Product CRUD Operations
// ============================================================================

/**
 * Create a new digital product.
 *
 * Handles file upload, Stripe product/price creation, and database insert.
 * Records audit trail for product creation.
 */
export async function createDigitalProduct(
	_prevState: ProductFormState,
	formData: FormData
): Promise<ProductFormState> {
	const traceId = await getTraceId();
	const clientIp = await getClientIp();

	const parsed = productSchema.safeParse({
		title: formData.get("title"),
		description: formData.get("description"),
		price: formData.get("price"),
		currency: formData.get("currency"),
		fulfillment_type: formData.get("fulfillment_type") ?? "file",
		external_url: formData.get("external_url"),
		category: formData.get("category") || "worksheet",
		language: formData.get("language") || undefined,
		level: formData.get("level") || undefined,
	});

	if (!parsed.success) {
		const issue = parsed.error.issues[0];
		return { error: issue?.message ?? "Invalid product details." };
	}

	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return { error: "You must be signed in." };
	}

	const log = createRequestLogger(traceId, user.id);
	logStep(log, "createProduct:start", {
		title: parsed.data.title,
		ip: clientIp,
	});

	const adminClient = createServiceRoleClient();
	if (!adminClient) {
		return { error: "Database connection failed." };
	}

	try {
		// Generate unique slug
		const slugBase = slugifyKebab(parsed.data.title, { maxLength: 60, fallback: "product" });
		let slug = slugBase;
		let slugAttempt = 1;

		while (true) {
			const existing = await getProductBySlug(adminClient, user.id, slug);
			if (!existing) break;
			slug = `${slugBase}-${slugAttempt++}`;
		}

		// Handle file upload
		let storagePath: string | null = null;

		if (parsed.data.fulfillment_type === "file") {
			const file = formData.get("file");
			if (!(file instanceof File) || file.size === 0) {
				return { error: "Upload a file to sell." };
			}
			if (file.size > MAX_FILE_SIZE_BYTES) {
				return { error: "File too large. Maximum size is 100MB." };
			}
			try {
				storagePath = await uploadDigitalFile(user.id, file);
			} catch (error) {
				logStepError(log, "createProduct:uploadFailed", error, { title: parsed.data.title });
				return { error: "Unable to upload file. Try a smaller file or different format." };
			}
		}

		if (parsed.data.fulfillment_type === "link" && !parsed.data.external_url) {
			return { error: "Provide a download link for link-only products." };
		}

		// Convert price to cents
		const priceString = parsed.data.price.toFixed(2);
		const [dollars, cents] = priceString.split(".");
		const priceCents = parseInt(dollars, 10) * 100 + parseInt(cents || "0", 10);

		// Create Stripe product and price
		const stripeProduct = await stripe.products.create({
			name: parsed.data.title,
			description: parsed.data.description,
			metadata: {
				tutorId: user.id,
				slug,
			},
		});

		const stripePrice = await stripe.prices.create({
			product: stripeProduct.id,
			unit_amount: priceCents,
			currency: parsed.data.currency.toLowerCase(),
		});

		// Create product in database
		const product = await createProduct(adminClient, {
			tutorId: user.id,
			slug,
			title: parsed.data.title,
			description: parsed.data.description ?? null,
			priceCents,
			currency: parsed.data.currency.toLowerCase(),
			fulfillmentType: parsed.data.fulfillment_type,
			storagePath,
			externalUrl: parsed.data.external_url ?? null,
			stripeProductId: stripeProduct.id,
			stripePriceId: stripePrice.id,
			category: parsed.data.category,
			language: parsed.data.language ?? null,
			level: parsed.data.level ?? null,
		});

		// Record audit trail
		await recordAudit(adminClient, {
			actorId: user.id,
			targetId: product.id,
			entityType: "marketplace",
			actionType: "product_created",
			afterState: {
				title: parsed.data.title,
				priceCents,
				currency: parsed.data.currency,
				fulfillmentType: parsed.data.fulfillment_type,
				category: parsed.data.category,
			},
			metadata: {
				slug,
				stripeProductId: stripeProduct.id,
				ip: clientIp,
				traceId,
			},
		});

		logStep(log, "createProduct:success", { productId: product.id, slug });

		revalidatePath("/digital-products");
		revalidatePath("/services");
		return { success: "Digital product saved" };
	} catch (error) {
		logStepError(log, "createProduct:error", error, { title: parsed.data.title });
		return { error: "Failed to save product. Try again." };
	}
}

/**
 * List all digital products for the current tutor.
 */
export async function listDigitalProductsForTutor() {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return [];
	}

	const adminClient = createServiceRoleClient();
	if (!adminClient) {
		return [];
	}

	try {
		return await listProductsByTutor(adminClient, user.id);
	} catch {
		return [];
	}
}

/**
 * Toggle product publish status.
 *
 * Records audit trail for publish/unpublish actions.
 */
export async function toggleDigitalProductPublish(
	productId: string,
	publish: boolean
): Promise<{ error?: string; success?: string }> {
	const traceId = await getTraceId();
	const clientIp = await getClientIp();

	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return { error: "Not authorized" };
	}

	const log = createRequestLogger(traceId, user.id);
	logStep(log, "togglePublish:start", { productId, publish });

	const adminClient = createServiceRoleClient();
	if (!adminClient) {
		return { error: "Database connection failed." };
	}

	try {
		// Get before state
		const product = await getProductById(adminClient, productId);
		if (!product || product.tutor_id !== user.id) {
			return { error: "Product not found." };
		}

		const beforePublished = product.published;

		// Update product
		await updateProduct(adminClient, productId, user.id, { published: publish });

		// Record audit trail
		await recordAudit(adminClient, {
			actorId: user.id,
			targetId: productId,
			entityType: "marketplace",
			actionType: publish ? "product_published" : "product_unpublished",
			beforeState: { published: beforePublished },
			afterState: { published: publish },
			metadata: {
				productTitle: product.title,
				ip: clientIp,
				traceId,
			},
		});

		logStep(log, "togglePublish:success", { productId, publish });

		revalidatePath("/digital-products");
		revalidatePath("/services");
		return { success: "Product updated" };
	} catch (error) {
		logStepError(log, "togglePublish:error", error, { productId });
		return { error: "Failed to update product" };
	}
}

/**
 * Delete a digital product.
 *
 * Records audit trail for deletion.
 */
export async function deleteDigitalProduct(
	productId: string
): Promise<{ error?: string; success?: string }> {
	const traceId = await getTraceId();
	const clientIp = await getClientIp();

	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return { error: "Not authorized" };
	}

	const log = createRequestLogger(traceId, user.id);
	logStep(log, "deleteProduct:start", { productId });

	const adminClient = createServiceRoleClient();
	if (!adminClient) {
		return { error: "Database connection failed." };
	}

	try {
		// Get before state
		const product = await getProductById(adminClient, productId);
		if (!product || product.tutor_id !== user.id) {
			return { error: "Product not found." };
		}

		// Delete product
		await deleteProduct(adminClient, productId, user.id);

		// Record audit trail
		await recordAudit(adminClient, {
			actorId: user.id,
			targetId: productId,
			entityType: "marketplace",
			actionType: "product_deleted",
			beforeState: {
				title: product.title,
				priceCents: product.price_cents,
				published: product.published,
			},
			metadata: {
				productTitle: product.title,
				slug: product.slug,
				ip: clientIp,
				traceId,
			},
		});

		logStep(log, "deleteProduct:success", { productId });

		revalidatePath("/digital-products");
		revalidatePath("/services");
		return { success: "Deleted" };
	} catch (error) {
		logStepError(log, "deleteProduct:error", error, { productId });
		return { error: "Failed to delete product" };
	}
}

/**
 * Update a product's price.
 *
 * Records audit trail with before/after state for compliance.
 */
export async function updateProductPrice(
	productId: string,
	newPriceCents: number
): Promise<ActionResult<void>> {
	const traceId = await getTraceId();
	const clientIp = await getClientIp();

	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return { error: "Not authorized" };
	}

	const log = createRequestLogger(traceId, user.id);
	logStep(log, "updatePrice:start", { productId, newPriceCents });

	const adminClient = createServiceRoleClient();
	if (!adminClient) {
		return { error: "Database connection failed." };
	}

	try {
		// Get before state
		const product = await getProductById(adminClient, productId);
		if (!product || product.tutor_id !== user.id) {
			return { error: "Product not found." };
		}

		const beforePrice = product.price_cents;

		// Create new Stripe price (prices are immutable in Stripe)
		const newStripePrice = await stripe.prices.create({
			product: product.stripe_product_id!,
			unit_amount: newPriceCents,
			currency: product.currency,
		});

		// Archive old price
		if (product.stripe_price_id) {
			await stripe.prices.update(product.stripe_price_id, { active: false });
		}

		// Update product
		await updateProduct(adminClient, productId, user.id, {
			price_cents: newPriceCents,
			stripe_price_id: newStripePrice.id,
		});

		// Record audit trail with before/after state
		await recordAudit(adminClient, {
			actorId: user.id,
			targetId: productId,
			entityType: "marketplace",
			actionType: "product_price_updated",
			beforeState: { price_cents: beforePrice },
			afterState: { price_cents: newPriceCents },
			metadata: {
				productTitle: product.title,
				currency: product.currency,
				oldStripePriceId: product.stripe_price_id,
				newStripePriceId: newStripePrice.id,
				ip: clientIp,
				traceId,
			},
		});

		logStep(log, "updatePrice:success", {
			productId,
			beforePrice,
			afterPrice: newPriceCents,
		});

		revalidatePath("/digital-products");
		return { success: true };
	} catch (error) {
		logStepError(log, "updatePrice:error", error, { productId });
		return { error: "Failed to update price." };
	}
}
