"use client";

import { useEffect, useState, useCallback } from "react";
import {
  TimeSelector,
  type TimePeriod,
  AnalyticsShell,
  SkeletonDashboard,
} from "@/components/analytics";
import { MetricCards } from "@/components/dashboard/metric-cards";
import { StripeConnectBanner } from "@/components/analytics/stripe-connect-banner";
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

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  const metrics = [
    {
      label: "Net earnings",
      value: formatCurrency(data?.totalRevenue.netEarnings ?? 0),
      helperText: `Last ${period} days`,
      iconName: "wallet",
    },
    {
      label: "Active students",
      value:
        data?.studentMetrics?.totalStudents ??
        data?.revenueBreakdown.totalActiveStudents ??
        0,
      helperText: "Currently learning with you",
      iconName: "users",
    },
    {
      label: "Lessons booked",
      value: data?.bookingMetrics?.totalBookings ?? 0,
      helperText: `${period}-day window`,
      iconName: "calendar-days",
    },
    {
      label: "Completion rate",
      value: `${data?.bookingMetrics?.completionRate ?? 0}%`,
      helperText: "Completed vs scheduled",
      iconName: "trending-up",
    },
  ];

  // Show skeleton dashboard while loading
  if (isLoading) {
    return <SkeletonDashboard />;
  }

  // Default data for AnalyticsShell when data is null
  const shellData = data
    ? {
        totalRevenue: data.totalRevenue,
        stripeBalance: data.stripeBalance,
        revenueBreakdown: data.revenueBreakdown,
        engagementTrend: data.engagementTrend,
        profileViews: data.profileViews,
        recentActivity: data.recentActivity,
      }
    : {
        totalRevenue: { grossVolume: 0, netEarnings: 0, refunds: 0, fees: 0 },
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

      {!error ? <MetricCards metrics={metrics} /> : null}

      {!error && !data?.stripeBalance && <StripeConnectBanner />}

      <AnalyticsShell data={shellData} isLoading={false} />
    </div>
  );
}
