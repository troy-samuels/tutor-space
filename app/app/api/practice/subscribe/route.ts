import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import type Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";
import { errorResponse } from "@/lib/api/error-responses";
import { enforceCheckoutRateLimit } from "@/lib/payments/checkout-rate-limit";
import { getStudentPracticeAccess } from "@/lib/practice/access";
import {
  resolveCheckoutPlan,
  type PracticeCheckoutPlan,
} from "@/lib/practice/checkout-plans";

type SubscribeRequestBody = {
  studentId?: string;
};

type StudentCheckoutRow = {
  id: string;
  user_id: string | null;
  tutor_id: string | null;
  full_name: string | null;
  email: string | null;
  ai_practice_customer_id: string | null;
  practice_tier: string | null;
  practice_subscription_id: string | null;
};

const SUBSCRIBE_BODY_SCHEMA = z
  .object({
    studentId: z.string().uuid().optional(),
  })
  .strict();

/**
 * Creates a student practice checkout session.
 *
 * Tutor-linked students are routed to the Unlimited plan ($4.99/mo).
 * Solo students are routed to the Solo plan ($9.99/mo).
 */
export async function POST(request: Request) {
  const requestId = randomUUID();
  const respondError = (
    message: string,
    status: number,
    code: string,
    extra?: Record<string, unknown>
  ) =>
    errorResponse(message, {
      status,
      code,
      extra: {
        requestId,
        ...extra,
      },
    });

  try {
    const supabase = await createClient();
    const supabaseAdmin = createServiceRoleClient();

    if (!supabaseAdmin) {
      return respondError("Service unavailable", 503, "SERVICE_UNAVAILABLE");
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return respondError("Unauthorized", 401, "UNAUTHORIZED");
    }

    const parsedBody = await parseSubscribeBody(request);
    if (!parsedBody.success) {
      return respondError("Invalid request body", 400, "INVALID_INPUT", {
        details: parsedBody.error.flatten(),
      });
    }

    const student = await loadStudentForCheckout(supabaseAdmin, user.id, parsedBody.data.studentId);
    if (!student) {
      return respondError("Student not found", 404, "STUDENT_NOT_FOUND");
    }

    const rateLimitResult = await enforceCheckoutRateLimit({
      supabaseAdmin,
      userId: user.id,
      req: request,
      keyPrefix: "checkout:practice_subscription",
      limit: 5,
      windowSeconds: 60,
    });

    if (!rateLimitResult.ok) {
      return respondError(
        rateLimitResult.error || "Too many requests",
        rateLimitResult.status ?? 429,
        "RATE_LIMITED"
      );
    }

    const access = await getStudentPracticeAccess(supabaseAdmin, student.id);
    if (!access.hasAccess) {
      const status = access.reason === "student_not_found" ? 404 : 500;
      return respondError(access.message, status, access.reason.toUpperCase());
    }

    if (access.tier === "unlimited" || access.tier === "solo") {
      return respondError("Practice subscription is already active", 409, "ALREADY_SUBSCRIBED", {
        tier: access.tier,
      });
    }

    const checkoutPlan = resolveCheckoutPlan(student.tutor_id);
    const customerId = await getOrCreatePracticeCustomer({
      student,
      userId: user.id,
      userEmail: user.email ?? null,
    });

    const stripePrice = await getOrCreatePracticeStripePrice(checkoutPlan);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl) {
      return respondError("App URL is not configured", 503, "SERVICE_UNAVAILABLE");
    }

    const checkoutSession = await stripe.checkout.sessions.create(
      {
        mode: "subscription",
        customer: customerId,
        allow_promotion_codes: true,
        line_items: [{ price: stripePrice.id, quantity: 1 }],
        success_url: `${appUrl}${checkoutPlan.successPath}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${appUrl}${checkoutPlan.cancelPath}`,
        metadata: {
          type: "student_practice_subscription",
          studentId: student.id,
          tutorId: student.tutor_id ?? "",
          practice_tier: checkoutPlan.subscription,
          practice_price_cents: String(checkoutPlan.priceCents),
        },
        subscription_data: {
          metadata: {
            type: "student_practice_subscription",
            studentId: student.id,
            tutorId: student.tutor_id ?? "",
            practice_tier: checkoutPlan.subscription,
            practice_price_cents: String(checkoutPlan.priceCents),
          },
        },
      },
      {
        idempotencyKey: `practice-checkout:${student.id}:${checkoutPlan.subscription}`,
      }
    );

    return NextResponse.json({
      checkoutUrl: checkoutSession.url,
      tier: checkoutPlan.subscription,
      priceCents: checkoutPlan.priceCents,
      message:
        checkoutPlan.subscription === "unlimited"
          ? "Redirecting to Unlimited Practice checkout."
          : "Redirecting to Solo Practice checkout.",
    });
  } catch (error) {
    console.error("[Practice Subscribe] Error:", error);
    return respondError("Failed to create checkout session", 500, "INTERNAL_ERROR");
  }
}

