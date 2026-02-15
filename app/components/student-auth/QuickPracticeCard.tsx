"use client";

import Link from "next/link";
import { Flame, ArrowRight, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

type QuickPracticeCardProps = {
  /** Current streak count. 0 = no streak. */
  streak?: number;
  /** Whether today's daily drill is complete. */
  dailyComplete?: boolean;
  /** Last practised language name. */
  lastLanguage?: string;
};

/**
 * Quick Practice card for the student dashboard.
 * Shows streak, daily drill status, and a CTA to continue practising.
 */
export function QuickPracticeCard({
  streak = 0,
  dailyComplete = false,
  lastLanguage,
}: QuickPracticeCardProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-stone-100 bg-white shadow-sm">
      <div className="px-5 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Streak badge */}
            <div
              className={cn(
                "flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-bold tabular-nums",
                streak > 0
                  ? "bg-orange-50 text-orange-600"
                  : "bg-stone-50 text-stone-400"
              )}
            >
              <Flame className="h-4 w-4" />
              {streak}
            </div>

            <div>
              <h3 className="text-base font-semibold text-foreground">
                {lastLanguage ? `Continue ${lastLanguage}` : "Quick Practice"}
              </h3>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {dailyComplete
                  ? "Great work today! Keep the streak alive."
                  : "3 minutes to keep your streak going"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Daily status */}
            <span
              className={cn(
                "hidden sm:inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
                dailyComplete
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-amber-50 text-amber-600"
              )}
            >
              {dailyComplete ? "Daily done ✓" : "Daily drill ready"}
            </span>

            <Link
              href="/practice"
              className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-primary px-5 text-sm font-semibold text-white shadow-sm transition-transform active:scale-95 hover:bg-primary/90"
            >
              {dailyComplete ? "Practice" : "Start"}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
