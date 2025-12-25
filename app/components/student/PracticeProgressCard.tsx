"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { MessageSquare, Mic, BookOpen, Target } from "lucide-react";
import { cn } from "@/lib/utils";

interface TopicProgress {
  topic: string;
  sessions: number;
  maxSessions: number;
}

interface FocusArea {
  category: string;
  description: string;
}

interface PracticeProgressCardProps {
  totalSessions: number;
  topics: TopicProgress[];
  focusAreas: FocusArea[];
  percentTextUsed: number;
  percentAudioUsed: number;
  className?: string;
}

function getProgressColor(percent: number): string {
  if (percent < 70) return "bg-emerald-500";
  if (percent < 90) return "bg-amber-500";
  return "bg-red-500";
}

export function PracticeProgressCard({
  totalSessions,
  topics,
  focusAreas,
  percentTextUsed,
  percentAudioUsed,
  className,
}: PracticeProgressCardProps) {
  // Calculate remaining (for depletion display)
  const textRemaining = Math.max(0, 100 - percentTextUsed);
  const audioRemaining = Math.max(0, 100 - percentAudioUsed);

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Target className="h-4 w-4" />
          This Month
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {totalSessions} session{totalSessions !== 1 ? "s" : ""}
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Topics practiced */}
        {topics.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Topics practiced
            </p>
            <div className="space-y-2">
              {topics.slice(0, 3).map((topic, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-sm text-foreground truncate flex-1">
                    {topic.topic}
                  </span>
                  <Progress
                    value={(topic.sessions / topic.maxSessions) * 100}
                    className="h-1.5 w-16"
                    indicatorClassName="bg-primary"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Focus areas */}
        {focusAreas.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Focus areas
            </p>
            <ul className="space-y-1">
              {focusAreas.slice(0, 3).map((area, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <BookOpen className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span>{area.description}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Usage bars */}
        <div className="flex items-center gap-4 pt-2 border-t border-border">
          <div className="flex items-center gap-2 flex-1">
            <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
            <Progress
              value={textRemaining}
              className="h-1.5 flex-1"
              indicatorClassName={getProgressColor(percentTextUsed)}
            />
          </div>
          <div className="flex items-center gap-2 flex-1">
            <Mic className="h-3.5 w-3.5 text-muted-foreground" />
            <Progress
              value={audioRemaining}
              className="h-1.5 flex-1"
              indicatorClassName={getProgressColor(percentAudioUsed)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
