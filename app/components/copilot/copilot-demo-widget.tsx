"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, Play, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LessonBriefingCard } from "./lesson-briefing-card";
import { DEMO_BRIEFING } from "./demo-briefing-data";

interface CopilotDemoWidgetProps {
  hasStudioAccess: boolean;
}

/**
 * Demo widget showing AI Copilot capabilities with sample data
 * Used when no real briefings exist or for non-Studio users to preview
 */
export function CopilotDemoWidget({ hasStudioAccess }: CopilotDemoWidgetProps) {
  const [showDemo, setShowDemo] = useState(false);

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
            <p className="text-xs text-muted-foreground/70">
              {hasStudioAccess ? "No briefings available" : "Studio feature"}
            </p>
          </div>
        </div>
        {!hasStudioAccess && (
          <Badge
            variant="outline"
            className="border-purple-200 bg-purple-50 text-purple-700"
          >
            Studio
          </Badge>
        )}
      </div>

      {/* Demo Preview Card or Expanded Demo */}
      {!showDemo ? (
        <div className="rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-6 sm:rounded-3xl">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Play className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">
              Preview AI Lesson Briefings
            </h3>
            <p className="mt-1 max-w-sm text-xs text-muted-foreground">
              {hasStudioAccess
                ? "See what AI-generated briefings look like. Briefings are created 24 hours before scheduled lessons."
                : "AI Copilot analyzes student data to generate personalized lesson briefings before each class."}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4 gap-2"
              onClick={() => setShowDemo(true)}
            >
              <Sparkles className="h-3.5 w-3.5" />
              View Demo Briefing
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Demo Banner */}
          <div className="flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2">
            <div className="flex items-center gap-2">
              <Badge className="border-0 bg-amber-100 text-[10px] text-amber-700">
                DEMO
              </Badge>
              <span className="text-xs text-amber-700">
                Sample data showing AI Copilot capabilities
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-amber-600 hover:bg-amber-100"
              onClick={() => setShowDemo(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Demo Briefing Card */}
          <LessonBriefingCard
            briefing={DEMO_BRIEFING}
            onDismiss={() => setShowDemo(false)}
            isDemo={true}
          />

          {/* Upgrade CTA for non-Studio users */}
          {!hasStudioAccess && (
            <div className="rounded-xl border border-purple-200 bg-purple-50 p-4 text-center">
              <p className="text-sm text-purple-800">
                Upgrade to{" "}
                <span className="font-semibold">Studio</span> to unlock
                AI-powered lesson briefings
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2 border-purple-300 text-purple-700 hover:bg-purple-100"
                asChild
              >
                <Link href="/settings/billing?upgrade=studio">
                  <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                  Unlock Studio Features
                </Link>
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
