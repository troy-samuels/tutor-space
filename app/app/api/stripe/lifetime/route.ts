import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { computeFounderPrice } from "@/lib/pricing/founder";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { enforceCheckoutRateLimit } from "@/lib/payments/checkout-rate-limit";

// Helper to create Stripe checkout session via direct fetch (bypasses SDK issues)
async function createStripeCheckoutSession(params: {
  customerId?: string;
  successUrl: string;
  cancelUrl: string;
  currency: string;
  amountCents: number;
  productName: string;
  metadata: Record<string, string>;
}): Promise<{ url: string } | { error: string }> {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return { error: "Stripe not configured" };
  }

  const body = new URLSearchParams();
  body.append("mode", "payment");
  body.append("success_url", params.successUrl);
  body.append("cancel_url", params.cancelUrl);
  body.append("line_items[0][price_data][currency]", params.currency);
  body.append("line_items[0][price_data][unit_amount]", String(params.amountCents));
  body.append("line_items[0][price_data][product_data][name]", params.productName);
  body.append("line_items[0][quantity]", "1");

  if (params.customerId) {
    body.append("customer", params.customerId);
  }

  Object.entries(params.metadata).forEach(([key, value]) => {
    body.append(`metadata[${key}]`, value);
  });

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${stripeKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  const data = await response.json();

  if (!response.ok) {
    return { error: data.error?.message || "Stripe checkout failed" };
  }

  return { url: data.url };
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const supabaseAdmin = createServiceRoleClient();

    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Service unavailable" }, { status: 500 });
    }

    // Parse request body for source attribution and guest email
    const body = await request.json().catch(() => ({}));
    const { source = "lifetime_landing_page" } = body as { source?: string };

    // Validate source parameter
    const validSources = ["campaign_banner", "lifetime_landing_page"];
    const trackingSource = validSources.includes(source) ? source : "lifetime_landing_page";

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Rate limit by user ID if authenticated, or by IP if guest
    const rateLimitKey = user?.id || request.headers.get("x-forwarded-for") || "anonymous";
    const rateLimitResult = await enforceCheckoutRateLimit({
      supabaseAdmin,
      userId: rateLimitKey,
      req: request,
      keyPrefix: "checkout:lifetime",
      limit: 5,
      windowSeconds: 60,
    });

    if (!rateLimitResult.ok) {
      return NextResponse.json(
        { error: rateLimitResult.error || "Too many requests" },
        { status: rateLimitResult.status ?? 429 }
      );
    }

    const price = computeFounderPrice(request.headers.get("accept-language"));
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tutorlingua.co";
    // Guest checkout goes to /lifetime/success, authenticated users go to /dashboard
    const successUrl = user
      ? `${appUrl.replace(/\/$/, "")}/dashboard?checkout=success`
      : `${appUrl.replace(/\/$/, "")}/lifetime/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = user
      ? `${appUrl.replace(/\/$/, "")}/dashboard?checkout=cancel`
      : `${appUrl.replace(/\/$/, "")}/lifetime`;

    // Create checkout session using direct fetch (bypasses Stripe SDK issues)
    console.log("[Stripe] Creating checkout with URLs:", { successUrl, cancelUrl, appUrl });

    const result = await createStripeCheckoutSession({
      successUrl,
      cancelUrl,
      currency: price.currency.toLowerCase(),
      amountCents: price.amountCents,
      productName: "TutorLingua Lifetime Access",
      metadata: {
        userId: user?.id ?? "",
        plan: "tutor_life",
        source: trackingSource,
      },
    });

    if ("error" in result) {
      console.error("[Stripe] Checkout creation failed:", result.error, { successUrl, cancelUrl });
      return NextResponse.json({
        error: result.error,
        debug: { successUrl, cancelUrl }
      }, { status: 500 });
    }

    return NextResponse.json({ url: result.url });
  } catch (error) {
    const err = error as Error;
    console.error("[Stripe] Lifetime checkout error:", err.message);
    return NextResponse.json({ error: err.message || "Unknown error" }, { status: 500 });
  }
}
