import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateStripeCustomer, stripe } from "@/lib/stripe";
import { computeFounderPrice } from "@/lib/pricing/founder";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { enforceCheckoutRateLimit } from "@/lib/payments/checkout-rate-limit";

const RETRYABLE_STRIPE_ERRORS = new Set([
  "StripeAPIError",
  "StripeConnectionError",
  "StripeRateLimitError",
]);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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

    // For authenticated users, get/create Stripe customer
    // For guests, Stripe will collect email during checkout
    let customerId: string | undefined;
    if (user) {
      const customer = await getOrCreateStripeCustomer({
        userId: user.id,
        email: user.email ?? "",
        name: (user.user_metadata?.full_name as string | undefined) ?? undefined,
        metadata: {
          profileId: user.id,
        },
      });
      customerId = customer.id;
    }

    // Prefer the Pro lifetime price ID; keep STRIPE_LIFETIME_PRICE_ID as a deprecated alias.
    const priceId = process.env.STRIPE_PRO_LIFETIME_PRICE_ID ?? process.env.STRIPE_LIFETIME_PRICE_ID;
    const usePriceId = price.currency.toLowerCase() === "gbp" && !!priceId;

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      // Use customer ID for authenticated users, otherwise Stripe collects email
      ...(customerId ? { customer: customerId } : {}),
      mode: "payment",
      allow_promotion_codes: false,
      success_url: successUrl,
      cancel_url: cancelUrl,
      line_items: usePriceId
        ? [
            {
              price: priceId,
              quantity: 1,
            },
          ]
        : [
            {
              price_data: {
                currency: price.currency.toLowerCase(),
                product_data: {
                  name: "TutorLingua lifetime access",
                  description: "One-time payment for lifetime platform access.",
                },
                unit_amount: price.amountCents,
              },
              quantity: 1,
            },
          ],
      metadata: {
        userId: user?.id ?? "",
        plan: "tutor_life",
        source: trackingSource,
      },
    };

    const idempotencyKey = `lifetime:${user?.id ?? "guest"}:${randomUUID()}`;
    const maxAttempts = 3;
    let session;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        session = await stripe.checkout.sessions.create(sessionParams, {
          idempotencyKey,
        });
        break;
      } catch (err) {
        const error = err as { type?: string; code?: string; message?: string };
        const isRetryable =
          (error.type && RETRYABLE_STRIPE_ERRORS.has(error.type)) ||
          error.code === "ECONNRESET" ||
          error.code === "ETIMEDOUT" ||
          Boolean(error.message?.toLowerCase().includes("request was retried")) ||
          Boolean(error.message?.toLowerCase().includes("connection"));

        if (!isRetryable || attempt === maxAttempts) {
          throw err;
        }

        const delayMs = 250 * Math.pow(2, attempt - 1);
        console.warn("[Stripe] Lifetime checkout retrying", {
          attempt,
          delayMs,
          type: error.type,
          code: error.code,
          message: error.message,
        });
        await sleep(delayMs);
      }
    }

    if (!session?.url) {
      throw new Error("Stripe checkout session URL missing.");
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const err = error as { type?: string; code?: string; message?: string; statusCode?: number };
    const errorMessage = err.message || "Unknown error";
    console.error("[Stripe] Lifetime checkout error (v2):", {
      message: errorMessage,
      type: err.type,
      code: err.code,
      statusCode: err.statusCode,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json({
      error: errorMessage,
      debug: { type: err.type, code: err.code, version: "v2" }
    }, { status: 500 });
  }
}
