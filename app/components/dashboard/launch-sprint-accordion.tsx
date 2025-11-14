"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, ChevronDown, Lock, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type LaunchStep = {
  id: string;
  title: string;
  description: string;
  href: string;
  ctaLabel: string;
  complete: boolean;
};

type LaunchSprintAccordionProps = {
  steps: LaunchStep[];
};

export function LaunchSprintAccordion({ steps }: LaunchSprintAccordionProps) {
  const firstIncompleteId = useMemo(
    () => steps.find((step) => !step.complete)?.id ?? null,
    [steps]
  );
  const [openStepId, setOpenStepId] = useState<string | null>(firstIncompleteId);

  useEffect(() => {
    setOpenStepId(firstIncompleteId);
  }, [firstIncompleteId]);

  const allComplete = steps.every((step) => step.complete);

  if (steps.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {steps.map((step, index) => {
        const isOpen = openStepId === step.id;
        const priorStepsComplete = steps.slice(0, index).every((prior) => prior.complete);
        const canInteract = priorStepsComplete || step.complete;
        const statusIcon = step.complete ? (
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
        ) : canInteract ? (
          <Circle className="h-5 w-5 text-muted-foreground" />
        ) : (
          <Lock className="h-5 w-5 text-muted-foreground" />
        );

        return (
          <div
            key={step.id}
            className={cn(
              "rounded-2xl border bg-white/90 shadow-sm transition",
              step.complete
                ? "border-emerald-200 bg-emerald-50/60"
                : canInteract
                  ? "border-border/70"
                  : "border-dashed border-border/50 opacity-70"
            )}
          >
            <button
              type="button"
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
              onClick={() => canInteract && setOpenStepId(isOpen ? null : step.id)}
              disabled={!canInteract}
            >
              <div className="flex items-center gap-3">
                {statusIcon}
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Step {index + 1}: {step.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {step.complete ? "Completed" : canInteract ? "Ready to complete" : "Unlock after previous step"}
                  </p>
                </div>
              </div>
              <ChevronDown
                className={cn(
                  "h-5 w-5 text-muted-foreground transition-transform",
                  isOpen ? "rotate-180" : "rotate-0"
                )}
              />
            </button>

            {isOpen && (
              <div className="border-t border-border/60 px-4 py-4 text-sm text-muted-foreground">
                <p>{step.description}</p>
                <div className="mt-4">
                  <Button asChild disabled={!canInteract}>
                    <Link href={step.href}>{step.ctaLabel}</Link>
                  </Button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {allComplete ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          You&apos;ve finished every launch sprint step. Keep growing with marketing experiments next!
        </div>
      ) : null}
    </div>
  );
}
