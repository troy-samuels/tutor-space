"use client";

import { useMemo } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type PlanTier = "pro" | "studio";
export type BillingCycle = "monthly" | "annual";

type SignupPlanSelectorProps = {
  tier: PlanTier;
  billing: BillingCycle;
  onTierChange?: (tier: PlanTier) => void;
  onBillingChange?: (cycle: BillingCycle) => void;
};

const PRICING = {
  pro: {
    monthly: { price: "$29", period: "/month", perMonth: "$29" },
    annual: { price: "$199", period: "/year", perMonth: "$17", savings: "43%" },
  },
  studio: {
    monthly: { price: "$49", period: "/month", perMonth: "$49" },
    annual: { price: "$349", period: "/year", perMonth: "$29", savings: "41%" },
  },
} as const;

const PLANS = [
  {
    tier: "pro" as const,
    name: "Pro",
    badge: "Most tutors",
    features: [
      "Booking & payments",
      "Student CRM",
      "Custom tutor site",
    ],
  },
  {
    tier: "studio" as const,
    name: "Studio",
    badge: "Video + AI",
    features: [
      "Everything in Pro",
      "Native video room",
      "AI drills & insights",
    ],
  },
] as const;

export function SignupPlanSelector({
  tier,
  billing,
  onTierChange,
  onBillingChange,
}: SignupPlanSelectorProps) {
  const handleTierChange = (newTier: PlanTier) => {
    onTierChange?.(newTier);
  };

  const handleBillingChange = (newBilling: BillingCycle) => {
    onBillingChange?.(newBilling);
  };

  const annualSavings = useMemo(() => {
    // Use the higher savings percentage for the toggle label
    return "43%";
  }, []);

  return (
    <div className="flex w-full flex-col items-center gap-6">
      {/* Billing Toggle */}
      <div className="inline-flex rounded-full bg-muted p-1 shadow-sm">
        <button
          type="button"
          onClick={() => handleBillingChange("monthly")}
          className={cn(
            "rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
            billing === "monthly"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Monthly
        </button>
        <button
          type="button"
          onClick={() => handleBillingChange("annual")}
          className={cn(
            "rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
            billing === "annual"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Annual (save {annualSavings})
        </button>
      </div>

      {/* Plan Cards */}
      <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
        {PLANS.map((plan) => {
          const pricing = PRICING[plan.tier][billing];
          const isSelected = tier === plan.tier;

          return (
            <button
              key={plan.tier}
              type="button"
              onClick={() => handleTierChange(plan.tier)}
              className={cn(
                "flex flex-col rounded-2xl border-2 bg-white p-5 text-left transition-all",
                isSelected
                  ? "border-primary shadow-md"
                  : "border-border hover:border-primary/50"
              )}
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold text-foreground">
                    {plan.name}
                  </span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    {plan.badge}
                  </span>
                </div>
                {isSelected && (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
              </div>

              {/* Price */}
              <div className="mt-4">
                <span className="text-3xl font-bold text-foreground">
                  {pricing.price}
                </span>
                <span className="text-sm font-medium text-muted-foreground">
                  {pricing.period}
                </span>
                {billing === "annual" && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    ~{pricing.perMonth}/mo
                  </p>
                )}
              </div>

              {/* Features */}
              <ul className="mt-4 space-y-2">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                  >
                    <Check className="h-4 w-4 text-primary" />
                    {feature}
                  </li>
                ))}
              </ul>

              {/* Trial info */}
              <p className="mt-4 text-xs text-muted-foreground">
                {billing === "annual" ? "14" : "7"}-day free trial
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
