"use client";

import { useState } from "react";
import type { PlatformBillingPlan } from "@/lib/types/payments";

interface SubscriptionCardProps {
  plan: PlatformBillingPlan;
  price: string;
  features: string[];
  currentPlan: PlatformBillingPlan | string;
}

export default function SubscriptionCard({
  plan,
  price,
  features,
  currentPlan,
}: SubscriptionCardProps) {
  const [loading] = useState(false);
  const isCurrentPlan = currentPlan === plan;
  const planLabel = plan === "founder_lifetime" ? "Founder lifetime" : plan;

  return (
    <div
      className={`border rounded-lg p-6 ${
        isCurrentPlan
          ? "border-blue-500 bg-blue-50"
          : "border-gray-200 bg-white"
      }`}
    >
      <div className="mb-4">
        <h3 className="text-lg font-semibold capitalize">{planLabel}</h3>
        <p className="text-3xl font-bold mt-2">{price}</p>
        <p className="text-gray-600 text-sm">
          {plan === "founder_lifetime"
            ? "Single lifetime all-access plan"
            : "Monthly subscription"}
        </p>
      </div>

      <ul className="mb-6 space-y-2 text-sm text-muted-foreground">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      {isCurrentPlan && (
        <button
          disabled
          className="w-full px-4 py-2 bg-gray-100 text-gray-600 rounded-lg font-medium cursor-not-allowed"
        >
          Current Plan
        </button>
      )}

      {!isCurrentPlan && (
        <button
          disabled={loading}
          className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition"
        >
          {loading ? "Processing..." : "Upgrade"}
        </button>
      )}
    </div>
  );
}
