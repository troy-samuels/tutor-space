"use client";

import { useEffect } from "react";
import { trackOnce } from "@/lib/analytics";
import type { PlatformBillingPlan } from "@/lib/types/payments";

type DashboardAnalyticsProps = {
  plan: PlatformBillingPlan;
  studentCount: number;
  upcomingSessions: number;
  revenueThisMonthCents: number;
};

export function DashboardAnalytics({
  plan,
  studentCount,
  upcomingSessions,
  revenueThisMonthCents,
}: DashboardAnalyticsProps) {
  useEffect(() => {
    trackOnce("dashboard_view", {
      plan,
      studentCount,
      upcomingSessions,
      revenueThisMonthCents,
    });
  }, [plan, studentCount, upcomingSessions, revenueThisMonthCents]);

  return null;
}
