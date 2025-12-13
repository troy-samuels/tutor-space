"use server";

import Stripe from "stripe";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import {
  SUBSCRIPTION_TIERS,
  getLessonsPerMonth,
  type TemplateTier,
  type LessonSubscriptionTemplate,
  type SubscriptionBalance,
  type SubscriptionWithDetails,
  type CreateSubscriptionTemplateInput,
  type UpdateSubscriptionTemplateInput,
} from "@/lib/subscription";

// ============================================
// Stripe Client
// ============================================
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
let stripeClient: Stripe | null | undefined;

function getStripe(): Stripe | null {
  if (typeof stripeClient !== "undefined") {
    return stripeClient;
  }

  if (!stripeSecretKey) {
    stripeClient = null;
    return stripeClient;
  }

  stripeClient = new Stripe(stripeSecretKey, {
    apiVersion: "2025-09-30.clover",
  });

  return stripeClient;
}

// ============================================
// Auth Helper
// ============================================
async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { supabase, user: null as null };
  }

  return { supabase, user };
}

// ============================================
// TUTOR ACTIONS: Template Management
// ============================================

/**
 * Create a subscription template for a service
 */
export async function createSubscriptionTemplate(
  input: CreateSubscriptionTemplateInput
): Promise<{ data?: LessonSubscriptionTemplate; error?: string }> {
  const { supabase, user } = await requireUser();

  if (!user) {
    return { error: "You need to be signed in to create subscription templates." };
  }

  // Validate service belongs to tutor
  const { data: service, error: serviceError } = await supabase
    .from("services")
    .select("id, name, tutor_id")
    .eq("id", input.service_id)
    .eq("tutor_id", user.id)
    .single();

  if (serviceError || !service) {
    return { error: "Service not found or doesn't belong to you." };
  }

  // Get lessons per month from tier
  const lessonsPerMonth =
    input.lessons_per_month || getLessonsPerMonth(input.template_tier);

  if (lessonsPerMonth <= 0) {
    return { error: "Invalid lessons per month value." };
  }

  // Create Stripe product and price
  let stripeProductId: string | null = null;
  let stripePriceId: string | null = null;
  const stripe = getStripe();

  if (stripe && input.price_cents > 0) {
    try {
      // Create product
      const product = await stripe.products.create({
        name: `${service.name} - ${lessonsPerMonth} lessons/month`,
        metadata: {
          tutor_id: user.id,
          service_id: input.service_id,
          template_tier: input.template_tier,
          type: "lesson_subscription",
        },
      });
      stripeProductId = product.id;

      // Create recurring price
      const price = await stripe.prices.create({
        currency: (input.currency || "USD").toLowerCase(),
        unit_amount: input.price_cents,
        product: product.id,
        recurring: {
          interval: "month",
        },
      });
      stripePriceId = price.id;
    } catch (stripeError) {
      console.error("[LessonSubscriptions] Failed to create Stripe price", stripeError);
      return { error: "Failed to create Stripe subscription price." };
    }
  }

  // Insert template
  const { data, error } = await supabase
    .from("lesson_subscription_templates")
    .insert({
      tutor_id: user.id,
      service_id: input.service_id,
      lessons_per_month: lessonsPerMonth,
      template_tier: input.template_tier,
      price_cents: input.price_cents,
      currency: input.currency || "USD",
      stripe_product_id: stripeProductId,
      stripe_price_id: stripePriceId,
      max_rollover_lessons: input.max_rollover_lessons ?? null,
      is_active: true,
    })
    .select("*")
    .single<LessonSubscriptionTemplate>();

  if (error) {
    console.error("[LessonSubscriptions] Failed to create template:", error);
    return { error: "Failed to create subscription template." };
  }

  revalidatePath("/services");
  return { data };
}

/**
 * Update a subscription template
 */
