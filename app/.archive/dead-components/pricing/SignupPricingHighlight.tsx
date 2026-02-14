"use client";

import { useMemo, useState } from "react";
import { BillingToggle, type BillingCycle } from "@/components/pricing/BillingToggle";

const MONTHLY_PRICE = "$29";
const ANNUAL_PRICE = "$199";

export function SignupPricingHighlight() {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");

  const { price, period, helper } = useMemo(() => {
    const isAnnual = billingCycle === "annual";

    return {
      price: isAnnual ? ANNUAL_PRICE : MONTHLY_PRICE,
      period: isAnnual ? "/year" : "/month",
      helper: isAnnual
        ? "14-day free trial. Then $199/yr (save 43% vs monthly)."
        : "7-day free trial. Then $29/mo. Switch to annual anytime.",
    };
  }, [billingCycle]);

  return (
    <div className="rounded-2xl border border-border bg-white/90 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            All-access plan
          </p>
          <div className="mt-1 text-2xl font-bold text-foreground">
            {price}{" "}
            <span className="text-sm font-semibold text-muted-foreground">{period}</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Free trial included. Every feature included. Billing starts after the trial.
          </p>
        </div>

        <BillingToggle
          value={billingCycle}
          onChange={setBillingCycle}
          monthlyLabel="Monthly"
          annualLabel="Annual (save 36%)"
          helper={helper}
        />
      </div>
    </div>
  );
}
