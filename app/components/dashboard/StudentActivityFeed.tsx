"use client";

import { Flame, TrendingUp, BookOpen, Clock } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type StudentActivity = {
  id: string;
  studentName: string;
  studentInitials: string;
  type: "practice_complete" | "streak_milestone" | "assignment_complete";
  language: string;
  score?: number;
  streak?: number;
  timeAgo: string;
};

type StudentActivityFeedProps = {
  /** Recent student practice activities. Empty = show placeholder. */
  activities?: StudentActivity[];
};

// ---------------------------------------------------------------------------
// Activity Item
// ---------------------------------------------------------------------------

function ActivityItem({ activity }: { activity: StudentActivity }) {
  const iconMap = {
    practice_complete: BookOpen,
    streak_milestone: Flame,
    assignment_complete: TrendingUp,
  };
  const Icon = iconMap[activity.type];

  const messageMap = {
    practice_complete: `completed a ${activity.language} practice session`,
    streak_milestone: `hit a ${activity.streak}-day streak in ${activity.language}`,
    assignment_complete: `finished their ${activity.language} assignment`,
  };

  return (
    <div className="flex items-start gap-3 py-3">
      {/* Student avatar */}
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
        {activity.studentInitials}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground">
          <span className="font-semibold">{activity.studentName}</span>{" "}
          <span className="text-muted-foreground">{messageMap[activity.type]}</span>
        </p>
        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {activity.timeAgo}
          </span>
          {activity.score !== undefined && (
            <span
              className={cn(
                "font-semibold",
                activity.score >= 80
                  ? "text-emerald-600"
                  : activity.score >= 60
                    ? "text-amber-600"
                    : "text-primary"
              )}
            >
              {activity.score}/100
            </span>
          )}
        </div>
      </div>

      {/* Type icon */}
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
          activity.type === "streak_milestone"
            ? "bg-orange-100 text-orange-600"
            : activity.type === "practice_complete"
              ? "bg-blue-100 text-blue-600"
              : "bg-emerald-100 text-emerald-600"
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Feed Component
// ---------------------------------------------------------------------------

/**
 * Student Activity Feed for the tutor dashboard.
 * Shows recent practice completions, scores, and streaks.
 */
export function StudentActivityFeed({ activities = [] }: StudentActivityFeedProps) {
  if (activities.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="h-5 w-5 text-primary" />
          <h2 className="text-base font-semibold text-foreground">Student Activity</h2>
        </div>
        <div className="py-6 text-center">
          <p className="text-sm text-muted-foreground">
            Practice activity from your students will appear here.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Assign practice exercises to get started.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <h2 className="text-base font-semibold text-foreground">Student Activity</h2>
        </div>
        <Link
          href="/students"
          className="text-xs font-medium text-primary hover:underline"
        >
          View all
        </Link>
      </div>

      <div className="divide-y divide-border">
        {activities.slice(0, 5).map((activity) => (
          <ActivityItem key={activity.id} activity={activity} />
        ))}
      </div>
    </div>
  );
}
