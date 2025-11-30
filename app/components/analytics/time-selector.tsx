"use client";

import { cn } from "@/lib/utils";

export type TimePeriod = 7 | 30 | 90;

interface TimeSelectorProps {
  value: TimePeriod;
  onChange: (period: TimePeriod) => void;
}

const periods: { value: TimePeriod; label: string }[] = [
  { value: 7, label: "7d" },
  { value: 30, label: "30d" },
  { value: 90, label: "90d" },
];

export function TimeSelector({ value, onChange }: TimeSelectorProps) {
  return (
    <div data-testid="time-period-selector" className="inline-flex items-center rounded-lg bg-muted/50 p-1">
      {periods.map((period) => (
        <button
          key={period.value}
          data-testid={`time-period-${period.value}d`}
          onClick={() => onChange(period.value)}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            value === period.value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
          aria-pressed={value === period.value}
        >
          {period.label}
        </button>
      ))}
    </div>
  );
}
