import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createSubscription } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await req.json();
    const { plan } = body; // 'growth' or 'studio'

    if (!plan || !["growth", "studio"].includes(plan)) {
      return NextResponse.json(
        { error: "Invalid plan. Must be 'growth' or 'studio'" },
        { status: 400 }
      );
    }

    // Get user profile with Stripe customer ID
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    if (!profile.stripe_customer_id) {
      return NextResponse.json(
        { error: "No Stripe customer found. Please contact support." },
        { status: 400 }
      );
    }

    // Get price ID from environment variables
    const priceId =
      plan === "growth"
        ? process.env.STRIPE_GROWTH_PRICE_ID
        : process.env.STRIPE_STUDIO_PRICE_ID;

    if (!priceId) {
      return NextResponse.json(
        { error: "Plan price not configured" },
        { status: 500 }
      );
    }

    // Create subscription
    const subscription = await createSubscription({
      customerId: profile.stripe_customer_id,
      priceId,
      metadata: {
        userId: user.id,
        plan,
      },
    });

    // Extract client secret for payment confirmation
    const clientSecret =
      // @ts-expect-error - Stripe types might not include expanded invoice
      subscription.latest_invoice?.payment_intent?.client_secret;

    return NextResponse.json({
      subscriptionId: subscription.id,
      clientSecret,
      status: subscription.status,
    });
  } catch (error) {
    console.error("Error creating subscription:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