/**
 * Returns the authenticated student's current practice subscription state.
 */
export async function GET() {
  const requestId = randomUUID();
  const respondError = (message: string, status: number, code: string) =>
    errorResponse(message, { status, code, extra: { requestId } });

  try {
    const supabase = await createClient();
    const supabaseAdmin = createServiceRoleClient();

    if (!supabaseAdmin) {
      return respondError("Service unavailable", 503, "SERVICE_UNAVAILABLE");
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return respondError("Unauthorized", 401, "UNAUTHORIZED");
    }

    const student = await loadStudentForCheckout(supabaseAdmin, user.id);
    if (!student) {
      return respondError("Student not found", 404, "STUDENT_NOT_FOUND");
    }

    const access = await getStudentPracticeAccess(supabaseAdmin, student.id);
    if (!access.hasAccess) {
      const status = access.reason === "student_not_found" ? 404 : 500;
      return respondError(access.message, status, access.reason.toUpperCase());
    }

    return NextResponse.json({
      hasAccess: true,
      tier: access.tier,
      sessionsPerMonth: access.sessionsPerMonth,
      textTurnsPerSession: access.textTurnsPerSession,
      audioEnabled: access.audioEnabled,
      adaptiveEnabled: access.adaptiveEnabled,
      voiceInputEnabled: access.voiceInputEnabled,
      showUpgradePrompt: access.showUpgradePrompt,
      upgradePrice: access.upgradePrice,
      practiceSubscription:
        access.tier === "unlimited" || access.tier === "solo" ? access.tier : null,
      isFreeUser: access.isFreeUser,
      hasBlockSubscription: false,
      hasLegacySubscription: Boolean(student.practice_subscription_id),
    });
  } catch (error) {
    console.error("[Practice Subscribe Status] Error:", error);
    return respondError("Failed to get subscription status", 500, "INTERNAL_ERROR");
  }
}

/**
 * Parses and validates the subscription request body.
 *
 * @param request - Incoming POST request.
 * @returns Validated payload or a schema error.
 */
async function parseSubscribeBody(request: Request) {
  try {
    const json = (await request.json()) as SubscribeRequestBody;
    return SUBSCRIBE_BODY_SCHEMA.safeParse(json);
  } catch {
    return SUBSCRIBE_BODY_SCHEMA.safeParse({});
  }
}

/**
 * Loads the authenticated student's billing row.
 *
 * @param supabaseAdmin - Service-role Supabase client.
 * @param userId - Authenticated user ID.
 * @param studentId - Optional explicit student ID.
 * @returns Student row for checkout decisions.
 */
