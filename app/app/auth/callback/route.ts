import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { getAppUrl } from "@/lib/auth/redirects";
import { getOrCreateStripeCustomer, stripe } from "@/lib/stripe";
import { isPaidPlan } from "@/lib/payments/subscriptions";
import { getTrialDays, isStripeConfigured } from "@/lib/utils/stripe-config";
import type { PlatformBillingPlan } from "@/lib/types/payments";

const SUBSCRIPTION_PLANS = new Set<PlatformBillingPlan>([
  "pro_monthly",
  "pro_annual",
  "studio_monthly",
  "studio_annual",
]);

function resolveRedirectBase(request: Request, origin: string): string {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const isLocal = process.env.NODE_ENV === "development";

  if (isLocal) {
    return origin;
  }

  if (forwardedHost && forwardedProto) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  return getAppUrl();
}

function resolvePriceId(plan: PlatformBillingPlan): string | null {
  return plan === "pro_monthly"
    ? process.env.STRIPE_PRO_MONTHLY_PRICE_ID?.trim() ?? null
    : plan === "pro_annual"
      ? process.env.STRIPE_PRO_ANNUAL_PRICE_ID?.trim() ?? null
      : plan === "studio_monthly"
        ? process.env.STRIPE_STUDIO_MONTHLY_PRICE_ID?.trim() ?? null
        : plan === "studio_annual"
          ? process.env.STRIPE_STUDIO_ANNUAL_PRICE_ID?.trim() ?? null
          : null;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/calendar";
  const nextPath = next.startsWith("/") ? next : "/calendar";
  const redirectBase = resolveRedirectBase(request, origin);

  if (!code) {
    return NextResponse.redirect(`${redirectBase}/auth/error`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[Supabase] OAuth exchange failed:", error);
    return NextResponse.redirect(`${redirectBase}/auth/error`);
  }

  // Update last_login_at for tutors (for churn tracking)
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.id) {
    const serviceClient = createServiceRoleClient();
    if (serviceClient) {
      await serviceClient
        .from("profiles")
        .update({ last_login_at: new Date().toISOString() })
        .eq("id", user.id)
        .eq("role", "tutor");

      const role = (user.user_metadata?.role as string | undefined) ?? "tutor";
      const plan = user.user_metadata?.plan as PlatformBillingPlan | undefined;
      const shouldAttemptCheckout = nextPath.startsWith("/onboarding") && role !== "student";

      if (shouldAttemptCheckout && plan && isPaidPlan(plan) && SUBSCRIPTION_PLANS.has(plan)) {
        const priceId = resolvePriceId(plan);
        if (priceId && isStripeConfigured()) {
          const { data: profile } = await serviceClient
            .from("profiles")
            .select("stripe_subscription_id, subscription_status")
            .eq("id", user.id)
            .maybeSingle();

          const hasActiveSubscription =
            profile?.subscription_status === "active" || Boolean(profile?.stripe_subscription_id);

          if (!hasActiveSubscription) {
            const customer = await getOrCreateStripeCustomer({
              userId: user.id,
              email: user.email ?? "",
              name: (user.user_metadata?.full_name as string | undefined) ?? undefined,
              metadata: { profileId: user.id },
            });

            await serviceClient
              .from("profiles")
              .update({ stripe_customer_id: customer.id })
              .eq("id", user.id);

            const session = await stripe.checkout.sessions.create({
              customer: customer.id,
              mode: "subscription",
              allow_promotion_codes: true,
              success_url: `${redirectBase}/onboarding?subscription=success`,
              cancel_url: `${redirectBase}/signup?checkout=cancelled`,
              line_items: [{ price: priceId, quantity: 1 }],
              subscription_data: {
                trial_period_days: getTrialDays(plan),
              },
              metadata: {
                userId: user.id,
                plan,
              },
            });

            if (session.url) {
              return NextResponse.redirect(session.url);
            }
          }
        }
      }
    }
  }

  return NextResponse.redirect(`${redirectBase}${nextPath}`);
}
