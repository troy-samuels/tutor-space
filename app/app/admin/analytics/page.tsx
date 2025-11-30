"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart3,
  CreditCard,
  TrendingUp,
  PieChart,
  Eye,
  ArrowRight,
} from "lucide-react";

interface OverviewData {
  tutors: { total: number; active: number };
  students: { total: number };
  revenue: {
    grossCents: number;
    refundsCents: number;
    feesCents: number;
    netCents: number;
  };
  subscriptions: {
    founder: number;
  };
  bookings: {
    total: number;
    completed: number;
    confirmed: number;
  };
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

function AnalyticsCard({
  title,
  description,
  href,
  icon: Icon,
  value,
  subValue,
  loading,
}: {
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
  value?: string | number;
  subValue?: string;
  loading?: boolean;
}) {
  return (
    <Link href={href}>
      <Card className="hover:border-primary/50 transition-colors cursor-pointer">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">{title}</CardTitle>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <CardDescription className="mb-3">{description}</CardDescription>
          {loading ? (
            <Skeleton className="h-8 w-24" />
          ) : (
            <div className="text-2xl font-bold">{value}</div>
          )}
          {subValue && !loading && (
            <p className="text-xs text-muted-foreground mt-1">{subValue}</p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch("/api/admin/analytics/overview");
        if (response.ok) {
          const result = await response.json();
          setData(result);
        }
      } catch {
        // Silently fail
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const totalTutors = data?.subscriptions.founder || 0;
  const paidTutors = data?.subscriptions.founder || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">
          Platform-wide analytics and insights
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <AnalyticsCard
          title="Revenue"
          description="Track platform revenue, payments, and refunds"
          href="/admin/analytics/revenue"
          icon={CreditCard}
          value={formatCurrency(data?.revenue.grossCents || 0)}
          subValue="Month to date"
          loading={loading}
        />

        <AnalyticsCard
          title="Engagement"
          description="Active tutors, booking rates, and growth"
          href="/admin/analytics/engagement"
          icon={TrendingUp}
          value={data?.bookings.total || 0}
          subValue={`${data?.bookings.completed || 0} completed this month`}
          loading={loading}
        />

        <AnalyticsCard
          title="Subscriptions"
          description="Tier distribution, upgrades, and churn"
          href="/admin/analytics/subscriptions"
          icon={PieChart}
          value={`${paidTutors} paid`}
          subValue={`of ${totalTutors} total tutors`}
          loading={loading}
        />

        <AnalyticsCard
          title="Page Views"
          description="Platform traffic and user journeys"
          href="/admin/analytics/page-views"
          icon={Eye}
          value="View Analytics"
          loading={false}
        />
      </div>

      {/* Quick Stats Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Quick Summary
          </CardTitle>
          <CardDescription>Key metrics at a glance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              {loading ? (
                <Skeleton className="h-8 w-16 mx-auto mb-1" />
              ) : (
                <div className="text-2xl font-bold">
                  {data?.tutors.total || 0}
                </div>
              )}
              <div className="text-sm text-muted-foreground">Total Tutors</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              {loading ? (
                <Skeleton className="h-8 w-16 mx-auto mb-1" />
              ) : (
                <div className="text-2xl font-bold">
                  {data?.students.total || 0}
                </div>
              )}
              <div className="text-sm text-muted-foreground">
                Total Students
              </div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              {loading ? (
                <Skeleton className="h-8 w-16 mx-auto mb-1" />
              ) : (
                <div className="text-2xl font-bold">
                  {data?.tutors.active || 0}
                </div>
              )}
              <div className="text-sm text-muted-foreground">
                Active (30d)
              </div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              {loading ? (
                <Skeleton className="h-8 w-16 mx-auto mb-1" />
              ) : (
                <div className="text-2xl font-bold">
                  {formatCurrency(data?.revenue.netCents || 0)}
                </div>
              )}
              <div className="text-sm text-muted-foreground">Net Revenue</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
