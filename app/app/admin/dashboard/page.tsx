"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  GraduationCap,
  DollarSign,
  Calendar,
  TrendingUp,
  PieChart,
  AlertCircle,
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
    professional: number;
    growth: number;
    studio: number;
  };
  bookings: {
    total: number;
    completed: number;
    confirmed: number;
    cancelled: number;
    pending: number;
  };
  period: { start: string; end: string };
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  loading,
}: {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ElementType;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-20 mb-1" />
          <Skeleton className="h-3 w-32" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

function SubscriptionChart({
  data,
  loading,
}: {
  data?: { professional: number; growth: number; studio: number };
  loading?: boolean;
}) {
  if (loading || !data) {
    return (
      <Card className="col-span-2">
        <CardHeader>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-60" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
    );
  }

  const total = data.professional + data.growth + data.studio;
  const percentages = {
    professional: total > 0 ? Math.round((data.professional / total) * 100) : 0,
    growth: total > 0 ? Math.round((data.growth / total) * 100) : 0,
    studio: total > 0 ? Math.round((data.studio / total) * 100) : 0,
  };

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <PieChart className="h-5 w-5" />
          Subscription Distribution
        </CardTitle>
        <CardDescription>Legacy vs all-access plans (historical tiers supported for now)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Legacy Free */}
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">Legacy Free</span>
              <span className="text-sm text-muted-foreground">
                {data.professional} tutors ({percentages.professional}%)
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gray-400 rounded-full"
                style={{ width: `${percentages.professional}%` }}
              />
            </div>
          </div>

          {/* All-access (paid) */}
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">All-access (paid)</span>
              <span className="text-sm text-muted-foreground">
                {data.growth} tutors ({percentages.growth}%)
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full"
                style={{ width: `${percentages.growth}%` }}
              />
            </div>
          </div>

          {/* Custom/Legacy */}
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">Custom/Legacy</span>
              <span className="text-sm text-muted-foreground">
                {data.studio} tutors ({percentages.studio}%)
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-500 rounded-full"
                style={{ width: `${percentages.studio}%` }}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function BookingStats({
  data,
  loading,
}: {
  data?: {
    total: number;
    completed: number;
    confirmed: number;
    cancelled: number;
    pending: number;
  };
  loading?: boolean;
}) {
  if (loading || !data) {
    return (
      <Card className="col-span-2">
        <CardHeader>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-60" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Bookings This Month
        </CardTitle>
        <CardDescription>Booking status breakdown</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {data.completed}
            </div>
            <div className="text-xs text-green-600">Completed</div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {data.confirmed}
            </div>
            <div className="text-xs text-blue-600">Confirmed</div>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">
              {data.pending}
            </div>
            <div className="text-xs text-yellow-600">Pending</div>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">
              {data.cancelled}
            </div>
            <div className="text-xs text-red-600">Cancelled</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch("/api/admin/analytics/overview");
        if (!response.ok) {
          throw new Error("Failed to fetch analytics");
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Platform overview and key metrics for the current month
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Tutors"
          value={data?.tutors.total || 0}
          description={`${data?.tutors.active || 0} active in last 30 days`}
          icon={Users}
          loading={loading}
        />
        <MetricCard
          title="Total Students"
          value={data?.students.total || 0}
          description="Across all tutors"
          icon={GraduationCap}
          loading={loading}
        />
        <MetricCard
          title="Revenue (MTD)"
          value={formatCurrency(data?.revenue.grossCents || 0)}
          description={`${formatCurrency(data?.revenue.refundsCents || 0)} refunded`}
          icon={DollarSign}
          loading={loading}
        />
        <MetricCard
          title="Bookings (MTD)"
          value={data?.bookings.total || 0}
          description={`${data?.bookings.completed || 0} completed`}
          icon={TrendingUp}
          loading={loading}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SubscriptionChart data={data?.subscriptions} loading={loading} />
        <BookingStats data={data?.bookings} loading={loading} />
      </div>
    </div>
  );
}
