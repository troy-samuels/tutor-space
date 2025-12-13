"use client";

import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MetricCardPremiumProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  helper?: string;
  trend?: {
    value: number;
    direction: "up" | "down" | "flat";
  };
  iconBgColor?: string;
  className?: string;
}

export function MetricCardPremium({
  icon,
  label,
  value,
  helper,
  trend,
  iconBgColor = "bg-primary/10",
  className,
}: MetricCardPremiumProps) {
  return (
    <Card
      className={cn(
        "flex h-full flex-col rounded-3xl border border-border/70 bg-card/90 shadow-[0_10px_30px_rgba(0,0,0,0.04)] transition-shadow hover:shadow-lg",
        className
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 px-6 pt-6 pb-3">
        <CardTitle className="text-sm font-semibold tracking-tight text-muted-foreground">
          {label}
        </CardTitle>
        <div
          className={cn(
            "rounded-xl border border-primary/15 bg-primary/10 p-2.5 text-primary shadow-[0_6px_18px_rgba(0,0,0,0.06)]",
            iconBgColor
          )}
        >
          {icon}
        </div>
      </CardHeader>
      <CardContent className="mt-0 px-6 pb-6 pt-2">
        <div className="flex items-baseline gap-2">
          <p className="text-3xl font-semibold leading-tight tracking-tight text-foreground">
            {value}
          </p>
          {trend && (
            <span
              className={cn(
                "text-xs font-medium",
                trend.direction === "up" && "text-primary",
                trend.direction === "down" && "text-destructive",
                trend.direction === "flat" && "text-muted-foreground"
              )}
            >
              {trend.direction === "up" && "+"}
              {trend.direction === "down" && "-"}
              {trend.value}%
            </span>
          )}
        </div>
        {helper && (
          <p className="mt-1.5 text-sm text-muted-foreground">{helper}</p>
        )}
      </CardContent>
    </Card>
  );
}
