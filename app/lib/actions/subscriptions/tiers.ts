"use server";

/**
 * Tutor Tier Management Module
 *
 * Handles subscription template (tier) management:
 * - Creating templates
 * - Updating templates
 * - Deleting templates
 * - Listing templates
 * - Batch operations for service form
 *
 * @module lib/actions/subscriptions/tiers
 */

import Stripe from "stripe";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { recordAudit } from "@/lib/repositories/audit";
import {
	SUBSCRIPTION_TIERS,
	getLessonsPerMonth,
	type LessonSubscriptionTemplate,
	type CreateSubscriptionTemplateInput,
	type UpdateSubscriptionTemplateInput,
} from "@/lib/subscription";
import {
	getTemplateByIdForTutor,
	getTemplatesForService,
	getTemplatesForTutor,
	getActiveTemplatesForService,
	insertTemplate,
	updateTemplate,
	deactivateTemplatesForService,
	getTemplateSubscribers as getSubscribersFromDb,
	verifyServiceOwnership,
	updateServiceSubscriptionsEnabled,
} from "@/lib/repositories/lesson-subscriptions";
import {
	getTraceId,
	createRequestLogger,
	logStep,
	logStepError,
} from "@/lib/logger";
import type { ActionResult, TemplateSubscriberView, TierConfig } from "./types";

// ============================================================================
// Stripe Client
// ============================================================================

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
let stripeClient: Stripe | null | undefined;

function getStripe(): Stripe | null {
	if (typeof stripeClient !== "undefined") {
		return stripeClient;
	}

	if (!stripeSecretKey) {
		stripeClient = null;
		return stripeClient;
	}

	stripeClient = new Stripe(stripeSecretKey, {
		apiVersion: "2025-09-30.clover",
	});

	return stripeClient;
}

// ============================================================================
// Internal Helpers
// ============================================================================

async function getClientIp(): Promise<string> {
	const headersList = await headers();
	return (
		headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
		headersList.get("x-real-ip") ||
		"unknown"
	);
}

async function requireUser() {
	const supabase = await createClient();
	const {
		data: { user },
		error,
	} = await supabase.auth.getUser();

	if (error || !user) {
		return { supabase, user: null as null };
	}

	return { supabase, user };
}

// ============================================================================
// Template CRUD Operations
// ============================================================================

/**
 * Create a subscription template for a service.
 *
 * @param input - Template creation input
 * @returns Created template or error
 */
export async function createSubscriptionTemplate(
	input: CreateSubscriptionTemplateInput
): Promise<ActionResult<LessonSubscriptionTemplate>> {
	const traceId = await getTraceId();
	const clientIp = await getClientIp();
	const log = createRequestLogger(traceId, input.service_id);

	logStep(log, "createTemplate:start", {
		serviceId: input.service_id,
		tier: input.template_tier,
		ip: clientIp,
	});

	const { supabase, user } = await requireUser();

	if (!user) {
		return { error: "You need to be signed in to create subscription templates." };
	}

	try {
		// Validate service belongs to tutor
		const service = await verifyServiceOwnership(supabase, input.service_id, user.id);

		if (!service) {
			return { error: "Service not found or doesn't belong to you." };
		}

		// Get lessons per month from tier
		const lessonsPerMonth =
			input.lessons_per_month || getLessonsPerMonth(input.template_tier);

		if (lessonsPerMonth <= 0) {
			return { error: "Invalid lessons per month value." };
		}

		// Create Stripe product and price
		let stripeProductId: string | null = null;
		let stripePriceId: string | null = null;
		const stripe = getStripe();

		if (stripe && input.price_cents > 0) {
			try {
				// Create product
				const product = await stripe.products.create({
					name: `${service.name} - ${lessonsPerMonth} lessons/month`,
					metadata: {
						tutor_id: user.id,
						service_id: input.service_id,
						template_tier: input.template_tier,
						type: "lesson_subscription",
					},
				});
				stripeProductId = product.id;

				// Create recurring price
				const price = await stripe.prices.create({
					currency: (input.currency || "USD").toLowerCase(),
					unit_amount: input.price_cents,
					product: product.id,
					recurring: {
						interval: "month",
					},
				});
				stripePriceId = price.id;
			} catch (stripeError) {
				logStepError(log, "createTemplate:stripeError", stripeError, { input });
				return { error: "Failed to create Stripe subscription price." };
			}
		}

		// Insert template
		const template = await insertTemplate(supabase, {
			tutor_id: user.id,
			service_id: input.service_id,
			lessons_per_month: lessonsPerMonth,
			template_tier: input.template_tier,
			price_cents: input.price_cents,
			currency: input.currency || "USD",
			stripe_product_id: stripeProductId,
			stripe_price_id: stripePriceId,
			max_rollover_lessons: input.max_rollover_lessons ?? null,
			is_active: true,
		});

		// Record audit trail
		await recordAudit(supabase, {
			actorId: user.id,
			targetId: template.id,
			entityType: "billing",
			actionType: "template_created",
			afterState: {
				tier: input.template_tier,
				lessonsPerMonth,
				priceCents: input.price_cents,
			},
			metadata: { ip: clientIp, traceId },
		});

		logStep(log, "createTemplate:success", { templateId: template.id });

		revalidatePath("/services");
		return { data: template, success: true };
	} catch (error) {
		logStepError(log, "createTemplate:error", error, { input });
		return { error: "Failed to create subscription template." };
	}
}