async function loadStudentForCheckout(
  supabaseAdmin: NonNullable<ReturnType<typeof createServiceRoleClient>>,
  userId: string,
  studentId?: string
): Promise<StudentCheckoutRow | null> {
  const query = supabaseAdmin
    .from("students")
    .select(
      "id, user_id, tutor_id, full_name, email, ai_practice_customer_id, practice_tier, practice_subscription_id"
    )
    .eq("user_id", userId);

  if (studentId) {
    const { data, error } = await query.eq("id", studentId).maybeSingle();
    if (error) {
      console.error("[Practice Subscribe] Failed to load student by id:", error);
      return null;
    }
    return (data as StudentCheckoutRow | null) ?? null;
  }

  const { data, error } = await query.limit(1).maybeSingle();
  if (error) {
    console.error("[Practice Subscribe] Failed to load student:", error);
    return null;
  }
  return (data as StudentCheckoutRow | null) ?? null;
}

/**
 * Gets or creates the Stripe customer for a student practice subscription.
 *
 * @param params - Customer identity and metadata payload.
 * @returns Stripe customer ID.
 */
async function getOrCreatePracticeCustomer(params: {
  student: StudentCheckoutRow;
  userId: string;
  userEmail: string | null;
}): Promise<string> {
  const { student, userId, userEmail } = params;

  if (student.ai_practice_customer_id) {
    return student.ai_practice_customer_id;
  }

  const customer = await stripe.customers.create(
    {
      email: userEmail || student.email || undefined,
      name: student.full_name || undefined,
      metadata: {
        userId,
        studentId: student.id,
        tutorId: student.tutor_id || "",
        source: "student_practice",
      },
    },
    { idempotencyKey: `practice-customer:${student.id}` }
  );

  const supabaseAdmin = createServiceRoleClient();
  if (supabaseAdmin) {
    const { error } = await supabaseAdmin
      .from("students")
      .update({ ai_practice_customer_id: customer.id })
      .eq("id", student.id);

    if (error) {
      console.error("[Practice Subscribe] Failed to persist customer ID:", error);
    }
  }

  return customer.id;
}

/**
 * Gets or creates the recurring Stripe price used for the selected practice plan.
 *
 * @param plan - Target checkout plan.
 * @returns Active recurring Stripe price.
 */
async function getOrCreatePracticeStripePrice(plan: PracticeCheckoutPlan): Promise<Stripe.Price> {
  const product = await getOrCreatePracticeProduct(plan);

  const existingPrices = await stripe.prices.list({
    product: product.id,
    active: true,
    limit: 20,
  });

  const recurringPrice = existingPrices.data.find(
    (price) =>
      price.unit_amount === plan.priceCents &&
      price.currency === "usd" &&
      price.recurring?.interval === "month" &&
      price.type === "recurring"
  );

  if (recurringPrice) {
    return recurringPrice;
  }

  return stripe.prices.create(
    {
      product: product.id,
      unit_amount: plan.priceCents,
      currency: "usd",
      recurring: { interval: "month" },
      metadata: {
        type: "student_practice_subscription",
        practice_tier: plan.subscription,
        practice_price_cents: String(plan.priceCents),
      },
    },
    {
      idempotencyKey: `practice-price:${plan.subscription}:${plan.priceCents}`,
    }
  );
}

/**
 * Gets or creates the Stripe product for the selected practice subscription tier.
 *
 * @param plan - Target checkout plan.
 * @returns Active Stripe product.
 */
async function getOrCreatePracticeProduct(plan: PracticeCheckoutPlan): Promise<Stripe.Product> {
  const existingProducts = await stripe.products.list({
    limit: 50,
    active: true,
  });

  const product = existingProducts.data.find(
    (item) =>
      item.metadata?.type === "student_practice_subscription" &&
      item.metadata?.practice_tier === plan.subscription
  );

  if (product) {
    return product;
  }

  return stripe.products.create(
    {
      name: plan.productName,
      description: plan.productDescription,
      metadata: {
        type: "student_practice_subscription",
        practice_tier: plan.subscription,
      },
    },
    {
      idempotencyKey: `practice-product:${plan.subscription}`,
    }
  );
}
