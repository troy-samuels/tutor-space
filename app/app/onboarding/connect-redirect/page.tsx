"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, AlertTriangle, RefreshCw, ArrowLeft, CreditCard } from "lucide-react";

type Status = "loading" | "error" | "redirecting";

type ErrorInfo = {
  message: string;
  recovery?: string;
  retryable: boolean;
};

/**
 * Stripe Connect Interstitial Page
 *
 * Shows immediate visual feedback (progress bar) while the
 * unified fast-onboard API creates account + generates link.
 *
 * Achieves sub-100ms perceived performance by:
 * - Immediate navigation to this page (no API wait)
 * - Animated progress bar for visual feedback
 * - Auto-redirect to Stripe when ready
 */
export default function ConnectRedirectPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tutorId = searchParams.get("tutorId");

  const [status, setStatus] = useState<Status>("loading");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<ErrorInfo | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Prevent double-calls in React 18 strict mode
  const hasFetched = useRef(false);

  const startOnboarding = useCallback(async () => {
    if (!tutorId) {
      setStatus("error");
      setError({
        message: "Missing profile information.",
        recovery: "Please go back and try again.",
        retryable: false
      });
      return;
    }

    setStatus("loading");
    setProgress(0);
    setError(null);

    // Animated progress (smooth visual feedback)
    const progressInterval = setInterval(() => {
      setProgress(p => {
        // Slow down as we approach 90%
        const increment = p < 50 ? 8 : p < 70 ? 5 : p < 85 ? 2 : 0.5;
        return Math.min(p + increment, 92);
      });
    }, 100);

    try {
      const response = await fetch("/api/stripe/connect/fast-onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tutorId }),
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setStatus("error");
        setError({
          message: data.error || "Unable to connect to payment service.",
          recovery: data.retryable
            ? "This is usually temporary. Please try again."
            : "Please contact support if this persists.",
          retryable: data.retryable ?? false
        });
        return;
      }

      const data = await response.json();

      if (!data.url) {
        setStatus("error");
        setError({
          message: "Invalid response from server.",
          recovery: "Please try again.",
          retryable: true
        });
        return;
      }

      // Success! Complete progress and redirect
      setProgress(100);
      setStatus("redirecting");

      // Brief pause at 100% for visual satisfaction
      setTimeout(() => {
        window.location.href = data.url;
      }, 300);

    } catch (err) {
      clearInterval(progressInterval);
      console.error("[Connect Redirect] Error:", err);

      setStatus("error");
      setError({
        message: "Network error. Please check your connection.",
        recovery: "Try again when you have a stable connection.",
        retryable: true
      });
    }
  }, [tutorId]);

  // Auto-start on mount
  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    startOnboarding();
  }, [startOnboarding]);

  const handleRetry = () => {
    hasFetched.current = false;
    setRetryCount(c => c + 1);
    startOnboarding();
  };

  const handleBack = () => {
    router.push("/onboarding");
  };

  // Error state
  if (status === "error" && error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <div className="w-full max-w-md space-y-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-semibold text-foreground">
              Stripe Connect Failed
            </h1>
            <p className="text-sm text-muted-foreground">
              {error.message}
            </p>
            {error.recovery && (
              <p className="text-xs text-muted-foreground/80">
                {error.recovery}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-3 pt-4">
            {error.retryable && (
              <button
                onClick={handleRetry}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
                {retryCount > 0 && (
                  <span className="text-xs opacity-70">
                    (Attempt {retryCount + 1})
                  </span>
                )}
              </button>
            )}

            <button
              onClick={handleBack}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-border px-6 text-sm font-medium text-muted-foreground transition hover:bg-muted"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Setup
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Loading / Redirecting state
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8 text-center">
        {/* Icon */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
          {status === "redirecting" ? (
            <CreditCard className="h-10 w-10 text-primary" />
          ) : (
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          )}
        </div>

        {/* Title and description */}
        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-foreground">
            {status === "redirecting"
              ? "Opening Stripe Connect..."
              : "Connecting to Stripe Connect"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {status === "redirecting"
              ? "Redirecting to Stripe's secure onboarding"
              : "Setting up your Stripe Connect account"}
          </p>
        </div>

        {/* Progress bar */}
        <div className="space-y-3">
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-200 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground/70">
            {status === "redirecting"
              ? "Ready!"
              : "This typically takes 2-3 seconds"}
          </p>
        </div>

        {/* Info box */}
        <div className="rounded-xl bg-blue-50 p-4">
          <p className="text-xs text-blue-800">
            <strong>Stripe Connect</strong> lets you accept card payments directly.
            You&apos;ll enter your business details on Stripe&apos;s secure page,
            and payments from students go straight to your bank account.
          </p>
        </div>
      </div>
    </div>
  );
}