/**
 * Update a subscription template.
 *
 * @param templateId - Template ID
 * @param input - Fields to update
 * @returns Updated template or error
 */
export async function updateSubscriptionTemplate(
	templateId: string,
	input: UpdateSubscriptionTemplateInput
): Promise<ActionResult<LessonSubscriptionTemplate>> {
	const traceId = await getTraceId();
	const clientIp = await getClientIp();
	const log = createRequestLogger(traceId, templateId);

	logStep(log, "updateTemplate:start", { templateId, input, ip: clientIp });

	const { supabase, user } = await requireUser();

	if (!user) {
		return { error: "You need to be signed in." };
	}

	try {
		// Verify ownership
		const existing = await getTemplateByIdForTutor(supabase, templateId, user.id);

		if (!existing) {
			return { error: "Template not found." };
		}

		// If price changed, create new Stripe price
		let stripePriceId = existing.stripe_price_id;
		const stripe = getStripe();

		if (
			stripe &&
			input.price_cents !== undefined &&
			input.price_cents !== existing.price_cents &&
			input.price_cents > 0 &&
			existing.stripe_product_id
		) {
			try {
				// Create new price (Stripe prices are immutable)
				const price = await stripe.prices.create({
					currency: existing.currency.toLowerCase(),
					unit_amount: input.price_cents,
					product: existing.stripe_product_id,
					recurring: {
						interval: "month",
					},
				});
				stripePriceId = price.id;
			} catch (stripeError) {
				logStepError(log, "updateTemplate:stripeError", stripeError, { templateId });
			}
		}

		// Update template
		const template = await updateTemplate(supabase, templateId, user.id, {
			...(input.price_cents !== undefined && { price_cents: input.price_cents }),
			...(input.is_active !== undefined && { is_active: input.is_active }),
			...(input.max_rollover_lessons !== undefined && {
				max_rollover_lessons: input.max_rollover_lessons,
			}),
			stripe_price_id: stripePriceId,
		});

		// Record audit trail
		await recordAudit(supabase, {
			actorId: user.id,
			targetId: templateId,
			entityType: "billing",
			actionType: "template_updated",
			beforeState: {
				priceCents: existing.price_cents,
				isActive: existing.is_active,
			},
			afterState: {
				priceCents: template.price_cents,
				isActive: template.is_active,
			},
			metadata: { ip: clientIp, traceId },
		});

		logStep(log, "updateTemplate:success", { templateId });

		revalidatePath("/services");
		return { data: template, success: true };
	} catch (error) {
		logStepError(log, "updateTemplate:error", error, { templateId, input });
		return { error: "Failed to update template." };
	}
}

/**
 * Delete (deactivate) a subscription template.
 *
 * @param templateId - Template ID
 * @returns Success or error
 */
export async function deleteSubscriptionTemplate(
	templateId: string
): Promise<ActionResult<{ success: boolean }>> {
	const traceId = await getTraceId();
	const clientIp = await getClientIp();
	const log = createRequestLogger(traceId, templateId);

	logStep(log, "deleteTemplate:start", { templateId, ip: clientIp });

	const { supabase, user } = await requireUser();

	if (!user) {
		return { error: "You need to be signed in." };
	}

	try {
		// Verify ownership and get before state
		const existing = await getTemplateByIdForTutor(supabase, templateId, user.id);

		if (!existing) {
			return { error: "Template not found." };
		}

		// Soft delete by setting is_active = false
		await updateTemplate(supabase, templateId, user.id, { is_active: false });

		// Record audit trail
		await recordAudit(supabase, {
			actorId: user.id,
			targetId: templateId,
			entityType: "billing",
			actionType: "template_deleted",
			beforeState: {
				tier: existing.template_tier,
				priceCents: existing.price_cents,
			},
			metadata: { ip: clientIp, traceId },
		});

		logStep(log, "deleteTemplate:success", { templateId });

		revalidatePath("/services");
		return { data: { success: true }, success: true };
	} catch (error) {
		logStepError(log, "deleteTemplate:error", error, { templateId });
		return { error: "Failed to delete template." };
	}
}

// ============================================================================
// Template Query Operations
// ============================================================================

/**
 * List all subscription templates for the current tutor.
 *
 * @returns Array of templates or error
 */
export async function listSubscriptionTemplates(): Promise<
	ActionResult<LessonSubscriptionTemplate[]>
> {
	const { supabase, user } = await requireUser();

	if (!user) {
		return { error: "You need to be signed in." };
	}

	try {
		const templates = await getTemplatesForTutor(supabase, user.id);
		return { data: templates, success: true };
	} catch (error) {
		console.error("[Subscriptions] Failed to load templates:", error);
		return { error: "Failed to load templates." };
	}
}

