"use client";

import {
  CalendarCheck,
  CreditCard,
  UserPlus,
  Repeat,
  Package,
  Activity,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RecentActivityItem } from "@/lib/types/analytics-premium";

interface RecentActivityListProps {
  data: RecentActivityItem[];
  isLoading?: boolean;
}

const activityConfig = {
  booking: CalendarCheck,
  payment: CreditCard,
  student: UserPlus,
  subscription: Repeat,
  package: Package,
};

export function RecentActivityList({
  data,
  isLoading,
}: RecentActivityListProps) {
  if (isLoading) {
    return (
      <Card className="min-h-[120px] rounded-[24px] border border-border/50 bg-white/70 shadow-[0_10px_30px_rgba(0,0,0,0.04)] backdrop-blur">
        <CardHeader className="px-5 pt-5 pb-3">
          <div className="h-3 w-28 animate-pulse rounded bg-muted/40" />
        </CardHeader>
        <CardContent className="mt-0 px-5 pb-5">
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-9 w-9 animate-pulse rounded-full bg-muted/40" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-24 animate-pulse rounded bg-muted/40" />
                  <div className="h-2.5 w-32 animate-pulse rounded bg-muted/30" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (data.length === 0) {
    return (
      <Card className="min-h-[120px] rounded-2xl border border-stone-100 bg-white shadow-sm sm:rounded-3xl">
        <CardHeader className="px-5 pt-5 pb-3">
          <CardTitle className="text-sm font-semibold tracking-tight text-muted-foreground">
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="mt-0 flex flex-col items-center gap-3 px-5 pb-6 text-center">
          <div className="rounded-full bg-stone-100 p-3">
            <Activity className="h-4 w-4 text-stone-200" />
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            All caught up
          </p>
        </CardContent>
      </Card>
    );
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    }
    if (diffHours < 24) {
      return `${diffHours}h ago`;
    }
    if (diffDays < 7) {
      return `${diffDays}d ago`;
    }
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <Card className="min-h-[120px] rounded-2xl border border-stone-200 bg-white sm:rounded-3xl">
      <CardHeader className="px-5 pt-5 pb-3">
        <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="mt-0 px-5 pb-5">
        <div className="max-h-[280px] space-y-2 overflow-y-auto pr-1">
          {data.map((item) => {
            const Icon = activityConfig[item.type] ?? Activity;

            return (
              <div
                key={item.id}
                className="flex items-center gap-4 rounded-xl px-4 py-4 transition-colors hover:bg-stone-50"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-stone-200 bg-stone-50 text-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {item.title}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {item.subtitle}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  {item.amount !== undefined && (
                    <p className="text-sm font-medium text-primary">
                      +{formatAmount(item.amount, item.currency ?? "usd")}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {formatTime(item.timestamp)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
