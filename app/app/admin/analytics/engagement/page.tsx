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
import {
  ArrowLeft,
  Users,
  Calendar,
  TrendingUp,
  GraduationCap,
  AlertCircle,
} from "lucide-react";

interface EngagementData {
  tutors: { total: number; active: number };
  students: { total: number };
  bookings: {
    total: number;
    completed: number;
    confirmed: number;
    cancelled: number;
    pending: number;
  };
}

export default function EngagementAnalyticsPage() {
  const [data, setData] = useState<EngagementData | null>(null);
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

  const activeRate =
    data?.tutors.total && data.tutors.total > 0
      ? ((data.tutors.active / data.tutors.total) * 100).toFixed(1)
      : "0";

  const completionRate =
    data?.bookings.total && data.bookings.total > 0
      ? ((data.bookings.completed / data.bookings.total) * 100).toFixed(1)
      : "0";

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/analytics">
          <Button variant="ghost" size="sm" className="mb-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Analytics
          </Button>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Engagement</h1>
        <p className="text-muted-foreground">
          User activity and platform engagement metrics
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Tutors
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">
                {data?.tutors.total || 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Tutors (30d)
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {data?.tutors.active || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {activeRate}% active rate
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Students
            </CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">
                {data?.students.total || 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Bookings (MTD)
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {data?.bookings.total || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {completionRate}% completion rate
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Booking Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Booking Status Distribution</CardTitle>
          <CardDescription>Current month booking statuses</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-32 w-full" />
          ) : (
            <div className="grid gap-4 md:grid-cols-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {data?.bookings.completed || 0}
                </div>
                <div className="text-sm text-green-600">Completed</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {data?.bookings.confirmed || 0}
                </div>
                <div className="text-sm text-blue-600">Confirmed</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {data?.bookings.pending || 0}
                </div>
                <div className="text-sm text-yellow-600">Pending</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {data?.bookings.cancelled || 0}
                </div>
                <div className="text-sm text-red-600">Cancelled</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Engagement Ratios */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Tutor Activity</CardTitle>
            <CardDescription>
              Active vs inactive tutors (30 days)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-24 w-full" />
            ) : (
              <div>
                <div className="flex justify-between mb-2">
                  <span>Active Tutors</span>
                  <span className="font-medium">{activeRate}%</span>
                </div>
                <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full"
                    style={{ width: `${activeRate}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Tutors with at least one booking in the last 30 days
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Booking Completion</CardTitle>
            <CardDescription>Completed vs total bookings</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-24 w-full" />
            ) : (
              <div>
                <div className="flex justify-between mb-2">
                  <span>Completion Rate</span>
                  <span className="font-medium">{completionRate}%</span>
                </div>
                <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${completionRate}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {data?.bookings.completed || 0} of {data?.bookings.total || 0}{" "}
                  bookings completed
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
