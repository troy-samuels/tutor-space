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
 * Dark mini-preview inside a light dashboard card (bridge element).
 */
export function QuickPracticeCard({
  streak = 0,
  dailyComplete = false,
  lastLanguage,
}: QuickPracticeCardProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border shadow-sm">
      {/* Dark practice preview strip */}
      <div className="bg-[hsl(40,10%,10%)] px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Streak */}
            <div
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold tabular-nums",
                streak > 0
                  ? "bg-orange-500/20 text-orange-400"
                  : "bg-white/[0.08] text-white/50"
              )}
            >
              <Flame className="h-4 w-4" />
              {streak}
            </div>

            {/* Daily status */}
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-medium",
                dailyComplete
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-white/[0.08] text-white/60"
              )}
            >
              {dailyComplete ? "Daily done ✓" : "Daily drill ready"}
            </span>
          </div>

          {/* XP indicator */}
          <div className="flex items-center gap-1 text-xs font-medium text-primary">
            <Zap className="h-3.5 w-3.5" />
          </div>
        </div>
      </div>

      {/* Light card body */}
      <div className="bg-white px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              {lastLanguage ? `Continue ${lastLanguage}` : "Quick Practice"}
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {dailyComplete
                ? "Great work today! Keep the streak alive."
                : "3 minutes to keep your streak going"}
            </p>
          </div>
          <Link
            href="/practice"
            className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-semibold text-white shadow-sm transition-transform active:scale-95"
          >
            {dailyComplete ? "Practice" : "Start"}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
