import type { OnboardingStatus, TutorStripeStatus } from "@/lib/types/payments";

export function extractTutorStripeStatus(account: Record<string, unknown>): TutorStripeStatus {
	const id = (account as { id?: string }).id ?? null;
	const charges = (account as { charges_enabled?: boolean }).charges_enabled ?? false;
	const payouts = (account as { payouts_enabled?: boolean }).payouts_enabled ?? false;
	const currency =
		(account as { business_profile?: { default_currency?: string } }).business_profile?.default_currency ??
		null;
	const country = (account as { country?: string }).country ?? null;
	const disabledReason =
		(account as { requirements?: { disabled_reason?: string | null } }).requirements?.disabled_reason ?? null;

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
	};
}


