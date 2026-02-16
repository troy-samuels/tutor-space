import Stripe from "stripe";
import type {
  ServiceRoleClient,
  StripeSubscriptionPayload,
} from "../utils/types";

type StudentPracticeTier = "unlimited" | "solo";

/**
 * Parses and validates student practice tier metadata.
 *
 * @param value - Raw Stripe metadata value.
 * @returns Normalized tier token or `null`.
 */
function parseStudentPracticeTier(value: string | undefined): StudentPracticeTier | null {
  if (value === "unlimited" || value === "solo") {
    return value;
  }

  return null;
}

/**
 * Handles updates for the new student practice subscriptions (Unlimited/Solo).
 *
 * @param subscription - Stripe subscription payload.
 * @param supabase - Service-role Supabase client.
 */
export async function handleStudentPracticeSubscriptionUpdate(
  subscription: StripeSubscriptionPayload,
  supabase: ServiceRoleClient
): Promise<void> {
  const studentId = subscription.metadata?.studentId;
  const practiceTier = parseStudentPracticeTier(subscription.metadata?.practice_tier);

  if (!studentId || !practiceTier) {
    console.error("Missing student practice metadata:", subscription.metadata);
    return;
  }

  const isActive = subscription.status === "active" || subscription.status === "trialing";
  const periodStartIso = new Date(subscription.current_period_start * 1000).toISOString();
  const periodEndIso = new Date(subscription.current_period_end * 1000).toISOString();

  const { data: existingStudent, error: loadError } = await supabase
    .from("students")
    .select("practice_period_start")
    .eq("id", studentId)
    .maybeSingle();

  if (loadError) {
    console.error("Failed to load student for practice subscription:", loadError);
  }

  const shouldResetSessionUsage = existingStudent?.practice_period_start !== periodStartIso;

  const activePayload: Record<string, unknown> = {
    practice_tier: practiceTier,
    practice_subscription_id: subscription.id,
    practice_period_start: periodStartIso,
    ai_practice_subscription_id: subscription.id,
    ai_practice_current_period_end: periodEndIso,
    ai_practice_enabled: true,
    ai_practice_free_tier_enabled: true,
  };

  if (shouldResetSessionUsage) {
    activePayload.practice_sessions_used = 0;
  }

  const inactivePayload = {
    practice_tier: null,
    practice_subscription_id: null,
    practice_period_start: null,
    ai_practice_subscription_id: null,
    ai_practice_current_period_end: null,
    ai_practice_enabled: true,
    ai_practice_free_tier_enabled: true,
  };

  const { error } = await supabase
    .from("students")
    .update(isActive ? activePayload : inactivePayload)
    .eq("id", studentId);

  if (error) {
    console.error("Failed to update student practice subscription:", error);
    throw error;
  }

  console.log(
    `✅ Student practice subscription updated for ${studentId}: status=${subscription.status}, tier=${isActive ? practiceTier : "free"}`
  );
}

/**
 * Handles cancellation for the new student practice subscriptions.
 *
 * @param subscription - Stripe subscription payload.
 * @param supabase - Service-role Supabase client.
 */
export async function handleStudentPracticeSubscriptionDeleted(
  subscription: Stripe.Subscription,
  supabase: ServiceRoleClient
): Promise<void> {
  const studentId = subscription.metadata?.studentId;

  if (!studentId) {
    console.error("No studentId in student practice cancellation metadata");
    return;
  }

  const { error } = await supabase
    .from("students")
    .update({
      practice_tier: null,
      practice_subscription_id: null,
      practice_period_start: null,
      ai_practice_subscription_id: null,
      ai_practice_current_period_end: null,
      ai_practice_enabled: true,
      ai_practice_free_tier_enabled: true,
    })
    .eq("id", studentId);

  if (error) {
    console.error("Failed to clear student practice subscription:", error);
    throw error;
  }

  console.log(`✅ Student practice subscription canceled for student ${studentId}`);
}

/**
 * Handles payment failure for the new student practice subscriptions.
 *
 * Payment failures immediately downgrade the student back to free tier.
 *
 * @param subscription - Stripe subscription payload.
 * @param supabase - Service-role Supabase client.
 */
export async function handleStudentPracticePaymentFailed(
  subscription: Stripe.Subscription,
  supabase: ServiceRoleClient
): Promise<void> {
  const studentId = subscription.metadata?.studentId;

  if (!studentId) {
    console.error("No studentId in student practice payment_failed metadata");
    return;
  }

  const { error } = await supabase
    .from("students")
    .update({
      practice_tier: null,
      practice_subscription_id: null,
      practice_period_start: null,
      ai_practice_subscription_id: null,
      ai_practice_current_period_end: null,
      ai_practice_enabled: true,
      ai_practice_free_tier_enabled: true,
    })
    .eq("id", studentId);

  if (error) {
    console.error("Failed to downgrade student after payment failure:", error);
    throw error;
  }

  console.log(`✅ Student practice payment failed, reverted to free tier for ${studentId}`);
}

/**
 * Handle AI Practice subscription updates (student subscriptions).
 *
 * FREEMIUM MODEL:
 * - Legacy "ai_practice" type: Full subscription, sets ai_practice_enabled
 * - New "ai_practice_blocks" type: Blocks-only subscription
 */
