"use client";

import { format } from "date-fns";

export interface SubscriptionCredit {
  id: string;
  lessonsAvailable: number;
  lessonsTotal: number;
  periodEndsAt: string;
  serviceName: string;
}

interface SubscriptionCreditSelectorProps {
  subscription: SubscriptionCredit | null;
  selected: boolean;
  onSelect: (subscriptionId: string | null) => void;
  disabled?: boolean;
}

export function SubscriptionCreditSelector({
  subscription,
  selected,
  onSelect,
  disabled,
}: SubscriptionCreditSelectorProps) {
  if (!subscription || subscription.lessonsAvailable <= 0) {
    return null;
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="useSubscription"
            checked={selected}
            onChange={(e) => onSelect(e.target.checked ? subscription.id : null)}
            disabled={disabled}
            className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary disabled:opacity-50"
          />
          <label htmlFor="useSubscription" className="cursor-pointer">
            <div className="font-medium text-foreground">
              Use subscription credit
            </div>
            <div className="text-sm text-muted-foreground">
              {subscription.lessonsAvailable} of {subscription.lessonsTotal} lessons remaining this month
            </div>
          </label>
        </div>
        <div className="text-right">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            No payment needed
          </div>
          <div className="text-xs text-muted-foreground">
            Renews {format(new Date(subscription.periodEndsAt), "MMM d")}
          </div>
        </div>
      </div>

      {selected && (
        <div className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          1 lesson credit will be deducted from your subscription
        </div>
      )}
    </div>
  );
}
