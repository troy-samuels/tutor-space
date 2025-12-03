import type { OnboardingStatus, TutorStripeStatus } from "@/lib/types/payments";

interface StripeRequirements {
	disabled_reason?: string | null;
	currently_due?: string[];
	eventually_due?: string[];
	past_due?: string[];
	pending_verification?: string[];
}

interface StripeAccountShape {
	id?: string;
	charges_enabled?: boolean;
	payouts_enabled?: boolean;
	default_currency?: string;
	country?: string;
	details_submitted?: boolean;
	requirements?: StripeRequirements;
}

export function extractTutorStripeStatus(account: Record<string, unknown>): TutorStripeStatus {
	const typed = account as StripeAccountShape;

	const id = typed.id ?? null;
	const charges = typed.charges_enabled ?? false;
	const payouts = typed.payouts_enabled ?? false;
	const currency = typed.default_currency ?? null;
	const country = typed.country ?? null;
	const detailsSubmitted = typed.details_submitted ?? false;

	const requirements = typed.requirements;
	const disabledReason = requirements?.disabled_reason ?? null;
	const currentlyDue = requirements?.currently_due ?? null;
	const eventuallyDue = requirements?.eventually_due ?? null;
	const pastDue = requirements?.past_due ?? null;
	const pendingVerification = requirements?.pending_verification ?? null;

	let onboardingStatus: OnboardingStatus = "pending";
	if (charges && payouts) {
		onboardingStatus = "completed";
	} else if (disabledReason) {
		onboardingStatus = "restricted";
	}

	return {
		accountId: id,
		chargesEnabled: charges,
		payoutsEnabled: payouts,
		onboardingStatus,
		defaultCurrency: currency,
		country,
		lastCapabilityCheckAt: new Date().toISOString(),
		disabledReason,
		currentlyDue,
		eventuallyDue,
		pastDue,
		pendingVerification,
		detailsSubmitted,
	};
}


