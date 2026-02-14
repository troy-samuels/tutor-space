"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { X, Loader2, ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getEngagementLabel } from "./engagement-indicator";
import { dismissBriefing, markBriefingViewed } from "@/lib/actions/copilot";
import type { LessonBriefing } from "@/lib/actions/types";

interface LessonBriefingCardProps {
  briefing: LessonBriefing;
  onDismiss?: () => void;
  isDemo?: boolean;
}

export function LessonBriefingCard({ briefing, onDismiss, isDemo = false }: LessonBriefingCardProps) {
  const [isPending, startTransition] = useTransition();
  const [isDismissing, setIsDismissing] = useState(false);

  const studentName = briefing.student?.fullName || "Student";
  const initials = studentName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const scheduledAt = briefing.booking?.scheduledAt
    ? new Date(briefing.booking.scheduledAt)
    : null;

  const lessonTime = scheduledAt
    ? format(scheduledAt, "h:mm a")
    : "Upcoming";

  const duration = briefing.booking?.service?.durationMinutes
    ? `${briefing.booking.service.durationMinutes} min`
    : "";

  const focusCount = briefing.focusAreas?.length || 0;
  const srItemsDue = briefing.srItemsDue || 0;
  const engagementLabel = getEngagementLabel(briefing.engagementTrend);
  const topFocus = briefing.focusAreas?.[0];

  const handleView = () => {
    if (isDemo) return;
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
    if (isDemo) {
      onDismiss?.();
      return;
    }
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
    <div className="rounded-2xl bg-card p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-shadow hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
      {/* Header: Avatar + Name + Dismiss */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 rounded-xl">
            <AvatarImage src={undefined} alt={studentName} />
            <AvatarFallback className="rounded-xl bg-muted text-sm font-semibold text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-semibold text-foreground">{studentName}</p>
              {isDemo && (
                <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                  Demo
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {lessonTime}{duration && ` · ${duration}`}
            </p>
          </div>
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

      {/* Inline Stats */}
      <p className="mt-3 text-sm text-muted-foreground">
        {focusCount} focus area{focusCount !== 1 ? "s" : ""} · {srItemsDue} to review · {engagementLabel}
      </p>

      {/* Focus Area (simple, no card) */}
      {topFocus && (
        <div className="mt-4 border-t border-border/50 pt-4">
          <p className="text-sm font-medium text-foreground">{topFocus.topic}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">{topFocus.reason}</p>
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between">
        {isDemo ? (
          <span className="text-xs text-muted-foreground">Using sample data</span>
        ) : (
          <div />
        )}
        <Link
          href={isDemo ? "#" : `/copilot/briefing/${briefing.bookingId}`}
          onClick={handleView}
          className="group inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          View full briefing
          <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
}

/**
 * Empty state when no briefings are available
 */
export function NoBriefingsCard() {
  return (
    <div className="rounded-2xl border border-dashed border-border/50 bg-muted/30 p-5">
      <p className="text-sm text-muted-foreground">
        No briefings available yet. Briefings are generated 24 hours before lessons.
      </p>
    </div>
  );
}

/**
 * Loading skeleton for briefing card
 */
export function BriefingCardSkeleton() {
  return (
    <div className="rounded-2xl bg-card p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 animate-pulse rounded-xl bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-28 animate-pulse rounded bg-muted" />
          <div className="h-3 w-20 animate-pulse rounded bg-muted" />
        </div>
      </div>
      <div className="mt-3 h-3 w-48 animate-pulse rounded bg-muted" />
      <div className="mt-4 border-t border-border/50 pt-4">
        <div className="h-4 w-32 animate-pulse rounded bg-muted" />
        <div className="mt-1 h-3 w-44 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}
