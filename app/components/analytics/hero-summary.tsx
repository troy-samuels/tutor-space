"use client";

import Link from "next/link";
import { Wallet } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { PaymentHealth, BookingMetrics, StudentMetrics } from "@/lib/data/analytics-metrics";
import type { RevenueSourceBreakdown } from "@/lib/types/analytics-premium";

// Stripe logo SVG
function StripeLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z" />
    </svg>
  );
}

interface HeroSummaryProps {
  totalRevenue: PaymentHealth;
  bookingMetrics: BookingMetrics | null;
  studentMetrics: StudentMetrics | null;
  revenueBreakdown: RevenueSourceBreakdown;
  period: number;
  isLoading?: boolean;
  stripeConnected?: boolean;
}

export function HeroSummary({
  totalRevenue,
  bookingMetrics,
  studentMetrics,
  revenueBreakdown,
  period,
  isLoading,
  stripeConnected,
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
        {stripeConnected ? (
          <div className="rounded-xl border border-primary/15 bg-primary/10 p-3.5 text-primary">
            <Wallet className="h-7 w-7" />
          </div>
        ) : (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/settings/payments"
                  className={cn(
                    "rounded-xl border p-3.5 transition-all",
                    "border-amber-500/30 bg-amber-50 text-amber-600",
                    "hover:border-amber-500/50 hover:bg-amber-100"
                  )}
                >
                  <StripeLogo className="h-7 w-7" />
                </Link>
              </TooltipTrigger>
              <TooltipContent>Connect to Stripe</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </Card>
  );
}
