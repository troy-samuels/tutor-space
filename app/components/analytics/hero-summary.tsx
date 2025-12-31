"use client";

import { Wallet } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { PaymentHealth, BookingMetrics, StudentMetrics } from "@/lib/data/analytics-metrics";
import type { RevenueSourceBreakdown } from "@/lib/types/analytics-premium";

interface HeroSummaryProps {
  totalRevenue: PaymentHealth;
  bookingMetrics: BookingMetrics | null;
  studentMetrics: StudentMetrics | null;
  revenueBreakdown: RevenueSourceBreakdown;
  period: number;
  isLoading?: boolean;
}

export function HeroSummary({
  totalRevenue,
  bookingMetrics,
  studentMetrics,
  revenueBreakdown,
  period,
  isLoading,
}: HeroSummaryProps) {
  if (isLoading) {
    return (
      <Card className="rounded-[24px] border border-border/50 bg-white/80 p-6 shadow-[0_10px_30px_rgba(0,0,0,0.04)] backdrop-blur sm:p-8">
        <div className="flex items-center justify-between">
          <div className="space-y-3">
            <div className="h-4 w-24 animate-pulse rounded bg-muted/40" />
            <div className="h-12 w-40 animate-pulse rounded bg-muted/40" />
            <div className="h-4 w-56 animate-pulse rounded bg-muted/30" />
          </div>
          <div className="h-14 w-14 animate-pulse rounded-xl bg-muted/30" />
        </div>
      </Card>
    );
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  const lessonsCount = bookingMetrics?.totalBookings ?? 0;
  const activeStudents =
    studentMetrics?.totalStudents ??
    revenueBreakdown.totalActiveStudents ??
    0;

  const periodLabel = period === 7 ? "7 days" : period === 30 ? "30 days" : `${period} days`;

  return (
    <Card className="rounded-[24px] border border-border/50 bg-white/80 p-6 shadow-[0_10px_30px_rgba(0,0,0,0.04)] backdrop-blur sm:p-8">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-muted-foreground">
            Earnings
          </p>
          <p className="mt-1 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            {formatCurrency(totalRevenue.netEarnings)}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{lessonsCount}</span>
            {" "}lessons
            {" "}&middot;{" "}
            <span className="font-medium text-foreground">{activeStudents}</span>
            {" "}students
            {" "}&middot;{" "}
            Last {periodLabel}
          </p>
        </div>
        <div className="rounded-xl border border-primary/15 bg-primary/10 p-3.5 text-primary">
          <Wallet className="h-7 w-7" />
        </div>
      </div>
    </Card>
  );
}
