"use client";

import { cn } from "@/lib/utils";

type EngagementScoreMeterProps = {
  score: number;
  size?: "sm" | "default" | "lg";
  showLabel?: boolean;
  className?: string;
};

export function EngagementScoreMeter({
  score,
  size = "default",
  showLabel = true,
  className,
}: EngagementScoreMeterProps) {
  // Clamp score to 0-100
  const clampedScore = Math.max(0, Math.min(100, score));

  // Determine color based on score
  const getColor = (s: number) => {
    if (s >= 70) return { stroke: "#22c55e", bg: "#dcfce7" }; // green
    if (s >= 40) return { stroke: "#eab308", bg: "#fef9c3" }; // yellow
    if (s >= 20) return { stroke: "#f97316", bg: "#ffedd5" }; // orange
    return { stroke: "#ef4444", bg: "#fee2e2" }; // red
  };

  const colors = getColor(clampedScore);

  // Size configurations
  const sizeConfig = {
    sm: { width: 40, strokeWidth: 4, fontSize: "text-xs" },
    default: { width: 56, strokeWidth: 5, fontSize: "text-sm" },
    lg: { width: 80, strokeWidth: 6, fontSize: "text-lg" },
  };

  const config = sizeConfig[size];
  const radius = (config.width - config.strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference;

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: config.width, height: config.width }}
    >
      <svg
        className="transform -rotate-90"
        width={config.width}
        height={config.width}
      >
        {/* Background circle */}
        <circle
          cx={config.width / 2}
          cy={config.width / 2}
          r={radius}
          fill="none"
          stroke={colors.bg}
          strokeWidth={config.strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={config.width / 2}
          cy={config.width / 2}
          r={radius}
          fill="none"
          stroke={colors.stroke}
          strokeWidth={config.strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-500 ease-out"
        />
      </svg>
      {showLabel && (
        <span
          className={cn(
            "absolute font-semibold",
            config.fontSize
          )}
          style={{ color: colors.stroke }}
        >
          {clampedScore}
        </span>
      )}
    </div>
  );
}
