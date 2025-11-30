"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, DollarSign, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";

interface RevenueData {
  revenue: {
    grossCents: number;
    refundsCents: number;
    feesCents: number;
    netCents: number;
  };
  bookings: {
    total: number;
    completed: number;
  };
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export default function RevenueAnalyticsPage() {
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch("/api/admin/analytics/overview");
        if (!response.ok) throw new Error("Failed to fetch data");
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
      <div className="space-y-6">
        <Link href="/admin/analytics">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Analytics
          </Button>
        </Link>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/analytics">
          <Button variant="ghost" size="sm" className="mb-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Analytics
          </Button>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Revenue</h1>
        <p className="text-muted-foreground">
          Platform payment analytics and revenue tracking
        </p>
      </div>

      {/* Revenue Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Gross Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">
                {formatCurrency(data?.revenue.grossCents || 0)}
              </div>
            )}
            <p className="text-xs text-muted-foreground">Month to date</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Refunds
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(data?.revenue.refundsCents || 0)}
              </div>
            )}
            <p className="text-xs text-muted-foreground">Month to date</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Platform Fees
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">
                {formatCurrency(data?.revenue.feesCents || 0)}
              </div>
            )}
            <p className="text-xs text-muted-foreground">Currently 0%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Net Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(data?.revenue.netCents || 0)}
              </div>
            )}
            <p className="text-xs text-muted-foreground">To tutors</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Summary</CardTitle>
          <CardDescription>
            Breakdown of platform revenue for current month
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between py-3 border-b">
                <span>Gross Booking Revenue</span>
                <span className="font-medium">
                  {formatCurrency(data?.revenue.grossCents || 0)}
                </span>
              </div>
              <div className="flex justify-between py-3 border-b text-red-600">
                <span>Less: Refunds</span>
                <span className="font-medium">
                  -{formatCurrency(data?.revenue.refundsCents || 0)}
                </span>
              </div>
              <div className="flex justify-between py-3 border-b">
                <span>Less: Platform Fees (0%)</span>
                <span className="font-medium">
                  -{formatCurrency(data?.revenue.feesCents || 0)}
                </span>
              </div>
              <div className="flex justify-between py-3 text-lg font-bold">
                <span>Net to Tutors</span>
                <span className="text-green-600">
                  {formatCurrency(data?.revenue.netCents || 0)}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Booking Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Booking Activity</CardTitle>
          <CardDescription>Paid bookings this month</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-24 w-full" />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-3xl font-bold">
                  {data?.bookings.total || 0}
                </div>
                <div className="text-sm text-muted-foreground">
                  Total Bookings
                </div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-3xl font-bold text-green-600">
                  {data?.bookings.completed || 0}
                </div>
                <div className="text-sm text-green-600">Completed</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
