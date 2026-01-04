"use client";

import { Badge } from "@/components/ui/badge";
import { AlertCircle, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type RiskStatus = "healthy" | "at_risk" | "critical" | "churned";

type RiskStatusBadgeProps = {
  status: RiskStatus;
  className?: string;
  showLabel?: boolean;
  size?: "sm" | "default";
};

const statusConfig: Record<
  RiskStatus,
  {
    label: string;
    icon: typeof CheckCircle;
    className: string;
  }
> = {
  healthy: {
    label: "Healthy",
    icon: CheckCircle,
    className: "bg-green-100 text-green-700 border-green-200",
  },
  at_risk: {
    label: "At Risk",
    icon: AlertTriangle,
    className: "bg-yellow-100 text-yellow-700 border-yellow-200",
  },
  critical: {
    label: "Critical",
    icon: AlertCircle,
    className: "bg-orange-100 text-orange-700 border-orange-200",
  },
  churned: {
    label: "Churned",
    icon: XCircle,
    className: "bg-red-100 text-red-700 border-red-200",
  },
};

export function RiskStatusBadge({
  status,
  className,
  showLabel = true,
  size = "default",
}: RiskStatusBadgeProps) {
  const config = statusConfig[status] ?? statusConfig.healthy;
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1 font-medium",
        config.className,
        size === "sm" && "text-xs py-0 px-1.5",
        className
      )}
    >
      <Icon className={cn("h-3 w-3", size === "sm" && "h-2.5 w-2.5")} />
      {showLabel && config.label}
    </Badge>
  );
}

export function getRiskStatusColor(status: RiskStatus): string {
  const colorMap: Record<RiskStatus, string> = {
    healthy: "#22c55e", // green-500
    at_risk: "#eab308", // yellow-500
    critical: "#f97316", // orange-500
    churned: "#ef4444", // red-500
  };
  return colorMap[status] ?? colorMap.healthy;
}
