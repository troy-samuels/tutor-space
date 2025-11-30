"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePageBuilderWizard, WIZARD_STEPS } from "./wizard-context";

export function WizardProgress() {
  const { state, goToStep, canGoToStep } = usePageBuilderWizard();
  const { currentStep, completedSteps } = state;

  return (
    <div className="w-full">
      {/* Progress bar */}
      <div className="mb-4 flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">
          Step {currentStep + 1} of {WIZARD_STEPS.length}
        </span>
        <span className="text-muted-foreground">
          {Math.round(((currentStep + 1) / WIZARD_STEPS.length) * 100)}% complete
        </span>
      </div>
      <div className="mb-6 h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${((currentStep + 1) / WIZARD_STEPS.length) * 100}%` }}
        />
      </div>

      {/* Step indicators */}
      <div className="flex items-center justify-between">
        {WIZARD_STEPS.map((step, index) => {
          const isCompleted = completedSteps.includes(index);
          const isCurrent = index === currentStep;
          const canClick = canGoToStep(index);

          return (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={() => canClick && goToStep(index)}
                  disabled={!canClick}
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold transition",
                    isCompleted && !isCurrent
                      ? "border-primary bg-primary text-primary-foreground shadow-sm"
                      : isCurrent
                      ? "border-primary bg-primary text-primary-foreground shadow-lg ring-4 ring-primary/20"
                      : "border-muted-foreground/30 bg-background text-muted-foreground",
                    canClick && !isCurrent
                      ? "cursor-pointer hover:shadow-md hover:border-primary/50"
                      : !canClick
                      ? "cursor-not-allowed opacity-60"
                      : ""
                  )}
                  aria-label={`Step ${index + 1}: ${step.title}`}
                  aria-current={isCurrent ? "step" : undefined}
                >
                  {isCompleted && !isCurrent ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </button>
                <span
                  className={cn(
                    "text-xs font-medium transition-colors",
                    isCurrent || isCompleted
                      ? "text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {step.title}
                </span>
              </div>
              {index < WIZARD_STEPS.length - 1 && (
                <div
                  className={cn(
                    "mx-3 h-0.5 w-12 transition-colors sm:w-20",
                    isCompleted ? "bg-primary" : "bg-muted-foreground/20"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
