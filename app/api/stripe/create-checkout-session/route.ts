import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createCheckoutSession } from "@/lib/stripe";
import { RateLimiters } from "@/lib/middleware/rate-limit";

export async function POST(req: NextRequest) {
  try {
    // SECURITY: Rate limit checkout session creation
    const rateLimitResult = await RateLimiters.api(req);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: rateLimitResult.error },
        { status: 429 }
      );
    }

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
    const { bookingId, amount, serviceName, serviceDescription, currency } = body;

    if (!bookingId || !amount || !serviceName) {
      return NextResponse.json(
        { error: "Missing required fields" },
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

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Create checkout session
    const session = await createCheckoutSession({
      customerId: profile.stripe_customer_id,
      priceAmount: Math.round(amount * 100), // Convert to cents
      currency: currency || "usd",
      successUrl: `${baseUrl}/bookings/${bookingId}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${baseUrl}/bookings/${bookingId}/cancelled`,
      metadata: {
        bookingId,
        userId: user.id,
      },
      lineItems: [
        {
          name: serviceName,
          description: serviceDescription,
          amount: Math.round(amount * 100),
          quantity: 1,
        },
      ],
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
