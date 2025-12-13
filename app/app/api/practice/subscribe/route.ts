import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";
import {
  AI_PRACTICE_BASE_PRICE_CENTS,
  AI_PRACTICE_BLOCK_PRICE_CENTS,
  BASE_AUDIO_MINUTES,
  BASE_TEXT_TURNS,
  BLOCK_AUDIO_MINUTES,
  BLOCK_TEXT_TURNS,
} from "@/lib/practice/constants";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { enforceCheckoutRateLimit } from "@/lib/payments/checkout-rate-limit";

// Platform fees
const PLATFORM_FIXED_FEE_CENTS = 300; // Target ~$3 platform fee
const PLATFORM_VARIABLE_FEE_PERCENT = 1; // Extra 1% platform fee

// Effective application fee percent to cover fixed + variable
const APPLICATION_FEE_PERCENT = (PLATFORM_FIXED_FEE_CENTS / AI_PRACTICE_BASE_PRICE_CENTS) * 100 + PLATFORM_VARIABLE_FEE_PERCENT; // 38.5%

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const supabaseAdmin = createServiceRoleClient();

    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
    }

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimitResult = await enforceCheckoutRateLimit({
      supabaseAdmin,
      userId: user.id,
      req: request,
      keyPrefix: "checkout:ai_practice",
      limit: 5,
      windowSeconds: 60,
    });

    if (!rateLimitResult.ok) {
      return NextResponse.json(
        { error: rateLimitResult.error || "Too many requests" },
        { status: rateLimitResult.status ?? 429 }
      );
    }

    const { studentId, tutorId } = await request.json();

    if (!studentId || !tutorId) {
      return NextResponse.json(
        { error: "Student ID and tutor ID are required" },
        { status: 400 }
      );
    }

    // Verify student belongs to user and fetch assigned tutor
    const { data: student } = await supabase
      .from("students")
      .select("id, email, full_name, ai_practice_customer_id, tutor_id")
      .eq("id", studentId)
      .eq("user_id", user.id)
      .single();

    if (!student) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    // Lock checkout to the student's assigned tutor to prevent misrouted payouts
    const assignedTutorId = student.tutor_id;
    if (!assignedTutorId) {
      return NextResponse.json(
        { error: "Student must have an assigned tutor before subscribing" },
        { status: 400 }
      );
    }

    if (tutorId && tutorId !== assignedTutorId) {
      return NextResponse.json(
        { error: "Subscription must be started with the student's assigned tutor" },
        { status: 400 }
      );
    }

    // Get tutor's Stripe Connect account
    const { data: tutor } = await supabase
      .from("profiles")
      .select("stripe_account_id, stripe_charges_enabled, full_name")
      .eq("id", assignedTutorId)
      .single();

    if (!tutor?.stripe_account_id || !tutor?.stripe_charges_enabled) {
      return NextResponse.json(
        { error: "Tutor has not set up payments yet" },
        { status: 400 }
      );
    }

    // Get or create Stripe customer for student
    let customerId = student.ai_practice_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email || student.email,
        name: student.full_name || undefined,
        metadata: {
          studentId: student.id,
          userId: user.id,
          tutorId: assignedTutorId,
        },
      });
      customerId = customer.id;

      // Save customer ID
      await supabase
        .from("students")
        .update({ ai_practice_customer_id: customerId })
        .eq("id", studentId);
    }

    // Get or create AI Practice products and prices
    const baseProduct = await getOrCreateBaseProduct();
    const basePrice = await getOrCreateBasePrice(baseProduct.id);
    const blockProduct = await getOrCreateBlockProduct();
    const blockPrice = await getOrCreateBlockPrice(blockProduct.id);

    // Create checkout session with both base subscription and metered block pricing
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [
        {
          price: basePrice.id,
          quantity: 1,
        },
        {
          price: blockPrice.id,
          // Metered prices don't need quantity - usage is reported separately
        },
      ],
      subscription_data: {
        // Charge on behalf of the tutor so Stripe fees are taken from the tutor payout
        on_behalf_of: tutor.stripe_account_id,
        application_fee_percent: APPLICATION_FEE_PERCENT,
        transfer_data: {
          destination: tutor.stripe_account_id,
        },
        metadata: {
          studentId,
          tutorId: assignedTutorId,
          type: "ai_practice",
          platform_fixed_fee_cents: String(PLATFORM_FIXED_FEE_CENTS),
          platform_variable_fee_percent: String(PLATFORM_VARIABLE_FEE_PERCENT),
          base_audio_minutes: String(BASE_AUDIO_MINUTES),
          base_text_turns: String(BASE_TEXT_TURNS),
          block_audio_minutes: String(BLOCK_AUDIO_MINUTES),
          block_text_turns: String(BLOCK_TEXT_TURNS),
        },
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/student/practice/subscribe/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/student/practice/subscribe`,
      metadata: {
        studentId,
        tutorId: assignedTutorId,
        type: "ai_practice_subscription",
      },
    });

    return NextResponse.json({ checkoutUrl: session.url });
  } catch (error) {
    console.error("[Practice Subscribe] Error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}

async function getOrCreateBaseProduct() {
  const existingProducts = await stripe.products.list({
    limit: 10,
    active: true,
  });

  const product = existingProducts.data.find(
    (p) => p.metadata?.type === "ai_practice_base"
  );

  if (product) {
    return product;
  }

  return stripe.products.create({
    name: "AI Practice Companion - Base",
    description: `${BASE_AUDIO_MINUTES} audio minutes + ${BASE_TEXT_TURNS} text turns per month`,
    metadata: {
      type: "ai_practice_base",
      audio_minutes: String(BASE_AUDIO_MINUTES),
      text_turns: String(BASE_TEXT_TURNS),
    },
  });
}

async function getOrCreateBasePrice(productId: string) {
  const existingPrices = await stripe.prices.list({
    product: productId,
    active: true,
    limit: 10,
  });

  const price = existingPrices.data.find(
    (p) => p.unit_amount === AI_PRACTICE_BASE_PRICE_CENTS && p.recurring?.interval === "month"
  );

  if (price) {
    return price;
  }

  return stripe.prices.create({
    product: productId,
    unit_amount: AI_PRACTICE_BASE_PRICE_CENTS,
    currency: "usd",
    recurring: {
      interval: "month",
    },
    metadata: {
      type: "ai_practice_base",
    },
  });
}

async function getOrCreateBlockProduct() {
  const existingProducts = await stripe.products.list({
    limit: 10,
    active: true,
  });

  const product = existingProducts.data.find(
    (p) => p.metadata?.type === "ai_practice_block"
  );

  if (product) {
    return product;
  }

  return stripe.products.create({
    name: "AI Practice Block",
    description: `+${BLOCK_AUDIO_MINUTES} audio minutes + ${BLOCK_TEXT_TURNS} text turns`,
    metadata: {
      type: "ai_practice_block",
      audio_minutes: String(BLOCK_AUDIO_MINUTES),
      text_turns: String(BLOCK_TEXT_TURNS),
    },
  });
}

async function getOrCreateBlockPrice(productId: string) {
  const existingPrices = await stripe.prices.list({
    product: productId,
    active: true,
    limit: 10,
  });

  // Look for metered price
  const price = existingPrices.data.find(
    (p) =>
      p.unit_amount === AI_PRACTICE_BLOCK_PRICE_CENTS &&
      p.recurring?.interval === "month" &&
      p.recurring?.usage_type === "metered"
  );

  if (price) {
    return price;
  }

  return (stripe.prices as any).create({
    product: productId,
    unit_amount: AI_PRACTICE_BLOCK_PRICE_CENTS,
    currency: "usd",
    recurring: {
      interval: "month",
      usage_type: "metered",
      aggregate_usage: "sum",
    },
    metadata: {
      type: "ai_practice_block",
    },
  });
}
