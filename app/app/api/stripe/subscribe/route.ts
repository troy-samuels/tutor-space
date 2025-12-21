import { NextResponse, type NextRequest } from "next/server";
import { randomUUID } from "crypto";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { getOrCreateStripeCustomer, stripe } from "@/lib/stripe";
import { enforceCheckoutRateLimit } from "@/lib/payments/checkout-rate-limit";

export async function POST(request: NextRequest) {
  try {
    // Parse billing cycle + tier from request body (defaults: pro + monthly)
    let billingCycle: "monthly" | "annual" = "monthly";
    let tier: "pro" | "studio" = "pro";
    try {
      const body = await request.json();
      if (body.billingCycle === "annual") {
        billingCycle = "annual";
      }
      if (body.tier === "studio") {
        tier = "studio";
      }
    } catch {
      // No body or invalid JSON - use default monthly
    }

    // Trial period: 14 days for annual, 7 days for monthly
    const trialPeriodDays = billingCycle === "annual" ? 14 : 7;

    const monthlyPriceId =
      tier === "studio"
        ? process.env.STRIPE_STUDIO_MONTHLY_PRICE_ID
        : process.env.STRIPE_PRO_MONTHLY_PRICE_ID;
    const yearlyPriceId =
      tier === "studio"
        ? process.env.STRIPE_STUDIO_ANNUAL_PRICE_ID
        : process.env.STRIPE_PRO_ANNUAL_PRICE_ID;

    const priceId = billingCycle === "annual" ? yearlyPriceId : monthlyPriceId;
    const plan =
      tier === "studio"
        ? billingCycle === "annual"
          ? "studio_annual"
          : "studio_monthly"
        : billingCycle === "annual"
          ? "pro_annual"
          : "pro_monthly";

    if (!priceId) {
      console.error(
        `[Stripe] Missing ${
          tier === "studio"
            ? billingCycle === "annual"
              ? "STRIPE_STUDIO_ANNUAL_PRICE_ID"
              : "STRIPE_STUDIO_MONTHLY_PRICE_ID"
            : billingCycle === "annual"
              ? "STRIPE_PRO_ANNUAL_PRICE_ID"
              : "STRIPE_PRO_MONTHLY_PRICE_ID"
        } env var`
      );
      return NextResponse.json({ error: "Service unavailable" }, { status: 500 });
    }

    const supabase = await createClient();
    const supabaseAdmin = createServiceRoleClient();
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimitResult = await enforceCheckoutRateLimit({
      supabaseAdmin,
      userId: user.id,
      req: request,
      keyPrefix: "checkout:subscription:all_access",
      limit: 5,
      windowSeconds: 60,
    });

    if (!rateLimitResult.ok) {
      return NextResponse.json(
        { error: rateLimitResult.error || "Too many requests" },
        { status: rateLimitResult.status ?? 429 }
      );
    }

    const { data: profile, error: profileError } = supabaseAdmin
      ? await supabaseAdmin
          .from("profiles")
          .select("id, email, full_name, stripe_customer_id")
          .eq("id", user.id)
          .maybeSingle()
      : { data: null, error: null };

    if (profileError) {
      console.error("[Stripe] Failed to load profile", profileError);
      return NextResponse.json({ error: "Unable to start checkout" }, { status: 500 });
    }

    const customer = await getOrCreateStripeCustomer({
      userId: user.id,
      email: user.email ?? profile?.email ?? "",
      name: (profile?.full_name as string | undefined) ?? (user.user_metadata?.full_name as string | undefined),
      metadata: {
        profileId: user.id,
      },
    });

    // Keep profile in sync with the Stripe customer ID for webhook handling
    if (supabaseAdmin && profile?.stripe_customer_id !== customer.id) {
      const { error: updateError } = await supabaseAdmin
        .from("profiles")
        .update({ stripe_customer_id: customer.id })
        .eq("id", user.id);

      if (updateError) {
        console.error("[Stripe] Failed to sync stripe_customer_id to profile", updateError);
      }
    }

    // Check for existing active subscription to prevent duplicates
    const existingSubscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: "active",
      limit: 1,
    });

    if (existingSubscriptions.data.length > 0) {
      // User already has an active subscription - redirect to billing portal instead
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: customer.id,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL || "https://tutorlingua.co"}/dashboard`,
      });
      return NextResponse.json({
        url: portalSession.url,
        message: "You already have an active subscription. Redirecting to manage your plan."
      });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tutorlingua.co";
    const successUrl = `${appUrl.replace(/\/$/, "")}/dashboard?checkout=success`;
    const cancelUrl = `${appUrl.replace(/\/$/, "")}/dashboard?checkout=cancel`;

    // Idempotency key prevents duplicate checkout sessions on rapid clicks
    const idempotencyKey = `subscribe:${user.id}:${plan}:${randomUUID()}`;

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: customer.id,
      mode: "subscription",
      payment_method_collection: "always",
      allow_promotion_codes: false,
      success_url: successUrl,
      cancel_url: cancelUrl,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: trialPeriodDays,
      },
      metadata: {
        userId: user.id,
        plan,
      },
    };

    const session = await stripe.checkout.sessions.create(sessionParams, {
      idempotencyKey,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("[Stripe] Subscription checkout error", error);
    return NextResponse.json({ error: "Unable to start checkout" }, { status: 500 });
  }
}
