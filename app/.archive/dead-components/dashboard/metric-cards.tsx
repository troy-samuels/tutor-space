"use client";

import {
  Users,
  TrendingUp,
  Wallet,
  CalendarDays,
  Clock,
  Calendar,
  MessageSquare,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

const ICON_MAP: Record<string, LucideIcon> = {
  "users": Users,
  "trending-up": TrendingUp,
  "wallet": Wallet,
  "calendar-days": CalendarDays,
  "clock": Clock,
  "calendar": Calendar,
  "message-square": MessageSquare,
  "settings": Settings,
};

export type MetricCardConfig = {
  label: string;
  value: string | number;
  helperText?: string;
  iconName?: keyof typeof ICON_MAP | string;
  action?: {
    href: string;
    icon?: keyof typeof ICON_MAP | string;
    tooltip?: string;
    fullCard?: boolean;
  };
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
        const ActionIcon = metric.action?.icon ? resolveIcon(metric.action.icon) : null;

        const cardContent = (
          <div className="flex flex-col h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
              <CardTitle className="text-sm font-medium">{metric.label}</CardTitle>
              <div className="flex items-center gap-2">
                {Icon ? (
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="h-4 w-4 shrink-0 text-primary" />
                  </div>
                ) : null}
                {metric.action && !metric.action.fullCard && ActionIcon && (
                  <Link
                    href={metric.action.href}
                    title={metric.action.tooltip}
                    className="rounded-md p-1 hover:bg-muted transition-colors"
                  >
                    <ActionIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </Link>
                )}
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-0">
              <div className="text-2xl font-semibold">
                {typeof metric.value === "number" ? metric.value.toLocaleString() : metric.value}
              </div>
              {metric.helperText ? (
                <p className="mt-1 text-xs text-muted-foreground">{metric.helperText}</p>
              ) : null}
            </CardContent>
          </div>
        );

        if (metric.action?.fullCard) {
          return (
            <Link key={metric.label} href={metric.action.href} className="block">
              <Card className="h-full border-border shadow-[var(--shadow-soft)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-hover)] cursor-pointer">
                {cardContent}
              </Card>
            </Link>
          );
        }

        return (
          <Card key={metric.label} className="border-border shadow-[var(--shadow-soft)]">
            {cardContent}
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
