import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Check, ArrowRight } from "lucide-react";
import PaymentSettingsForm from "@/components/settings/PaymentSettingsForm";
import StripeConnectPanel from "@/components/settings/StripeConnectPanel";
import { getPlanDisplayName, getPlanTier } from "@/lib/payments/subscriptions";
import type { PlatformBillingPlan } from "@/lib/types/payments";

export default async function PaymentSettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get current payment settings and plan
  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "payment_instructions, booking_currency, stripe_account_id, stripe_charges_enabled, stripe_payouts_enabled, stripe_onboarding_status, plan"
    )
    .eq("id", user.id)
    .single();

  const currentPlan = (profile?.plan || "professional") as PlatformBillingPlan;
  const displayPlan = getPlanDisplayName(currentPlan);
  const planTier = getPlanTier(currentPlan);
  const isPaidPlan = planTier !== "free";

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Payment Settings</h1>
        <p className="text-gray-600 mt-2">
          Set up how you get paid
        </p>
      </div>

      {/* Plan & Billing Card — Informational Only */}
      <div className="rounded-2xl border border-stone-200 bg-white p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Current Plan
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {displayPlan}
            </p>
          </div>
          {isPaidPlan && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
              <Check className="h-3.5 w-3.5" />
              Active
            </span>
          )}
        </div>

        {/* Link to Billing page for plan management */}
        <div className="mt-4">
          <Link
            href="/settings/billing"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            Manage your plan
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <StripeConnectPanel
        tutorId={user.id}
        accountId={(profile?.stripe_account_id as string | null) ?? null}
        chargesEnabled={Boolean(profile?.stripe_charges_enabled)}
        payoutsEnabled={Boolean(profile?.stripe_payouts_enabled)}
        onboardingStatus={(profile?.stripe_onboarding_status as any) ?? "pending"}
      />

      <PaymentSettingsForm
        initialData={{
          payment_instructions: profile?.payment_instructions || "",
          booking_currency: profile?.booking_currency || "USD",
        }}
      />

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">💡 Tips for Payment Collection</h2>

        <div className="space-y-4 text-sm text-gray-700">
          <div>
            <h3 className="font-medium text-gray-900">1. Be Clear About Payment Timing</h3>
            <p className="mt-1">
              Let students know when payment is expected (e.g., &quot;Payment required
              within 24 hours of booking&quot; or &quot;Pay after the lesson&quot;)
            </p>
          </div>

          <div>
            <h3 className="font-medium text-gray-900">2. Offer Multiple Options</h3>
            <p className="mt-1">
              Providing several payment methods (Venmo, PayPal, Zelle) makes it
              easier for students to pay
            </p>
          </div>

          <div>
            <h3 className="font-medium text-gray-900">3. Use Payment Links</h3>
            <p className="mt-1">
              If you have a Stripe Payment Link or other payment URL, add it here
              so students can pay with one click
            </p>
          </div>

          <div>
            <h3 className="font-medium text-gray-900">4. Include Reference Instructions</h3>
            <p className="mt-1">
              Ask students to include their name or booking ID when sending payment
              so you can easily match it
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
