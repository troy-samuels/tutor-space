"use client";

import { FinancialHealthCard } from "./FinancialHealthCard";
import { PlanDistributionCard } from "./PlanDistributionCard";
import { UtilizationChart } from "./UtilizationChart";
import { TrafficStatsCard } from "./TrafficStatsCard";
import { RecentActivityList } from "./RecentActivityList";
import type {
  StripeBalanceData,
  RevenueSourceBreakdown,
  RecentActivityItem,
} from "@/lib/types/analytics-premium";
import type {
  EngagementDataPoint,
  ProfileViewStats,
  PaymentHealth,
} from "@/lib/data/analytics-metrics";

interface AnalyticsShellProps {
  data: {
    totalRevenue: PaymentHealth;
    stripeBalance: StripeBalanceData | null;
    revenueBreakdown: RevenueSourceBreakdown;
    engagementTrend: EngagementDataPoint[];
    profileViews: ProfileViewStats;
    recentActivity: RecentActivityItem[];
  };
  isLoading: boolean;
}

export function AnalyticsShell({ data, isLoading }: AnalyticsShellProps) {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  return (
    <div className="space-y-6">
      {/* Hero band for premium feel */}
      <div className="overflow-hidden rounded-[28px] border border-white/60 bg-gradient-to-br from-white via-white/70 to-primary/5 px-6 py-6 shadow-[0_12px_40px_rgba(0,0,0,0.06)] backdrop-blur">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Momentum
            </p>
            <h2 className="text-4xl font-semibold tracking-tight text-foreground">
              Your studio at a glance
            </h2>
            <p className="text-sm text-muted-foreground">
              One place to see revenue, engagement, and payouts.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 rounded-2xl bg-white/70 px-4 py-3 text-sm text-foreground shadow-sm backdrop-blur">
            <div>
              <p className="text-[12px] uppercase tracking-[0.18em] text-muted-foreground">
                Net earnings
              </p>
              <p className="text-2xl font-semibold">
                {formatCurrency(data.totalRevenue.netEarnings)}
              </p>
            </div>
            <div className="hidden h-12 w-px bg-border/70 sm:block" />
            <div>
              <p className="text-[12px] uppercase tracking-[0.18em] text-muted-foreground">
                MRR
              </p>
              <p className="text-2xl font-semibold">
                {formatCurrency(data.revenueBreakdown.estimatedMRR)}
              </p>
            </div>
            <div className="hidden h-12 w-px bg-border/70 sm:block" />
            <div>
              <p className="text-[12px] uppercase tracking-[0.18em] text-muted-foreground">
                Active students
              </p>
              <p className="text-2xl font-semibold">
                {data.revenueBreakdown.totalActiveStudents}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Trends row */}
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <UtilizationChart data={data.engagementTrend} isLoading={isLoading} />
        </div>
        <div className="lg:col-span-4">
          <TrafficStatsCard data={data.profileViews} isLoading={isLoading} />
        </div>
      </div>

      {/* Money row */}
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <FinancialHealthCard data={data.stripeBalance} isLoading={isLoading} />
        </div>
        <div className="lg:col-span-7">
          <PlanDistributionCard
            data={data.revenueBreakdown}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Activity row */}
      <RecentActivityList data={data.recentActivity} isLoading={isLoading} />
    </div>
  );
}
