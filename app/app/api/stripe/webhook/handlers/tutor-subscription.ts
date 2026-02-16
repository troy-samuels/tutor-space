import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import type {
  ServiceRoleClient,
  StripeSubscriptionPayload,
} from "../utils/types";
import { mapPriceIdToPlan, getPlanDbTier } from "@/lib/payments/subscriptions";
import { sendPaymentFailedEmail } from "@/lib/emails/booking-emails";

/**
 * Handle tutor subscription creation or update.
 * Update profile with subscription details.
 */
export async function handleTutorSubscriptionUpdate(
  subscription: StripeSubscriptionPayload,
  supabase: ServiceRoleClient
): Promise<void> {
  const customerId = subscription.customer as string;

  // Find profile by Stripe customer ID
  const { data: profile, error: findError } = await supabase
    .from("profiles")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .single();

  if (findError || !profile) {
    console.error("Profile not found for customer:", customerId);
    return;
  }

  const priceId = subscription.items.data[0]?.price.id;
  let plan = mapPriceIdToPlan(priceId);

  // If subscription is paused (trial ended without payment), downgrade to professional
  if (subscription.status === "paused") {
    plan = "professional";
    console.log(`[Webhook] Subscription paused for profile ${profile.id}, downgrading to professional`);
  }

  // Update or create subscription record
  const { error: upsertError } = await supabase
    .from("subscriptions")
    .upsert({
      profile_id: profile.id,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: customerId,
      status: subscription.status,
      price_id: priceId,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      updated_at: new Date().toISOString(),
    });

  if (upsertError) {
    console.error("Failed to upsert subscription:", upsertError);
    throw upsertError;
  }

  // Get previous plan for history
  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", profile.id)
    .single();
  const previousPlan = currentProfile?.plan || "professional";

  // Update profile plan and tier
  const tier = getPlanDbTier(plan);
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ plan, tier })
    .eq("id", profile.id);

  if (updateError) {
    console.error("Failed to update profile plan:", updateError);
    throw updateError;
  }

  // Record plan change if plan actually changed
  if (previousPlan !== plan) {
    await supabase.from("plan_change_history").insert({
      tutor_id: profile.id,
      previous_plan: previousPlan,
      new_plan: plan,
      change_type: "subscription",
      stripe_event_id: subscription.id,
    });
  }

  console.log(`✅ Subscription updated for profile ${profile.id}: ${plan} (tier: ${tier})`);
}

/**
 * Handle tutor subscription deletion.
 * Mark subscription canceled and revoke access unless the tutor has lifetime access.
 */
export async function handleTutorSubscriptionDeleted(
  subscription: Stripe.Subscription,
  supabase: ServiceRoleClient
): Promise<void> {
  const customerId = subscription.customer as string;

  // Find profile by Stripe customer ID
  const { data: profile, error: findError } = await supabase
    .from("profiles")
    .select("id, plan")
    .eq("stripe_customer_id", customerId)
    .single();

  if (findError || !profile) {
    console.error("Profile not found for customer:", customerId);
    return;
  }

  // Update subscription status
  const { error: updateSubError } = await supabase
    .from("subscriptions")
    .update({
      status: "canceled",
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id);

  if (updateSubError) {
    console.error("Failed to update subscription status:", updateSubError);
  }

  // Lifetime access should never be downgraded by subscription cancellation.
  const LIFETIME_PLANS = ["tutor_life", "studio_life", "founder_lifetime"];
  if (LIFETIME_PLANS.includes(profile.plan)) {
    // Ensure tier is consistent with the preserved plan
    const { error: tierError } = await supabase
      .from("profiles")
      .update({ tier: getPlanDbTier(profile.plan as any) })
      .eq("id", profile.id);
    if (tierError) {
      console.error("Failed to reconcile tier for lifetime profile:", tierError);
    }
    console.log(`✅ Subscription canceled for profile ${profile.id}, lifetime plan preserved (${profile.plan})`);
    return;
  }

  const fallbackPlan = "professional";

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ plan: fallbackPlan, tier: "standard" })
    .eq("id", profile.id);

  if (updateError) {
    console.error("Failed to downgrade profile:", updateError);
    throw updateError;
  }

  // Record plan change history
  await supabase.from("plan_change_history").insert({
    tutor_id: profile.id,
    previous_plan: profile.plan,
    new_plan: fallbackPlan,
    change_type: "cancellation",
    stripe_event_id: subscription.id,
  });

  console.log(`✅ Subscription canceled for profile ${profile.id}, plan set to ${fallbackPlan}, tier reset to standard`);
}

