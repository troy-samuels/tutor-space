"use client";

import { useEffect, useState, useTransition } from "react";
import { Sparkles, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import {
  LessonBriefingCard,
  BriefingCardSkeleton,
} from "./lesson-briefing-card";
import { getPendingBriefings } from "@/lib/actions/copilot";
import type { LessonBriefing, PendingBriefingsResult } from "@/lib/actions/types";

export type { LessonBriefing, PendingBriefingsResult };

interface CopilotWidgetProps {
  initialData?: PendingBriefingsResult;
}

export function CopilotWidget({ initialData }: CopilotWidgetProps) {
  const [data, setData] = useState<PendingBriefingsResult | null>(initialData || null);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [isExpanded, setIsExpanded] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (!initialData) {
      loadBriefings();
    }
  }, [initialData]);

  const loadBriefings = () => {
    setIsLoading(true);
    startTransition(async () => {
      try {
        const result = await getPendingBriefings();
        setData(result);
      } catch (error) {
        console.error("Failed to load briefings:", error);
        setData({ briefings: [], count: 0 });
      } finally {
        setIsLoading(false);
      }
    });
  };

  const handleDismiss = (briefingId: string) => {
    if (!data) return;
    const updatedBriefings = data.briefings.filter((b) => b.id !== briefingId);
    setData({
      ...data,
      briefings: updatedBriefings,
      count: Math.max(0, data.count - 1),
    });
    // Collapse if no more briefings
    if (updatedBriefings.length === 0) {
      setIsExpanded(false);
    }
  };

  // Don't render if no briefings and not loading
  if (!isLoading && (!data || data.briefings.length === 0)) {
    return null;
  }

  // Get the next briefing for collapsed preview
  const nextBriefing = data?.briefings[0];
  const studentName = nextBriefing?.student?.fullName || "Student";
  const scheduledAt = nextBriefing?.booking?.scheduledAt
    ? new Date(nextBriefing.booking.scheduledAt)
    : null;
  const lessonTime = scheduledAt ? format(scheduledAt, "h:mm a") : "";

  return (
    <div className="space-y-3">
      {/* Collapsed State - Click anywhere to expand */}
      {!isExpanded && !isLoading && (
        <button
          onClick={() => setIsExpanded(true)}
          className="group flex w-full items-center gap-3 rounded-2xl bg-card p-4 text-left shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">
              Lesson briefing ready
            </p>
            <p className="text-sm text-muted-foreground">
              {studentName}{lessonTime && ` · ${lessonTime}`}
            </p>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </button>
      )}

      {/* Loading State */}
      {isLoading && <BriefingCardSkeleton />}

      {/* Expanded State - Show briefing card */}
      {isExpanded && !isLoading && data && data.briefings.length > 0 && (
        <LessonBriefingCard
          briefing={data.briefings[0]}
          onDismiss={() => handleDismiss(data.briefings[0].id)}
        />
      )}
    </div>
  );
}
