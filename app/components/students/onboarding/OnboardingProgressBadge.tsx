"use client";

import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

type OnboardingStatus = "not_started" | "in_progress" | "completed";

type OnboardingProgressBadgeProps = {
  status: OnboardingStatus;
  completedCount?: number;
  totalCount?: number;
  className?: string;
  showProgress?: boolean;
};

export function OnboardingProgressBadge({
  status,
  completedCount = 0,
  totalCount = 0,
  className,
  showProgress = true,
}: OnboardingProgressBadgeProps) {
  const config: Record<
    OnboardingStatus,
    { label: string; icon: typeof Circle; variant: "default" | "secondary" | "outline"; className: string }
  > = {
    not_started: {
      label: "Not Started",
      icon: Circle,
      variant: "outline",
      className: "border-muted-foreground/30 text-muted-foreground",
    },
    in_progress: {
      label: "In Progress",
      icon: Clock,
      variant: "secondary",
      className: "bg-blue-100 text-blue-700 border-blue-200",
    },
    completed: {
      label: "Completed",
      icon: CheckCircle2,
      variant: "default",
      className: "bg-green-100 text-green-700 border-green-200",
    },
  };

  const { label, icon: Icon, className: statusClassName } = config[status];

  const progressText =
    showProgress && totalCount > 0 && status !== "not_started"
      ? ` (${completedCount}/${totalCount})`
      : "";

  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1 font-medium",
        statusClassName,
        className
      )}
    >
      <Icon className="h-3 w-3" />
      {label}
      {progressText}
    </Badge>
  );
}
