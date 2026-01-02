"use client";

import { useEffect, useState, useCallback } from "react";
import {
  TimeSelector,
  type TimePeriod,
  AnalyticsShell,
  SkeletonDashboard,
  HeroSummary,
} from "@/components/analytics";
import type {
  RevenueDataPoint,
  StudentMetrics,
  BookingMetrics,
  ServicePopularity,
  BookingsByPeriod,
  EngagementDataPoint,
  ProfileViewStats,
  PaymentHealth,
} from "@/lib/data/analytics-metrics";
import type {
  StripeBalanceData,
  RevenueSourceBreakdown,
  RecentActivityItem,
} from "@/lib/types/analytics-premium";

interface AnalyticsClientProps {
  tutorId: string;
  initialPeriod?: TimePeriod;
}

interface AnalyticsData {
  revenue: RevenueDataPoint[];
  studentMetrics: StudentMetrics | null;
  bookingMetrics: BookingMetrics | null;
  servicePopularity: ServicePopularity[];
  bookingsByPeriod: BookingsByPeriod[];
  totalRevenue: PaymentHealth;
  engagementTrend: EngagementDataPoint[];
  profileViews: ProfileViewStats;
  stripeBalance: StripeBalanceData | null;
  revenueBreakdown: RevenueSourceBreakdown;
  recentActivity: RecentActivityItem[];
}

export function AnalyticsClient({ tutorId, initialPeriod = 30 }: AnalyticsClientProps) {
  const [period, setPeriod] = useState<TimePeriod>(initialPeriod);
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/analytics/tutor-metrics?tutorId=${tutorId}&days=${period}`);
      if (!response.ok) throw new Error("Failed to fetch analytics");
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      setError("Couldn't load your data. Try refreshing.");
    } finally {
      setIsLoading(false);
    }
  }, [tutorId, period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Show skeleton dashboard while loading
  if (isLoading) {
    return <SkeletonDashboard />;
  }

  // Default data for AnalyticsShell when data is null
  const shellData = data
    ? {
        stripeBalance: data.stripeBalance,
        revenueBreakdown: data.revenueBreakdown,
        engagementTrend: data.engagementTrend,
        profileViews: data.profileViews,
        recentActivity: data.recentActivity,
        studentMetrics: data.studentMetrics,
        bookingMetrics: data.bookingMetrics,
      }
    : {
        stripeBalance: null,
        revenueBreakdown: {
          subscriptionCount: 0,
          packageCount: 0,
          adHocCount: 0,
          totalActiveStudents: 0,
          subscriptionPercentage: 0,
          packagePercentage: 0,
          adHocPercentage: 0,
          estimatedMRR: 0,
        },
        engagementTrend: [],
        profileViews: { totalViews: 0, trend: [] },
        recentActivity: [],
        studentMetrics: null,
        bookingMetrics: null,
      };

  // Default data for HeroSummary when data is null
  const heroData = {
    totalRevenue: data?.totalRevenue ?? { grossVolume: 0, netEarnings: 0, refunds: 0, fees: 0 },
    bookingMetrics: data?.bookingMetrics ?? null,
    studentMetrics: data?.studentMetrics ?? null,
    revenueBreakdown: data?.revenueBreakdown ?? {
      subscriptionCount: 0,
      packageCount: 0,
      adHocCount: 0,
      totalActiveStudents: 0,
      subscriptionPercentage: 0,
      packagePercentage: 0,
      adHocPercentage: 0,
      estimatedMRR: 0,
    },
  };

  return (
    <div className="space-y-6 rounded-[32px] border border-border/30 bg-[#f7f4ef] px-4 py-5 shadow-[0_16px_40px_rgba(0,0,0,0.04)] sm:px-6 lg:px-8">
      {/* Header with period selector */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Analytics</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            See how your business is doing
          </p>
        </div>
        <TimeSelector value={period} onChange={setPeriod} />
      </div>

      {error ? (
        <div
          role="alert"
          className="rounded-xl border border-destructive/60 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </div>
      ) : null}

      {!error && (
        <HeroSummary
          totalRevenue={heroData.totalRevenue}
          bookingMetrics={heroData.bookingMetrics}
          studentMetrics={heroData.studentMetrics}
          revenueBreakdown={heroData.revenueBreakdown}
          period={period}
          stripeConnected={!!data?.stripeBalance}
        />
      )}

      <AnalyticsShell data={shellData} isLoading={false} period={period} />
    </div>
  );
}
