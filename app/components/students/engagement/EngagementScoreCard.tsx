"use client";

import { useTransition } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Calendar,
  MessageSquare,
  BookOpen,
  Mic,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { EngagementScoreMeter } from "./EngagementScoreMeter";
import { refreshEngagementScore } from "@/lib/actions/student-engagement";
import type { EngagementScore } from "@/lib/actions/types";

type EngagementScoreCardProps = {
  studentId: string;
  score: EngagementScore | null;
  onUpdate?: (score: EngagementScore) => void;
};

export function EngagementScoreCard({
  studentId,
  score,
  onUpdate,
}: EngagementScoreCardProps) {
  const [isPending, startTransition] = useTransition();

  const handleRefresh = () => {
    startTransition(async () => {
      const result = await refreshEngagementScore(studentId);
      if (result && onUpdate) {
        onUpdate(result);
      }
    });
  };

  const currentScore = score?.score ?? 100;

  const componentScores = [
    {
      label: "Lesson Frequency",
      value: score?.lesson_frequency_score ?? 100,
      icon: Calendar,
      detail: score?.days_since_last_lesson
        ? `${score.days_since_last_lesson} days ago`
        : "No lessons yet",
    },
    {
      label: "Response Rate",
      value: score?.response_rate_score ?? 100,
      icon: MessageSquare,
      detail: score?.days_since_last_message
        ? `${score.days_since_last_message} days ago`
        : "No messages yet",
    },
    {
      label: "Homework",
      value: score?.homework_completion_score ?? 100,
      icon: BookOpen,
      detail: "Completion rate",
    },
    {
      label: "Practice",
      value: score?.practice_engagement_score ?? 100,
      icon: Mic,
      detail: "Last 30 days",
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">Engagement Score</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleRefresh}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main score display */}
        <div className="flex items-center gap-4">
          <EngagementScoreMeter score={currentScore} size="lg" />
          <div className="flex-1 space-y-2">
            <p className="text-sm font-medium text-foreground">Engagement health</p>
            <p className="text-xs text-muted-foreground">
              Based on lesson frequency, response rate, homework, and practice activity.
            </p>
          </div>
        </div>

        {/* Component breakdown */}
        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Score Breakdown
          </p>
          {componentScores.map((component) => {
            const Icon = component.icon;
            return (
              <div key={component.label} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span>{component.label}</span>
                  </div>
                  <span className="font-medium">{component.value}%</span>
                </div>
                <Progress value={component.value} className="h-1.5" />
                <p className="text-xs text-muted-foreground">{component.detail}</p>
              </div>
            );
          })}
        </div>

      </CardContent>
    </Card>
  );
}
