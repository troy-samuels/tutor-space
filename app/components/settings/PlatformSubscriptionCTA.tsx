"use client";

import { useState } from "react";
import { BillingToggle, type BillingCycle } from "@/components/pricing/BillingToggle";

type PlatformSubscriptionCTAProps = {
  className?: string;
  tier?: "pro" | "studio";
  defaultCycle?: BillingCycle;
  ctaLabel?: string;
  helperText?: string;
  monthlyLabel?: string;
  annualLabel?: string;
};

/**
 * Starts the TutorLingua platform subscription checkout (monthly or annual).
 * Redirects to Stripe Checkout on success.
 */
export function PlatformSubscriptionCTA({
  className = "",
  tier = "pro",
  defaultCycle = "monthly",
  ctaLabel = "Start free trial",
  helperText,
  monthlyLabel,
  annualLabel,
}: PlatformSubscriptionCTAProps) {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(defaultCycle);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubscribe = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/stripe/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billingCycle, tier }),
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
    <div className={`space-y-5 ${className}`}>
      <div className="flex justify-center">
        <BillingToggle
          value={billingCycle}
          onChange={setBillingCycle}
          monthlyLabel={monthlyLabel ?? (tier === "studio" ? "$49/mo" : "$29/mo")}
          annualLabel={annualLabel ?? (tier === "studio" ? "$349/yr" : "$199/yr")}
        />
      </div>

      {helperText ? (
        <p className="text-center text-xs text-muted-foreground">{helperText}</p>
      ) : null}

      <button
        type="button"
        onClick={handleSubscribe}
        disabled={loading}
        className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? "Starting checkout..." : ctaLabel}
      </button>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
