"use client";

import { useState } from "react";
import { AlertCircle, X } from "lucide-react";
import { SignupPlanSelector, type PlanTier, type BillingCycle } from "./SignupPlanSelector";
import { SignupForm } from "@/components/forms/signup-form";

type SignupPageClientProps = {
  checkoutCancelled?: boolean;
  initialTier?: PlanTier;
  initialBilling?: BillingCycle;
};

export function SignupPageClient({ checkoutCancelled, initialTier, initialBilling }: SignupPageClientProps) {
  const [tier, setTier] = useState<PlanTier>(initialTier ?? "pro");
  const [billing, setBilling] = useState<BillingCycle>(initialBilling ?? "monthly");
  const [showCancelledBanner, setShowCancelledBanner] = useState(checkoutCancelled ?? false);

  return (
    <>
      {/* Checkout cancelled warning */}
      {showCancelledBanner && (
        <div className="w-full rounded-xl border border-amber-200 bg-amber-50 p-4 animate-in slide-in-from-top-2">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800">
                Checkout was cancelled
              </p>
              <p className="text-xs text-amber-600 mt-1">
                Please complete checkout to start your free trial and access TutorLingua.
              </p>
            </div>
            <button
              onClick={() => setShowCancelledBanner(false)}
              className="text-amber-400 hover:text-amber-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

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
