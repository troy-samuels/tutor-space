"use client";

import { useEffect, useState, useCallback } from "react";
import {
  TimeSelector,
  type TimePeriod,
  RevenueChart,
  BookingsChart,
  StudentMetricsCard,
  ServicePopularityChart,
  BookingStatsCard,
  OverviewCards,
} from "@/components/analytics";
import type {
  RevenueDataPoint,
  StudentMetrics,
  BookingMetrics,
  ServicePopularity,
  BookingsByPeriod,
} from "@/lib/data/analytics-metrics";

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
  totalRevenue: { gross: number; net: number; refunds: number };
}

export function AnalyticsClient({ tutorId, initialPeriod = 30 }: AnalyticsClientProps) {
  const [period, setPeriod] = useState<TimePeriod>(initialPeriod);
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/analytics/tutor-metrics?tutorId=${tutorId}&days=${period}`);
      if (!response.ok) throw new Error("Failed to fetch analytics");
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setIsLoading(false);
    }
  }, [tutorId, period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const overviewData = data
    ? {
        revenue: Math.round(data.totalRevenue.gross),
        lessons: data.bookingMetrics?.completedBookings ?? 0,
        students: data.studentMetrics?.totalStudents ?? 0,
        retentionRate: data.studentMetrics?.retentionRate ?? 0,
      }
    : null;

  return (
    <div className="space-y-6">
      {/* Header with period selector */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track your teaching business performance
          </p>
        </div>
        <TimeSelector value={period} onChange={setPeriod} />
      </div>

      {/* Overview Cards */}
      <OverviewCards data={overviewData} isLoading={isLoading} />

      {/* Revenue Chart - Full Width */}
      <RevenueChart data={data?.revenue ?? []} isLoading={isLoading} />

      {/* Middle Row: Lessons Chart + Student Insights */}
      <div className="grid gap-4 lg:grid-cols-2">
        <BookingsChart data={data?.bookingsByPeriod ?? []} isLoading={isLoading} />
        <StudentMetricsCard data={data?.studentMetrics ?? null} isLoading={isLoading} />
      </div>

      {/* Bottom Row: Service Popularity + Booking Stats */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ServicePopularityChart data={data?.servicePopularity ?? []} isLoading={isLoading} />
        <BookingStatsCard data={data?.bookingMetrics ?? null} isLoading={isLoading} />
      </div>
    </div>
  );
}
