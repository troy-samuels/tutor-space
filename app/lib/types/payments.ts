/**
 * Platform billing plans for tutor subscriptions
 *
 * Tier Structure:
 * - Free: professional (unpaid/trial expired)
 * - Pro: pro_monthly, pro_annual, tutor_life (+ legacy: all_access, founder_lifetime)
 * - Studio: studio_monthly, studio_annual (+ legacy: studio_life)
 */
export type PlatformBillingPlan =
	| "professional" // Free tier (unpaid/trial expired)
	| "pro_monthly" // $29/mo
	| "pro_annual" // $199/yr
	| "tutor_life" // $99 lifetime deal (unlocks Studio tier)
	| "studio_monthly" // $79/mo
	| "studio_annual" // $499/yr
	| "studio_life" // $99 lifetime (unlocks all features)
	| "founder_lifetime" // Legacy lifetime (grandfathered; no longer sold)
	| "all_access"; // Legacy - maps to pro_monthly for existing users

/** Pro tier plans (full platform access, no Studio features) */
export type ProTierPlan = "pro_monthly" | "pro_annual" | "tutor_life";

/** Studio tier plans (includes all Pro features + Studio features) */
export type StudioTierPlan = "studio_monthly" | "studio_annual" | "studio_life";

/** All paid plans (Pro + Studio + Legacy) */
export type PaidPlan = ProTierPlan | StudioTierPlan | "founder_lifetime" | "all_access";

/** Plan tier levels for feature gating */
export type PlanTier = "free" | "pro" | "studio";

export type PaymentRoute =
	| "connect_destination" // Destination charge to tutor's connected account
	| "no_payment_method"; // Tutor cannot accept payments yet (Stripe Connect required)

export type OnboardingStatus = "pending" | "completed" | "restricted";

export interface TutorStripeStatus {
	readonly accountId: string | null;
	readonly chargesEnabled: boolean;
	readonly payoutsEnabled: boolean;
	readonly onboardingStatus: OnboardingStatus;
	readonly defaultCurrency: string | null;
	readonly country: string | null;
	readonly lastCapabilityCheckAt: string | null; // ISO timestamp
	readonly disabledReason: string | null; // e.g., "requirements.past_due", "rejected.fraud"
	readonly currentlyDue: string[] | null; // Requirements currently due
	readonly eventuallyDue: string[] | null; // Requirements eventually due
	readonly pastDue: string[] | null; // Past due requirements (blocking)
	readonly pendingVerification: string[] | null; // Requirements pending verification
	readonly detailsSubmitted: boolean; // Whether account details have been submitted
}

export interface RouteStudentPaymentInput {
	readonly tutorStripe: TutorStripeStatus;
	readonly hasPaymentLink: boolean;
}

export interface RouteStudentPaymentDecision {
	readonly route: PaymentRoute;
	readonly reason:
		| "connect_ready"
		| "no_payment_method_available";
}

export interface ApplicationFeePolicy {
	readonly type: "flat" | "percent";
	readonly amountCents?: number; // when type === "flat"
	readonly percent?: number; // when type === "percent", e.g., 7.5 for 7.5%
	readonly minFeeCents?: number; // optional floor
}

export interface FeeComputationResult {
	readonly applicationFeeCents: number;
	readonly netToTutorCents: number;
}
