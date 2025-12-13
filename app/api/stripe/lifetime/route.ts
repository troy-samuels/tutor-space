import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import Stripe from "stripe";

const LIFETIME_PRICE_ID = process.env.STRIPE_PRO_LIFETIME_PRICE_ID ?? process.env.STRIPE_LIFETIME_PRICE_ID;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

/**
 * POST /api/stripe/lifetime
 * Creates a Stripe checkout session for the lifetime deal.
 * No authentication required - users can pay before creating an account.
 */
export async function POST(req: NextRequest) {
  try {
    // Validate price ID is configured
    if (!LIFETIME_PRICE_ID) {
      console.error("STRIPE_LIFETIME_PRICE_ID is not configured");
      return NextResponse.json(
        { error: "Lifetime offer is not available at this time" },
        { status: 503 }
      );
    }

    // Parse optional email from request body
    const body = await req.json().catch(() => ({}));
    const { email } = body as { email?: string };

    // Create checkout session for one-time payment
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price: LIFETIME_PRICE_ID,
          quantity: 1,
        },
      ],
      success_url: `${APP_URL}/lifetime/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/lifetime`,
      metadata: {
        plan: "tutor_life",
        source: "lifetime_landing_page",
      },
      allow_promotion_codes: true,
    };

    // If email provided, pre-fill it and store in metadata
    if (email) {
      sessionParams.customer_email = email;
      if (sessionParams.metadata) {
        sessionParams.metadata.customer_email = email;
      }
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Error creating lifetime checkout session:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
