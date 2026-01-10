import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { enforceCheckoutRateLimit } from "@/lib/payments/checkout-rate-limit";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

function getStripe(): Stripe | null {
  if (!stripeSecretKey) return null;
  return new Stripe(stripeSecretKey, {
    apiVersion: "2025-09-30.clover",
  });
}

/**
 * Create a Stripe Checkout Session for lesson subscription
 * with Stripe Connect destination charges (platform takes 1% fee)
 */
export async function POST(req: NextRequest) {
  try {
    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
    }

    const supabaseAdmin = createServiceRoleClient();
    const supabase = await createClient();

    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Service unavailable" }, { status: 500 });
    }

    // Parse request body
    const body = await req.json();
    const { templateId, tutorUsername } = body;

    if (!templateId || !tutorUsername) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Get the subscription template with tutor info
    const { data: template, error: templateError } = await supabaseAdmin
      .from("lesson_subscription_templates")
      .select(`
        id,
        tutor_id,
        service_id,
        template_tier,
        lessons_per_month,
        price_cents,
        currency,
        stripe_price_id,
        is_active
      `)
      .eq("id", templateId)
      .eq("is_active", true)
      .single();

    if (templateError || !template) {
      return NextResponse.json({ error: "Subscription plan not found" }, { status: 404 });
    }

    if (!template.stripe_price_id) {
      return NextResponse.json(
        { error: "Subscription plan is not set up for payments" },
        { status: 400 }
      );
    }

    // Get tutor's Stripe Connect account
    const { data: tutorProfile, error: tutorError } = await supabaseAdmin
      .from("profiles")
      .select("id, stripe_account_id, stripe_charges_enabled, full_name, username")
      .eq("id", template.tutor_id)
      .single();

    if (tutorError || !tutorProfile) {
      return NextResponse.json({ error: "Tutor not found" }, { status: 404 });
    }

    if (!tutorProfile.stripe_account_id || !tutorProfile.stripe_charges_enabled) {
      return NextResponse.json(
        { error: "Tutor cannot accept Stripe payments yet" },
        { status: 400 }
      );
    }

    // Get current user (student)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const rateLimitResult = await enforceCheckoutRateLimit({
      supabaseAdmin,
      userId: user?.id ?? null,
      req,
      keyPrefix: "checkout:subscription:lesson",
      limit: 5,
      windowSeconds: 60,
    });

    if (!rateLimitResult.ok) {
      return NextResponse.json(
        { error: rateLimitResult.error || "Too many requests" },
        { status: rateLimitResult.status ?? 429 }
      );
    }

    let stripeCustomerId: string | null = null;
    let studentEmail: string | null = null;
    let studentId: string | null = null;

    if (user) {
      // Authenticated student - get their Stripe customer ID
      const { data: studentProfile } = await supabaseAdmin
        .from("profiles")
        .select("id, stripe_customer_id, email")
        .eq("id", user.id)
        .single();

      if (studentProfile?.stripe_customer_id) {
        stripeCustomerId = studentProfile.stripe_customer_id;
      }
      studentEmail = studentProfile?.email || user.email || null;

      // Find or create student record for this tutor
      const { data: existingStudent } = await supabaseAdmin
        .from("students")
        .select("id")
        .eq("user_id", user.id)
        .eq("tutor_id", template.tutor_id)
        .maybeSingle();

      studentId = existingStudent?.id || null;
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Build checkout session configuration
    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      mode: "subscription",
      payment_method_types: ["card"],
      allow_promotion_codes: true,
      line_items: [
        {
          price: template.stripe_price_id,
          quantity: 1,
        },
      ],
      subscription_data: {
        // Platform fee: 1% of each subscription payment
        application_fee_percent: 1,
        transfer_data: {
          destination: tutorProfile.stripe_account_id,
        },
        metadata: {
          type: "lesson_subscription",
          template_id: templateId,
          tutor_id: template.tutor_id,
          service_id: template.service_id,
          ...(studentId && { student_id: studentId }),
        },
      },
      success_url: `${baseUrl}/book/subscription-success?session_id={CHECKOUT_SESSION_ID}&tutor=${tutorUsername}`,
      cancel_url: `${baseUrl}/${tutorUsername}`,
      metadata: {
        type: "lesson_subscription",
        template_id: templateId,
        tutor_id: template.tutor_id,
        tutor_username: tutorUsername,
      },
    };

    // Add customer if we have one
    if (stripeCustomerId) {
      sessionConfig.customer = stripeCustomerId;
    } else if (studentEmail) {
      // Allow Stripe to create a customer from email
      sessionConfig.customer_email = studentEmail;
    }

    // Deterministic idempotency key prevents duplicate checkout sessions on rapid retries
    const guestFingerprint =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "guest";
    const idempotencyScope = studentId ?? user?.id ?? guestFingerprint;
    const idempotencyKey = `lesson-sub:${templateId}:${idempotencyScope}`;

    // Create checkout session
    const session = await stripe.checkout.sessions.create(sessionConfig, {
      idempotencyKey,
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error("Error creating subscription checkout session:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
