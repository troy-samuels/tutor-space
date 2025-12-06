"use client";

import { useState } from "react";
import { BillingToggle, type BillingCycle } from "@/components/pricing/BillingToggle";

type PlatformSubscriptionCTAProps = {
  className?: string;
  defaultCycle?: BillingCycle;
  ctaLabel?: string;
  helperText?: string;
};

/**
 * Starts the TutorLingua platform subscription checkout (monthly or annual).
 * Redirects to Stripe Checkout on success.
 */
export function PlatformSubscriptionCTA({
  className = "",
  defaultCycle = "monthly",
  ctaLabel = "Start 14-day free trial",
  helperText,
}: PlatformSubscriptionCTAProps) {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(defaultCycle);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const helper =
    helperText ?? "14-day free trial. Then $39/mo or $299/yr. Switch anytime.";

  const handleSubscribe = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/app/api/stripe/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billingCycle }),
      });

      const data = await response.json();

      if (!response.ok || data.error || !data.url) {
        setError(data.error || "Unable to start checkout. Please try again.");
        return;
      }

      window.location.href = data.url as string;
    } catch (err) {
      console.error("Failed to start subscription checkout:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">TutorLingua access</p>
          <p className="text-xs text-muted-foreground">
            14-day free trial. Billed $39/mo or $299/yr after. Cancel anytime during the trial.
          </p>
        </div>
        <BillingToggle
          value={billingCycle}
          onChange={setBillingCycle}
          monthlyLabel="$39/mo after trial"
          annualLabel="$299/yr after trial (save 36%)"
          helper={helper}
        />
      </div>

      <button
        type="button"
        onClick={handleSubscribe}
        disabled={loading}
        className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? "Starting checkout..." : ctaLabel}
      </button>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
