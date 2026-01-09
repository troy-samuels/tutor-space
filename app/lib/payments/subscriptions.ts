import type {
	PlatformBillingPlan,
	PlanTier,
	PaidPlan,
} from "@/lib/types/payments";

/**
 * Maps Stripe price IDs to platform billing plans.
 *
 * Tier Structure:
 * - Free: professional (unpaid/trial expired)
 * - Pro: pro_monthly, pro_annual, tutor_life (+ legacy: all_access, founder_lifetime)
 * - Studio: studio_monthly, studio_annual (+ legacy: studio_life)
 */
export function mapPriceIdToPlan(
	priceId?: string | null
): PlatformBillingPlan {
	if (!priceId) return "professional";

	// Build price map from environment variables
	const priceMap: Record<string, PlatformBillingPlan> = {};

	// Pro tier plans
	if (process.env.STRIPE_PRO_MONTHLY_PRICE_ID) {
		priceMap[process.env.STRIPE_PRO_MONTHLY_PRICE_ID] = "pro_monthly";
	}
	if (process.env.STRIPE_PRO_ANNUAL_PRICE_ID) {
		priceMap[process.env.STRIPE_PRO_ANNUAL_PRICE_ID] = "pro_annual";
	}
	if (process.env.STRIPE_PRO_LIFETIME_PRICE_ID) {
		priceMap[process.env.STRIPE_PRO_LIFETIME_PRICE_ID] = "tutor_life";
	}

	// Studio tier plans
	if (process.env.STRIPE_STUDIO_MONTHLY_PRICE_ID) {
		priceMap[process.env.STRIPE_STUDIO_MONTHLY_PRICE_ID] = "studio_monthly";
	}
	if (process.env.STRIPE_STUDIO_ANNUAL_PRICE_ID) {
		priceMap[process.env.STRIPE_STUDIO_ANNUAL_PRICE_ID] = "studio_annual";
	}
	if (process.env.STRIPE_STUDIO_LIFETIME_PRICE_ID) {
		priceMap[process.env.STRIPE_STUDIO_LIFETIME_PRICE_ID] = "studio_life";
	}

	// Legacy mappings (for existing subscribers)
	if (process.env.STRIPE_ALL_ACCESS_PRICE_ID) {
		priceMap[process.env.STRIPE_ALL_ACCESS_PRICE_ID] = "all_access";
	}
	if (process.env.STRIPE_ALL_YEAR_ACCESS_PRICE_ID) {
		priceMap[process.env.STRIPE_ALL_YEAR_ACCESS_PRICE_ID] = "all_access";
	}
	// Deprecated alias (older env name) — maps to Pro lifetime.
	if (process.env.STRIPE_LIFETIME_PRICE_ID) {
		priceMap[process.env.STRIPE_LIFETIME_PRICE_ID] = "tutor_life";
	}

	return priceMap[priceId] ?? "professional";
}

/**
 * Returns the tier level for a given plan.
 * Used for feature gating and UI display.
 */
export function getPlanTier(plan: PlatformBillingPlan): PlanTier {
	switch (plan) {
		case "professional":
			return "free";

		case "pro_monthly":
		case "pro_annual":
		case "tutor_life":
		case "founder_lifetime":
		case "all_access":
			return "pro";

		case "studio_monthly":
		case "studio_annual":
		case "studio_life":
			return "studio";

		default:
			return "free";
	}
}

/**
 * Returns the database tier value for a given plan.
 * Maps to the tier_type enum in the database: 'standard' | 'studio'
 */
export function getPlanDbTier(plan: PlatformBillingPlan): "standard" | "studio" {
	switch (plan) {
		case "studio_monthly":
		case "studio_annual":
		case "studio_life":
			return "studio";
		default:
			return "standard";
	}
}

/**
 * Checks if the plan has Studio tier access.
 * Studio includes all Pro features plus: LiveKit video, transcription, drills, clips, roadmaps.
 */
export function hasStudioAccess(plan: PlatformBillingPlan): boolean {
	return getPlanTier(plan) === "studio";
}

/**
 * Checks if the plan has Pro tier access (any paid plan).
 * Pro includes: dashboard, calendar, bookings, students, services, availability,
 * messages, pages, analytics, marketing.
 */
