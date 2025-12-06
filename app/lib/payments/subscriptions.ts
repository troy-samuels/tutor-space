import type { PlatformBillingPlan } from "@/lib/types/payments";

/**
 * Single-plan mapping: Stripe prices map to the all-access or founder lifetime plans.
 * Both monthly (STRIPE_ALL_ACCESS_PRICE_ID) and yearly (STRIPE_ALL_YEAR_ACCESS_PRICE_ID)
 * prices map to the "growth" plan.
 */
export function mapPriceIdToPlan(priceId?: string | null): PlatformBillingPlan {
	const lifetimePriceId = process.env.STRIPE_LIFETIME_PRICE_ID;
	const allAccessPriceId = process.env.STRIPE_ALL_ACCESS_PRICE_ID;
	const allAccessYearlyPriceId = process.env.STRIPE_ALL_YEAR_ACCESS_PRICE_ID;

	if (priceId && lifetimePriceId && priceId === lifetimePriceId) {
		return "founder_lifetime";
	}

	// Only return growth when the price matches one of the configured all-access prices
	if (priceId && allAccessPriceId && priceId === allAccessPriceId) {
		return "growth";
	}

	if (priceId && allAccessYearlyPriceId && priceId === allAccessYearlyPriceId) {
		return "growth";
	}

	// Anything else should not unlock paid access
	return "professional";
}
