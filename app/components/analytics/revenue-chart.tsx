"use client";

import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RevenueDataPoint } from "@/lib/data/analytics-metrics";

interface RevenueChartProps {
  data: RevenueDataPoint[];
  isLoading?: boolean;
}

export function RevenueChart({ data, isLoading }: RevenueChartProps) {
  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);
  const formattedTotal = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(totalRevenue);

  // Format dates for display
  const chartData = data.map((d) => ({
    ...d,
    displayDate: new Date(d.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
  }));

  if (isLoading) {
    return (
      <Card data-testid="revenue-chart-loading" className="rounded-3xl border border-border/60 bg-white/90 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">
            Revenue Over Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] animate-pulse rounded-lg bg-muted/40" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="revenue-chart" className="rounded-3xl border border-border/60 bg-white/90 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-semibold text-foreground">
          Revenue Over Time
        </CardTitle>
        <span data-testid="revenue-total" className="text-2xl font-bold text-foreground">{formattedTotal}</span>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
            No revenue data for this period
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="displayDate"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                interval="preserveStartEnd"
                minTickGap={30}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                tickFormatter={(value) => `$${value}`}
                width={45}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const data = payload[0].payload;
                  return (
                    <div className="rounded-lg border border-border/60 bg-background px-3 py-2 shadow-lg">
                      <p className="text-xs text-muted-foreground">{data.displayDate}</p>
                      <p className="text-sm font-semibold text-foreground">
                        ${data.revenue.toFixed(2)}
                      </p>
                    </div>
                  );
                }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#revenueGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
