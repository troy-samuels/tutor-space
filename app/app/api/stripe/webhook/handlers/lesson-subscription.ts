import Stripe from "stripe";
import type {
  ServiceRoleClient,
  StripeSubscriptionPayload,
  LessonSubscriptionContext,
  LessonSubscriptionRow,
} from "../utils/types";
import { sendLessonSubscriptionEmails } from "@/lib/emails/ops-emails";

/**
 * Handle Lesson subscription updates (student lesson subscriptions).
 * Updates the subscription status and creates/updates allowance periods.
 */
export async function handleLessonSubscriptionUpdate(
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
export async function handleLessonSubscriptionDeleted(
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
