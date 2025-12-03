import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";

// AI Practice subscription pricing
const AI_PRACTICE_PRICE_CENTS = 600; // $6/month
const PLATFORM_SHARE_PERCENT = 25; // Platform keeps 25% ($1.50)

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    // Create or get AI Practice product
    let product = await getOrCreateProduct();
    let price = await getOrCreatePrice(product.id);

    // Calculate platform fee (25%)
    const platformFee = Math.round(AI_PRACTICE_PRICE_CENTS * (PLATFORM_SHARE_PERCENT / 100));

    // Create checkout session with destination charge
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [
        {
          price: price.id,
          quantity: 1,
        },
      ],
      subscription_data: {
        application_fee_percent: PLATFORM_SHARE_PERCENT,
        transfer_data: {
          destination: tutor.stripe_account_id,
        },
        metadata: {
          studentId,
          tutorId: assignedTutorId,
          type: "ai_practice",
        },
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/student-auth/practice/subscribe/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/student-auth/practice/subscribe`,
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

async function getOrCreateProduct() {
  const existingProducts = await stripe.products.list({
    limit: 1,
    active: true,
  });

  const product = existingProducts.data.find(
    (p) => p.metadata?.type === "ai_practice_subscription"
  );

  if (product) {
    return product;
  }

  return stripe.products.create({
    name: "AI Practice Companion",
    description: "Unlimited AI conversation practice between lessons",
    metadata: {
      type: "ai_practice_subscription",
    },
  });
}

async function getOrCreatePrice(productId: string) {
  const existingPrices = await stripe.prices.list({
    product: productId,
    active: true,
    limit: 1,
  });

  const price = existingPrices.data.find(
    (p) => p.unit_amount === AI_PRACTICE_PRICE_CENTS && p.recurring?.interval === "month"
  );

  if (price) {
    return price;
  }

  return stripe.prices.create({
    product: productId,
    unit_amount: AI_PRACTICE_PRICE_CENTS,
    currency: "usd",
    recurring: {
      interval: "month",
    },
  });
}
