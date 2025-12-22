"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CreditCard, Check, ExternalLink, Wallet } from "lucide-react";
import { saveOnboardingStep } from "@/lib/actions/onboarding";

type StepPaymentsProps = {
  profileId: string;
  onComplete: () => void;
  isCompleting: boolean;
  onSaveError?: (message: string) => void;
  stripeReturnDetected?: boolean;
  initialStripeChargesEnabled?: boolean;
};

// Simplified state - just idle or redirecting
type ConnectState = "idle" | "redirecting";

type PaymentOption = "stripe" | "manual" | null;

export function StepPayments({
  profileId,
  onComplete,
  isCompleting,
  onSaveError,
  stripeReturnDetected = false,
  initialStripeChargesEnabled = false,
}: StepPaymentsProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [selectedOption, setSelectedOption] = useState<PaymentOption>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [connectState, setConnectState] = useState<ConnectState>("idle");
  const [isPolling, setIsPolling] = useState(false);
  const hasAutoCompletedRef = useRef(false);

  // Poll for Stripe Connect completion when returning from Stripe
  useEffect(() => {
    // Prevent double execution
    if (hasAutoCompletedRef.current) return;

    // If already connected, auto-complete immediately
    if (initialStripeChargesEnabled) {
      hasAutoCompletedRef.current = true;
      onComplete();
      return;
    }

    // If returning from Stripe, start polling
    if (stripeReturnDetected) {
      setIsPolling(true);
      let pollCount = 0;
      const maxPolls = 20; // Poll for max 60 seconds (20 * 3000ms)

      const pollInterval = setInterval(async () => {
        pollCount++;

        try {
          const res = await fetch("/api/stripe/connect/status", { method: "POST" });
          const data = await res.json();

          if (data.chargesEnabled) {
            clearInterval(pollInterval);
            setIsPolling(false);
            hasAutoCompletedRef.current = true;
            onComplete();
          } else if (pollCount >= maxPolls) {
            // Stop polling after max attempts but don't auto-complete
            clearInterval(pollInterval);
            setIsPolling(false);
          }
        } catch (err) {
          console.error("Failed to check Stripe status:", err);
          // Continue polling on error
        }
      }, 3000);

      return () => {
        clearInterval(pollInterval);
        setIsPolling(false);
      };
    }
  }, [stripeReturnDetected, initialStripeChargesEnabled, onComplete]);

  /**
   * Fast Stripe Connect Flow
   *
   * Achieves sub-100ms perceived performance by immediately redirecting
   * to an interstitial page that handles the API calls and shows progress.
   */
  const startStripeConnectFlow = () => {
    if (!profileId) {
      setErrors({ submit: "Profile not found. Please refresh and try again." });
      return;
    }

    // Immediate redirect to interstitial page - no API calls here!
    setConnectState("redirecting");
    router.push(`/onboarding/connect-redirect?tutorId=${encodeURIComponent(profileId)}`);
  };

  const handleManualComplete = () => {
    setErrors({});

    // Optimistic: Move to next step immediately
    onComplete();

    // Save to database in background
    startTransition(async () => {
      try {
        const result = await saveOnboardingStep(7, {
          payment_method: undefined,
          custom_payment_url: null,
        });

        if (!result.success) {
          console.error("Background save failed for step 7:", result.error);
          onSaveError?.(result.error || "Failed to save payment settings");
        }
      } catch (error) {
        console.error("Error saving payment step:", error);
        onSaveError?.("An error occurred while saving");
      }
    });
  };

  const handleSkip = () => {
    setErrors({});

    // Optimistic: Move to next step immediately
    onComplete();

    // Save to database in background
    startTransition(async () => {
      try {
        const result = await saveOnboardingStep(7, {
          payment_method: undefined,
          custom_payment_url: null,
        });

        if (!result.success) {
          console.error("Background save failed for step 7:", result.error);
          onSaveError?.(result.error || "Failed to save payment step");
        }
      } catch (error) {
        console.error("Error skipping step:", error);
        onSaveError?.("An error occurred while saving");
      }
    });
  };

  const isRedirecting = connectState === "redirecting";
  const isProcessing = isRedirecting || isPolling;

  // Show polling status when returning from Stripe
  if (isPolling) {
    return (
      <div className="space-y-5">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-sm font-medium text-foreground">
            Verifying Stripe setup...
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            This may take a few moments. Please don&apos;t close this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Choose how you&apos;ll receive payments from students after they book lessons.
      </p>

      {/* Payment Option Selection */}
      <div className="space-y-3">
        {/* Option 1: Card Payments (Recommended) */}
        <button
          type="button"
          onClick={() => {
            setSelectedOption("stripe");
            setErrors({});
          }}
          disabled={isRedirecting || isCompleting}
          className={`flex w-full items-start gap-4 rounded-xl border p-4 text-left transition ${
            selectedOption === "stripe"
              ? "border-primary bg-primary/10"
              : "border-border hover:border-primary/50"
          } disabled:cursor-not-allowed disabled:opacity-50`}
        >
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-lg ${
              selectedOption === "stripe"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {selectedOption === "stripe" ? (
              <Check className="h-5 w-5" />
            ) : (
              <CreditCard className="h-5 w-5" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">
                Stripe Connect
              </span>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                Recommended
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Accept card payments directly. Students pay, money goes to your bank in 2-3 days.
            </p>
            <p className="mt-2 text-xs text-muted-foreground/70">
              Takes ~5 minutes. Powered by Stripe&apos;s secure payment platform.
            </p>
          </div>
        </button>

        {/* Option 2: Manual Payments */}
        <button
          type="button"
          onClick={() => {
            setSelectedOption("manual");
            setErrors({});
            setConnectState("idle");
          }}
          disabled={isRedirecting || isCompleting}
          className={`flex w-full items-start gap-4 rounded-xl border p-4 text-left transition ${
            selectedOption === "manual"
              ? "border-primary bg-primary/10"
              : "border-border hover:border-primary/50"
          } disabled:cursor-not-allowed disabled:opacity-50`}
        >
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-lg ${
              selectedOption === "manual"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {selectedOption === "manual" ? (
              <Check className="h-5 w-5" />
            ) : (
              <Wallet className="h-5 w-5" />
            )}
          </div>
          <div className="flex-1">
            <span className="text-sm font-semibold text-foreground">
              I&apos;ll handle payments myself
            </span>
            <p className="mt-1 text-xs text-muted-foreground">
              Use Venmo, PayPal, Zelle, bank transfer, or cash. You&apos;ll collect payments outside the platform.
            </p>
          </div>
        </button>
      </div>

      {/* Info box */}
      <div className="rounded-xl bg-blue-50 p-4">
        <p className="text-xs text-blue-800">
          You can change your payment method anytime in Settings → Payments.
        </p>
      </div>

      {/* Legacy error messages */}
      {errors.submit && (
        <p className="text-sm text-red-600">{errors.submit}</p>
      )}

      {/* Action buttons - matching StepVideo.tsx layout */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={handleSkip}
          disabled={isRedirecting || isCompleting}
          className="inline-flex h-10 items-center justify-center rounded-full border border-border px-6 text-sm font-semibold text-muted-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
        >
          Skip for now
        </button>

        {selectedOption === "stripe" && (
          <button
            type="button"
            onClick={startStripeConnectFlow}
            disabled={isRedirecting || isCompleting}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isRedirecting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Opening Stripe Connect...
              </>
            ) : (
              <>
                Connect with Stripe
                <ExternalLink className="h-4 w-4" />
              </>
            )}
          </button>
        )}

        {selectedOption === "manual" && (
          <button
            type="button"
            onClick={handleManualComplete}
            disabled={isCompleting}
            className="inline-flex h-10 items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isCompleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Completing...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Continue
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