export function getSubscriptionIdFromInvoice(invoice: Stripe.Invoice): string | null {
  const parentSubscription = invoice.parent?.subscription_details?.subscription;
  if (parentSubscription) {
    return typeof parentSubscription === "string"
      ? parentSubscription
      : parentSubscription?.id ?? null;
  }

  // Fallback for older Stripe API versions
  const subscription = (invoice as unknown as Record<string, unknown>).subscription as
    | string
    | { id?: string | null }
    | null
    | undefined;

  if (subscription) {
    return typeof subscription === "string" ? subscription : subscription.id ?? null;
  }

  return null;
}

/**
 * Handle successful invoice payment for tutor subscriptions.
 * Update subscription status and extend access period.
 */
export async function handleTutorInvoicePaymentSucceeded(
  invoice: Stripe.Invoice,
  supabase: ServiceRoleClient
): Promise<void> {
  console.log(`Invoice ${invoice.id} payment succeeded`);

  const subscriptionId = getSubscriptionIdFromInvoice(invoice);

  if (!subscriptionId) {
    console.log(`Invoice ${invoice.id} is not a subscription invoice, skipping`);
    return;
  }

  const customerId = invoice.customer as string;
  if (!customerId) {
    console.log("No customer ID in invoice, skipping");
    return;
  }

  // Find profile by Stripe customer ID
  const { data: profile, error: findError } = await supabase
    .from("profiles")
    .select("id, email, full_name")
    .eq("stripe_customer_id", customerId)
    .single();

  if (findError || !profile) {
    console.error("Profile not found for customer:", customerId);
    return;
  }

  // Update subscription status to active
  const { error: updateError } = await supabase
    .from("subscriptions")
    .update({
      status: "active",
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscriptionId);

  if (updateError) {
    console.error("Failed to update subscription status:", updateError);
  }

  // Reset any failed payment counters
  await supabase
    .from("profiles")
    .update({
      payment_failed_count: 0,
      last_payment_failure_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", profile.id);

  console.log(`Invoice ${invoice.id} processed - subscription ${subscriptionId} renewed for profile ${profile.id}`);
}

/**
 * Handle failed invoice payment for tutor subscriptions.
 * Send notification to user and update subscription status.
 */
export async function handleTutorInvoicePaymentFailed(
  invoice: Stripe.Invoice,
  supabase: ServiceRoleClient,
  subscriptionId: string,
  customerId: string
): Promise<void> {
  // Find profile by Stripe customer ID
  const { data: profile, error: findError } = await supabase
    .from("profiles")
    .select("id, email, full_name, payment_failed_count")
    .eq("stripe_customer_id", customerId)
    .single();

  if (findError || !profile) {
    console.error("Profile not found for customer:", customerId);
    return;
  }

  // Increment failed payment count
  const failedCount = (profile.payment_failed_count || 0) + 1;

  // Update profile with failure info
  await supabase
    .from("profiles")
    .update({
      payment_failed_count: failedCount,
      last_payment_failure_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", profile.id);

  // Update subscription status to past_due
  const { error: updateError } = await supabase
    .from("subscriptions")
    .update({
      status: "past_due",
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscriptionId);

  if (updateError) {
    console.error("Failed to update subscription status:", updateError);
  }

  // Format amount for display
  let amountDue = "N/A";
  if (invoice.amount_due && invoice.currency) {
    try {
      amountDue = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: invoice.currency,
      }).format(invoice.amount_due / 100);
    } catch {
      amountDue = `${invoice.currency.toUpperCase()} ${(invoice.amount_due / 100).toFixed(2)}`;
    }
  }

  // Get plan name from subscription
  let planName = "Your subscription";
  if (subscriptionId) {
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const priceId = subscription.items.data[0]?.price.id;
      if (priceId) {
        planName = mapPriceIdToPlan(priceId);
        planName = planName.charAt(0).toUpperCase() + planName.slice(1);
      }
    } catch (err) {
      console.error("Failed to retrieve subscription for plan name:", err);
    }
  }

  // Calculate next retry date
  const nextRetryDate = invoice.next_payment_attempt
    ? new Date(invoice.next_payment_attempt * 1000).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      })
    : undefined;

  // Send email notification
  if (profile.email) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.tutorlingua.co";
    const updatePaymentUrl = `${baseUrl}/settings/billing`;
    try {
      await sendPaymentFailedEmail({
        userEmail: profile.email,
        userName: profile.full_name || "there",
        planName,
        amountDue,
        nextRetryDate,
        updatePaymentUrl,
      });

      console.log(`Payment failed email sent to ${profile.email}`);
    } catch (err) {
      console.error("Failed to send payment failed email:", err);
    }
  }

  // If payment has failed multiple times, log for manual intervention
  if (failedCount >= 3) {
    console.log(`Profile ${profile.id} has ${failedCount} failed payments - may need manual intervention`);
  }

  console.log(`Invoice ${invoice.id} failure processed for profile ${profile.id} (failure count: ${failedCount})`);
}