export async function handleAIPracticeSubscriptionUpdate(
  subscription: StripeSubscriptionPayload,
  supabase: ServiceRoleClient
): Promise<void> {
  const studentId = subscription.metadata?.studentId;
  const tutorId = subscription.metadata?.tutorId;
  const isBlocksOnly = subscription.metadata?.is_blocks_only === "true" ||
                       subscription.metadata?.type === "ai_practice_blocks";

  if (!studentId) {
    console.error("No studentId in AI Practice subscription metadata");
    return;
  }

  const isActive = subscription.status === "active" || subscription.status === "trialing";

  // Find the metered subscription item (block price)
  const meteredItem = subscription.items.data.find(
    (item) => item.price.recurring?.usage_type === "metered"
  );

  if (isBlocksOnly) {
    // FREEMIUM MODEL: Blocks-only subscription
    const { error } = await supabase
      .from("students")
      .update({
        ai_practice_block_subscription_item_id: isActive ? (meteredItem?.id || null) : null,
      })
      .eq("id", studentId);

    if (error) {
      console.error("Failed to update AI Practice blocks subscription:", error);
      throw error;
    }

    if (isActive && tutorId) {
      const { error: periodError } = await supabase
        .from("practice_usage_periods")
        .update({
          stripe_subscription_id: subscription.id,
          is_free_tier: false,
        })
        .eq("student_id", studentId)
        .gte("period_end", new Date().toISOString());

      if (periodError) {
        console.error("Failed to link subscription to usage period:", periodError);
      }
    }

    console.log(
      `✅ AI Practice blocks subscription ${isActive ? "activated" : "updated"} for student ${studentId} (freemium model)`
    );
  } else {
    // LEGACY MODEL: Full subscription with base + blocks
    const { error } = await supabase
      .from("students")
      .update({
        ai_practice_enabled: isActive,
        ai_practice_subscription_id: subscription.id,
        ai_practice_current_period_end: new Date(
          subscription.current_period_end * 1000
        ).toISOString(),
        ai_practice_block_subscription_item_id: meteredItem?.id || null,
      })
      .eq("id", studentId);

    if (error) {
      console.error("Failed to update AI Practice subscription:", error);
      throw error;
    }

    if (isActive && tutorId) {
      const periodStart = new Date(subscription.current_period_start * 1000);
      const periodEnd = new Date(subscription.current_period_end * 1000);

      const { data: existingPeriod } = await supabase
        .from("practice_usage_periods")
        .select("id")
        .eq("student_id", studentId)
        .eq("subscription_id", subscription.id)
        .eq("period_start", periodStart.toISOString())
        .maybeSingle();

      if (!existingPeriod) {
        const { error: periodError } = await supabase
          .from("practice_usage_periods")
          .insert({
            student_id: studentId,
            tutor_id: tutorId,
            subscription_id: subscription.id,
            period_start: periodStart.toISOString(),
            period_end: periodEnd.toISOString(),
            audio_seconds_used: 0,
            text_turns_used: 0,
            blocks_consumed: 0,
            is_free_tier: false,
            current_tier_price_cents: 800,
          });

        if (periodError) {
          console.error("Failed to create usage period:", periodError);
        } else {
          console.log(`✅ Created new usage period for student ${studentId} (legacy model)`);
        }
      }
    }

    console.log(
      `✅ AI Practice subscription ${isActive ? "activated" : "updated"} for student ${studentId} (legacy model)`
    );
  }
}

/**
 * Handle AI Practice subscription cancellation.
 */
export async function handleAIPracticeSubscriptionDeleted(
  subscription: Stripe.Subscription,
  supabase: ServiceRoleClient
): Promise<void> {
  const studentId = subscription.metadata?.studentId;
  const isBlocksOnly = subscription.metadata?.is_blocks_only === "true" ||
                       subscription.metadata?.type === "ai_practice_blocks";

  if (!studentId) {
    console.error("No studentId in AI Practice subscription metadata");
    return;
  }

  if (isBlocksOnly) {
    // FREEMIUM MODEL: Blocks-only subscription canceled
    const { error } = await supabase
      .from("students")
      .update({
        ai_practice_block_subscription_item_id: null,
      })
      .eq("id", studentId);

    if (error) {
      console.error("Failed to clear AI Practice blocks subscription:", error);
      throw error;
    }

    const { error: periodError } = await supabase
      .from("practice_usage_periods")
      .update({
        is_free_tier: true,
        stripe_subscription_id: null,
      })
      .eq("student_id", studentId)
      .gte("period_end", new Date().toISOString());

    if (periodError) {
      console.error("Failed to update usage period to free tier:", periodError);
    }

    console.log(`✅ AI Practice blocks subscription canceled for student ${studentId} (reverted to free tier)`);
  } else {
    // LEGACY MODEL: Full subscription canceled
    const { error } = await supabase
      .from("students")
      .update({
        ai_practice_enabled: false,
      })
      .eq("id", studentId);

    if (error) {
      console.error("Failed to disable AI Practice subscription:", error);
      throw error;
    }

    console.log(`✅ AI Practice subscription canceled for student ${studentId} (legacy model)`);
  }
}