export function hasProAccess(plan: PlatformBillingPlan): boolean {
	return getPlanTier(plan) !== "free";
}

/**
 * Checks if the given plan is a paid plan (not free tier).
 */
export function isPaidPlan(plan: PlatformBillingPlan): plan is PaidPlan {
	return hasProAccess(plan);
}

/**
 * Returns the display name for a plan.
 */
export function getPlanDisplayName(plan: PlatformBillingPlan): string {
	const displayNames: Record<PlatformBillingPlan, string> = {
		professional: "Free",
		pro_monthly: "Pro Monthly",
		pro_annual: "Pro Annual",
		tutor_life: "Pro Lifetime",
		studio_monthly: "Studio Monthly",
		studio_annual: "Studio Annual",
		studio_life: "Studio Lifetime",
		founder_lifetime: "Legacy Lifetime",
		all_access: "Legacy Pro",
	};

	return displayNames[plan] ?? "Free";
}

/**
 * Returns pricing info for display purposes.
 */
export function getPlanPricing(plan: PlatformBillingPlan): {
	price: number;
	interval: "month" | "year" | "lifetime";
	currency: string;
} {
	const pricing: Record<
		PlatformBillingPlan,
		{ price: number; interval: "month" | "year" | "lifetime"; currency: string }
	> = {
		professional: { price: 0, interval: "month", currency: "USD" },
		pro_monthly: { price: 29, interval: "month", currency: "USD" },
		pro_annual: { price: 199, interval: "year", currency: "USD" },
		tutor_life: { price: 99, interval: "lifetime", currency: "USD" },
		studio_monthly: { price: 49, interval: "month", currency: "USD" },
		studio_annual: { price: 349, interval: "year", currency: "USD" },
		studio_life: { price: 99, interval: "lifetime", currency: "USD" },
		founder_lifetime: { price: 0, interval: "lifetime", currency: "USD" },
		all_access: { price: 29, interval: "month", currency: "USD" }, // Legacy
	};

	return pricing[plan] ?? { price: 0, interval: "month", currency: "USD" };
}

/**
 * Feature access matrix for gating.
 */
export const PLAN_FEATURES = {
	// Pro tier features (full platform access, no Studio features)
	pro: [
		"dashboard",
		"calendar",
		"bookings",
		"students",
		"services",
		"availability",
		"messages",
		"pages",
		"analytics",
		"marketing",
	] as const,

	// Studio tier features (includes all Pro features + Studio features)
	studio: [
		"dashboard",
		"calendar",
		"bookings",
		"students",
		"services",
		"availability",
		"messages",
		"pages",
		"analytics",
		"marketing",
		"studio",
		"lesson-room",
		"recordings",
		"transcripts",
		"drills",
		"clips",
		"roadmaps",
	] as const,
} as const;

export type ProFeature = (typeof PLAN_FEATURES.pro)[number];
export type StudioFeature = (typeof PLAN_FEATURES.studio)[number];

/**
 * Checks if a plan has access to a specific feature.
 */
export function hasFeatureAccess(
	plan: PlatformBillingPlan,
	feature: ProFeature | StudioFeature
): boolean {
	const tier = getPlanTier(plan);

	if (tier === "free") return false;

	if (tier === "studio") {
		return (PLAN_FEATURES.studio as readonly string[]).includes(feature);
	}

	// Pro tier
	return (PLAN_FEATURES.pro as readonly string[]).includes(feature);
}

// ============================================================================
// Plan Transition Types & Helpers
// ============================================================================

export type TransitionStrategy =
	| "new_subscription"
	| "update_subscription"
	| "one_time_payment"
	| "cancel";

export type ProrationBehavior = "create_prorations" | "none" | "always_invoice";

export type EffectiveAt = "immediate" | "period_end";

export interface PlanTransition {
	fromPlan: PlatformBillingPlan;
	toPlan: PlatformBillingPlan;
	strategy: TransitionStrategy;
	proration: ProrationBehavior;
	effectiveAt: EffectiveAt;
	isUpgrade: boolean;
}

