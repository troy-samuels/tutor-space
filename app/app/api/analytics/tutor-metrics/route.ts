import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getRevenueOverTime,
  getStudentMetrics,
  getBookingMetrics,
  getServicePopularity,
  getBookingsByPeriod,
  getTotalRevenue,
  getEngagementOverTime,
  getProfileViews,
  getStripeBalance,
  getRevenueSourceBreakdown,
  getRecentActivity,
} from "@/lib/data/analytics-metrics";
import type {
  RevenueDataPoint,
  StudentMetrics,
  BookingMetrics,
  ServicePopularity,
  BookingsByPeriod,
  PaymentHealth,
  EngagementDataPoint,
  ProfileViewStats,
} from "@/lib/data/analytics-metrics";
import type {
  StripeBalanceData,
  RevenueSourceBreakdown,
  RecentActivityItem,
} from "@/lib/types/analytics-premium";

export const dynamic = "force-dynamic";

// Default fallback values for graceful degradation
const defaultStudentMetrics: StudentMetrics = {
  totalStudents: 0,
  newStudents: 0,
  returningStudents: 0,
  churnRiskStudents: 0,
  retentionRate: 0,
  avgLessonsPerStudent: 0,
};

const defaultBookingMetrics: BookingMetrics = {
  totalBookings: 0,
  completedBookings: 0,
  cancelledBookings: 0,
  pendingBookings: 0,
  completionRate: 0,
  cancellationRate: 0,
  avgSessionValue: 0,
};

const defaultPaymentHealth: PaymentHealth = {
  grossVolume: 0,
  netEarnings: 0,
  refunds: 0,
  fees: 0,
};

const defaultProfileViews: ProfileViewStats = {
  totalViews: 0,
  trend: [],
};

const defaultRevenueBreakdown: RevenueSourceBreakdown = {
  subscriptionCount: 0,
  packageCount: 0,
  adHocCount: 0,
  totalActiveStudents: 0,
  subscriptionPercentage: 0,
  packagePercentage: 0,
  adHocPercentage: 0,
  estimatedMRR: 0,
};

/**
 * Safe metric fetcher - prevents one failing metric from breaking entire response
 */
async function safeMetricFetch<T>(
  fetcher: () => Promise<T>,
  fallback: T,
  metricName: string
): Promise<T> {
  try {
    return await fetcher();
  } catch (error) {
    console.error(`[Analytics] Failed to fetch ${metricName}:`, error);
    return fallback;
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const tutorIdParam = url.searchParams.get("tutorId");
    const daysParam = Number(url.searchParams.get("days"));
    const days = [7, 30, 90].includes(daysParam) ? daysParam : 30;

    // Only allow tutors to see their own data (or allow admin to see any)
    const tutorId = tutorIdParam === user.id ? tutorIdParam : user.id;

    // Fetch all metrics in parallel with error boundaries
    const [
      revenue,
      studentMetrics,
      bookingMetrics,
      servicePopularity,
      bookingsByPeriod,
      totalRevenue,
      engagementTrend,
      profileViews,
      stripeBalance,
      revenueBreakdown,
      recentActivity,
    ] = await Promise.all([
      safeMetricFetch<RevenueDataPoint[]>(
        () => getRevenueOverTime(tutorId, days, supabase),
        [],
        "revenue"
      ),
      safeMetricFetch<StudentMetrics>(
        () => getStudentMetrics(tutorId, days, supabase),
        defaultStudentMetrics,
        "studentMetrics"
      ),
      safeMetricFetch<BookingMetrics>(
        () => getBookingMetrics(tutorId, days, supabase),
        defaultBookingMetrics,
        "bookingMetrics"
      ),
      safeMetricFetch<ServicePopularity[]>(
        () => getServicePopularity(tutorId, days, supabase),
        [],
        "servicePopularity"
      ),
      safeMetricFetch<BookingsByPeriod[]>(
        () => getBookingsByPeriod(tutorId, days, supabase),
        [],
        "bookingsByPeriod"
      ),
      safeMetricFetch<PaymentHealth>(
        () => getTotalRevenue(tutorId, days, supabase),
        defaultPaymentHealth,
        "totalRevenue"
      ),
      safeMetricFetch<EngagementDataPoint[]>(
        () => getEngagementOverTime(tutorId, days, supabase),
        [],
        "engagementTrend"
      ),
      safeMetricFetch<ProfileViewStats>(
        () => getProfileViews(tutorId, days, supabase),
        defaultProfileViews,
        "profileViews"
      ),
      safeMetricFetch<StripeBalanceData | null>(
        () => getStripeBalance(tutorId, supabase),
        null,
        "stripeBalance"
      ),
      safeMetricFetch<RevenueSourceBreakdown>(
        () => getRevenueSourceBreakdown(tutorId, supabase),
        defaultRevenueBreakdown,
        "revenueBreakdown"
      ),
      safeMetricFetch<RecentActivityItem[]>(
        () => getRecentActivity(tutorId, 10, supabase),
        [],
        "recentActivity"
      ),
    ]);

    return NextResponse.json(
      {
        revenue,
        studentMetrics,
        bookingMetrics,
        servicePopularity,
        bookingsByPeriod,
        totalRevenue,
        engagementTrend,
        profileViews,
        stripeBalance,
        revenueBreakdown,
        recentActivity,
      },
      {
        headers: {
          "Cache-Control": "private, no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching tutor metrics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
