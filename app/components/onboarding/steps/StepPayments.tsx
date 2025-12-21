"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { Loader2, CreditCard, Check, ExternalLink, AlertTriangle, RefreshCw, Wallet } from "lucide-react";
import { saveOnboardingStep } from "@/lib/actions/onboarding";
import { checkConnectHealth } from "@/lib/stripe/connect-health";
import { fetchWithRetry } from "@/lib/stripe/connect-retry";
import type { StripeConnectError } from "@/lib/stripe/connect-errors";

type StepPaymentsProps = {
  profileId: string;
  onComplete: () => void;
  isCompleting: boolean;
  onSaveError?: (message: string) => void;
};

// State machine for Stripe Connect flow
type ConnectState =
  | { status: "idle" }
  | { status: "checking" }
  | { status: "connecting"; stage: "account" | "link" | "save" }
  | { status: "retrying"; stage: string; attempt: number; countdown: number }
  | { status: "error"; error: StripeConnectError }
  | { status: "redirecting" };

type PaymentOption = "stripe" | "manual" | null;

export function StepPayments({
  profileId,
  onComplete,
  isCompleting,
  onSaveError,
}: StepPaymentsProps) {
  const [, startTransition] = useTransition();
  const [selectedOption, setSelectedOption] = useState<PaymentOption>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [connectState, setConnectState] = useState<ConnectState>({ status: "idle" });

  // Countdown timer for retry state
  useEffect(() => {
    if (connectState.status !== "retrying") return;

    if (connectState.countdown <= 0) return;

    const timer = setTimeout(() => {
      setConnectState((prev) => {
        if (prev.status !== "retrying") return prev;
        return { ...prev, countdown: prev.countdown - 1 };
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, [connectState]);

  const startStripeConnectFlow = useCallback(async () => {
    // Immediate feedback - this should always run
    console.log("[Stripe Connect] Button clicked, profileId:", profileId);

    // Show loading state immediately
    setConnectState({ status: "checking" });
    setErrors({});

    try {
      // Verify profileId exists
      if (!profileId) {
        console.error("[Stripe Connect] No profileId provided");
        setConnectState({
          status: "error",
          error: {
            code: "invalid_tutor_id",
            message: "Profile not found. Please refresh and try again.",
            recovery: "If this persists, try logging out and back in.",
            retryable: false,
          },
        });
        return;
      }

      // 1. Pre-flight health check
      console.log("[Stripe Connect] Running health check...");
      const health = await checkConnectHealth(profileId);
      console.log("[Stripe Connect] Health check result:", health);

      if (!health.ready) {
        if (health.error) {
          console.error("[Stripe Connect] Health check failed:", health.error);
          setConnectState({ status: "error", error: health.error });
        } else {
          // Health check returned not ready without an error - create a generic error
          console.error("[Stripe Connect] Health check not ready, no error provided");
          setConnectState({
            status: "error",
            error: {
              code: "stripe_network_error",
              message: "Unable to verify your account. Please try again.",
              recovery: "Check your internet connection and refresh the page.",
              retryable: true,
            },
          });
        }
        return;
      }

      // 2. Create account (or use existing) with retry
      let accountId = health.existingAccountId;
      console.log("[Stripe Connect] Existing account:", accountId || "none");

      if (!accountId) {
        console.log("[Stripe Connect] Creating new account...");
        setConnectState({ status: "connecting", stage: "account" });

        const accountResult = await fetchWithRetry<{ accountId: string }>(
          "/api/stripe/connect/accounts",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tutorId: profileId }),
          },
          { maxRetries: 3, baseDelayMs: 1000 },
          (attempt, _error, delayMs) => {
            setConnectState({
              status: "retrying",
              stage: "account",
              attempt,
              countdown: Math.ceil(delayMs / 1000),
            });
          }
        );

        if (!accountResult.success) {
          console.error("[Stripe Connect] Account creation failed:", accountResult.error);
          setConnectState({ status: "error", error: accountResult.error });
          return;
        }

        accountId = accountResult.data.accountId;
        console.log("[Stripe Connect] Account created:", accountId);
      }

      // 3. Get account link with retry
      console.log("[Stripe Connect] Getting account link...");
      setConnectState({ status: "connecting", stage: "link" });

      const linkResult = await fetchWithRetry<{ url: string }>(
        "/api/stripe/connect/account-link",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            accountId,
            returnContext: "onboarding", // Ensures return to onboarding flow after Stripe
          }),
        },
        { maxRetries: 3, baseDelayMs: 1000 },
        (attempt, _error, delayMs) => {
          setConnectState({
            status: "retrying",
            stage: "link",
            attempt,
            countdown: Math.ceil(delayMs / 1000),
          });
        }
      );

      if (!linkResult.success) {
        console.error("[Stripe Connect] Link creation failed:", linkResult.error);
        setConnectState({ status: "error", error: linkResult.error });
        return;
      }

      console.log("[Stripe Connect] Got account link, saving step...");

      // 4. Save onboarding step
      setConnectState({ status: "connecting", stage: "save" });

      await saveOnboardingStep(7, {
        payment_method: "stripe",
        custom_payment_url: null,
      });

      console.log("[Stripe Connect] Step saved, redirecting to Stripe...");

      // 5. Redirect to Stripe
      setConnectState({ status: "redirecting" });
      window.location.href = linkResult.data.url;
    } catch (error) {
      console.error("[Stripe Connect] Unexpected error:", error);
      setConnectState({
        status: "error",
        error: {
          code: "stripe_network_error",
          message: "An unexpected error occurred.",
          recovery: "Please check your connection and try again.",
          retryable: true,
        },
      });
    }
  }, [profileId]);

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

  const isConnecting =
    connectState.status === "checking" ||
    connectState.status === "connecting" ||
    connectState.status === "retrying" ||
    connectState.status === "redirecting";

  // Simplified loading messages (2 states instead of 5)
  const getConnectingMessage = () => {
    if (connectState.status === "redirecting" ||
        (connectState.status === "connecting" && connectState.stage === "save")) {
      return "Opening secure setup...";
    }
    if (connectState.status === "retrying") {
      return "Retrying...";
    }
    return "Setting up...";
  };

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
          disabled={isConnecting || isCompleting}
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
                Accept Card Payments
              </span>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                Recommended
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Students pay by card. Money goes to your bank in 2-3 days.
            </p>
            <p className="mt-2 text-xs text-muted-foreground/70">
              Takes ~5 minutes. You&apos;ll enter basic info on a secure page.
            </p>
          </div>
        </button>

        {/* Option 2: Manual Payments */}
        <button
          type="button"
          onClick={() => {
            setSelectedOption("manual");
            setErrors({});
            setConnectState({ status: "idle" });
          }}
          disabled={isConnecting || isCompleting}
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

      {/* Error display with structured messaging */}
      {connectState.status === "error" && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 text-red-500" />
            <div className="flex-1 space-y-2">
              <p className="text-sm font-medium text-red-800">
                {connectState.error.message}
              </p>
              {connectState.error.recovery && (
                <p className="text-sm text-red-700">
                  {connectState.error.recovery}
                </p>
              )}
              <div className="flex items-center gap-3 pt-1">
                {connectState.error.retryable && (
                  <button
                    type="button"
                    onClick={startStripeConnectFlow}
                    className="inline-flex items-center gap-1.5 rounded-md bg-red-100 px-3 py-1.5 text-xs font-medium text-red-800 transition hover:bg-red-200"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Try Again
                  </button>
                )}
                <span className="text-xs text-red-500">
                  Error: {connectState.error.code}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Retry state display */}
      {connectState.status === "retrying" && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-yellow-600" />
            <span className="text-sm text-yellow-800">
              {getConnectingMessage()}
            </span>
          </div>
        </div>
      )}

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
          disabled={isConnecting || isCompleting}
          className="inline-flex h-10 items-center justify-center rounded-full border border-border px-6 text-sm font-semibold text-muted-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
        >
          Skip for now
        </button>

        {selectedOption === "stripe" && (
          <button
            type="button"
            onClick={startStripeConnectFlow}
            disabled={isConnecting || isCompleting}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isConnecting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {getConnectingMessage()}
              </>
            ) : (
              <>
                Set Up Card Payments
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
