"use client";

import { UtilizationChart } from "./UtilizationChart";
import { TrafficStatsCard } from "./TrafficStatsCard";
import { RecentActivityList } from "./RecentActivityList";
import { StudentsCard } from "../students-card";
import { BalanceCard } from "../balance-card";
import type {
  StripeBalanceData,
  RevenueSourceBreakdown,
  RecentActivityItem,
} from "@/lib/types/analytics-premium";
import type {
  EngagementDataPoint,
  ProfileViewStats,
  StudentMetrics,
} from "@/lib/data/analytics-metrics";

interface AnalyticsShellProps {
  data: {
    stripeBalance: StripeBalanceData | null;
    revenueBreakdown: RevenueSourceBreakdown;
    engagementTrend: EngagementDataPoint[];
    profileViews: ProfileViewStats;
    recentActivity: RecentActivityItem[];
    studentMetrics: StudentMetrics | null;
  };
  isLoading: boolean;
}

export function AnalyticsShell({ data, isLoading }: AnalyticsShellProps) {
  return (
    <div className="space-y-6">
      {/* Teaching Activity + Students row */}
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <UtilizationChart data={data.engagementTrend} isLoading={isLoading} />
        </div>
        <div className="lg:col-span-4">
          <StudentsCard
            studentMetrics={data.studentMetrics}
            revenueBreakdown={data.revenueBreakdown}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Balance + Profile Views row - only show when Stripe connected */}
      {data.stripeBalance && (
        <div className="grid gap-6 sm:grid-cols-2">
          <BalanceCard data={data.stripeBalance} isLoading={isLoading} />
          <TrafficStatsCard data={data.profileViews} isLoading={isLoading} />
        </div>
      )}

      {/* Profile Views only when no Stripe */}
      {!data.stripeBalance && (
        <div className="max-w-sm">
          <TrafficStatsCard data={data.profileViews} isLoading={isLoading} />
        </div>
      )}

      {/* Activity row */}
      <RecentActivityList data={data.recentActivity} isLoading={isLoading} />
    </div>
  );
}
