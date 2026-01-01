"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Plus, Video, Mic, Sparkles, BookOpen, Loader2 } from "lucide-react";
import { BillingToggle, type BillingCycle } from "@/components/pricing/BillingToggle";

// Pro features (what they already have)
const PRO_FEATURES = [
  "Professional booking page",
  "Student CRM with notes",
  "Stripe payments (0% fees)",
  "Calendar sync",
  "Email reminders",
  "Session packages",
  "Custom tutor website",
  "Analytics dashboard",
];

// Studio-exclusive features (what they'll gain)
const STUDIO_FEATURES = [
  { icon: Video, text: "Native video classroom" },
  { icon: Mic, text: "Lesson transcription" },
  { icon: Sparkles, text: "AI lesson insights" },
  { icon: BookOpen, text: "AI drill generation" },
];

type UpgradePlanCardProps = {
  currentPlan: string;
  currentBillingCycle?: "monthly" | "annual";
};

export function UpgradePlanCard({
  currentPlan,
  currentBillingCycle = "monthly",
}: UpgradePlanCardProps) {
  const router = useRouter();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(currentBillingCycle);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const targetPlan = billingCycle === "monthly" ? "studio_monthly" : "studio_annual";
  const monthlyPrice = 49;
  const annualPrice = 349;
  const currentMonthlyEquivalent = billingCycle === "monthly" ? 29 : Math.round(199 / 12);
  const targetMonthlyEquivalent = billingCycle === "monthly" ? monthlyPrice : Math.round(annualPrice / 12);
  const priceDiff = targetMonthlyEquivalent - currentMonthlyEquivalent;
  const annualSavings = Math.round(((monthlyPrice * 12 - annualPrice) / (monthlyPrice * 12)) * 100);

  const handleUpgrade = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/stripe/plan-change", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetPlan }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        setError(data.error || "Failed to upgrade. Please try again.");
        return;
      }

      // Handle different response actions
      if (data.action === "updated") {
        // Subscription updated in-place
        setSuccess(true);
        // Refresh the page to show new plan
        setTimeout(() => {
          router.refresh();
        }, 1500);
      } else if (data.action === "checkout" && data.url) {
        // Redirect to checkout (for edge cases)
        window.location.href = data.url;
      } else if (data.action === "scheduled") {
        // Change scheduled for period end
        setSuccess(true);
        setTimeout(() => {
          router.refresh();
        }, 1500);
      }
    } catch (err) {
      console.error("Upgrade failed:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50 p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
            <Check className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-emerald-900">
              Welcome to Studio!
            </h3>
            <p className="text-sm text-emerald-700">
              Your plan has been upgraded. Refreshing...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-6">
      <h3 className="text-lg font-semibold text-foreground">
        Unlock Studio Features
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Take your teaching to the next level with video, AI, and insights.
      </p>

      {/* Plan Comparison */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {/* Current Plan - Pro */}
        <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              Your Plan
            </span>
            <span className="rounded-full bg-stone-200 px-2 py-0.5 text-xs font-medium text-stone-600">
              Current
            </span>
          </div>
          <h4 className="mt-2 text-xl font-bold text-foreground">Pro</h4>
          <ul className="mt-3 space-y-1.5">
            {PRO_FEATURES.slice(0, 4).map((feature) => (
              <li
                key={feature}
                className="flex items-center gap-2 text-xs text-muted-foreground"
              >
                <Check className="h-3.5 w-3.5 flex-shrink-0 text-emerald-500" />
                {feature}
              </li>
            ))}
            <li className="text-xs text-muted-foreground">
              + {PRO_FEATURES.length - 4} more features
            </li>
          </ul>
        </div>

        {/* Target Plan - Studio */}
        <div className="rounded-xl border-2 border-primary bg-gradient-to-br from-orange-50 to-amber-50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-primary">
              Upgrade to
            </span>
            <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
              +${priceDiff}/mo
            </span>
          </div>
          <h4 className="mt-2 text-xl font-bold text-foreground">Studio</h4>
          <ul className="mt-3 space-y-1.5">
            <li className="flex items-center gap-2 text-xs text-foreground font-medium">
              <Check className="h-3.5 w-3.5 flex-shrink-0 text-emerald-500" />
              Everything in Pro
            </li>
            {STUDIO_FEATURES.map(({ icon: Icon, text }) => (
              <li
                key={text}
                className="flex items-center gap-2 text-xs text-foreground"
              >
                <Plus className="h-3.5 w-3.5 flex-shrink-0 text-primary" />
                {text}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Billing Toggle */}
      <div className="mt-6 flex justify-center">
        <BillingToggle
          value={billingCycle}
          onChange={setBillingCycle}
          monthlyLabel="$49/mo"
          annualLabel={`$349/yr (save ${annualSavings}%)`}
        />
      </div>

      {/* Proration Info */}
      <p className="mt-4 text-center text-xs text-muted-foreground">
        Pro-rated for your remaining billing period. No double charges.
      </p>

      {/* Error Message */}
      {error && (
        <p className="mt-4 text-center text-sm text-destructive">{error}</p>
      )}

      {/* Upgrade Button */}
      <button
        type="button"
        onClick={handleUpgrade}
        disabled={loading}
        className="mt-4 w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Upgrading...
          </span>
        ) : (
          `Upgrade to Studio — ${billingCycle === "monthly" ? "$49/mo" : "$349/yr"}`
        )}
      </button>
    </div>
  );
}
