"use server";

import { createServiceRoleClient } from "@/lib/supabase/admin";
import { getTrialDays } from "@/lib/utils/stripe-config";
import type { PlatformBillingPlan } from "@/lib/types/payments";

type LocalTrialResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Creates a local trial when Stripe is not configured.
 * Stores trial end date and plan in profiles table.
 * After trial expires, user is prompted to add payment method.
 */
export async function createLocalTrial(
  userId: string,
  plan: PlatformBillingPlan
): Promise<LocalTrialResult> {
  const supabase = createServiceRoleClient();
  if (!supabase) {
    console.error("[LocalTrial] Failed to create Supabase admin client");
    return { success: false, error: "Database unavailable" };
  }

  // Skip trial for free plans - they don't need payment
  if (plan === "professional") {
    return { success: true };
  }

  const trialDays = getTrialDays(plan);
  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + trialDays);

  const { error } = await supabase
    .from("profiles")
    .update({
      plan, // Grant the selected plan immediately
      local_trial_end: trialEnd.toISOString(),
      local_trial_plan: plan,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) {
    console.error("[LocalTrial] Failed to create trial:", error);
    return { success: false, error: error.message };
  }

  console.log(`[LocalTrial] Created ${trialDays}-day trial for ${userId} on ${plan}`);
  return { success: true };
}

/**
 * Checks if user has an active local trial.
 */
export async function hasActiveLocalTrial(userId: string): Promise<boolean> {
  const supabase = createServiceRoleClient();
  if (!supabase) return false;

  const { data } = await supabase
    .from("profiles")
    .select("local_trial_end")
    .eq("id", userId)
    .single();

  if (!data?.local_trial_end) return false;

  return new Date(data.local_trial_end) > new Date();
}

/**
 * Gets local trial info for a user.
 */
export async function getLocalTrialInfo(userId: string): Promise<{
  hasLocalTrial: boolean;
  trialEnd: Date | null;
  trialPlan: string | null;
  daysRemaining: number | null;
}> {
  const supabase = createServiceRoleClient();
  if (!supabase) {
    return { hasLocalTrial: false, trialEnd: null, trialPlan: null, daysRemaining: null };
  }

  const { data } = await supabase
    .from("profiles")
    .select("local_trial_end, local_trial_plan")
    .eq("id", userId)
    .single();

  if (!data?.local_trial_end) {
    return { hasLocalTrial: false, trialEnd: null, trialPlan: null, daysRemaining: null };
  }

  const trialEnd = new Date(data.local_trial_end);
  const now = new Date();
  const diffMs = trialEnd.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  return {
    hasLocalTrial: true,
    trialEnd,
    trialPlan: data.local_trial_plan,
    daysRemaining,
  };
}

/**
 * Clears local trial fields after Stripe subscription is created.
 */
export async function clearLocalTrial(userId: string): Promise<void> {
  const supabase = createServiceRoleClient();
  if (!supabase) return;

  await supabase
    .from("profiles")
    .update({
      local_trial_end: null,
      local_trial_plan: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);
}
