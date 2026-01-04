"use client";

import { useState, useTransition } from "react";
import { Check, Circle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  toggleOnboardingItem,
  completeStudentOnboarding,
  type OnboardingProgress,
  type OnboardingTemplateItem,
} from "@/lib/actions/student-onboarding";

type OnboardingChecklistProps = {
  studentId: string;
  progress: OnboardingProgress | null;
  readOnly?: boolean;
  onUpdate?: (progress: OnboardingProgress) => void;
};

export function OnboardingChecklist({
  studentId,
  progress,
  readOnly = false,
  onUpdate,
}: OnboardingChecklistProps) {
  const [isPending, startTransition] = useTransition();
  const [pendingItemId, setPendingItemId] = useState<string | null>(null);

  const template = progress?.template;
  const items = (template?.items ?? []) as OnboardingTemplateItem[];
  const completedItems = progress?.completed_items ?? [];
  const completedCount = completedItems.length;
  const totalCount = items.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const isCompleted = progress?.status === "completed";

  const handleToggle = (itemId: string, checked: boolean) => {
    if (readOnly || isPending) return;

    setPendingItemId(itemId);
    startTransition(async () => {
      const result = await toggleOnboardingItem(studentId, itemId, checked);
      if (result.data && onUpdate) {
        onUpdate(result.data);
      }
      setPendingItemId(null);
    });
  };

  const handleMarkComplete = () => {
    if (readOnly || isPending || isCompleted) return;

    startTransition(async () => {
      await completeStudentOnboarding(studentId);
    });
  };

  if (!template || items.length === 0) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-muted-foreground">
          No onboarding checklist configured
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">
            {template.name}
          </CardTitle>
          <span className="text-sm text-muted-foreground">
            {completedCount} of {totalCount} complete
          </span>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </CardHeader>
      <CardContent className="space-y-3">
        {items
          .sort((a, b) => a.order - b.order)
          .map((item) => {
            const isChecked = completedItems.includes(item.id);
            const isItemPending = pendingItemId === item.id;

            return (
              <div
                key={item.id}
                className={cn(
                  "flex items-start gap-3 rounded-lg border p-3 transition-colors",
                  isChecked && "bg-muted/50",
                  !readOnly && !isCompleted && "hover:bg-muted/30"
                )}
              >
                {readOnly || isCompleted ? (
                  <div className="mt-0.5">
                    {isChecked ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Circle className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                ) : (
                  <div className="mt-0.5">
                    {isItemPending ? (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : (
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={(checked) =>
                          handleToggle(item.id, checked === true)
                        }
                        disabled={isPending}
                      />
                    )}
                  </div>
                )}
                <div className="flex-1 space-y-1">
                  <p
                    className={cn(
                      "text-sm font-medium leading-none",
                      isChecked && "text-muted-foreground line-through"
                    )}
                  >
                    {item.label}
                  </p>
                  {item.description && (
                    <p className="text-xs text-muted-foreground">
                      {item.description}
                    </p>
                  )}
                </div>
              </div>
            );
          })}

        {!readOnly && !isCompleted && completedCount < totalCount && (
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-3"
            onClick={handleMarkComplete}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Mark as Complete
          </Button>
        )}

        {isCompleted && (
          <div className="flex items-center justify-center gap-2 text-sm text-green-600 mt-3">
            <Check className="h-4 w-4" />
            <span>Onboarding completed</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
