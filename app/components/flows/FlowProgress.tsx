"use client";

import { Check } from "lucide-react";

type FlowStep = {
  id: string;
  title: string;
  helper?: string;
};

type FlowProgressProps = {
  steps: FlowStep[];
  activeIndex: number;
};

export function FlowProgress({ steps, activeIndex }: FlowProgressProps) {
  const total = Math.max(steps.length - 1, 1);
  const clampedIndex = Math.min(Math.max(activeIndex, 0), steps.length - 1);
  const percent = Math.round((clampedIndex / total) * 100);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        <span className="text-foreground/80">
          {steps[clampedIndex]?.title ?? "Progress"}
        </span>
        <span>{percent}%</span>
      </div>
      <div className="relative h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-primary transition-all duration-300 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {steps.map((step, index) => {
          const status = index < clampedIndex ? "complete" : index === clampedIndex ? "active" : "idle";
          return (
            <div key={step.id} className="flex items-start gap-3 rounded-2xl border border-border bg-background/70 p-3 shadow-sm">
              <div
                className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-full border text-xs transition ${
                  status === "complete"
                    ? "border-emerald-500 bg-emerald-50 text-emerald-600"
                    : status === "active"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-muted/40 text-muted-foreground"
                }`}
              >
                {status === "complete" ? <Check className="h-4 w-4" /> : <span className="h-2 w-2 rounded-full bg-current" />}
              </div>
              <div className="space-y-0.5">
                <p
                  className={`text-sm font-semibold ${
                    status === "idle" ? "text-muted-foreground" : "text-foreground"
                  }`}
                >
                  {step.title}
                </p>
                {step.helper ? (
                  <p className="text-xs text-muted-foreground/80">{step.helper}</p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
