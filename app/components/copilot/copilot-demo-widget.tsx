"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LessonBriefingCard } from "./lesson-briefing-card";
import { DEMO_BRIEFING } from "./demo-briefing-data";

interface CopilotDemoWidgetProps {
  hasStudioAccess: boolean;
}

/**
 * Demo widget showing AI Copilot capabilities with sample data.
 * Simplified design with click-anywhere expansion.
 */
export function CopilotDemoWidget({ hasStudioAccess }: CopilotDemoWidgetProps) {
  const [showDemo, setShowDemo] = useState(false);

  // Get demo data for preview
  const studentName = DEMO_BRIEFING.student?.fullName || "Student";
  const scheduledAt = DEMO_BRIEFING.booking?.scheduledAt
    ? new Date(DEMO_BRIEFING.booking.scheduledAt)
    : null;
  const lessonTime = scheduledAt ? format(scheduledAt, "h:mm a") : "";

  return (
    <div className="space-y-3">
      {/* Collapsed Preview - Click anywhere to expand */}
      {!showDemo && (
        <button
          onClick={() => setShowDemo(true)}
          className="group flex w-full items-center gap-3 rounded-2xl bg-card p-4 text-left shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-foreground">
                Preview lesson briefings
              </p>
              {!hasStudioAccess && (
                <Badge variant="outline" className="px-1.5 py-0 text-[10px] border-purple-200 text-purple-600">
                  Studio
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              See what AI-generated briefings look like
            </p>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </button>
      )}

      {/* Expanded Demo */}
      {showDemo && (
        <div className="space-y-3">
          {/* Demo Briefing Card (badge built into card) */}
          <LessonBriefingCard
            briefing={DEMO_BRIEFING}
            onDismiss={() => setShowDemo(false)}
            isDemo={true}
          />

          {/* Upgrade CTA for non-Studio users */}
          {!hasStudioAccess && (
            <div className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-3">
              <p className="text-sm text-muted-foreground">
                Unlock AI briefings with <span className="font-medium text-foreground">Studio</span>
              </p>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0"
                asChild
              >
                <Link href="/settings/billing?upgrade=studio">
                  Upgrade
                </Link>
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
