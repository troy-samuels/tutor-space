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
