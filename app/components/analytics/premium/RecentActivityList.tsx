"use client";

import Link from "next/link";
import {
  CalendarCheck,
  CreditCard,
  UserPlus,
  Repeat,
  Package,
  Activity,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RecentActivityItem } from "@/lib/types/analytics-premium";

interface RecentActivityListProps {
  data: RecentActivityItem[];
  isLoading?: boolean;
  limit?: number;
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
  limit = 5,
}: RecentActivityListProps) {
  if (isLoading) {
    return (
      <Card className="rounded-[24px] border border-border/50 bg-white/80 shadow-[0_10px_30px_rgba(0,0,0,0.04)] backdrop-blur">
        <CardHeader className="px-5 pt-5 pb-3">
          <div className="h-3 w-28 animate-pulse rounded bg-muted/40" />
        </CardHeader>
        <CardContent className="mt-0 px-5 pb-5">
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 py-2">
                <div className="h-8 w-8 animate-pulse rounded-lg bg-muted/40" />
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
      <Card className="rounded-[24px] border border-border/50 bg-white/80 shadow-[0_10px_30px_rgba(0,0,0,0.04)] backdrop-blur">
        <CardHeader className="px-5 pt-5 pb-3">
          <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="mt-0 flex flex-col items-center gap-2 px-5 pb-6 text-center">
          <div className="rounded-full bg-muted/20 p-3">
            <Activity className="h-4 w-4 text-muted-foreground/40" />
          </div>
          <p className="text-sm text-muted-foreground">All caught up</p>
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
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Limit items displayed
  const displayedItems = data.slice(0, limit);

  return (
    <Card className="rounded-[24px] border border-border/50 bg-white/80 shadow-[0_10px_30px_rgba(0,0,0,0.04)] backdrop-blur transition-shadow hover:shadow-lg">
      <CardHeader className="px-5 pt-5 pb-3">
        <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="mt-0 px-5 pb-5">
        <div className="space-y-1">
          {displayedItems.map((item) => {
            const Icon = activityConfig[item.type] ?? Activity;

            const content = (
              <>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
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
                {item.targetUrl && (
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />
                )}
              </>
            );

            if (item.targetUrl) {
              return (
                <Link
                  key={item.id}
                  href={item.targetUrl}
                  className="flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-muted/30"
                >
                  {content}
                </Link>
              );
            }

            return (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-muted/30"
              >
                {content}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
