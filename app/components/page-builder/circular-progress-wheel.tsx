"use client";

import { cn } from "@/lib/utils";
import { Check, User, FileText, Palette } from "lucide-react";

export type SectionCompletion = {
  profile: boolean;
  content: boolean;
  style: boolean;
};

type CircularProgressWheelProps = {
  completion: SectionCompletion;
  className?: string;
};

const SECTIONS = [
  { key: "profile" as const, label: "Profile", icon: User },
  { key: "content" as const, label: "Content", icon: FileText },
  { key: "style" as const, label: "Style", icon: Palette },
];

export function CircularProgressWheel({ completion, className }: CircularProgressWheelProps) {
  const completedCount = Object.values(completion).filter(Boolean).length;
  const totalSections = Object.keys(completion).length;
  const percentage = Math.round((completedCount / totalSections) * 100);

  // SVG circle math
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      {/* Circular progress ring */}
      <div className="relative">
        <svg
          viewBox="0 0 100 100"
          className="h-24 w-24 -rotate-90 transform"
        >
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            className="text-muted/20"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="round"
            className="text-primary transition-all duration-500 ease-out"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
          />
        </svg>
      </div>

      {/* Section completion text */}
      <p className="text-sm text-muted-foreground">
        {completedCount} of {totalSections} sections complete
      </p>

      {/* Section indicators */}
      <div className="flex items-center gap-3">
        {SECTIONS.map(({ key, label, icon: Icon }) => {
          const isComplete = completion[key];
          return (
            <div
              key={key}
              className="flex flex-col items-center gap-1.5"
              title={label}
            >
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-300",
                  isComplete
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-muted-foreground/30 bg-background text-muted-foreground"
                )}
              >
                {isComplete ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Icon className="h-3.5 w-3.5" />
                )}
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium transition-colors",
                  isComplete ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Compact inline version for header
export function InlineProgressWheel({ completion }: { completion: SectionCompletion }) {
  const completedCount = Object.values(completion).filter(Boolean).length;
  const totalSections = Object.keys(completion).length;
  const percentage = Math.round((completedCount / totalSections) * 100);

  // SVG circle math (smaller)
  const radius = 14;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex items-center gap-3">
      {/* Small progress ring */}
      <div className="relative">
        <svg viewBox="0 0 36 36" className="h-9 w-9 -rotate-90 transform">
          <circle
            cx="18"
            cy="18"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="text-muted/20"
          />
          <circle
            cx="18"
            cy="18"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            className="text-primary transition-all duration-500 ease-out"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
          />
        </svg>
      </div>

      {/* Step dots */}
      <div className="flex items-center gap-1.5">
        {SECTIONS.map(({ key, label, icon: Icon }) => {
          const isComplete = completion[key];
          return (
            <div
              key={key}
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded-full transition-all duration-300",
                isComplete
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/30 text-muted-foreground"
              )}
              title={label}
            >
              {isComplete ? (
                <Check className="h-3 w-3" />
              ) : (
                <Icon className="h-2.5 w-2.5" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Helper to calculate section completion from wizard state
export function calculateSectionCompletion(state: {
  content: { title: string };
  pages: { selectedServiceIds: string[] };
  faq: Array<{ q: string; a: string }>;
  avatarUrl?: string | null;
}): SectionCompletion {
  return {
    // Profile: photo uploaded + name filled
    profile: !!state.avatarUrl && !!state.content.title,
    // Content: at least 1 service OR 1 FAQ
    content: state.pages.selectedServiceIds.length > 0 || state.faq.length > 0,
    // Style: always complete (has defaults)
    style: true,
  };
}
