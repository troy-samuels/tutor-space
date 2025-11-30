"use client";

import { useEffect, useMemo, useState } from "react";
import { Rocket, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

function useCountdown(deadlineIso: string) {
  const deadlineMs = useMemo(() => new Date(deadlineIso).getTime(), [deadlineIso]);
  const [remainingMs, setRemainingMs] = useState(() => Math.max(deadlineMs - Date.now(), 0));

  useEffect(() => {
    const update = () => setRemainingMs(Math.max(deadlineMs - Date.now(), 0));
    update();
    const interval = setInterval(update, 60 * 1000);
    return () => clearInterval(interval);
  }, [deadlineMs]);

  const totalMinutes = Math.max(0, Math.floor(remainingMs / 60000));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  return { remainingMs, days, hours, minutes };
}

interface CountdownBannerProps {
  deadline: string;
  startedAt?: string;
  onDismiss?: () => void;
}

export function CountdownBanner({ deadline, startedAt, onDismiss }: CountdownBannerProps) {
  const { remainingMs, days, hours, minutes } = useCountdown(deadline);
  const [isDismissed, setIsDismissed] = useState(false);

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  if (isDismissed || remainingMs <= 0) {
    return null;
  }

  const windowMs = startedAt ? new Date(deadline).getTime() - new Date(startedAt).getTime() : WINDOW_MS;
  const elapsedMs = Math.max(0, windowMs - remainingMs);
  const progressPercentage = windowMs > 0 ? Math.min(100, (elapsedMs / windowMs) * 100) : 0;
  const tickerLabel = `${days}d · ${hours}h · ${minutes}m`;

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
                {tickerLabel}
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

export function CountdownTicker({ deadline }: { deadline: string }) {
  const { remainingMs, days, hours, minutes } = useCountdown(deadline);

  if (remainingMs <= 0) {
    return <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Sprint complete</span>;
  }

  return (
    <span className="text-sm font-semibold text-primary">
      {days}d · {hours}h · {minutes}m
    </span>
  );
}