export async function updateSubscriptionTemplate(
  templateId: string,
  input: UpdateSubscriptionTemplateInput
): Promise<{ data?: LessonSubscriptionTemplate; error?: string }> {
  const { supabase, user } = await requireUser();

  if (!user) {
    return { error: "You need to be signed in." };
  }

  // Verify ownership
  const { data: existing, error: fetchError } = await supabase
    .from("lesson_subscription_templates")
    .select("*")
    .eq("id", templateId)
    .eq("tutor_id", user.id)
    .single<LessonSubscriptionTemplate>();

  if (fetchError || !existing) {
    return { error: "Template not found." };
  }

  // If price changed, create new Stripe price
  let stripePriceId = existing.stripe_price_id;
  const stripe = getStripe();

  if (
    stripe &&
    input.price_cents !== undefined &&
    input.price_cents !== existing.price_cents &&
    input.price_cents > 0
  ) {
    try {
      // Create new price (Stripe prices are immutable)
      const price = await stripe.prices.create({
        currency: existing.currency.toLowerCase(),
        unit_amount: input.price_cents,
        product: existing.stripe_product_id!,
        recurring: {
          interval: "month",
        },
      });
      stripePriceId = price.id;
    } catch (stripeError) {
      console.error("[LessonSubscriptions] Failed to update Stripe price", stripeError);
    }
  }

  // Update template
  const { data, error } = await supabase
    .from("lesson_subscription_templates")
    .update({
      ...(input.price_cents !== undefined && { price_cents: input.price_cents }),
      ...(input.is_active !== undefined && { is_active: input.is_active }),
      ...(input.max_rollover_lessons !== undefined && {
        max_rollover_lessons: input.max_rollover_lessons,
      }),
      stripe_price_id: stripePriceId,
    })
    .eq("id", templateId)
    .eq("tutor_id", user.id)
    .select("*")
    .single<LessonSubscriptionTemplate>();

  if (error) {
    return { error: "Failed to update template." };
  }

  revalidatePath("/services");
  return { data };
}

/**
 * Delete (deactivate) a subscription template
 */
export async function deleteSubscriptionTemplate(
  templateId: string
): Promise<{ success?: boolean; error?: string }> {
  const { supabase, user } = await requireUser();

  if (!user) {
    return { error: "You need to be signed in." };
  }

  // Soft delete by setting is_active = false
  const { error } = await supabase
    .from("lesson_subscription_templates")
    .update({ is_active: false })
    .eq("id", templateId)
    .eq("tutor_id", user.id);

  if (error) {
    return { error: "Failed to delete template." };
  }

  revalidatePath("/services");
  return { success: true };
}

/**
 * List all subscription templates for the current tutor
 */
export async function listSubscriptionTemplates(): Promise<{
  data?: LessonSubscriptionTemplate[];
  error?: string;
}> {
  const { supabase, user } = await requireUser();

  if (!user) {
    return { error: "You need to be signed in." };
  }

  const { data, error } = await supabase
    .from("lesson_subscription_templates")
    .select("*")
    .eq("tutor_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return { error: "Failed to load templates." };
  }

  return { data: data as LessonSubscriptionTemplate[] };
}

/**
 * Get subscription templates for a specific service
 */
export async function getServiceSubscriptionTemplates(
  serviceId: string
): Promise<{ data?: LessonSubscriptionTemplate[]; error?: string }> {
  const { supabase, user } = await requireUser();

  if (!user) {
    return { error: "You need to be signed in." };
  }

  const { data, error } = await supabase
    .from("lesson_subscription_templates")
    .select("*")
    .eq("service_id", serviceId)
    .eq("tutor_id", user.id)
    .order("lessons_per_month", { ascending: true });

  if (error) {
    return { error: "Failed to load templates." };
  }

  return { data: data as LessonSubscriptionTemplate[] };
}

/**
 * Get template with active subscribers
 */
