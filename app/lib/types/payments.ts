export type PlatformBillingPlan = "professional" | "growth" | "studio" | "founder_lifetime";

export type PaymentRoute =
	| "connect_destination" // Destination charge to tutor's connected account
	| "payment_link" // External payment URL (e.g., Stripe Payment Link)
	| "platform_fallback"; // Temporary platform-processed charge (only if compliant)

export type OnboardingStatus = "pending" | "completed" | "restricted";

export interface TutorStripeStatus {
	readonly accountId: string | null;
	readonly chargesEnabled: boolean;
	readonly payoutsEnabled: boolean;
	readonly onboardingStatus: OnboardingStatus;
	readonly defaultCurrency: string | null;
	readonly country: string | null;
	readonly lastCapabilityCheckAt: string | null; // ISO timestamp
}

export interface RouteStudentPaymentInput {
	readonly tutorStripe: TutorStripeStatus;
	readonly hasPaymentLink: boolean;
}

export interface RouteStudentPaymentDecision {
	readonly route: PaymentRoute;
	readonly reason:
		| "connect_ready"
		| "use_payment_link"
		| "connect_not_ready_fallback"
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
