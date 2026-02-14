"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceRoleClient } from "@/lib/supabase/admin";

type ReferralStats = {
  totalReferred: number;
  activeReferred: number;
  rewardsEarned: number;
};

/**
 * Returns a reusable empty referral stats object.
 *
 * @returns Zeroed referral stats.
 */
function emptyReferralStats(): ReferralStats {
  return {
    totalReferred: 0,
    activeReferred: 0,
    rewardsEarned: 0,
  };
}

/**
 * Records a tutor referral using a provided Supabase client.
 *
 * @param client - Supabase client instance.
 * @param params - Referral participant IDs.
 */
export async function recordTutorReferralWithClient(
  client: SupabaseClient,
  params: {
    referrerTutorId: string;
    referredTutorId: string;
  }
): Promise<void> {
  if (!params.referrerTutorId || !params.referredTutorId) {
    throw new Error("Both referrer and referred tutor IDs are required");
  }

  if (params.referrerTutorId === params.referredTutorId) {
    return;
  }

  const { error } = await client
    .from("tutor_referrals")
    .upsert(
      {
        referrer_tutor_id: params.referrerTutorId,
        referred_tutor_id: params.referredTutorId,
        status: "pending",
      },
      {
        onConflict: "referrer_tutor_id,referred_tutor_id",
        ignoreDuplicates: true,
      }
    );

  if (error) {
    throw new Error(`Failed to record tutor referral: ${error.message}`);
  }
}

/**
 * Reads referral dashboard stats for a tutor from a provided Supabase client.
 *
 * @param client - Supabase client instance.
 * @param tutorId - Referrer tutor profile ID.
 * @returns Aggregated referral stats.
 */
export async function getTutorReferralStatsWithClient(
  client: SupabaseClient,
  tutorId: string
): Promise<ReferralStats> {
  if (!tutorId) {
    return emptyReferralStats();
  }

  const { data, error } = await client
    .from("tutor_referrals")
    .select("status")
    .eq("referrer_tutor_id", tutorId);

  if (error || !data) {
    return emptyReferralStats();
  }

  return {
    totalReferred: data.length,
    activeReferred: data.filter((row) => row.status === "active" || row.status === "rewarded").length,
    rewardsEarned: data.filter((row) => row.status === "rewarded").length,
  };
}

/**
 * Applies referral reward metadata for an eligible referral pair using a provided client.
 *
 * @param client - Supabase client instance.
 * @param params - Reward payload.
 */
export async function processReferralRewardWithClient(
  client: SupabaseClient,
  params: {
    referrerTutorId: string;
    referredTutorId: string;
    rewardType: "free_month_pro";
  }
): Promise<void> {
  if (!params.referrerTutorId || !params.referredTutorId) {
    throw new Error("Both referrer and referred tutor IDs are required");
  }

  const { error } = await client
    .from("tutor_referrals")
    .update({
      status: "rewarded",
      reward_type: params.rewardType,
      reward_applied_at: new Date().toISOString(),
    })
    .eq("referrer_tutor_id", params.referrerTutorId)
    .eq("referred_tutor_id", params.referredTutorId);

  if (error) {
    throw new Error(`Failed to process referral reward: ${error.message}`);
  }
}

/**
 * Records a tutor-to-tutor referral relationship.
 *
 * @param params - Referral link participants.
 */
export async function recordTutorReferral(params: {
  referrerTutorId: string;
  referredTutorId: string;
}): Promise<void> {
  const adminClient = createServiceRoleClient();
  if (!adminClient) {
    throw new Error("Service unavailable");
  }

  await recordTutorReferralWithClient(adminClient, params);
}

/**
 * Aggregates referral stats for a tutor.
 *
 * @param tutorId - Tutor profile ID.
 * @returns Referral metrics for dashboard display.
 */
export async function getTutorReferralStats(tutorId: string): Promise<ReferralStats> {
  const adminClient = createServiceRoleClient();
  if (!adminClient) {
    return emptyReferralStats();
  }

  return getTutorReferralStatsWithClient(adminClient, tutorId);
}

/**
 * Marks a referral reward as processed for an eligible pair.
 *
 * @param params - Reward payload.
 */
export async function processReferralReward(params: {
  referrerTutorId: string;
  referredTutorId: string;
  rewardType: "free_month_pro";
}): Promise<void> {
  const adminClient = createServiceRoleClient();
  if (!adminClient) {
    throw new Error("Service unavailable");
  }

  await processReferralRewardWithClient(adminClient, params);
}