export async function getTemplateSubscribers(templateId: string): Promise<{
  data?: {
    template: LessonSubscriptionTemplate;
    subscribers: Array<{
      subscription_id: string;
      student_id: string;
      student_name: string;
      student_email: string;
      status: string;
      lessons_used: number;
      lessons_available: number;
      period_ends_at: string;
    }>;
  };
  error?: string;
}> {
  const { supabase, user } = await requireUser();

  if (!user) {
    return { error: "You need to be signed in." };
  }

  // Get template
  const { data: template, error: templateError } = await supabase
    .from("lesson_subscription_templates")
    .select("*")
    .eq("id", templateId)
    .eq("tutor_id", user.id)
    .single<LessonSubscriptionTemplate>();

  if (templateError || !template) {
    return { error: "Template not found." };
  }

  // Get subscriptions with student info and current period
  const { data: subscriptions, error: subsError } = await supabase
    .from("lesson_subscriptions")
    .select(`
      id,
      status,
      current_period_end,
      student:students!inner (
        id,
        full_name,
        email
      ),
      current_period:lesson_allowance_periods!inner (
        lessons_allocated,
        lessons_rolled_over,
        lessons_used
      )
    `)
    .eq("template_id", templateId)
    .eq("current_period.is_current", true)
    .in("status", ["active", "past_due", "trialing"]);

  if (subsError) {
    console.error("[LessonSubscriptions] Failed to load subscribers:", subsError);
    return { error: "Failed to load subscribers." };
  }

  const subscribers = (subscriptions || []).map((sub: {
    id: string;
    status: string;
    current_period_end: string;
    student: { id: string; full_name: string; email: string }[];
    current_period: { lessons_allocated: number; lessons_rolled_over: number; lessons_used: number }[];
  }) => {
    const student = sub.student[0];
    const period = sub.current_period[0];
    return {
      subscription_id: sub.id,
      student_id: student?.id ?? "",
      student_name: student?.full_name ?? "",
      student_email: student?.email ?? "",
      status: sub.status,
      lessons_used: period?.lessons_used ?? 0,
      lessons_available:
        (period?.lessons_allocated ?? 0) +
        (period?.lessons_rolled_over ?? 0) -
        (period?.lessons_used ?? 0),
      period_ends_at: sub.current_period_end,
    };
  });

  return { data: { template, subscribers } };
}

// ============================================
// STUDENT ACTIONS: Subscription Management
// ============================================

/**
 * Check if student has an active subscription with a tutor
 */
export async function hasActiveSubscription(
  studentId: string,
  tutorId: string
): Promise<boolean> {
  const supabase = createServiceRoleClient();
  if (!supabase) return false;

  const { data, error } = await supabase
    .from("lesson_subscriptions")
    .select("id, status")
    .eq("student_id", studentId)
    .eq("tutor_id", tutorId)
    .in("status", ["active", "trialing"])
    .maybeSingle();

  if (error) {
    console.error("[LessonSubscriptions] Error checking subscription:", error);
    return false;
  }

  return !!data;
}

/**
 * Get student's subscription with a tutor
 */
export async function getStudentSubscription(
  studentId: string,
  tutorId: string
): Promise<{ data?: SubscriptionWithDetails; error?: string }> {
  const supabase = createServiceRoleClient();
  if (!supabase) {
    return { error: "Database connection failed." };
  }

  const { data, error } = await supabase
    .from("lesson_subscriptions")
    .select(`
      *,
      template:lesson_subscription_templates!inner (*),
      current_period:lesson_allowance_periods (*)
    `)
    .eq("student_id", studentId)
    .eq("tutor_id", tutorId)
    .eq("current_period.is_current", true)
    .maybeSingle();

  if (error) {
    console.error("[LessonSubscriptions] Error fetching subscription:", error);
    return { error: "Failed to load subscription." };
  }

  if (!data) {
    return { data: undefined };
  }

  // Flatten the nested current_period array
  const subscription: SubscriptionWithDetails = {
    ...data,
    template: data.template,
    current_period: Array.isArray(data.current_period)
      ? data.current_period[0] || null
      : data.current_period,
  };

  return { data: subscription };
}

/**
 * Get subscription balance (available lessons)
 */
