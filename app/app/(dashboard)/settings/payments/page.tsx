import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PaymentSettingsForm from "@/components/settings/PaymentSettingsForm";
import StripeConnectPanel from "@/components/settings/StripeConnectPanel";
import { getPlanDisplayName } from "@/lib/payments/subscriptions";
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

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">Payment Settings</h1>
        <p className="text-muted-foreground mt-1">
          Set up how you get paid
        </p>
      </div>

      {/* Current Plan - Simple inline display */}
      <div className="flex items-center justify-between py-4 border-b border-stone-200">
        <div>
          <p className="text-sm text-muted-foreground">Current Plan</p>
          <p className="font-medium">{displayPlan}</p>
        </div>
        <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
          Active
        </span>
      </div>

      {/* Stripe Connect */}
      <StripeConnectPanel
        tutorId={user.id}
        accountId={(profile?.stripe_account_id as string | null) ?? null}
        chargesEnabled={Boolean(profile?.stripe_charges_enabled)}
        payoutsEnabled={Boolean(profile?.stripe_payouts_enabled)}
        onboardingStatus={(profile?.stripe_onboarding_status as any) ?? "pending"}
      />

      {/* Currency Setting */}
      <PaymentSettingsForm
        initialData={{
          payment_instructions: profile?.payment_instructions || "",
          booking_currency: profile?.booking_currency || "USD",
        }}
      />
    </div>
  );
}