/** Lifetime plans that don't have recurring subscriptions */
const LIFETIME_PLANS: PlatformBillingPlan[] = ["tutor_life", "studio_life", "founder_lifetime"];

/**
 * Determines the transition strategy for changing from one plan to another.
 * Used by both the checkout-agent and UI to show appropriate messaging.
 */
export function getPlanTransition(
	fromPlan: PlatformBillingPlan,
	toPlan: PlatformBillingPlan
): PlanTransition {
	const isUpgrade = isPlanUpgrade(fromPlan, toPlan);

	// Same plan - no change needed
	if (fromPlan === toPlan) {
		return {
			fromPlan,
			toPlan,
			strategy: "update_subscription",
			proration: "none",
			effectiveAt: "immediate",
			isUpgrade: false,
		};
	}

	// To lifetime - always one-time payment
	if (LIFETIME_PLANS.includes(toPlan)) {
		return {
			fromPlan,
			toPlan,
			strategy: "one_time_payment",
			proration: "none",
			effectiveAt: "immediate",
			isUpgrade: true,
		};
	}

	// To free tier - cancel subscription
	if (toPlan === "professional") {
		return {
			fromPlan,
			toPlan,
			strategy: "cancel",
			proration: "none",
			effectiveAt: "period_end",
			isUpgrade: false,
		};
	}

	// From free tier - new subscription
	if (fromPlan === "professional") {
		return {
			fromPlan,
			toPlan,
			strategy: "new_subscription",
			proration: "none",
			effectiveAt: "immediate",
			isUpgrade: true,
		};
	}

	// From lifetime - new subscription (lifetime doesn't have active sub to update)
	if (LIFETIME_PLANS.includes(fromPlan)) {
		return {
			fromPlan,
			toPlan,
			strategy: "new_subscription",
			proration: "none",
			effectiveAt: "immediate",
			isUpgrade: false,
		};
	}

	// Subscription to subscription changes
	if (isUpgrade) {
		// Upgrade: Pro → Studio OR monthly → annual (same tier)
		return {
			fromPlan,
			toPlan,
			strategy: "update_subscription",
			proration: "create_prorations",
			effectiveAt: "immediate",
			isUpgrade: true,
		};
	}

	// Downgrade: Studio → Pro OR annual → monthly (same tier)
	return {
		fromPlan,
		toPlan,
		strategy: "update_subscription",
		proration: "none",
		effectiveAt: "period_end",
		isUpgrade: false,
	};
}

/**
 * Determines if changing from one plan to another is an upgrade (user pays more).
 */
export function isPlanUpgrade(
	fromPlan: PlatformBillingPlan,
	toPlan: PlatformBillingPlan
): boolean {
	const fromTier = getPlanTier(fromPlan);
	const toTier = getPlanTier(toPlan);

	// Free to any paid is an upgrade
	if (fromTier === "free" && toTier !== "free") return true;

	// Studio is higher tier than Pro
	if (fromTier === "pro" && toTier === "studio") return true;

	// Same tier but going to annual (higher value)
	if (fromTier === toTier && fromTier !== "free") {
		const monthlyPlans: PlatformBillingPlan[] = ["pro_monthly", "studio_monthly"];
		const annualPlans: PlatformBillingPlan[] = ["pro_annual", "studio_annual"];
		if (monthlyPlans.includes(fromPlan) && annualPlans.includes(toPlan)) {
			return true;
		}
	}

	return false;
}

/**
 * Gets human-readable description of a plan transition.
 */
export function getPlanTransitionDescription(transition: PlanTransition): string {
	const { fromPlan, toPlan, strategy, effectiveAt } = transition;

	if (strategy === "new_subscription") {
		return `Start a new ${getPlanDisplayName(toPlan)} subscription`;
	}

	if (strategy === "one_time_payment") {
		return `Purchase ${getPlanDisplayName(toPlan)} (one-time payment)`;
	}

	if (strategy === "cancel") {
		return "Cancel subscription at end of billing period";
	}

	// update_subscription
	if (effectiveAt === "immediate") {
		return `Upgrade to ${getPlanDisplayName(toPlan)} immediately (prorated)`;
	}

	return `Switch to ${getPlanDisplayName(toPlan)} at end of billing period`;
}