export async function getSubscriptionBalance(
  subscriptionId: string
): Promise<{ data?: SubscriptionBalance; error?: string }> {
  const supabase = createServiceRoleClient();
  if (!supabase) {
    return { error: "Database connection failed." };
  }

  const { data, error } = await supabase.rpc("get_subscription_balance", {
    p_subscription_id: subscriptionId,
  });

  if (error) {
    console.error("[LessonSubscriptions] Error getting balance:", error);
    return { error: "Failed to get subscription balance." };
  }

  if (!data || data.length === 0) {
    return { error: "No active period found." };
  }

  return { data: data[0] as SubscriptionBalance };
}

/**
 * Cancel a subscription at period end
 */
export async function cancelSubscription(
  subscriptionId: string
): Promise<{ success?: boolean; error?: string }> {
  const { supabase, user } = await requireUser();

  if (!user) {
    return { error: "You need to be signed in." };
  }

  // Verify the subscription belongs to student or tutor
  const { data: subscription, error: fetchError } = await supabase
    .from("lesson_subscriptions")
    .select(`
      id,
      stripe_subscription_id,
      tutor_id,
      student:students!inner (
        user_id
      )
    `)
    .eq("id", subscriptionId)
    .single();

  if (fetchError || !subscription) {
    return { error: "Subscription not found." };
  }

  // Check authorization - student is returned as array from Supabase join
  const studentData = Array.isArray(subscription.student) ? subscription.student[0] : subscription.student;
  const isStudent = studentData?.user_id === user.id;
  const isTutor = subscription.tutor_id === user.id;

  if (!isStudent && !isTutor) {
    return { error: "Not authorized to cancel this subscription." };
  }

  // Cancel in Stripe
  const stripe = getStripe();
  if (stripe && subscription.stripe_subscription_id) {
    try {
      await stripe.subscriptions.update(subscription.stripe_subscription_id, {
        cancel_at_period_end: true,
      });
    } catch (stripeError) {
      console.error("[LessonSubscriptions] Stripe cancellation failed:", stripeError);
      return { error: "Failed to cancel subscription in Stripe." };
    }
  }

  // Update local record
  const adminSupabase = createServiceRoleClient();
  if (adminSupabase) {
    await adminSupabase
      .from("lesson_subscriptions")
      .update({ cancel_at_period_end: true })
      .eq("id", subscriptionId);
  }

  return { success: true };
}

// ============================================
// BOOKING INTEGRATION
// ============================================

/**
 * Redeem a subscription lesson for a booking
 */
export async function redeemSubscriptionLesson(
  subscriptionId: string,
  bookingId: string,
  lessonsCount: number = 1
): Promise<{ success?: boolean; error?: string }> {
  const supabase = createServiceRoleClient();
  if (!supabase) {
    return { error: "Database connection failed." };
  }

  try {
    const { error } = await supabase.rpc("redeem_subscription_lesson", {
      p_subscription_id: subscriptionId,
      p_booking_id: bookingId,
      p_lessons_count: lessonsCount,
    });

    if (error) {
      console.error("[LessonSubscriptions] Redemption failed:", error);
      return { error: error.message || "Failed to redeem subscription lesson." };
    }

    return { success: true };
  } catch (err) {
    console.error("[LessonSubscriptions] Unexpected error:", err);
    return { error: "An unexpected error occurred." };
  }
}

/**
 * Refund a subscription lesson when booking is cancelled
 */
export async function refundSubscriptionLesson(
  bookingId: string
): Promise<{ success?: boolean; refunded?: boolean; error?: string }> {
  const supabase = createServiceRoleClient();
  if (!supabase) {
    return { error: "Database connection failed." };
  }

  try {
    const { data, error } = await supabase.rpc("refund_subscription_lesson", {
      p_booking_id: bookingId,
    });

    if (error) {
      console.error("[LessonSubscriptions] Refund failed:", error);
      return { error: error.message || "Failed to refund subscription lesson." };
    }

    return { success: true, refunded: data as boolean };
  } catch (err) {
    console.error("[LessonSubscriptions] Unexpected error:", err);
    return { error: "An unexpected error occurred." };
  }
}

// ============================================
// BATCH OPERATIONS: Service Form Integration
// ============================================

