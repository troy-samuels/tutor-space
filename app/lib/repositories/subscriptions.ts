import type { SupabaseClient } from "@supabase/supabase-js";
import type { PlatformBillingPlan } from "@/lib/types/payments";

export interface UpsertSubscriptionInput {
	readonly profileId: string;
	readonly stripeSubscriptionId: string;
	readonly stripeCustomerId: string;
	readonly status: string;
	readonly priceId: string | null;
	readonly currentPeriodStart: string;
	readonly currentPeriodEnd: string;
	readonly cancelAtPeriodEnd: boolean;
}

export async function upsertSubscription(
	client: SupabaseClient,
	input: UpsertSubscriptionInput
): Promise<void> {
	const { error } = await client.from("subscriptions").upsert({
		profile_id: input.profileId,
		stripe_subscription_id: input.stripeSubscriptionId,
		stripe_customer_id: input.stripeCustomerId,
		status: input.status,
		price_id: input.priceId,
		current_period_start: input.currentPeriodStart,
		current_period_end: input.currentPeriodEnd,
		cancel_at_period_end: input.cancelAtPeriodEnd,
	});
	if (error) {
		throw error;
	}
}

export async function updateProfilePlan(
	client: SupabaseClient,
	profileId: string,
	plan: PlatformBillingPlan
): Promise<void> {
	const { error } = await client.from("profiles").update({ plan }).eq("id", profileId);
	if (error) {
		throw error;
	}
}


