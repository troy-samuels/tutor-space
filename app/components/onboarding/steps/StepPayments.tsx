"use client";

import { useState } from "react";
import { Loader2, CreditCard, Check, ExternalLink } from "lucide-react";
import { saveOnboardingStep } from "@/lib/actions/onboarding";

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
  const [isConnectingStripe, setIsConnectingStripe] = useState(false);

  const startStripeConnectFlow = async () => {
    setIsConnectingStripe(true);
    setErrors({});

    try {
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

      // Save the step before redirecting
      await saveOnboardingStep(7, {
        payment_method: "stripe",
        custom_payment_url: null,
      });

      window.location.href = linkData.url as string;
    } catch (error) {
      console.error("Error starting Stripe Connect:", error);
      setErrors({ connect: "Failed to start Stripe setup. Please try again." });
      setIsConnectingStripe(false);
    }
  };

  const handleComplete = async () => {
    setErrors({});
    try {
      const result = await saveOnboardingStep(7, {
        payment_method: undefined,
        custom_payment_url: null,
      });

      if (result.success) {
        onComplete();
      } else {
        setErrors({ submit: result.error || "Failed to save. Please try again." });
      }
    } catch (error) {
      console.error("Error completing onboarding:", error);
      setErrors({ submit: "Failed to complete setup. Please try again." });
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-muted-foreground">
          Your trial is active! Now set up how you&apos;ll receive payments from students.
        </p>
      </div>

      {/* Stripe Connect Card - Optional */}
      <div className="rounded-xl border border-dashed border-muted-foreground/30 bg-muted/30 p-4">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <CreditCard className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">
                Stripe Connect
              </span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                Optional
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Accept credit cards and get payouts directly to your bank account.
            </p>

            <button
              type="button"
              onClick={startStripeConnectFlow}
              disabled={isConnectingStripe || isCompleting}
              className="mt-3 inline-flex items-center gap-2 rounded-lg border border-muted-foreground/30 bg-background px-4 py-2 text-xs font-medium text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isConnectingStripe ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <ExternalLink className="h-3 w-3" />
                  Connect Stripe
                </>
              )}
            </button>
          </div>
        </div>

        <p className="mt-3 text-xs text-muted-foreground">
          You can set this up later in Settings → Payments
        </p>
      </div>

      {/* Alternative payment methods note */}
      <div className="rounded-xl bg-blue-50 p-4">
        <p className="text-xs text-blue-800">
          <span className="font-medium">Other options:</span> You can also accept payments via Venmo, PayPal, or Zelle. Configure these in Settings after onboarding.
        </p>
      </div>

      {/* Error messages */}
      {errors.connect && (
        <p className="text-sm text-red-600">{errors.connect}</p>
      )}
      {errors.submit && (
        <p className="text-sm text-red-600">{errors.submit}</p>
      )}

      {/* Complete Setup button */}
      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={handleComplete}
          disabled={isConnectingStripe || isCompleting}
          className="inline-flex h-10 items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isCompleting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Completing...
            </>
          ) : (
            <>
              <Check className="mr-2 h-4 w-4" />
              Complete Setup
            </>
          )}
        </button>
      </div>
    </div>
  );
}
