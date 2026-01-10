import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import {
  ensureSignupCheckoutSession,
  isSignupCheckoutComplete,
  isSignupLifetimePlan,
  resolveSignupPriceId,
} from "@/lib/services/signup-checkout";
import {
  createLifetimeCheckoutSession,
  isLifetimeCheckoutExpired,
  retrieveLifetimeCheckoutSession,
} from "@/lib/payments/lifetime-checkout";
import { getTrialDays } from "@/lib/utils/stripe-config";
import { getAppUrl } from "@/lib/auth/redirects";
import type { PlatformBillingPlan } from "@/lib/types/payments";

export const dynamic = "force-dynamic";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const adminClient = createServiceRoleClient();
  const profileClient = adminClient ?? supabase;

  const { data: profile, error } = await profileClient
    .from("profiles")
    .select(
      "id, full_name, email, plan, signup_checkout_plan, signup_checkout_status, signup_checkout_session_id, signup_checkout_expires_at, signup_checkout_completed_at, stripe_subscription_id, subscription_status"
    )
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error("[SignupCheckoutGuard] Failed to load profile", error);
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
  }

  const responseInit = { headers: { "Cache-Control": "no-store" } };

  if (!profile) {
    return NextResponse.json({ redirectUrl: null }, responseInit);
  }

  const plan = (profile.plan as PlatformBillingPlan | null) ?? "professional";
  const signupPlan = (profile.signup_checkout_plan as PlatformBillingPlan | null) ?? null;
  const stripeSecretConfigured = Boolean(process.env.STRIPE_SECRET_KEY?.trim());

  if (stripeSecretConfigured && isSignupLifetimePlan(signupPlan) && !isSignupCheckoutComplete(profile)) {
    const sessionId = profile.signup_checkout_session_id ?? null;
    let sessionUrl: string | null = null;
    let sessionComplete = false;

    if (sessionId) {
      const sessionResult = await retrieveLifetimeCheckoutSession(sessionId);
      if ("session" in sessionResult) {
        const { session } = sessionResult;
        sessionComplete = session.status === "complete";
        const isOpen = session.status === "open" && !isLifetimeCheckoutExpired(session.expiresAt);
        sessionUrl = isOpen ? session.url : null;

        if (sessionComplete && adminClient) {
          await adminClient
            .from("profiles")
            .update({
              signup_checkout_status: "complete",
              signup_checkout_completed_at: new Date().toISOString(),
              signup_checkout_expires_at: session.expiresAt,
            })
            .eq("id", user.id);
        }
      }
    }

    if (!sessionComplete && !sessionUrl) {
      const appUrl = getAppUrl();
      const sessionResult = await createLifetimeCheckoutSession({
        successUrl: `${appUrl}/onboarding?checkout=success`,
        cancelUrl: `${appUrl}/signup?checkout=cancelled&lifetime=true`,
        userId: user.id,
        customerEmail: profile.email ?? user.email ?? undefined,
        source: "signup_gate",
        flow: "signup",
      });

      if ("session" in sessionResult) {
        sessionUrl = sessionResult.session.url;
        if (adminClient) {
          await adminClient
            .from("profiles")
            .update({
              signup_checkout_session_id: sessionResult.session.id,
              signup_checkout_status: "open",
              signup_checkout_plan: signupPlan ?? "tutor_life",
              signup_checkout_started_at: new Date().toISOString(),
              signup_checkout_expires_at: sessionResult.session.expiresAt,
            })
            .eq("id", user.id);
        }
      }
    }

    if (sessionUrl) {
      return NextResponse.json({ redirectUrl: sessionUrl }, responseInit);
    }
  }

  const priceId = resolveSignupPriceId(plan);
  if (stripeSecretConfigured && priceId) {
    const appUrl = getAppUrl();
    const checkoutUrl = await ensureSignupCheckoutSession({
      user,
      plan,
      priceId,
      trialPeriodDays: getTrialDays(plan),
      successUrl: `${appUrl}/signup/verify?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${appUrl}/signup?checkout=cancelled`,
      fullName: profile.full_name ?? null,
      adminClient,
      context: "onboarding_gate_client",
    });

    if (checkoutUrl) {
      return NextResponse.json({ redirectUrl: checkoutUrl }, responseInit);
    }
  }

  return NextResponse.json({ redirectUrl: null }, responseInit);
}
