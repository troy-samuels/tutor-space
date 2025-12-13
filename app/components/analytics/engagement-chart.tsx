"use client";

import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { EngagementDataPoint } from "@/lib/data/analytics-metrics";

interface EngagementChartProps {
  data: EngagementDataPoint[];
  isLoading?: boolean;
  onHoverChange?: (hovering: boolean) => void;
  dimmed?: boolean;
}

export function EngagementChart({
  data,
  isLoading,
  onHoverChange,
  dimmed,
}: EngagementChartProps) {
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
      <Card
        data-testid="engagement-chart-loading"
        className="rounded-3xl border border-border/60 bg-white/90 shadow-sm"
      >
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">
            Engagement Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] animate-pulse rounded-lg bg-muted/40" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      data-testid="engagement-chart"
      className={cn(
        "rounded-3xl border border-border/60 bg-white/90 shadow-sm transition-opacity duration-200",
        dimmed && "opacity-80"
      )}
      onMouseEnter={() => onHoverChange?.(true)}
      onMouseLeave={() => onHoverChange?.(false)}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-semibold text-foreground">
          Engagement Trends
        </CardTitle>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />
            <span className="text-muted-foreground">Lessons</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span className="text-muted-foreground">Active Students</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
            No engagement data for this period
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
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
                width={30}
                allowDecimals={false}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const data = payload[0].payload;
                  return (
                    <div className="rounded-lg border border-border/60 bg-background px-3 py-2 shadow-lg">
                      <p className="mb-1 text-xs text-muted-foreground">
                        {data.displayDate}
                      </p>
                      <p className="text-sm font-medium text-blue-600">
                        {data.lessonCount} lesson
                        {data.lessonCount !== 1 ? "s" : ""}
                      </p>
                      <p className="text-sm font-medium text-emerald-600">
                        {data.activeStudentCount} active student
                        {data.activeStudentCount !== 1 ? "s" : ""}
                      </p>
                    </div>
                  );
                }}
              />
              <Line
                type="monotone"
                dataKey="lessonCount"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: "#3b82f6" }}
              />
              <Line
                type="monotone"
                dataKey="activeStudentCount"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: "#10b981" }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
