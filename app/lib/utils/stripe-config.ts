import type { PlatformBillingPlan } from "@/lib/types/payments";

/**
 * Checks if Stripe is configured for platform billing.
 * Returns true if the required env vars are set.
 */
export function isStripeConfigured(): boolean {
  return Boolean(
    process.env.STRIPE_SECRET_KEY &&
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY &&
    (process.env.STRIPE_PRO_MONTHLY_PRICE_ID || process.env.STRIPE_PRO_ANNUAL_PRICE_ID)
  );
}

/**
 * Get trial days based on plan billing cycle.
 * - Monthly plans: 7-day trial
 * - Annual plans: 14-day trial
 */
export function getTrialDays(plan: PlatformBillingPlan): number {
  const annualPlans: PlatformBillingPlan[] = ["pro_annual", "studio_annual"];
  return annualPlans.includes(plan) ? 14 : 7;
}
