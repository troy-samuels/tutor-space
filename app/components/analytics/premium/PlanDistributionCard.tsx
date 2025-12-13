"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { RevenueSourceBreakdown } from "@/lib/types/analytics-premium";

interface PlanDistributionCardProps {
  data: RevenueSourceBreakdown;
  isLoading?: boolean;
}

export function PlanDistributionCard({
  data,
  isLoading,
}: PlanDistributionCardProps) {
  if (isLoading) {
    return (
      <Card className="rounded-[24px] border border-border/50 bg-white/70 shadow-[0_10px_30px_rgba(0,0,0,0.04)] backdrop-blur">
        <CardHeader className="px-5 pt-5 pb-3">
          <div className="h-3 w-20 animate-pulse rounded bg-muted/40" />
          <div className="mt-1 h-3 w-32 animate-pulse rounded bg-muted/30" />
        </CardHeader>
        <CardContent className="mt-0 px-5 pb-5">
          <div className="h-8 w-24 animate-pulse rounded bg-muted/40" />
          <div className="mt-4 h-3 w-full animate-pulse rounded-full bg-muted/40" />
          <div className="mt-4 flex gap-4">
            <div className="h-4 w-20 animate-pulse rounded bg-muted/40" />
            <div className="h-4 w-20 animate-pulse rounded bg-muted/40" />
            <div className="h-4 w-20 animate-pulse rounded bg-muted/40" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const { totalActiveStudents, subscriptionCount, packageCount, adHocCount } =
    data;
  const hasData = totalActiveStudents > 0;

  // Empty state
  if (!hasData) {
    return (
      <Card className="rounded-[24px] border border-border/50 bg-white/80 shadow-[0_10px_30px_rgba(0,0,0,0.04)] backdrop-blur">
        <CardHeader className="px-5 pt-5 pb-3">
          <CardTitle className="text-sm font-semibold tracking-tight text-muted-foreground">
            Where your money comes from
          </CardTitle>
        </CardHeader>
        <CardContent className="mt-0 flex flex-col items-center gap-2 px-5 pb-5 text-center">
          <p className="text-sm text-muted-foreground">
            Add subscriptions for steady income
          </p>
          <Button asChild variant="outline" size="sm" className="mt-3">
            <Link href="/services">Create Subscription</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const formatMRR = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const palette = {
    subscription: "var(--primary)",
    packages: "var(--accent)",
    adHoc: "var(--muted-foreground)",
  };

  const legendItems = [
    { label: "Subscriptions", count: subscriptionCount, color: palette.subscription },
    { label: "Packages", count: packageCount, color: palette.packages },
    { label: "One-time", count: adHocCount, color: palette.adHoc },
  ];

  return (
    <Card className="rounded-[24px] border border-border/50 bg-white/80 shadow-[0_10px_30px_rgba(0,0,0,0.04)] transition-shadow hover:shadow-lg backdrop-blur">
      <CardHeader className="px-5 pt-5 pb-3">
        <CardTitle className="text-sm font-semibold tracking-tight text-muted-foreground">
          Revenue mix
        </CardTitle>
        <p className="text-xs text-muted-foreground/80">
          Where active students are contributing
        </p>
      </CardHeader>
      <CardContent className="mt-0 space-y-5 px-5 pb-5">
        <div>
          <p className="text-3xl font-semibold tracking-tight text-foreground">
            {formatMRR(data.estimatedMRR)}
            <span className="ml-1 text-sm font-medium text-muted-foreground">
              /mo
            </span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {totalActiveStudents} active students
          </p>
        </div>

        {/* Stacked Bar */}
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
          {data.subscriptionPercentage > 0 && (
            <div
              className="transition-all"
              style={{
                width: `${data.subscriptionPercentage}%`,
                backgroundColor: palette.subscription,
              }}
              title={`Subscriptions: ${data.subscriptionPercentage}%`}
            />
          )}
          {data.packagePercentage > 0 && (
            <div
              className="transition-all"
              style={{
                width: `${data.packagePercentage}%`,
                backgroundColor: palette.packages,
              }}
              title={`Packages: ${data.packagePercentage}%`}
            />
          )}
          {data.adHocPercentage > 0 && (
            <div
              className="transition-all"
              style={{
                width: `${data.adHocPercentage}%`,
                backgroundColor: palette.adHoc,
              }}
              title={`Ad-hoc: ${data.adHocPercentage}%`}
            />
          )}
        </div>

        {/* Legend */}
        <div className="grid gap-3 sm:grid-cols-3">
          {legendItems.map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-border/60 bg-white/60 px-3 py-3 backdrop-blur"
            >
              <div className="flex min-w-0 flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <div
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm font-medium leading-tight text-muted-foreground">
                    {item.label}
                  </span>
                </div>
                <span className="text-lg font-semibold leading-tight text-foreground">
                  {item.count}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
