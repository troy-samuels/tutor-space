"use server";

import type Stripe from "stripe";
import { stripe, getOrCreateStripeCustomer } from "@/lib/stripe";
import { createServiceRoleClient } from "@/lib/supabase/admin";

const TRIAL_PERIOD_DAYS = 7;

type AutoTrialResult =
  | { success: true; subscriptionId: string }
  | { success: true; skipped: true; reason: string }
  | { success: false; error: string };

/**
 * Automatically creates a Stripe subscription with a 7-day free trial.
 * No payment method is required upfront - subscription will pause when trial ends
 * if no payment method has been added.
 *
 * This should be called after email confirmation in the auth callback.
 */
export async function createAutoTrial(
  userId: string,
  email: string,
  fullName?: string
): Promise<AutoTrialResult> {
  const supabase = createServiceRoleClient();
  if (!supabase) {
    console.error("[Trial] Failed to create Supabase admin client");
    return { success: false, error: "Database unavailable" };
  }

  // Check if user already has a subscription or paid plan
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("plan, stripe_customer_id")
    .eq("id", userId)
    .single();

  if (profileError || !profile) {
    console.error("[Trial] Profile not found:", profileError);
    return { success: false, error: "Profile not found" };
  }

  // Skip if already on a paid plan (Pro/Studio/Lifetime or legacy)
  if (
    [
      "pro_monthly",
      "pro_annual",
      "tutor_life",
      "studio_monthly",
      "studio_annual",
      "studio_life",
      "all_access", // legacy
      "founder_lifetime", // legacy
    ].includes(profile.plan)
  ) {
    return { success: true, skipped: true, reason: "Already on paid plan" };
  }

  // Check if user already has an active or trialing subscription
  const { data: existingSubscription } = await supabase
    .from("subscriptions")
    .select("id, status")
    .eq("profile_id", userId)
    .in("status", ["active", "trialing"])
    .maybeSingle();

  if (existingSubscription) {
    return { success: true, skipped: true, reason: "Already has subscription" };
  }

  // Get or create Stripe customer
  let customer;
  try {
    customer = await getOrCreateStripeCustomer({
      userId,
      email,
      name: fullName,
      metadata: { profileId: userId },
    });
  } catch (err) {
    console.error("[Trial] Failed to get/create Stripe customer:", err);
    return { success: false, error: "Failed to create billing account" };
  }

  // Store customer ID on profile if not already set
  if (!profile.stripe_customer_id || profile.stripe_customer_id !== customer.id) {
    await supabase
      .from("profiles")
      .update({ stripe_customer_id: customer.id })
      .eq("id", userId);
  }

  // Auto-trial defaults to Pro monthly (trialing).
  const priceId = process.env.STRIPE_PRO_MONTHLY_PRICE_ID;
  if (!priceId) {
    console.error("[Trial] STRIPE_PRO_MONTHLY_PRICE_ID not configured");
    return { success: false, error: "Billing not configured" };
  }

  try {
    // Create subscription with trial (NO payment method required)
    const subscriptionResponse = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
      trial_period_days: TRIAL_PERIOD_DAYS,
      payment_settings: {
        save_default_payment_method: "on_subscription",
      },
      trial_settings: {
        end_behavior: {
          missing_payment_method: "pause", // Pause subscription when trial ends if no payment method
        },
      },
      metadata: {
        userId,
        plan: "pro_monthly",
        source: "auto_trial",
      },
    });
    const subscription = subscriptionResponse as unknown as Stripe.Subscription & {
      current_period_start: number;
      current_period_end: number;
    };

    // Immediately update profile to Pro (don't wait for webhook)
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        plan: "pro_monthly",
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (updateError) {
      console.error("[Trial] Failed to update profile plan:", updateError);
      // Don't fail - webhook will eventually sync this
    }

    // Create subscription record
    const { error: subError } = await supabase.from("subscriptions").upsert({
      profile_id: userId,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: customer.id,
      status: subscription.status, // Will be "trialing"
      price_id: priceId,
      current_period_start: new Date(
        subscription.current_period_start * 1000
      ).toISOString(),
      current_period_end: new Date(
        subscription.current_period_end * 1000
      ).toISOString(),
      cancel_at_period_end: false,
      updated_at: new Date().toISOString(),
    });

    if (subError) {
      console.error("[Trial] Failed to create subscription record:", subError);
      // Don't fail - webhook will eventually sync this
    }

    console.log(
      `[Trial] Auto-trial created for ${userId}: ${subscription.id} (status: ${subscription.status})`
    );
    return { success: true, subscriptionId: subscription.id };
  } catch (err) {
    console.error("[Trial] Failed to create subscription:", err);
    return { success: false, error: "Failed to start trial" };
  }
}
