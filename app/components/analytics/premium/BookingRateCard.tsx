"use client";

import { TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";

interface BookingRateCardProps {
  totalBookings: number;
  totalViews: number;
  isLoading?: boolean;
}

export function BookingRateCard({
  totalBookings,
  totalViews,
  isLoading,
}: BookingRateCardProps) {
  if (isLoading) {
    return (
      <Card className="flex h-full flex-col rounded-[24px] border border-border/50 bg-white/80 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.04)] backdrop-blur">
        <div className="flex items-center justify-between">
          <div className="h-4 w-24 animate-pulse rounded bg-muted/40" />
          <div className="h-10 w-10 animate-pulse rounded-xl bg-muted/30" />
        </div>
        <div className="mt-3 flex-1">
          <div className="h-8 w-16 animate-pulse rounded bg-muted/40" />
          <div className="mt-2 h-3 w-32 animate-pulse rounded bg-muted/30" />
        </div>
      </Card>
    );
  }

  const rate = totalViews > 0 ? (totalBookings / totalViews) * 100 : 0;

  return (
    <Card className="flex h-full flex-col rounded-[24px] border border-border/50 bg-white/80 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.04)] backdrop-blur transition-shadow hover:shadow-lg">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold tracking-tight text-muted-foreground">
          Booking Rate
        </p>
        <div className="rounded-xl border border-primary/15 bg-primary/10 p-2.5 text-primary">
          <TrendingUp className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-auto pt-4">
        <p className="text-3xl font-semibold tracking-tight">
          {rate.toFixed(1)}%
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {totalBookings} bookings from {totalViews} views
        </p>
      </div>
    </Card>
  );
}
