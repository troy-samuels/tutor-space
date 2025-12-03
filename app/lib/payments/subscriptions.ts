import type { PlatformBillingPlan } from "@/lib/types/payments";

/**
 * Single-plan mapping: Stripe prices map to the all-access or founder lifetime plans.
 */
export function mapPriceIdToPlan(priceId?: string | null): PlatformBillingPlan {
	const lifetimePriceId = process.env.STRIPE_LIFETIME_PRICE_ID;
	const allAccessPriceId = process.env.STRIPE_ALL_ACCESS_PRICE_ID;

	if (priceId && lifetimePriceId && priceId === lifetimePriceId) {
		return "founder_lifetime";
	}

	if (priceId && allAccessPriceId && priceId === allAccessPriceId) {
		return "growth";
	}

	// Default to growth if we have an all-access price configured, otherwise professional
	if (allAccessPriceId) return "growth";
	return "professional";
}
