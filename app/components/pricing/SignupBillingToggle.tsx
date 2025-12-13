"use client";

import { useState } from "react";
import { BillingToggle, type BillingCycle } from "@/components/pricing/BillingToggle";

export function SignupBillingToggle() {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");

  return (
    <BillingToggle
      value={billingCycle}
      onChange={setBillingCycle}
      monthlyLabel="Monthly"
      annualLabel="Annual (save 36%)"
    />
  );
}
