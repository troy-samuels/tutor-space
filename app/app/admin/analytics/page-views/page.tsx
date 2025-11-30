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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Eye,
  Monitor,
  Smartphone,
  Tablet,
  Users,
  AlertCircle,
} from "lucide-react";

interface PageViewsData {
  summary: {
    total: number;
    uniquePaths: number;
    period: {
      start: string;
      end: string;
      days: number;
    };
  };
  dailyViews: Array<{ date: string; count: number }>;
  topPaths: Array<{ path: string; count: number }>;
  byDevice: Record<string, number>;
  byUserType: Record<string, number>;
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat("en-US").format(num);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function DeviceIcon({ device }: { device: string }) {
  switch (device) {
    case "desktop":
      return <Monitor className="h-4 w-4" />;
    case "mobile":
      return <Smartphone className="h-4 w-4" />;
    case "tablet":
      return <Tablet className="h-4 w-4" />;
    default:
      return <Monitor className="h-4 w-4" />;
  }
}

function SimpleBarChart({
  data,
  loading,
}: {
  data: Array<{ date: string; count: number }>;
  loading: boolean;
}) {
  if (loading) {
    return <Skeleton className="h-48 w-full" />;
  }

  if (data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-muted-foreground">
        No data available
      </div>
    );
  }

  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="h-48 flex items-end justify-between gap-1">
      {data.map((item, i) => (
        <div
          key={i}
          className="flex-1 flex flex-col items-center gap-1"
          title={`${formatDate(item.date)}: ${formatNumber(item.count)} views`}
        >
          <div
            className="w-full bg-primary/80 rounded-t transition-all hover:bg-primary"
            style={{
              height: `${Math.max((item.count / maxCount) * 160, 4)}px`,
            }}
          />
          <span className="text-xs text-muted-foreground rotate-45 origin-left">
            {formatDate(item.date)}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function PageViewsAnalyticsPage() {
  const [data, setData] = useState<PageViewsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState("7");

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/admin/analytics/page-views?days=${days}`
        );
        if (!response.ok) throw new Error("Failed to fetch page views");
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [days]);

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
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/analytics">
            <Button variant="ghost" size="sm" className="mb-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Analytics
            </Button>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Page Views</h1>
          <p className="text-muted-foreground">
            Platform traffic and user journeys
          </p>
        </div>

        <Select value={days} onValueChange={setDays}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="14">Last 14 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Page Views
            </CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">
                {formatNumber(data?.summary.total || 0)}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Unique Pages
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">
                {formatNumber(data?.summary.uniquePaths || 0)}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg. Daily Views
            </CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">
                {formatNumber(
                  Math.round(
                    (data?.summary.total || 0) /
                      (data?.summary.period.days || 1)
                  )
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Daily Views Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Page Views</CardTitle>
          <CardDescription>Views per day over selected period</CardDescription>
        </CardHeader>
        <CardContent>
          <SimpleBarChart data={data?.dailyViews || []} loading={loading} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Pages */}
        <Card>
          <CardHeader>
            <CardTitle>Top Pages</CardTitle>
            <CardDescription>Most viewed pages</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Path</TableHead>
                    <TableHead className="text-right">Views</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(data?.topPaths || []).map((page, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono text-sm">
                        {page.path}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatNumber(page.count)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {(data?.topPaths || []).length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={2}
                        className="text-center text-muted-foreground"
                      >
                        No data available
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Device & User Type Breakdown */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>By Device</CardTitle>
              <CardDescription>Views by device type</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-24 w-full" />
              ) : (
                <div className="space-y-3">
                  {Object.entries(data?.byDevice || {}).map(
                    ([device, count]) => (
                      <div key={device} className="flex items-center gap-3">
                        <DeviceIcon device={device} />
                        <span className="capitalize flex-1">{device}</span>
                        <span className="font-medium">
                          {formatNumber(count)}
                        </span>
                      </div>
                    )
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>By User Type</CardTitle>
              <CardDescription>Views by logged-in status</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-24 w-full" />
              ) : (
                <div className="space-y-3">
                  {Object.entries(data?.byUserType || {}).map(
                    ([type, count]) => (
                      <div key={type} className="flex items-center gap-3">
                        <Users className="h-4 w-4" />
                        <span className="capitalize flex-1">{type}</span>
                        <span className="font-medium">
                          {formatNumber(count)}
                        </span>
                      </div>
                    )
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
