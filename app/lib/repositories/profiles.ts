import type { SupabaseClient } from "@supabase/supabase-js";
import type { TutorStripeStatus } from "@/lib/types/payments";

export async function setStripeAccountId(
	client: SupabaseClient,
	tutorId: string,
	accountId: string
): Promise<void> {
	const { error } = await client
		.from("profiles")
		.update({ stripe_account_id: accountId })
		.eq("id", tutorId);
	if (error) {
		throw error;
	}
}

export async function updateStripeStatus(
	client: SupabaseClient,
	tutorId: string,
	status: TutorStripeStatus
): Promise<void> {
	const { error } = await client
		.from("profiles")
		.update({
			stripe_account_id: status.accountId,
			stripe_charges_enabled: status.chargesEnabled,
			stripe_payouts_enabled: status.payoutsEnabled,
			stripe_onboarding_status: status.onboardingStatus,
			stripe_default_currency: status.defaultCurrency,
			stripe_country: status.country,
			stripe_last_capability_check_at: status.lastCapabilityCheckAt,
			stripe_disabled_reason: status.disabledReason,
			stripe_currently_due: status.currentlyDue,
			stripe_eventually_due: status.eventuallyDue,
			stripe_past_due: status.pastDue,
			stripe_pending_verification: status.pendingVerification,
			stripe_details_submitted: status.detailsSubmitted,
		})
		.eq("id", tutorId);
	if (error) {
		throw error;
	}
}

export async function getTutorStripeStatus(
	client: SupabaseClient,
	tutorId: string
): Promise<TutorStripeStatus> {
	const { data, error } = await client
		.from("profiles")
		.select(
			"stripe_account_id, stripe_charges_enabled, stripe_payouts_enabled, stripe_onboarding_status, stripe_default_currency, stripe_country, stripe_last_capability_check_at, stripe_disabled_reason, stripe_currently_due, stripe_eventually_due, stripe_past_due, stripe_pending_verification, stripe_details_submitted"
		)
		.eq("id", tutorId)
		.single();
	if (error) {
		throw error;
	}
	return {
		accountId: (data?.stripe_account_id as string | null) ?? null,
		chargesEnabled: Boolean(data?.stripe_charges_enabled),
		payoutsEnabled: Boolean(data?.stripe_payouts_enabled),
		onboardingStatus: (data?.stripe_onboarding_status as TutorStripeStatus["onboardingStatus"]) ?? "pending",
		defaultCurrency: (data?.stripe_default_currency as string | null) ?? null,
		country: (data?.stripe_country as string | null) ?? null,
		lastCapabilityCheckAt: (data?.stripe_last_capability_check_at as string | null) ?? null,
		disabledReason: (data?.stripe_disabled_reason as string | null) ?? null,
		currentlyDue: (data?.stripe_currently_due as string[] | null) ?? null,
		eventuallyDue: (data?.stripe_eventually_due as string[] | null) ?? null,
		pastDue: (data?.stripe_past_due as string[] | null) ?? null,
		pendingVerification: (data?.stripe_pending_verification as string[] | null) ?? null,
		detailsSubmitted: Boolean(data?.stripe_details_submitted),
	};
}


