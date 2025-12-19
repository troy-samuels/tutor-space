"use client";

import { Check } from "lucide-react";
import { ReactNode } from "react";

export type StepStatus = "completed" | "active" | "upcoming";

type TimelineStepProps = {
  stepNumber: number;
  title: string;
  description: string;
  status: StepStatus;
  isCompleted: boolean;
  isLastStep: boolean;
  children?: ReactNode;
  onNavigate?: (stepNumber: number) => void;
};

export function TimelineStep({
  stepNumber,
  title,
  description,
  status,
  isCompleted,
  isLastStep,
  children,
  onNavigate,
}: TimelineStepProps) {
  const isClickableCompletedStep = isCompleted && status !== "active";

  return (
    <div className="relative flex gap-4">
      {/* Vertical line connector - base (gray) */}
      {!isLastStep && (
        <div className="absolute left-5 top-10 h-[calc(100%-2.5rem)] w-0.5 bg-border" />
      )}

      {/* Vertical line connector - progress fill (animated) */}
      {!isLastStep && (
        <div
          className="absolute left-5 top-10 w-0.5 bg-accent transition-all duration-500 ease-out"
          style={{
            height: isCompleted ? "calc(100% - 2.5rem)" : "0%",
          }}
        />
      )}

      {/* Step indicator circle */}
      <div className="relative z-10 flex-shrink-0">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-all duration-300 ease-in-out ${
            status === "completed"
              ? "bg-accent text-accent-foreground scale-100"
              : status === "active"
              ? "bg-primary text-primary-foreground ring-4 ring-primary/20 scale-110"
              : "bg-muted text-muted-foreground scale-100"
          }`}
        >
          {status === "completed" ? (
            <Check className="h-5 w-5 animate-in fade-in zoom-in duration-200" />
          ) : (
            stepNumber
          )}
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 pb-8">
        <div
          className={`rounded-2xl border p-4 sm:p-5 transition-all duration-300 ease-in-out ${
            status === "active"
              ? "border-primary bg-white shadow-md shadow-primary/10"
              : status === "completed"
              ? "border-accent/30 bg-accent/5"
              : "border-border bg-muted/30"
          } ${
            isClickableCompletedStep
              ? "cursor-pointer hover:border-accent/60 hover:shadow-sm hover:bg-accent/10"
              : ""
          }`}
          onClick={() =>
            isClickableCompletedStep && onNavigate?.(stepNumber)
          }
        >
          <div
            className="mb-3"
          >
            <h3
              className={`text-sm sm:text-base font-semibold transition-colors duration-200 ${
                status === "upcoming"
                  ? "text-muted-foreground"
                  : "text-foreground"
              }`}
            >
              {title}
            </h3>
            <p
              className={`mt-1 text-xs sm:text-sm transition-colors duration-200 ${
                status === "upcoming"
                  ? "text-muted-foreground/70"
                  : "text-muted-foreground"
              }`}
            >
              {description}
            </p>
          </div>

          {/* Step form content - only show for active step */}
          {status === "active" && children && (
            <div className="mt-4 border-t border-border/50 pt-4 animate-in fade-in slide-in-from-top-2 duration-300">
              {children}
            </div>
          )}

          {/* Completed badge */}
          {isCompleted && status !== "active" && (
            <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-accent animate-in fade-in zoom-in duration-200">
              <Check className="h-3.5 w-3.5" />
              Completed
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
