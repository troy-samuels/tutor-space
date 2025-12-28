import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { VerifyEmailForm } from "@/components/forms/verify-email-form";

export const metadata: Metadata = {
  title: "Verify Email | TutorLingua",
  description: "Confirm your email to unlock your TutorLingua account.",
};

type SearchParams = Promise<{ session_id?: string }>;

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

function getStripe(): Stripe | null {
  if (!stripeSecretKey) return null;
  return new Stripe(stripeSecretKey, {
    apiVersion: "2025-09-30.clover",
  });
}

export default async function SignupVerifyPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const sessionId = typeof params.session_id === "string" ? params.session_id : null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.email_confirmed_at) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.onboarding_completed) {
      redirect("/dashboard");
    }

    redirect("/onboarding");
  }

  let email: string | null = null;
  let sessionStatus: Stripe.Checkout.Session.Status | null = null;
  let sessionPlan: string | null = null;
  let sessionUserId: string | null = null;
  let sessionLookupFailed = false;

  if (sessionId) {
    const stripe = getStripe();
    if (stripe) {
      try {
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        sessionUserId = session.metadata?.userId ?? null;

        // Security: Only show session details if it belongs to the current user
        // or if no user is logged in (they may have just signed up)
        const isOwner = !user || !sessionUserId || sessionUserId === user.id;

        if (isOwner) {
          sessionStatus = session.status ?? null;
          sessionPlan = session.metadata?.plan ?? null;
          email = session.customer_details?.email ?? session.customer_email ?? null;
        } else {
          // Don't leak payment info for other users
          console.warn("[Signup Verify] User attempted to view another user's checkout session");
          sessionLookupFailed = true;
        }
      } catch (error) {
        console.error("[Signup Verify] Failed to retrieve checkout session", error);
        sessionLookupFailed = true;
      }
    }
  }

  if (!email && sessionUserId) {
    const adminClient = createServiceRoleClient();
    if (adminClient) {
      const { data: profile } = await adminClient
        .from("profiles")
        .select("email")
        .eq("id", sessionUserId)
        .maybeSingle();

      email = (profile?.email as string | null) ?? null;
    }
  }

  const heading =
    sessionStatus === "complete"
      ? "Payment confirmed"
      : "You're almost done";

  const subtitle =
    sessionStatus === "complete"
      ? "Confirm your email to unlock your TutorLingua dashboard."
      : "Confirm your email to activate your TutorLingua account.";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-muted via-muted/30 to-white px-4 py-12">
      <div className="w-full max-w-md space-y-6 rounded-3xl bg-white/90 p-8 shadow-lg backdrop-blur">
        <header className="space-y-2 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            {sessionPlan ? `Plan: ${sessionPlan.replace(/_/g, " ")}` : "Next step"}
          </p>
          <h1 className="text-3xl font-semibold text-primary">{heading}</h1>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
          {email ? (
            <p className="text-xs text-muted-foreground">
              Sent to <span className="font-medium text-foreground">{email}</span>
            </p>
          ) : null}
          {sessionLookupFailed ? (
            <div className="space-y-2">
              <p className="text-xs text-amber-600">
                We couldn&apos;t verify the payment status yet.
              </p>
              <p className="text-xs text-muted-foreground">
                If you just completed checkout, please wait a moment and{" "}
                <Link
                  href={sessionId ? `/signup/verify?session_id=${sessionId}&_t=${Date.now()}` : "/signup/verify"}
                  className="font-medium text-primary hover:underline"
                >
                  refresh the page
                </Link>
                . If this persists,{" "}
                <Link href="/contact" className="font-medium text-primary hover:underline">
                  contact support
                </Link>
                .
              </p>
            </div>
          ) : null}
        </header>

        <VerifyEmailForm role="tutor" email={email} next="/onboarding" />

        <div className="space-y-2 text-center text-sm text-muted-foreground">
          <p>
            Already confirmed?{" "}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Sign in
            </Link>
          </p>
          <p>
            Need help?{" "}
            <Link href="/contact" className="font-semibold text-primary hover:underline">
              Contact support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
