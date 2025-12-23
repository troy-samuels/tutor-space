"use client";

import { TrendingUp, TrendingDown, Minus, User } from "lucide-react";
import { cn } from "@/lib/utils";

export type EngagementTrend = "improving" | "stable" | "declining" | "new_student";

interface EngagementIndicatorProps {
  trend: EngagementTrend;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

const trendConfig: Record<
  EngagementTrend,
  {
    icon: typeof TrendingUp;
    color: string;
    bg: string;
    label: string;
    description: string;
  }
> = {
  improving: {
    icon: TrendingUp,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    label: "Improving",
    description: "Engagement has improved in recent lessons",
  },
  stable: {
    icon: Minus,
    color: "text-blue-600",
    bg: "bg-blue-50",
    label: "Stable",
    description: "Consistent engagement across lessons",
  },
  declining: {
    icon: TrendingDown,
    color: "text-amber-600",
    bg: "bg-amber-50",
    label: "Watch",
    description: "Engagement may need attention",
  },
  new_student: {
    icon: User,
    color: "text-primary",
    bg: "bg-primary/10",
    label: "New",
    description: "New student - building engagement baseline",
  },
};

const sizeClasses = {
  sm: {
    container: "gap-1",
    icon: "h-3 w-3",
    label: "text-[10px]",
  },
  md: {
    container: "gap-1.5",
    icon: "h-4 w-4",
    label: "text-xs",
  },
  lg: {
    container: "gap-2",
    icon: "h-5 w-5",
    label: "text-sm",
  },
};

export function EngagementIndicator({
  trend,
  size = "sm",
  showLabel = true,
  className,
}: EngagementIndicatorProps) {
  const config = trendConfig[trend];
  const sizes = sizeClasses[size];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "inline-flex flex-col items-center justify-center",
        sizes.container,
        className
      )}
      title={config.description}
    >
      <div
        className={cn(
          "flex items-center justify-center rounded-full p-1.5",
          config.bg,
          config.color
        )}
      >
        <Icon className={sizes.icon} />
      </div>
      {showLabel && (
        <span className={cn("font-medium", config.color, sizes.label)}>
          {config.label}
        </span>
      )}
    </div>
  );
}

/**
 * Compact inline version for use in lists/tables
 */
interface EngagementBadgeProps {
  trend: EngagementTrend;
  className?: string;
}

export function EngagementBadge({ trend, className }: EngagementBadgeProps) {
  const config = trendConfig[trend];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5",
        config.bg,
        className
      )}
      title={config.description}
    >
      <Icon className={cn("h-3 w-3", config.color)} />
      <span className={cn("text-[10px] font-medium", config.color)}>
        {config.label}
      </span>
    </span>
  );
}
