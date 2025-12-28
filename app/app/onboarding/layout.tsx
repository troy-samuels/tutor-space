import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { Logo } from "@/components/Logo";
import { AuthProvider } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { getPlanTier, hasProAccess, hasStudioAccess } from "@/lib/payments/subscriptions";
import type { PlatformBillingPlan } from "@/lib/types/payments";
import {
  createLifetimeCheckoutSession,
  isLifetimeCheckoutExpired,
  retrieveLifetimeCheckoutSession,
} from "@/lib/payments/lifetime-checkout";
import { LogoutButton } from "./logout-button";
import { ensureSignupCheckoutSession, resolveSignupPriceId } from "@/lib/services/signup-checkout";
import { getTrialDays } from "@/lib/utils/stripe-config";
import { getAppUrl } from "@/lib/auth/redirects";

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, full_name, email, role, subscription_status, avatar_url, plan, username, signup_checkout_session_id, signup_checkout_status, signup_checkout_plan, signup_checkout_expires_at"
    )
    .eq("id", user.id)
    .single();

  if (profile?.role && profile.role !== "tutor") {
    redirect("/student/login");
  }

  const plan: PlatformBillingPlan =
    (profile?.plan as PlatformBillingPlan | null) ?? "professional";
  const priceId = resolveSignupPriceId(plan);
  const adminClient = createServiceRoleClient();

  const lifetimeSignupPlan =
    (profile?.signup_checkout_plan as PlatformBillingPlan | null) ?? null;
  const lifetimeCheckoutPlans: PlatformBillingPlan[] = [
    "tutor_life",
    "studio_life",
    "founder_lifetime",
    "all_access",
  ];
  const hasLifetimeCheckoutPlan =
    lifetimeSignupPlan && lifetimeCheckoutPlans.includes(lifetimeSignupPlan);
  const checkoutStatus = profile?.signup_checkout_status ?? null;

  if (
    hasLifetimeCheckoutPlan &&
    checkoutStatus !== "complete" &&
    process.env.STRIPE_SECRET_KEY?.trim()
  ) {
    const sessionId = profile?.signup_checkout_session_id ?? null;
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

    if (!sessionComplete) {
      if (!sessionUrl) {
        const appUrl = getAppUrl().replace(/\/$/, "");
        const sessionResult = await createLifetimeCheckoutSession({
          successUrl: `${appUrl}/onboarding?checkout=success`,
          cancelUrl: `${appUrl}/signup?checkout=cancelled&lifetime=true`,
          userId: user.id,
          customerEmail: profile?.email ?? user.email ?? undefined,
          source: "signup_gate",
          acceptLanguage: headers().get("accept-language"),
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
                signup_checkout_plan: lifetimeSignupPlan ?? "tutor_life",
                signup_checkout_started_at: new Date().toISOString(),
                signup_checkout_expires_at: sessionResult.session.expiresAt,
              })
              .eq("id", user.id);
          }
        }
      }

      if (sessionUrl) {
        redirect(sessionUrl);
      }
    }
  }

  if (priceId && adminClient && process.env.STRIPE_SECRET_KEY) {
    const appUrl = getAppUrl();
    const checkoutUrl = await ensureSignupCheckoutSession({
      user,
      plan,
      priceId,
      trialPeriodDays: getTrialDays(plan),
      successUrl: `${appUrl}/signup/verify?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${appUrl}/signup?checkout=cancelled`,
      fullName: profile?.full_name ?? null,
      adminClient,
      context: "onboarding_gate",
    });

    if (checkoutUrl) {
      redirect(checkoutUrl);
    }
  }

  const entitlements = {
    plan,
    tier: getPlanTier(plan),
    isPaid: hasProAccess(plan),
    hasProAccess: hasProAccess(plan),
    hasStudioAccess: hasStudioAccess(plan),
  } as const;

  return (
    <AuthProvider
      initialUser={user}
      initialProfile={profile ?? null}
      initialEntitlements={entitlements}
    >
      <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
        {/* Minimal header with just logout */}
        <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-sm">
          <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4 sm:px-6">
            <div className="flex items-center gap-2">
              <Logo variant="wordmark" />
            </div>
            <LogoutButton />
          </div>
        </header>

        {/* Main content - no sidebar, no bottom nav */}
        <main className="scroll-smooth">{children}</main>
      </div>
    </AuthProvider>
  );
}
