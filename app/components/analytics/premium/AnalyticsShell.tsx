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
  return (
    <div className="space-y-6">
      {/* Trends row */}
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <UtilizationChart data={data.engagementTrend} isLoading={isLoading} />
        </div>
        <div className="lg:col-span-4">
          <TrafficStatsCard data={data.profileViews} isLoading={isLoading} />
        </div>
      </div>

      {/* Money row - only show when Stripe connected */}
      {data.stripeBalance && (
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
      )}

      {/* Activity row */}
      <RecentActivityList data={data.recentActivity} isLoading={isLoading} />
    </div>
  );
}
