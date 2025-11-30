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
import { ArrowLeft, PieChart, TrendingUp, Users, AlertCircle } from "lucide-react";

interface SubscriptionData {
  subscriptions: {
    founder: number;
  };
  tutors: {
    total: number;
    active: number;
  };
}

export default function SubscriptionsAnalyticsPage() {
  const [data, setData] = useState<SubscriptionData | null>(null);
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

  const total = data?.subscriptions.founder || 0;

  const tiers = [
    {
      name: "Founder Lifetime",
      count: data?.subscriptions.founder || 0,
      color: "bg-blue-500",
      revenue: 0,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/analytics">
          <Button variant="ghost" size="sm" className="mb-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Analytics
          </Button>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Subscriptions</h1>
        <p className="text-muted-foreground">
          Subscription tier distribution and revenue
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
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
              <div className="text-2xl font-bold">{total}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Paid Subscribers
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  data?.subscriptions.founder || 0
                </div>
                <p className="text-xs text-muted-foreground">
                  {total > 0
                    ? (((data?.subscriptions.founder || 0) / total) * 100).toFixed(1)
                    : 0}
                  % conversion rate
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Lifetime buyers
            </CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{data?.subscriptions.founder || 0}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tier Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Lifetime distribution</CardTitle>
          <CardDescription>Current lifetime buyers</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <div className="space-y-6">
              {tiers.map((tier) => {
                const percentage =
                  total > 0 ? Math.round((tier.count / total) * 100) : 0;

                return (
                  <div key={tier.name}>
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">{tier.name}</span>
                      <span className="text-muted-foreground">
                        {tier.count} tutors ({percentage}%)
                      </span>
                    </div>
                    <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${tier.color} rounded-full transition-all`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    {tier.revenue > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        ${tier.revenue}/mo revenue
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
