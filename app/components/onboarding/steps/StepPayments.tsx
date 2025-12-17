"use client";

import { useState } from "react";
import { Loader2, CreditCard, Check } from "lucide-react";
import { saveOnboardingStep } from "@/lib/actions/onboarding";
import { PlatformSubscriptionCTA } from "@/components/settings/PlatformSubscriptionCTA";

type StepPaymentsProps = {
  profileId: string;
  onComplete: () => void;
  isCompleting: boolean;
};

export function StepPayments({
  profileId,
  onComplete,
  isCompleting,
}: StepPaymentsProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const startStripeConnectFlow = async (): Promise<string> => {
    // Creates a Stripe Connect account (if needed) and returns an onboarding link
    const accountRes = await fetch("/api/stripe/connect/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tutorId: profileId }),
    });
    const accountData = await accountRes.json();
    if (!accountRes.ok) {
      throw new Error(accountData?.error || "Failed to create Stripe account.");
    }

    const accountId = accountData.accountId as string;
    const linkRes = await fetch("/api/stripe/connect/account-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountId }),
    });
    const linkData = await linkRes.json();
    if (!linkRes.ok || !linkData?.url) {
      throw new Error(linkData?.error || "Failed to start Stripe onboarding.");
    }

    return linkData.url as string;
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    try {
      const result = await saveOnboardingStep(7, {
        payment_method: "stripe",
        custom_payment_url: null,
      });

      if (result.success) {
        const onboardingUrl = await startStripeConnectFlow();
        window.location.href = onboardingUrl;
        return;
      } else {
        setErrors({ submit: result.error || "Failed to save. Please try again." });
      }
    } catch (error) {
      console.error("Error saving step 5:", error);
      setErrors({ submit: "Failed to save payment settings. Please check your connection and try again." });
    } finally {
      // If we redirected to Stripe, this won't run, but that's fine.
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Connect Stripe to accept payments from students.
      </p>

      <div className="flex w-full items-start gap-4 rounded-xl border border-primary bg-primary/10 p-4 text-left">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <CreditCard className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">
              Stripe Connect
            </span>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
              Required
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Accept credit cards and payouts to your bank account.
          </p>
        </div>
        <Check className="h-5 w-5 text-primary" />
      </div>

      {/* Stripe info box */}
      <div className="rounded-xl bg-blue-50 p-4">
        <p className="text-xs text-blue-800">
          You&apos;ll be redirected to Stripe to complete setup.
        </p>
      </div>

      {errors.submit && (
        <p className="text-sm text-red-600">{errors.submit}</p>
      )}

      {/* Platform subscription */}
      <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-foreground">Activate TutorLingua</p>
            <p className="text-xs text-muted-foreground">
              Start your 7-day free trial. Then $29/mo or $199/yr.
            </p>
          </div>
        </div>
        <div className="mt-3">
          <PlatformSubscriptionCTA
            ctaLabel="Start 7-day free trial"
            helperText="7-day free trial. Then $29/mo or $199/yr."
          />
        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSaving || isCompleting}
          className="inline-flex h-10 items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving || isCompleting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isCompleting ? "Completing..." : "Saving..."}
            </>
          ) : (
            "Complete Setup"
          )}
        </button>
      </div>
    </div>
  );
}
