"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronRight,
  Puzzle,
  MessageSquare,
  BookA,
  Mic,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DrillWithContext, DrillType } from "@/lib/actions/types";

interface DrillsListClientProps {
  pendingDrills: DrillWithContext[];
  completedDrills: DrillWithContext[];
  counts: {
    pending: number;
    completed: number;
    total: number;
  };
}

const drillTypeConfig: Record<
  DrillType,
  { label: string; icon: typeof BookOpen; color: string }
> = {
  grammar: {
    label: "Grammar",
    icon: BookA,
    color: "text-blue-600 bg-blue-50 border-blue-200",
  },
  vocabulary: {
    label: "Vocabulary",
    icon: MessageSquare,
    color: "text-purple-600 bg-purple-50 border-purple-200",
  },
  pronunciation: {
    label: "Pronunciation",
    icon: Mic,
    color: "text-amber-600 bg-amber-50 border-amber-200",
  },
  fluency: {
    label: "Fluency",
    icon: Puzzle,
    color: "text-emerald-600 bg-emerald-50 border-emerald-200",
  },
};

function DrillCard({ drill }: { drill: DrillWithContext }) {
  const config = drillTypeConfig[drill.drill_type] || drillTypeConfig.grammar;
  const Icon = config.icon;

  const gameType = drill.content?.type;
  const gameLabel =
    gameType === "scramble"
      ? "Word Order"
      : gameType === "match"
        ? "Matching"
        : gameType === "gap-fill"
          ? "Fill in the Blank"
          : "Practice";

  return (
    <Link href={`/student/drills/${drill.id}`}>
      <div className="group relative overflow-hidden rounded-xl border border-border bg-background p-4 shadow-sm transition-all hover:border-primary/30 hover:shadow-md">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border",
              config.color
            )}
          >
            <Icon className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                  config.color
                )}
              >
                {config.label}
              </span>
              <span className="text-xs text-muted-foreground">{gameLabel}</span>
            </div>

            <p className="mt-1 line-clamp-2 text-sm font-medium text-foreground">
              {drill.content?.prompt || drill.focus_area || "Practice exercise"}
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              {drill.tutor_name && <span>From {drill.tutor_name}</span>}
              {drill.lesson_date && (
                <span>
                  Lesson{" "}
                  {new Date(drill.lesson_date).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              )}
              {drill.homework_title && (
                <span className="truncate max-w-[150px]">
                  · {drill.homework_title}
                </span>
              )}
              {drill.due_date && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Due{" "}
                  {new Date(drill.due_date).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              )}
            </div>
          </div>

          <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
        </div>
      </div>
    </Link>
  );
}

function CompletedDrillCard({ drill }: { drill: DrillWithContext }) {
  const config = drillTypeConfig[drill.drill_type] || drillTypeConfig.grammar;
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/50 p-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-emerald-600">
        <CheckCircle2 className="h-4 w-4" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">
            {config.label}
          </span>
        </div>
        <p className="truncate text-sm text-foreground">
          {drill.content?.prompt || drill.focus_area || "Practice exercise"}
        </p>
      </div>

      {drill.completed_at && (
        <span className="shrink-0 text-xs text-muted-foreground">
          {new Date(drill.completed_at).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          })}
        </span>
      )}
    </div>
  );
}

export function DrillsListClient({
  pendingDrills,
  completedDrills,
  counts,
}: DrillsListClientProps) {
  const [showCompleted, setShowCompleted] = useState(false);

  const progressPercent =
    counts.total > 0 ? Math.round((counts.completed / counts.total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Practice Drills</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Interactive exercises based on your lessons
        </p>
      </div>

      {/* Progress Card */}
      <div className="rounded-xl border border-border bg-gradient-to-br from-primary/5 to-background p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Your Progress
            </p>
            <p className="mt-1 text-3xl font-bold">
              {counts.completed}
              <span className="text-lg font-normal text-muted-foreground">
                {" "}
                / {counts.total}
              </span>
            </p>
          </div>
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm">
            <Sparkles className="h-7 w-7 text-primary" />
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Drills completed</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-sky-500 to-blue-500 transition-[width]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Pending Drills */}
      {pendingDrills.length > 0 ? (
        <div className="space-y-3">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <BookOpen className="h-5 w-5 text-primary" />
            Ready to Practice
            <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {counts.pending}
            </span>
          </h2>

          <div className="space-y-3">
            {pendingDrills.map((drill) => (
              <DrillCard key={drill.id} drill={drill} />
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-muted/50 p-8 text-center">
          <Sparkles className="mx-auto h-10 w-10 text-muted-foreground/50" />
          <p className="mt-3 font-medium text-foreground">All caught up!</p>
          <p className="mt-1 text-sm text-muted-foreground">
            No pending drills. New exercises will appear after your lessons.
          </p>
          <Link href="/student/progress">
            <Button variant="outline" className="mt-4">
              View Progress
            </Button>
          </Link>
        </div>
      )}

      {/* Completed Drills */}
      {completedDrills.length > 0 && (
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setShowCompleted(!showCompleted)}
            className="flex w-full items-center gap-2 text-lg font-semibold text-muted-foreground hover:text-foreground"
          >
            <CheckCircle2 className="h-5 w-5" />
            Completed
            <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
              {counts.completed}
            </span>
            <ChevronRight
              className={cn(
                "ml-auto h-5 w-5 transition-transform",
                showCompleted && "rotate-90"
              )}
            />
          </button>

          {showCompleted && (
            <div className="space-y-2">
              {completedDrills.slice(0, 10).map((drill) => (
                <CompletedDrillCard key={drill.id} drill={drill} />
              ))}
              {completedDrills.length > 10 && (
                <p className="text-center text-xs text-muted-foreground">
                  + {completedDrills.length - 10} more completed
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
