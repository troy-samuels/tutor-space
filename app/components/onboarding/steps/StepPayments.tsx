"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, CreditCard, Check, ExternalLink, AlertTriangle, RefreshCw } from "lucide-react";
import { saveOnboardingStep } from "@/lib/actions/onboarding";
import { checkConnectHealth } from "@/lib/stripe/connect-health";
import { fetchWithRetry } from "@/lib/stripe/connect-retry";
import type { StripeConnectError } from "@/lib/stripe/connect-errors";

type StepPaymentsProps = {
  profileId: string;
  onComplete: () => void;
  isCompleting: boolean;
};

// State machine for Stripe Connect flow
type ConnectState =
  | { status: "idle" }
  | { status: "checking" }
  | { status: "connecting"; stage: "account" | "link" | "save" }
  | { status: "retrying"; stage: string; attempt: number; countdown: number }
  | { status: "error"; error: StripeConnectError }
  | { status: "redirecting" };

export function StepPayments({
  profileId,
  onComplete,
  isCompleting,
}: StepPaymentsProps) {
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
    setConnectState({ status: "checking" });
    setErrors({});

    try {
      // 1. Pre-flight health check
      const health = await checkConnectHealth(profileId);
      if (!health.ready && health.error) {
        setConnectState({ status: "error", error: health.error });
        return;
      }

      // 2. Create account (or use existing) with retry
      let accountId = health.existingAccountId;

      if (!accountId) {
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
          setConnectState({ status: "error", error: accountResult.error });
          return;
        }

        accountId = accountResult.data.accountId;
      }

      // 3. Get account link with retry
      setConnectState({ status: "connecting", stage: "link" });

      const linkResult = await fetchWithRetry<{ url: string }>(
        "/api/stripe/connect/account-link",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accountId }),
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
        setConnectState({ status: "error", error: linkResult.error });
        return;
      }

      // 4. Save onboarding step
      setConnectState({ status: "connecting", stage: "save" });

      await saveOnboardingStep(7, {
        payment_method: "stripe",
        custom_payment_url: null,
      });

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

  const isConnecting =
    connectState.status === "checking" ||
    connectState.status === "connecting" ||
    connectState.status === "retrying" ||
    connectState.status === "redirecting";

  const getConnectingMessage = () => {
    switch (connectState.status) {
      case "checking":
        return "Verifying...";
      case "connecting":
        if (connectState.stage === "account") return "Creating account...";
        if (connectState.stage === "link") return "Generating link...";
        if (connectState.stage === "save") return "Saving...";
        return "Connecting...";
      case "retrying":
        return `Retrying in ${connectState.countdown}s...`;
      case "redirecting":
        return "Redirecting to Stripe...";
      default:
        return "Connecting...";
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
      <button
        type="button"
        onClick={startStripeConnectFlow}
        disabled={isConnecting || isCompleting}
        className="flex w-full items-start gap-4 rounded-xl border border-dashed border-muted-foreground/30 bg-muted/30 p-4 text-left transition hover:border-muted-foreground/60 hover:bg-muted/40 disabled:cursor-not-allowed disabled:opacity-50"
      >
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
          <p className="mt-3 text-xs text-muted-foreground">
            You can set this up later in Settings → Payments
          </p>
        </div>
        <div className="mt-1 inline-flex items-center gap-2 text-xs font-medium text-muted-foreground">
          {isConnecting ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              {getConnectingMessage()}
            </>
          ) : (
            <>
              <ExternalLink className="h-3 w-3" />
              Connect Stripe
            </>
          )}
        </div>
      </button>

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

      {/* Retry countdown display */}
      {connectState.status === "retrying" && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-yellow-600" />
            <span className="text-sm text-yellow-800">
              Retrying in {connectState.countdown}s (attempt {connectState.attempt} of 3)...
            </span>
          </div>
        </div>
      )}

      {/* Alternative payment methods note */}
      <div className="rounded-xl bg-blue-50 p-4">
        <p className="text-xs text-blue-800">
          <span className="font-medium">Other options:</span> You can also accept payments via Venmo, PayPal, or Zelle. Configure these in Settings after onboarding.
        </p>
      </div>

      {/* Legacy error messages */}
      {errors.submit && (
        <p className="text-sm text-red-600">{errors.submit}</p>
      )}

      {/* Complete Setup button */}
      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={handleComplete}
          disabled={isConnecting || isCompleting}
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
