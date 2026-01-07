"use client";

import Link from "next/link";
import {
  Sparkles,
  ChevronRight,
  BookA,
  MessageSquare,
  Mic,
  Puzzle,
  Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DrillWithContext, DrillType } from "@/lib/actions/types";

interface DrillProgressCardProps {
  pendingCount: number;
  completedCount: number;
  recentDrills: DrillWithContext[];
}

const drillTypeConfig: Record<
  DrillType,
  { label: string; icon: typeof BookA; color: string }
> = {
  grammar: {
    label: "Grammar",
    icon: BookA,
    color: "text-blue-600 bg-blue-50",
  },
  vocabulary: {
    label: "Vocabulary",
    icon: MessageSquare,
    color: "text-purple-600 bg-purple-50",
  },
  pronunciation: {
    label: "Pronunciation",
    icon: Mic,
    color: "text-amber-600 bg-amber-50",
  },
  fluency: {
    label: "Fluency",
    icon: Puzzle,
    color: "text-emerald-600 bg-emerald-50",
  },
};

export function DrillProgressCard({
  pendingCount,
  completedCount,
  recentDrills,
}: DrillProgressCardProps) {
  const total = pendingCount + completedCount;
  const progressPercent = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  // Don't show card if no drills at all
  if (total === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-border bg-background shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Practice Drills</h3>
            <p className="text-xs text-muted-foreground">
              {pendingCount} pending · {completedCount} completed
            </p>
          </div>
        </div>

        {/* Progress ring */}
        <div className="relative h-12 w-12">
          <svg className="h-12 w-12 -rotate-90" viewBox="0 0 36 36">
            <path
              className="text-muted/30"
              stroke="currentColor"
              strokeWidth="3"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className="text-primary"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
              strokeDasharray={`${progressPercent}, 100`}
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold">
            {progressPercent}%
          </span>
        </div>
      </div>

      {/* Recent drills */}
      {recentDrills.length > 0 && (
        <div className="divide-y divide-border">
          {recentDrills.slice(0, 3).map((drill) => {
            const config = drillTypeConfig[drill.drill_type] || drillTypeConfig.grammar;
            const Icon = config.icon;

            return (
              <Link
                key={drill.id}
                href={`/student/drills/${drill.id}`}
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
              >
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                    config.color
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {drill.content?.prompt || drill.focus_area || "Practice exercise"}
                  </p>
                  <p className="text-xs text-muted-foreground">{config.label}</p>
                </div>

                <Button size="sm" variant="ghost" className="shrink-0 gap-1">
                  <Play className="h-3 w-3" />
                  Start
                </Button>
              </Link>
            );
          })}
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-border px-4 py-3">
        <Link href="/student/drills">
          <Button variant="outline" size="sm" className="w-full gap-1">
            View All Drills
            <ChevronRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
