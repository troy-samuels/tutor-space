"use client";

import { useEffect, useState, useTransition } from "react";
import { Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  LessonBriefingCard,
  NoBriefingsCard,
  BriefingCardSkeleton,
} from "./lesson-briefing-card";
import { getPendingBriefings } from "@/lib/actions/copilot";
import type { LessonBriefing, PendingBriefingsResult } from "@/lib/actions/types";

// Re-export types for the server component
export type { LessonBriefing, PendingBriefingsResult };

interface CopilotWidgetProps {
  /** Initial data for SSR */
  initialData?: PendingBriefingsResult;
}

export function CopilotWidget({ initialData }: CopilotWidgetProps) {
  const [data, setData] = useState<PendingBriefingsResult | null>(initialData || null);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [isExpanded, setIsExpanded] = useState(true);
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
    setData({
      ...data,
      briefings: data.briefings.filter((b) => b.id !== briefingId),
      count: Math.max(0, data.count - 1),
    });
  };

  // Don't render if no briefings and not loading
  if (!isLoading && (!data || data.briefings.length === 0)) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              AI Copilot
            </h2>
            {data && data.count > 0 && (
              <p className="text-xs text-muted-foreground/70">
                {data.count} briefing{data.count > 1 ? "s" : ""} ready
              </p>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-muted-foreground"
        >
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="space-y-4">
          {isLoading ? (
            <BriefingCardSkeleton />
          ) : data && data.briefings.length > 0 ? (
            data.briefings.map((briefing) => (
              <LessonBriefingCard
                key={briefing.id}
                briefing={briefing}
                onDismiss={() => handleDismiss(briefing.id)}
              />
            ))
          ) : (
            <NoBriefingsCard />
          )}
        </div>
      )}
    </div>
  );
}

// Server component is exported from copilot-widget-server.tsx
