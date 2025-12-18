"use client";

import { useState } from "react";
import { SignupPlanSelector, type PlanTier, type BillingCycle } from "./SignupPlanSelector";
import { SignupForm } from "@/components/forms/signup-form";

export function SignupPageClient() {
  const [tier, setTier] = useState<PlanTier>("pro");
  const [billing, setBilling] = useState<BillingCycle>("monthly");

  return (
    <>
      <SignupPlanSelector
        tier={tier}
        billing={billing}
        onTierChange={setTier}
        onBillingChange={setBilling}
      />

      <div className="w-full">
        <SignupForm tier={tier} billingCycle={billing} />
      </div>
    </>
  );
}
