"use client";

import { CheckCircle2, XCircle, Clock, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { BookingMetrics } from "@/lib/data/analytics-metrics";

interface BookingStatsCardProps {
  data: BookingMetrics | null;
  isLoading?: boolean;
  dimmed?: boolean;
}

export function BookingStatsCard({ data, isLoading, dimmed }: BookingStatsCardProps) {
  if (isLoading) {
    return (
      <Card className="rounded-3xl border border-border/60 bg-white/90 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">
            Booking Stats
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 animate-pulse rounded-lg bg-muted/40" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="rounded-3xl border border-border/60 bg-white/90 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">
            Booking Stats
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No booking data available</p>
        </CardContent>
      </Card>
    );
  }

  const stats = [
    {
      icon: CheckCircle2,
      label: "Completion Rate",
      value: `${data.completionRate}%`,
      subtext: `${data.completedBookings} completed`,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      icon: XCircle,
      label: "Cancellation Rate",
      value: `${data.cancellationRate}%`,
      subtext: `${data.cancelledBookings} cancelled`,
      color: "text-red-500",
      bgColor: "bg-red-50",
    },
    {
      icon: Clock,
      label: "Pending",
      value: data.pendingBookings,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
    },
    {
      icon: DollarSign,
      label: "Avg. Session Value",
      value: `$${data.avgSessionValue.toFixed(0)}`,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
  ];

  return (
    <Card
      className={cn(
        "rounded-3xl border border-border/60 bg-white/90 shadow-sm transition-opacity duration-200",
        dimmed && "opacity-80"
      )}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-foreground">
          Booking Stats
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex items-center justify-between rounded-2xl border border-border/60 bg-muted/30 px-3 py-2"
          >
            <div className="flex items-center gap-2.5">
              <div className={`rounded-full p-1.5 ${stat.bgColor}`}>
                <stat.icon className={`h-3.5 w-3.5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-xs font-medium text-foreground">{stat.label}</p>
                {stat.subtext && (
                  <p className="text-xs text-muted-foreground">{stat.subtext}</p>
                )}
              </div>
            </div>
            <span className="text-lg font-semibold text-foreground">{stat.value}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
