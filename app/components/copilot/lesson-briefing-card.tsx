"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import { Sparkles, ArrowRight, X, Target, RotateCcw, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { EngagementIndicator } from "./engagement-indicator";
import { dismissBriefing, markBriefingViewed } from "@/lib/actions/copilot";
import type { LessonBriefing } from "@/lib/actions/copilot";

interface LessonBriefingCardProps {
  briefing: LessonBriefing;
  onDismiss?: () => void;
}

export function LessonBriefingCard({ briefing, onDismiss }: LessonBriefingCardProps) {
  const [isPending, startTransition] = useTransition();
  const [isDismissing, setIsDismissing] = useState(false);

  // Get student initials
  const studentName = briefing.student?.fullName || "Student";
  const initials = studentName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Format lesson time
  const scheduledAt = briefing.booking?.scheduledAt
    ? new Date(briefing.booking.scheduledAt)
    : null;
  const lessonTime = scheduledAt
    ? `${format(scheduledAt, "h:mm a")} · ${formatDistanceToNow(scheduledAt, { addSuffix: true })}`
    : "Upcoming lesson";

  // Count focus areas and SR items
  const focusCount = briefing.focusAreas?.length || 0;
  const srItemsDue = briefing.srItemsDue || 0;

  const handleView = () => {
    // Mark as viewed when card is clicked
    if (!briefing.viewedAt) {
      startTransition(async () => {
        try {
          await markBriefingViewed(briefing.id);
        } catch (error) {
          console.error("Failed to mark briefing viewed:", error);
        }
      });
    }
  };

  const handleDismiss = () => {
    setIsDismissing(true);
    startTransition(async () => {
      try {
        await dismissBriefing(briefing.id);
        onDismiss?.();
      } catch (error) {
        console.error("Failed to dismiss briefing:", error);
        setIsDismissing(false);
      }
    });
  };

  if (isDismissing) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-6 sm:rounded-3xl">
      {/* Header with AI icon */}
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary/70">
            AI Copilot
          </p>
          <h3 className="text-sm font-semibold text-foreground">
            Lesson Briefing Ready
          </h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
          onClick={handleDismiss}
          disabled={isPending}
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <X className="h-4 w-4" />
          )}
          <span className="sr-only">Dismiss</span>
        </Button>
      </div>

      {/* Student Info */}
      <div className="flex items-center gap-4 rounded-xl border border-stone-200 bg-stone-50/50 p-4">
        <Avatar className="h-12 w-12 rounded-xl border border-stone-200">
          <AvatarImage src={undefined} alt={studentName} />
          <AvatarFallback className="rounded-xl text-sm font-semibold text-primary">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{studentName}</p>
          <p className="text-xs text-muted-foreground">{lessonTime}</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="rounded-lg bg-stone-50 p-3 text-center">
          <div className="flex items-center justify-center gap-1">
            <Target className="h-3.5 w-3.5 text-amber-600" />
            <p className="text-lg font-semibold text-foreground">{focusCount}</p>
          </div>
          <p className="text-[10px] text-muted-foreground">Focus Areas</p>
        </div>
        <div className="rounded-lg bg-stone-50 p-3 text-center">
          <div className="flex items-center justify-center gap-1">
            <RotateCcw className="h-3.5 w-3.5 text-blue-600" />
            <p className="text-lg font-semibold text-foreground">{srItemsDue}</p>
          </div>
          <p className="text-[10px] text-muted-foreground">Review Items</p>
        </div>
        <div className="rounded-lg bg-stone-50 p-3 text-center">
          <EngagementIndicator trend={briefing.engagementTrend} size="sm" />
        </div>
      </div>

      {/* Top focus area preview (if any) */}
      {briefing.focusAreas && briefing.focusAreas.length > 0 && (
        <div className="mt-4 rounded-lg border border-amber-100 bg-amber-50/50 p-3">
          <p className="text-xs font-medium text-amber-800">
            Top focus: {briefing.focusAreas[0].topic}
          </p>
          <p className="mt-0.5 text-[11px] text-amber-700/80">
            {briefing.focusAreas[0].reason}
          </p>
        </div>
      )}

      {/* Footer Action */}
      <div className="mt-5 flex items-center justify-between border-t border-stone-100 pt-4">
        <Link
          href={`/copilot/briefing/${briefing.bookingId}`}
          onClick={handleView}
          className="group inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          View full briefing
          <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
        </Link>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          disabled={isPending}
          className="text-xs text-muted-foreground"
        >
          Dismiss
        </Button>
      </div>
    </div>
  );
}

/**
 * Empty state when no briefings are available
 */
export function NoBriefingsCard() {
  return (
    <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50/50 p-6 sm:rounded-3xl">
      <div className="flex flex-col items-center justify-center text-center">
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-stone-100">
          <Sparkles className="h-5 w-5 text-stone-400" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">
          No briefings available
        </p>
        <p className="mt-1 text-xs text-muted-foreground/70">
          Briefings are generated 24 hours before lessons
        </p>
      </div>
    </div>
  );
}

/**
 * Loading skeleton for briefing card
 */
export function BriefingCardSkeleton() {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-6 sm:rounded-3xl">
      <div className="mb-5 flex items-center gap-3">
        <div className="h-10 w-10 animate-pulse rounded-xl bg-stone-100" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-16 animate-pulse rounded bg-stone-100" />
          <div className="h-4 w-32 animate-pulse rounded bg-stone-100" />
        </div>
      </div>
      <div className="flex items-center gap-4 rounded-xl border border-stone-200 bg-stone-50/50 p-4">
        <div className="h-12 w-12 animate-pulse rounded-xl bg-stone-200" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-24 animate-pulse rounded bg-stone-200" />
          <div className="h-3 w-32 animate-pulse rounded bg-stone-100" />
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-stone-50" />
        ))}
      </div>
    </div>
  );
}
