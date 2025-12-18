"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CreditCard, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TrialExpiredBannerProps {
  trialPlan: string;
  daysRemaining?: number;
}

/**
 * Banner shown in dashboard when user has a local trial (Stripe not configured).
 * Shows warning when trial is expiring soon or expired.
 */
export function TrialExpiredBanner({ trialPlan, daysRemaining }: TrialExpiredBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const router = useRouter();

  if (dismissed) return null;

  const isExpired = daysRemaining === undefined || daysRemaining <= 0;
  const isExpiringSoon = !isExpired && daysRemaining <= 3;

  // Format plan name for display
  const formatPlanName = (plan: string) => {
    return plan
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  return (
    <div
      className={`border rounded-lg p-4 mb-6 ${
        isExpired
          ? "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800"
          : isExpiringSoon
            ? "bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800"
            : "bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800"
      }`}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle
          className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
            isExpired
              ? "text-amber-600 dark:text-amber-400"
              : isExpiringSoon
                ? "text-yellow-600 dark:text-yellow-400"
                : "text-blue-600 dark:text-blue-400"
          }`}
        />
        <div className="flex-1 min-w-0">
          <h3
            className={`font-semibold ${
              isExpired
                ? "text-amber-900 dark:text-amber-100"
                : isExpiringSoon
                  ? "text-yellow-900 dark:text-yellow-100"
                  : "text-blue-900 dark:text-blue-100"
            }`}
          >
            {isExpired
              ? "Your free trial has ended"
              : `Your free trial ends in ${daysRemaining} day${daysRemaining === 1 ? "" : "s"}`}
          </h3>
          <p
            className={`text-sm mt-1 ${
              isExpired
                ? "text-amber-700 dark:text-amber-300"
                : isExpiringSoon
                  ? "text-yellow-700 dark:text-yellow-300"
                  : "text-blue-700 dark:text-blue-300"
            }`}
          >
            {isExpired
              ? `Add a payment method to continue using TutorLingua with your ${formatPlanName(trialPlan)} plan.`
              : `Add a payment method to ensure uninterrupted access to your ${formatPlanName(trialPlan)} plan.`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            onClick={() => router.push("/settings/billing")}
            size="sm"
            className={
              isExpired
                ? "bg-amber-600 hover:bg-amber-700 text-white"
                : "bg-primary hover:bg-primary/90"
            }
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Add Payment
          </Button>
          {!isExpired && (
            <button
              onClick={() => setDismissed(true)}
              className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
