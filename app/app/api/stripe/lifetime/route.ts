import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { enforceCheckoutRateLimit } from "@/lib/payments/checkout-rate-limit";
import { createLifetimeCheckoutSession } from "@/lib/payments/lifetime-checkout";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const supabaseAdmin = createServiceRoleClient();

    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Service unavailable" }, { status: 500 });
    }

    // Parse request body for source attribution and guest email
    const body = await request.json().catch(() => ({}));
    const {
      source = "lifetime_landing_page",
      flow,
    } = body as { source?: string; flow?: string };

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

    // Trim to remove any accidental newlines from env var
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://tutorlingua.co").trim();
    const appUrlBase = appUrl.replace(/\/$/, "");

    if (!user && flow === "signup") {
      const signupUrl = new URL("/signup", appUrlBase);
      signupUrl.searchParams.set("lifetime", "true");
      signupUrl.searchParams.set("source", trackingSource);
      return NextResponse.json({ url: signupUrl.toString() });
    }

    // Guest checkout goes to /signup, authenticated users go to onboarding.
    const successUrl = user
      ? `${appUrlBase}/onboarding?checkout=success`
      : `${appUrlBase}/signup?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = user
      ? `${appUrlBase}/dashboard?checkout=cancel`
      : `${appUrlBase}/lifetime`;

    const result = await createLifetimeCheckoutSession({
      successUrl,
      cancelUrl,
      userId: user?.id,
      customerEmail: user?.email ?? undefined,
      source: trackingSource,
      acceptLanguage: request.headers.get("accept-language"),
    });

    if ("error" in result) {
      console.error("[Stripe] Checkout creation failed:", result.error);
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    if (!result.session.url) {
      return NextResponse.json({ error: "Stripe checkout unavailable" }, { status: 500 });
    }

    return NextResponse.json({ url: result.session.url });
  } catch (error) {
    const err = error as Error;
    console.error("[Stripe] Lifetime checkout error:", err.message);
    return NextResponse.json({ error: err.message || "Unknown error" }, { status: 500 });
  }
}
