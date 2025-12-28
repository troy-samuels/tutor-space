import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { getAppUrl } from "@/lib/auth/redirects";
import { isPaidPlan } from "@/lib/payments/subscriptions";
import { getTrialDays, isStripeConfigured } from "@/lib/utils/stripe-config";
import type { PlatformBillingPlan } from "@/lib/types/payments";
import { ensureSignupCheckoutSession, resolveSignupPriceId } from "@/lib/services/signup-checkout";

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
        const priceId = resolveSignupPriceId(plan);
        if (priceId && isStripeConfigured()) {
          const checkoutUrl = await ensureSignupCheckoutSession({
            user,
            plan,
            priceId,
            trialPeriodDays: getTrialDays(plan),
            successUrl: `${redirectBase}/signup/verify?session_id={CHECKOUT_SESSION_ID}`,
            cancelUrl: `${redirectBase}/signup?checkout=cancelled`,
            fullName: (user.user_metadata?.full_name as string | undefined) ?? undefined,
            adminClient: serviceClient,
            context: "auth_callback",
          });

          if (checkoutUrl) {
            return NextResponse.redirect(checkoutUrl);
          }
        }
      }
    }
  }

  return NextResponse.redirect(`${redirectBase}${nextPath}`);
}
