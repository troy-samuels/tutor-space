"use client";

import { Rocket, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface CountdownBannerProps {
  daysRemaining: number;
  onDismiss?: () => void;
}

export function CountdownBanner({ daysRemaining, onDismiss }: CountdownBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  if (isDismissed || daysRemaining <= 0) {
    return null;
  }

  const progressPercentage = ((30 - daysRemaining) / 30) * 100;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/10 via-primary/5 to-background p-6 shadow-sm">
      {/* Progress Bar Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent">
        <div
          className="h-full bg-gradient-to-r from-primary/10 to-primary/5 transition-all duration-500"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Content */}
      <div className="relative flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Rocket className="h-6 w-6 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-foreground">
                Launch Sprint Active
              </h3>
              <span className="rounded-full bg-primary/20 px-2.5 py-0.5 text-xs font-semibold text-primary">
                {daysRemaining} {daysRemaining === 1 ? "day" : "days"} left
              </span>
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Complete your onboarding checklist below to launch successfully
            </p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={handleDismiss}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Dismiss banner</span>
        </Button>
      </div>
    </div>
  );
}
