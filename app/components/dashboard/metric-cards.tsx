"use client";

import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type MetricCardConfig = {
  label: string;
  value: string | number;
  helperText?: string;
  icon?: LucideIcon;
};

type MetricCardsProps = {
  metrics: MetricCardConfig[];
};

export function MetricCards({ metrics }: MetricCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        return (
          <Card key={metric.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.label}</CardTitle>
              {Icon ? <Icon className="h-4 w-4 text-muted-foreground" /> : null}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">
                {typeof metric.value === "number" ? metric.value.toLocaleString() : metric.value}
              </div>
              {metric.helperText ? (
                <p className="text-xs text-muted-foreground">{metric.helperText}</p>
              ) : null}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

MetricCards.Skeleton = function MetricCardsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="h-28 animate-pulse rounded-xl bg-muted" />
      ))}
    </div>
  );
};
