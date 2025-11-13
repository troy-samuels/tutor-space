"use client";

import {
  Users,
  TrendingUp,
  Wallet,
  CalendarDays,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ICON_MAP: Record<string, LucideIcon> = {
  "users": Users,
  "trending-up": TrendingUp,
  "wallet": Wallet,
  "calendar-days": CalendarDays,
};

export type MetricCardConfig = {
  label: string;
  value: string | number;
  helperText?: string;
  iconName?: keyof typeof ICON_MAP | string;
};

type MetricCardsProps = {
  metrics: MetricCardConfig[];
};

function resolveIcon(iconName?: string): LucideIcon | null {
  if (!iconName) return null;
  return ICON_MAP[iconName] ?? null;
}

export function MetricCards({ metrics }: MetricCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => {
        const Icon = resolveIcon(metric.iconName);
        return (
          <Card key={metric.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
              <CardTitle className="text-sm font-medium">{metric.label}</CardTitle>
              {Icon ? <Icon className="h-4 w-4 shrink-0 text-muted-foreground" /> : null}
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-0">
              <div className="text-2xl font-semibold">
                {typeof metric.value === "number" ? metric.value.toLocaleString() : metric.value}
              </div>
              {metric.helperText ? (
                <p className="mt-1 text-xs text-muted-foreground">{metric.helperText}</p>
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
