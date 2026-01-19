import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import type {
  ServiceRoleClient,
  StripeSubscriptionPayload,
  LessonSubscriptionContext,
  LessonSubscriptionRow,
} from "../utils/types";
import { mapPriceIdToPlan, getPlanDbTier } from "@/lib/payments/subscriptions";
import { sendPaymentFailedEmail } from "@/lib/emails/booking-emails";
import { sendLessonSubscriptionEmails } from "@/lib/emails/ops-emails";

// ==========================================
// TUTOR SUBSCRIPTION HANDLERS
// ==========================================

/**
 * Handle subscription creation or update.
 * Update profile with subscription details.
 */
export async function handleSubscriptionUpdate(
  subscription: StripeSubscriptionPayload,
  supabase: ServiceRoleClient
): Promise<void> {
  const customerId = subscription.customer as string;

  // Check if this is an AI Practice subscription (student subscription)
  if (subscription.metadata?.type === "ai_practice" || subscription.metadata?.type === "ai_practice_blocks") {
    await handleAIPracticeSubscriptionUpdate(subscription, supabase);
    return;
  }

  // Check if this is a Lesson subscription (student subscription)
  if (subscription.metadata?.type === "lesson_subscription") {
    await handleLessonSubscriptionUpdate(subscription, supabase);
    return;
  }

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
 * Handle subscription deletion.
 * Mark subscription canceled and revoke access unless the tutor has lifetime access.
 */
export async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
  supabase: ServiceRoleClient
): Promise<void> {
  // Check if this is an AI Practice subscription
  if (subscription.metadata?.type === "ai_practice" || subscription.metadata?.type === "ai_practice_blocks") {
    await handleAIPracticeSubscriptionDeleted(subscription, supabase);
    return;
  }

  // Check if this is a Lesson subscription
  if (subscription.metadata?.type === "lesson_subscription") {
    await handleLessonSubscriptionDeleted(subscription, supabase);
    return;
  }

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

// ==========================================
// INVOICE HANDLERS
// ==========================================

function getSubscriptionIdFromInvoice(invoice: Stripe.Invoice): string | null {
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
 * Handle successful invoice payment.
 * Update subscription status and extend access period.
 */
export async function handleInvoicePaymentSucceeded(
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
 * Handle failed invoice payment.
 * Send notification to user and update subscription status.
 */
export async function handleInvoicePaymentFailed(
  invoice: Stripe.Invoice,
  supabase: ServiceRoleClient
): Promise<void> {
  console.log(`Invoice ${invoice.id} payment failed`);

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

// ==========================================
// CONNECT ACCOUNT HANDLERS
// ==========================================

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

// ==========================================
// AI PRACTICE SUBSCRIPTION HANDLERS
// ==========================================

/**
 * Handle AI Practice subscription updates (student subscriptions).
 *
 * FREEMIUM MODEL:
 * - Legacy "ai_practice" type: Full subscription, sets ai_practice_enabled
 * - New "ai_practice_blocks" type: Blocks-only subscription
 */
async function handleAIPracticeSubscriptionUpdate(
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
async function handleAIPracticeSubscriptionDeleted(
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

// ==========================================
// LESSON SUBSCRIPTION HANDLERS
// ==========================================

/**
 * Handle Lesson subscription updates (student lesson subscriptions).
 * Updates the subscription status and creates/updates allowance periods.
 */
async function handleLessonSubscriptionUpdate(
  subscription: StripeSubscriptionPayload,
  supabase: ServiceRoleClient
): Promise<void> {
  const studentId = subscription.metadata?.studentId;
  const tutorId = subscription.metadata?.tutorId;
  const templateId = subscription.metadata?.templateId;

  if (!studentId || !tutorId || !templateId) {
    console.error("Missing metadata in lesson subscription:", subscription.metadata);
    return;
  }

  const isActive = subscription.status === "active" || subscription.status === "trialing";
  const periodStart = new Date(subscription.current_period_start * 1000);
  const periodEnd = new Date(subscription.current_period_end * 1000);

  const { data: existingSub } = await supabase
    .from("lesson_subscriptions")
    .select("id")
    .eq("stripe_subscription_id", subscription.id)
    .maybeSingle();

  if (existingSub) {
    const { error: updateError } = await supabase
      .from("lesson_subscriptions")
      .update({
        status: subscription.status,
        current_period_start: periodStart.toISOString(),
        current_period_end: periodEnd.toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingSub.id);

    if (updateError) {
      console.error("Failed to update lesson subscription:", updateError);
      throw updateError;
    }

    if (isActive) {
      await supabase.rpc("process_subscription_rollover", {
        p_subscription_id: existingSub.id,
        p_new_period_start: periodStart.toISOString(),
        p_new_period_end: periodEnd.toISOString(),
      });
    }

    const context = await loadLessonSubscriptionContext(supabase, existingSub.id);
    if (context) {
      try {
        await sendLessonSubscriptionEmails({
          studentEmail: context.studentEmail,
          studentName: context.studentName,
          tutorEmail: context.tutorEmail,
          tutorName: context.tutorName,
          status: subscription.cancel_at_period_end
            ? "cancellation_scheduled"
            : "renewed",
          planName: context.planName,
          lessonsPerMonth: context.lessonsPerMonth,
          periodEnd: context.periodEnd,
          manageUrl: process.env.NEXT_PUBLIC_APP_URL
            ? `${process.env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, "")}/student/subscriptions`
            : undefined,
        });
      } catch (err) {
        console.error("Failed to send lesson subscription renewal email:", err);
      }
    }
  } else {
    const { data: newSub, error: insertError } = await supabase
      .from("lesson_subscriptions")
      .insert({
        template_id: templateId,
        student_id: studentId,
        tutor_id: tutorId,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: subscription.customer as string,
        status: subscription.status,
        current_period_start: periodStart.toISOString(),
        current_period_end: periodEnd.toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Failed to create lesson subscription:", insertError);
      throw insertError;
    }

    const { data: template } = await supabase
      .from("lesson_subscription_templates")
      .select("lessons_per_month")
      .eq("id", templateId)
      .single();

    if (newSub && template) {
      const { error: periodError } = await supabase
        .from("lesson_allowance_periods")
        .insert({
          subscription_id: newSub.id,
          period_start: periodStart.toISOString(),
          period_end: periodEnd.toISOString(),
          lessons_allocated: template.lessons_per_month,
          lessons_rolled_over: 0,
          lessons_used: 0,
          is_current: true,
        });

      if (periodError) {
        console.error("Failed to create allowance period:", periodError);
      }
    }

    const context = await loadLessonSubscriptionContext(supabase, newSub?.id || "");
    if (context) {
      try {
        await sendLessonSubscriptionEmails({
          studentEmail: context.studentEmail,
          studentName: context.studentName,
          tutorEmail: context.tutorEmail,
          tutorName: context.tutorName,
          status: "activated",
          planName: context.planName,
          lessonsPerMonth: context.lessonsPerMonth,
          periodEnd: context.periodEnd,
          manageUrl: process.env.NEXT_PUBLIC_APP_URL
            ? `${process.env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, "")}/student/subscriptions`
            : undefined,
        });
      } catch (err) {
        console.error("Failed to send lesson subscription activation email:", err);
      }
    }
  }

  console.log(
    `✅ Lesson subscription ${isActive ? "activated" : "updated"} for student ${studentId}`
  );
}

async function loadLessonSubscriptionContext(
  supabase: ServiceRoleClient,
  subscriptionId: string
): Promise<LessonSubscriptionContext | null> {
  const { data } = await supabase
    .from("lesson_subscriptions")
    .select(
      `
        id,
        current_period_end,
        student:students(full_name, email),
        tutor:profiles(full_name, email),
        template:lesson_subscription_templates (
          lessons_per_month,
          service:services(name)
        )
      `
    )
    .eq("id", subscriptionId)
    .maybeSingle<LessonSubscriptionRow>();

  if (!data) return null;

  const student = Array.isArray(data.student) ? data.student[0] : data.student;
  const tutor = Array.isArray(data.tutor) ? data.tutor[0] : data.tutor;
  const template = Array.isArray(data.template) ? data.template[0] : data.template;
  const service = template?.service;
  const serviceRecord = Array.isArray(service) ? service[0] : service;
  const serviceName = serviceRecord?.name ?? null;

  return {
    studentEmail: student?.email ?? null,
    studentName: student?.full_name || "Student",
    tutorEmail: tutor?.email ?? null,
    tutorName: tutor?.full_name || "Tutor",
    lessonsPerMonth: template?.lessons_per_month ?? null,
    planName: serviceName ? `${serviceName} subscription` : "Lesson subscription",
    periodEnd: data.current_period_end,
  };
}

/**
 * Handle Lesson subscription cancellation.
 * Marks the subscription as canceled but allows using remaining credits.
 */
async function handleLessonSubscriptionDeleted(
  subscription: Stripe.Subscription,
  supabase: ServiceRoleClient
): Promise<void> {
  const { error } = await supabase
    .from("lesson_subscriptions")
    .update({
      status: "canceled",
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id);

  if (error) {
    console.error("Failed to mark lesson subscription as canceled:", error);
    throw error;
  }

  const { data: sub } = await supabase
    .from("lesson_subscriptions")
    .select("id")
    .eq("stripe_subscription_id", subscription.id)
    .single();

  if (sub) {
    await supabase
      .from("lesson_allowance_periods")
      .update({
        is_current: false,
        finalized_at: new Date().toISOString(),
      })
      .eq("subscription_id", sub.id)
      .eq("is_current", true);

    const context = await loadLessonSubscriptionContext(supabase, sub.id);
    if (context) {
      try {
        await sendLessonSubscriptionEmails({
          studentEmail: context.studentEmail,
          studentName: context.studentName,
          tutorEmail: context.tutorEmail,
          tutorName: context.tutorName,
          status: "canceled",
          planName: context.planName,
          lessonsPerMonth: context.lessonsPerMonth,
          periodEnd: context.periodEnd,
          manageUrl: process.env.NEXT_PUBLIC_APP_URL
            ? `${process.env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, "")}/student/subscriptions`
            : undefined,
        });
      } catch (err) {
        console.error("Failed to send lesson subscription cancellation email:", err);
      }
    }
  }

  console.log(`✅ Lesson subscription canceled: ${subscription.id}`);
}
