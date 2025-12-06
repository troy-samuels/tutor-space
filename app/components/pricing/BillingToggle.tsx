"use client";

import { cn } from "@/lib/utils";

export type BillingCycle = "monthly" | "annual";

type BillingToggleProps = {
  value: BillingCycle;
  onChange: (value: BillingCycle) => void;
  monthlyLabel: string;
  annualLabel: string;
  helper?: string;
};

export function BillingToggle({
  value,
  onChange,
  monthlyLabel,
  annualLabel,
  helper,
}: BillingToggleProps) {
  const options: { value: BillingCycle; label: string }[] = [
    { value: "monthly", label: monthlyLabel },
    { value: "annual", label: annualLabel },
  ];

  return (
    <div className="flex flex-col items-center gap-2 sm:flex-row sm:gap-3">
      <div className="inline-flex rounded-full bg-muted p-1 shadow-sm">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors",
              value === option.value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {helper ? (
        <p className="text-xs font-medium text-muted-foreground">{helper}</p>
      ) : null}
    </div>
  );
}
