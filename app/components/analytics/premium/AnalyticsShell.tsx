"use client";

import { UtilizationChart } from "./UtilizationChart";
import { TrafficStatsCard } from "./TrafficStatsCard";
import { RecentActivityList } from "./RecentActivityList";
import { BookingRateCard } from "./BookingRateCard";
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
  BookingMetrics,
} from "@/lib/data/analytics-metrics";

interface AnalyticsShellProps {
  data: {
    stripeBalance: StripeBalanceData | null;
    revenueBreakdown: RevenueSourceBreakdown;
    engagementTrend: EngagementDataPoint[];
    profileViews: ProfileViewStats;
    recentActivity: RecentActivityItem[];
    studentMetrics: StudentMetrics | null;
    bookingMetrics: BookingMetrics | null;
  };
  isLoading: boolean;
  period: number;
}

export function AnalyticsShell({ data, isLoading, period }: AnalyticsShellProps) {
  return (
    <div className="space-y-6">
      {/* Row 1: Teaching Activity (70%) + Booking Rate (30%) */}
      <div className="grid gap-6 lg:grid-cols-10">
        <div className="lg:col-span-7">
          <UtilizationChart data={data.engagementTrend} isLoading={isLoading} />
        </div>
        <div className="lg:col-span-3">
          <BookingRateCard
            totalBookings={data.bookingMetrics?.totalBookings ?? 0}
            totalViews={data.profileViews.totalViews}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Row 2: Profile Visits (70%) + Students (30%) */}
      <div className="grid gap-6 lg:grid-cols-10">
        <div className="lg:col-span-7">
          <TrafficStatsCard data={data.profileViews} isLoading={isLoading} period={period} />
        </div>
        <div className="lg:col-span-3">
          <StudentsCard
            studentMetrics={data.studentMetrics}
            revenueBreakdown={data.revenueBreakdown}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Row 3: Balance (if Stripe connected) */}
      {data.stripeBalance && (
        <BalanceCard data={data.stripeBalance} isLoading={isLoading} />
      )}

      {/* Row 4: Recent Activity */}
      <RecentActivityList data={data.recentActivity} isLoading={isLoading} />
    </div>
  );
}