/**
 * Save all subscription tiers for a service
 * Called when saving the service form
 */
export async function saveServiceSubscriptionTiers(
  serviceId: string,
  enabled: boolean,
  tiers: Array<{
    tier_id: TemplateTier;
    price_cents: number | null;
  }>
): Promise<{ success?: boolean; error?: string }> {
  const { supabase, user } = await requireUser();

  if (!user) {
    return { error: "You need to be signed in." };
  }

  // Verify service ownership
  const { data: service, error: serviceError } = await supabase
    .from("services")
    .select("id, name")
    .eq("id", serviceId)
    .eq("tutor_id", user.id)
    .single();

  if (serviceError || !service) {
    return { error: "Service not found." };
  }

  // Update subscriptions_enabled on service
  await supabase
    .from("services")
    .update({ subscriptions_enabled: enabled })
    .eq("id", serviceId);

  if (!enabled) {
    // Disable all templates for this service
    await supabase
      .from("lesson_subscription_templates")
      .update({ is_active: false })
      .eq("service_id", serviceId)
      .eq("tutor_id", user.id);

    revalidatePath("/services");
    return { success: true };
  }

  // Get existing templates
  const { data: existingTemplates } = await supabase
    .from("lesson_subscription_templates")
    .select("*")
    .eq("service_id", serviceId)
    .eq("tutor_id", user.id);

  const existingByTier = new Map(
    (existingTemplates || []).map((t: LessonSubscriptionTemplate) => [t.template_tier, t])
  );

  // Process each tier
  for (const tierConfig of tiers) {
    const existing = existingByTier.get(tierConfig.tier_id);
    const tierInfo = SUBSCRIPTION_TIERS[
      tierConfig.tier_id === "2_lessons"
        ? "TWO_LESSONS"
        : tierConfig.tier_id === "4_lessons"
          ? "FOUR_LESSONS"
          : "EIGHT_LESSONS"
    ];

    if (!tierInfo) continue;

    if (tierConfig.price_cents && tierConfig.price_cents > 0) {
      if (existing) {
        // Update existing template
        await updateSubscriptionTemplate(existing.id, {
          price_cents: tierConfig.price_cents,
          is_active: true,
        });
      } else {
        // Create new template
        await createSubscriptionTemplate({
          service_id: serviceId,
          template_tier: tierConfig.tier_id,
          lessons_per_month: tierInfo.lessons_per_month,
          price_cents: tierConfig.price_cents,
        });
      }
    } else if (existing) {
      // Disable template if price is empty
      await updateSubscriptionTemplate(existing.id, { is_active: false });
    }
  }

  revalidatePath("/services");
  return { success: true };
}

/**
 * Get subscription templates for a service as public data
 * Used on booking page to show subscription options
 */
export async function getPublicServiceSubscriptionTemplates(
  serviceId: string
): Promise<{ data?: LessonSubscriptionTemplate[]; error?: string }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("lesson_subscription_templates")
    .select("*")
    .eq("service_id", serviceId)
    .eq("is_active", true)
    .order("lessons_per_month", { ascending: true });

  if (error) {
    return { error: "Failed to load subscription options." };
  }

  return { data: data as LessonSubscriptionTemplate[] };
}

// ============================================
// STUDENT PORTAL: Subscription Management
// ============================================

export interface StudentSubscriptionView {
  id: string;
  status: string;
  cancelAtPeriodEnd: boolean;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  tutor: {
    id: string;
    fullName: string;
    username: string;
    avatarUrl: string | null;
  };
  template: {
    id: string;
    lessonsPerMonth: number;
    priceCents: number;
    currency: string;
    serviceName: string;
  };
  balance: {
    lessonsAllocated: number;
    lessonsRolledOver: number;
    lessonsUsed: number;
    lessonsAvailable: number;
  };
}

export type StudentSubscriptionSummary = {
  totalAvailable: number;
  nextRenewal: string | null;
};

/**
 * Get all lesson subscriptions for the logged-in student
 */