/**
 * Handle Stripe Connect account updates.
 * Update tutor's capability flags when their account status changes.
 */
export async function handleAccountUpdated(
  account: Stripe.Account,
  supabase: ServiceRoleClient
): Promise<void> {
  if (!account.id) {
    console.error("No account ID in webhook payload");
    return;
  }

  const chargesEnabled = account.charges_enabled ?? false;
  const payoutsEnabled = account.payouts_enabled ?? false;
  const requirements = account.requirements;

  // Determine onboarding status
  let onboardingStatus: "pending" | "completed" | "restricted" = "pending";
  if (chargesEnabled && payoutsEnabled) {
    onboardingStatus = "completed";
  } else if (requirements?.disabled_reason) {
    onboardingStatus = "restricted";
  }

  const updatePayload = {
    stripe_charges_enabled: chargesEnabled,
    stripe_payouts_enabled: payoutsEnabled,
    stripe_onboarding_status: onboardingStatus,
    stripe_default_currency: account.default_currency || null,
    stripe_country: account.country || null,
    stripe_last_capability_check_at: new Date().toISOString(),
    stripe_disabled_reason: requirements?.disabled_reason || null,
    stripe_currently_due: requirements?.currently_due || null,
    stripe_eventually_due: requirements?.eventually_due || null,
    stripe_past_due: requirements?.past_due || null,
    stripe_pending_verification: requirements?.pending_verification || null,
    stripe_details_submitted: account.details_submitted ?? false,
    updated_at: new Date().toISOString(),
  };

  const { data: updatedProfiles, error } = await supabase
    .from("profiles")
    .update(updatePayload)
    .eq("stripe_account_id", account.id)
    .select("id");

  if (error) {
    console.error("Failed to update Connect status:", error);
    throw error;
  }

  if (!updatedProfiles || updatedProfiles.length === 0) {
    const metadataTutorId = account.metadata?.tutor_id;

    if (!metadataTutorId) {
      console.warn("Connect account update received for unknown profile:", account.id);
      return;
    }

    const { error: fallbackError } = await supabase
      .from("profiles")
      .update({
        ...updatePayload,
        stripe_account_id: account.id,
      })
      .eq("id", metadataTutorId);

    if (fallbackError) {
      console.error("Failed to update Connect status by metadata:", fallbackError);
      throw fallbackError;
    }
  }

  console.log(
    `✅ Updated Connect account ${account.id}: charges=${chargesEnabled}, payouts=${payoutsEnabled}, status=${onboardingStatus}`
  );
}

/**
 * Handle Stripe Connect account deauthorization.
 * Mark the tutor's account as restricted when they disconnect from the platform.
 */
export async function handleAccountDeauthorized(
  accountId: string,
  supabase: ServiceRoleClient
): Promise<void> {
  console.log(`Stripe Connect account ${accountId} deauthorized`);

  const { error } = await supabase
    .from("profiles")
    .update({
      stripe_charges_enabled: false,
      stripe_payouts_enabled: false,
      stripe_onboarding_status: "restricted",
      stripe_disabled_reason: "account_deauthorized",
      stripe_last_capability_check_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_account_id", accountId);

  if (error) {
    console.error("Failed to update deauthorized account:", error);
    throw error;
  }

  console.log(`✅ Account ${accountId} marked as deauthorized`);
}
