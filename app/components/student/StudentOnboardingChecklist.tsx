"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, Sparkles, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OnboardingProgress } from "@/lib/actions/types";

type StudentOnboardingChecklistProps = {
  progress: OnboardingProgress | null;
  className?: string;
};

export function StudentOnboardingChecklist({
  progress,
  className,
}: StudentOnboardingChecklistProps) {
  if (!progress) {
    return null;
  }

  const items = (progress.template?.items as Array<{ id: string; label: string; description?: string }>) ?? [];
  const completedIds = new Set(progress.completed_items ?? []);
  const completedCount = completedIds.size;
  const totalCount = items.length;
  const percentComplete = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const isCompleted = progress.status === "completed";

  if (isCompleted) {
    return (
      <Card className={cn("border-green-200 bg-green-50/50", className)}>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-green-100 p-2">
              <Sparkles className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-medium text-green-800">Onboarding Complete!</h3>
              <p className="text-sm text-green-600">You're all set for your learning journey.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("border-primary/20 bg-primary/5", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-primary" />
          <CardTitle className="text-base font-medium">Getting Started</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Your progress</span>
            <span className="font-medium">{completedCount}/{totalCount} complete</span>
          </div>
          <Progress value={percentComplete} className="h-2" />
        </div>

        {/* Checklist Items */}
        <div className="space-y-2">
          {items.map((item) => {
            const isItemCompleted = completedIds.has(item.id);
            return (
              <div
                key={item.id}
                className={cn(
                  "flex items-start gap-3 rounded-lg p-3 transition-colors",
                  isItemCompleted ? "bg-green-50" : "bg-white"
                )}
              >
                {isItemCompleted ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                )}
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "text-sm font-medium",
                      isItemCompleted && "text-green-800"
                    )}
                  >
                    {item.label}
                  </p>
                  {item.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.description}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Your tutor will guide you through these steps
        </p>
      </CardContent>
    </Card>
  );
}
