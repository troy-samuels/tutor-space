"use client";

import { Eye } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProfileViewStats } from "@/lib/data/analytics-metrics";

interface TrafficStatsCardProps {
  data: ProfileViewStats;
  isLoading?: boolean;
}

export function TrafficStatsCard({ data, isLoading }: TrafficStatsCardProps) {
  if (isLoading) {
    return (
      <Card className="rounded-3xl border border-border/60 bg-card shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
        <CardHeader className="px-5 pt-5 pb-3">
          <div className="h-3 w-20 animate-pulse rounded bg-muted/40" />
        </CardHeader>
        <CardContent className="mt-0 px-5 pb-5">
          <div className="h-8 w-16 animate-pulse rounded bg-muted/40" />
          <div className="mt-3 h-10 w-full animate-pulse rounded bg-muted/20" />
        </CardContent>
      </Card>
    );
  }

  const { totalViews, trend } = data;

  // Prepare sparkline data
  const sparklineData = trend.map((t) => ({ views: t.views }));

  return (
    <Card className="rounded-[24px] border border-border/50 bg-white/80 shadow-[0_10px_30px_rgba(0,0,0,0.04)] transition-shadow hover:shadow-lg backdrop-blur">
      <CardHeader className="flex flex-row items-center justify-between px-5 pt-5 pb-3">
        <CardTitle className="text-sm font-semibold tracking-tight text-muted-foreground">
          Profile Visits
        </CardTitle>
        <div className="rounded-xl border border-primary/15 bg-primary/10 p-2 text-primary">
          <Eye className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent className="mt-0 px-5 pb-5">
        <p className="text-3xl font-semibold tracking-tight text-foreground">
          {totalViews.toLocaleString()}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">Past 30 days</p>

        {/* Mini Sparkline */}
        {sparklineData.length > 0 && (
          <div className="mt-3">
            <ResponsiveContainer width="100%" height={40}>
              <AreaChart
                data={sparklineData}
                margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="views"
                  stroke="var(--primary)"
                  strokeWidth={1.8}
                  fill="url(#viewsGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