/**
 * Get subscription templates for a specific service.
 *
 * @param serviceId - Service ID
 * @returns Array of templates or error
 */
export async function getServiceSubscriptionTemplates(
	serviceId: string
): Promise<ActionResult<LessonSubscriptionTemplate[]>> {
	const { supabase, user } = await requireUser();

	if (!user) {
		return { error: "You need to be signed in." };
	}

	try {
		const templates = await getTemplatesForService(supabase, serviceId, user.id);
		return { data: templates, success: true };
	} catch (error) {
		console.error("[Subscriptions] Failed to load templates:", error);
		return { error: "Failed to load templates." };
	}
}

/**
 * Get template with active subscribers.
 *
 * @param templateId - Template ID
 * @returns Template with subscribers or error
 */
export async function getTemplateSubscribers(
	templateId: string
): Promise<ActionResult<TemplateSubscriberView>> {
	const { supabase, user } = await requireUser();

	if (!user) {
		return { error: "You need to be signed in." };
	}

	try {
		// Get template
		const template = await getTemplateByIdForTutor(supabase, templateId, user.id);

		if (!template) {
			return { error: "Template not found." };
		}

		// Get subscribers
		const subscribers = await getSubscribersFromDb(supabase, templateId);

		return { data: { template, subscribers }, success: true };
	} catch (error) {
		console.error("[Subscriptions] Failed to load subscribers:", error);
		return { error: "Failed to load subscribers." };
	}
}

/**
 * Get subscription templates for a service as public data.
 * Used on booking page to show subscription options.
 *
 * @param serviceId - Service ID
 * @returns Array of active templates or error
 */
export async function getPublicServiceSubscriptionTemplates(
	serviceId: string
): Promise<ActionResult<LessonSubscriptionTemplate[]>> {
	const supabase = await createClient();

	try {
		const templates = await getActiveTemplatesForService(supabase, serviceId);
		return { data: templates, success: true };
	} catch (error) {
		console.error("[Subscriptions] Failed to load templates:", error);
		return { error: "Failed to load subscription options." };
	}
}

// ============================================================================
// Batch Operations
// ============================================================================

/**
 * Save all subscription tiers for a service.
 * Called when saving the service form.
 *
 * @param serviceId - Service ID
 * @param enabled - Whether subscriptions are enabled
 * @param tiers - Tier configurations
 * @returns Success or error
 */
export async function saveServiceSubscriptionTiers(
	serviceId: string,
	enabled: boolean,
	tiers: TierConfig[]
): Promise<ActionResult<{ success: boolean }>> {
	const traceId = await getTraceId();
	const log = createRequestLogger(traceId, serviceId);

	logStep(log, "saveTiers:start", { serviceId, enabled, tiersCount: tiers.length });

	const { supabase, user } = await requireUser();

	if (!user) {
		return { error: "You need to be signed in." };
	}

	try {
		// Verify service ownership
		const service = await verifyServiceOwnership(supabase, serviceId, user.id);

		if (!service) {
			return { error: "Service not found." };
		}

		// Update subscriptions_enabled on service
		await updateServiceSubscriptionsEnabled(supabase, serviceId, enabled);

		if (!enabled) {
			// Disable all templates for this service
			await deactivateTemplatesForService(supabase, serviceId, user.id);

			revalidatePath("/services");
			return { data: { success: true }, success: true };
		}

		// Get existing templates
		const existingTemplates = await getTemplatesForService(supabase, serviceId, user.id);

		const existingByTier = new Map(
			existingTemplates.map((t) => [t.template_tier, t])
		);

		// Process each tier
		for (const tierConfig of tiers) {
			const existing = existingByTier.get(tierConfig.tier_id);
			const tierInfo = SUBSCRIPTION_TIERS[
				tierConfig.tier_id === "2_lessons"
					? "TWO_LESSONS"
					: tierConfig.tier_id === "4_lessons"
						? "FOUR_LESSONS"
						: "EIGHT_LESSONS"
			];

			if (!tierInfo) continue;

			if (tierConfig.price_cents && tierConfig.price_cents > 0) {
				if (existing) {
					// Update existing template
					await updateSubscriptionTemplate(existing.id, {
						price_cents: tierConfig.price_cents,
						is_active: true,
					});
				} else {
					// Create new template
					await createSubscriptionTemplate({
						service_id: serviceId,
						template_tier: tierConfig.tier_id,
						lessons_per_month: tierInfo.lessons_per_month,
						price_cents: tierConfig.price_cents,
					});
				}
			} else if (existing) {
				// Disable template if price is empty
				await updateSubscriptionTemplate(existing.id, { is_active: false });
			}
		}

		logStep(log, "saveTiers:success", { serviceId });

		revalidatePath("/services");
		return { data: { success: true }, success: true };
	} catch (error) {
		logStepError(log, "saveTiers:error", error, { serviceId });
		return { error: "Failed to save subscription tiers." };
	}
}
