import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";
import {
  AI_PRACTICE_BLOCK_PRICE_CENTS,
  BLOCK_AUDIO_MINUTES,
  BLOCK_TEXT_TURNS,
  FREE_AUDIO_MINUTES,
  FREE_TEXT_TURNS,
} from "@/lib/practice/constants";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { enforceCheckoutRateLimit } from "@/lib/payments/checkout-rate-limit";
import { getTutorHasPracticeAccess } from "@/lib/practice/access";

// Platform fees for block purchases
// With $5/block, we take ~38.5% ($1.93) for platform, tutor gets ~61.5% ($3.07)
const PLATFORM_FIXED_FEE_CENTS = 193; // ~$1.93 platform fee on $5 block
const PLATFORM_VARIABLE_FEE_PERCENT = 0;
const APPLICATION_FEE_PERCENT =
  (PLATFORM_FIXED_FEE_CENTS / AI_PRACTICE_BLOCK_PRICE_CENTS) * 100 + PLATFORM_VARIABLE_FEE_PERCENT; // ~38.6%

/**
 * FREEMIUM MODEL: Buy Credits Flow
 *
 * POST /api/practice/subscribe (or /api/practice/buy-credits)
 *
 * Creates a metered subscription for blocks ONLY (no base subscription).
 * This is optional - students can use the free tier (45 min audio + 600 text)
 * without ever setting up this subscription.
 *
 * When free tier is exhausted and student continues using the service,
 * blocks are auto-charged via Stripe metered billing.
 */
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
      keyPrefix: "checkout:ai_practice_blocks",
      limit: 5,
      windowSeconds: 60,
    });

    if (!rateLimitResult.ok) {
      return NextResponse.json(
        { error: rateLimitResult.error || "Too many requests" },
        { status: rateLimitResult.status ?? 429 }
      );
    }

    const { studentId } = await request.json();

    if (!studentId) {
      return NextResponse.json(
        { error: "Student ID is required" },
        { status: 400 }
      );
    }

    // Verify student belongs to user and fetch assigned tutor
    const { data: student } = await supabase
      .from("students")
      .select("*")
      .eq("id", studentId)
      .eq("user_id", user.id)
      .single();

    if (!student) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    // Check if already has block subscription
    if (student.ai_practice_block_subscription_item_id) {
      return NextResponse.json(
        {
          error: "Already has block subscription",
          code: "ALREADY_SUBSCRIBED",
          message: "You already have a credits subscription set up. Blocks will be charged automatically when you exceed your free allowance.",
        },
        { status: 400 }
      );
    }

    // FREEMIUM: Require assigned tutor with Studio tier
    const assignedTutorId = student.tutor_id;
    if (!assignedTutorId) {
      return NextResponse.json(
        { error: "Student must have an assigned tutor to buy credits" },
        { status: 400 }
      );
    }

    // Check tutor has Studio tier
    const tutorHasStudio = await getTutorHasPracticeAccess(supabaseAdmin, assignedTutorId);
    if (!tutorHasStudio) {
      return NextResponse.json(
        {
          error: "Your tutor needs a Studio subscription for AI Practice",
          code: "TUTOR_NOT_STUDIO",
        },
        { status: 403 }
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

    // Get or create AI Practice BLOCK product and price (no base product needed)
    const blockProduct = await getOrCreateBlockProduct();
    const blockPrice = await getOrCreateBlockPrice(blockProduct.id);

    // FREEMIUM: Create checkout session with BLOCKS ONLY (no base subscription)
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      allow_promotion_codes: true,
      line_items: [
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
          type: "ai_practice_blocks", // NEW: blocks-only subscription
          is_blocks_only: "true",
          block_price_cents: String(AI_PRACTICE_BLOCK_PRICE_CENTS),
          block_audio_minutes: String(BLOCK_AUDIO_MINUTES),
          block_text_turns: String(BLOCK_TEXT_TURNS),
          free_audio_minutes: String(FREE_AUDIO_MINUTES),
          free_text_turns: String(FREE_TEXT_TURNS),
        },
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/student/practice/credits-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/student/practice/subscribe`,
      metadata: {
        studentId,
        tutorId: assignedTutorId,
        type: "ai_practice_blocks",
      },
    });

    return NextResponse.json({
      checkoutUrl: session.url,
      message: "Set up automatic credits billing. You'll only be charged ($5/block) when you exceed your free allowance.",
    });
  } catch (error) {
    console.error("[Practice Buy Credits] Error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/practice/subscribe
 * Returns current subscription status for the student
 */
export async function GET() {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get student record
    const { data: student } = await supabase
      .from("students")
      .select("*")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (!student) {
      return NextResponse.json({
        hasAccess: false,
        isFreeUser: false,
        hasBlockSubscription: false,
      });
    }

    return NextResponse.json({
      hasAccess: Boolean(student.ai_practice_enabled || student.ai_practice_free_tier_enabled),
      isFreeUser: student.ai_practice_free_tier_enabled === true,
      hasBlockSubscription: !!student.ai_practice_block_subscription_item_id,
      // Legacy subscription (for backwards compatibility)
      hasLegacySubscription: !!student.ai_practice_subscription_id,
    });
  } catch (error) {
    console.error("[Practice Subscription Status] Error:", error);
    return NextResponse.json(
      { error: "Failed to get subscription status" },
      { status: 500 }
    );
  }
}

// Note: getOrCreateBaseProduct and getOrCreateBasePrice removed for freemium model
// Base subscription ($8/month) is no longer used

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
    name: "AI Practice Credits",
    description: `Additional practice credits - $${AI_PRACTICE_BLOCK_PRICE_CENTS / 100} adds ${BLOCK_AUDIO_MINUTES} audio minutes + ${BLOCK_TEXT_TURNS} text turns`,
    metadata: {
      type: "ai_practice_block",
      audio_minutes: String(BLOCK_AUDIO_MINUTES),
      text_turns: String(BLOCK_TEXT_TURNS),
      price_cents: String(AI_PRACTICE_BLOCK_PRICE_CENTS),
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