export async function getStudentLessonSubscriptions(): Promise<{
  data?: StudentSubscriptionView[];
  error?: string;
}> {
  const { supabase, user } = await requireUser();

  if (!user) {
    return { error: "You need to be signed in." };
  }

  // First, find all student records for this user
  const { data: students, error: studentsError } = await supabase
    .from("students")
    .select("id")
    .eq("user_id", user.id);

  if (studentsError) {
    console.error("[LessonSubscriptions] Error finding students:", studentsError);
    return { error: "Failed to load subscriptions." };
  }

  if (!students || students.length === 0) {
    return { data: [] };
  }

  const studentIds = students.map((s) => s.id);

  // Fetch subscriptions with nested data
  const { data: subscriptions, error: subsError } = await supabase
    .from("lesson_subscriptions")
    .select(`
      id,
      status,
      cancel_at_period_end,
      current_period_start,
      current_period_end,
      tutor:profiles!lesson_subscriptions_tutor_id_fkey (
        id,
        full_name,
        username,
        avatar_url
      ),
      template:lesson_subscription_templates!lesson_subscriptions_template_id_fkey (
        id,
        lessons_per_month,
        price_cents,
        currency,
        service:services!lesson_subscription_templates_service_id_fkey (
          name
        )
      ),
      current_period:lesson_allowance_periods (
        lessons_allocated,
        lessons_rolled_over,
        lessons_used
      )
    `)
    .in("student_id", studentIds)
    .in("status", ["active", "past_due", "trialing"])
    .eq("current_period.is_current", true);

  if (subsError) {
    console.error("[LessonSubscriptions] Error loading subscriptions:", subsError);
    return { error: "Failed to load subscriptions." };
  }

  // Transform the data
  const result: StudentSubscriptionView[] = (subscriptions || []).map((sub: any) => {
    const tutorData = Array.isArray(sub.tutor) ? sub.tutor[0] : sub.tutor;
    const templateData = Array.isArray(sub.template) ? sub.template[0] : sub.template;
    const periodData = Array.isArray(sub.current_period) ? sub.current_period[0] : sub.current_period;
    const serviceData = templateData?.service;
    const serviceName = Array.isArray(serviceData) ? serviceData[0]?.name : serviceData?.name;

    return {
      id: sub.id,
      status: sub.status,
      cancelAtPeriodEnd: sub.cancel_at_period_end || false,
      currentPeriodStart: sub.current_period_start,
      currentPeriodEnd: sub.current_period_end,
      tutor: {
        id: tutorData?.id || "",
        fullName: tutorData?.full_name || "",
        username: tutorData?.username || "",
        avatarUrl: tutorData?.avatar_url || null,
      },
      template: {
        id: templateData?.id || "",
        lessonsPerMonth: templateData?.lessons_per_month || 0,
        priceCents: templateData?.price_cents || 0,
        currency: templateData?.currency || "USD",
        serviceName: serviceName || "Lesson",
      },
      balance: {
        lessonsAllocated: periodData?.lessons_allocated || 0,
        lessonsRolledOver: periodData?.lessons_rolled_over || 0,
        lessonsUsed: periodData?.lessons_used || 0,
        lessonsAvailable:
          (periodData?.lessons_allocated || 0) +
          (periodData?.lessons_rolled_over || 0) -
          (periodData?.lessons_used || 0),
      },
    };
  });

  return { data: result };
}

/**
 * Lightweight summary for student header: total available credits and next renewal date
 */
export async function getStudentSubscriptionSummary(): Promise<{
  data?: StudentSubscriptionSummary;
  error?: string;
}> {
  const { data, error } = await getStudentLessonSubscriptions();
  if (error) return { error };

  const active = (data || []).filter((sub) => sub.status !== "cancelled");
  const totalAvailable = active.reduce((sum, sub) => sum + (sub.balance?.lessonsAvailable || 0), 0);
  const nextRenewal =
    active
      .map((sub) => sub.currentPeriodEnd)
      .filter(Boolean)
      .sort()
      .at(0) || null;

  return { data: { totalAvailable, nextRenewal } };
}
