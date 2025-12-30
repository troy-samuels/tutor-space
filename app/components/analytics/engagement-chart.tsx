"use client";

import {
  BarChart,
  Bar,
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

// Get the Monday-Sunday range for the current week
function getCurrentWeekRange() {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
  // Calculate offset to Monday: if Sunday (0), go back 6 days; else go back (day - 1) days
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return { start: monday, end: sunday };
}

// Format date to YYYY-MM-DD in local timezone
function toLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Format date for week range display
function formatWeekRange(start: Date, end: Date): string {
  const startStr = start.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const endStr = end.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${startStr} - ${endStr}`;
}

export function EngagementChart({
  data,
  isLoading,
  onHoverChange,
  dimmed,
}: EngagementChartProps) {
  if (isLoading) {
    return (
      <Card
        data-testid="engagement-chart-loading"
        className="rounded-3xl border border-border/60 bg-white/90 shadow-sm"
      >
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">
            Teaching Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] animate-pulse rounded-lg bg-muted/40" />
        </CardContent>
      </Card>
    );
  }

  // Get current week range (Monday-Sunday)
  const { start, end } = getCurrentWeekRange();
  const weekLabel = formatWeekRange(start, end);

  // Build chart data for each day of the week
  const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const chartData = daysOfWeek.map((dayName, index) => {
    const targetDate = new Date(start);
    targetDate.setDate(start.getDate() + index);
    const dateStr = toLocalDateString(targetDate);

    const dayData = data.find((d) => d.date === dateStr);
    return {
      dayName,
      date: dateStr,
      lessonCount: dayData?.lessonCount ?? 0,
    };
  });

  // Total lessons for the current week
  const totalLessons = chartData.reduce((sum, d) => sum + d.lessonCount, 0);

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
        <div>
          <CardTitle className="text-base font-semibold text-foreground">
            Teaching Activity
          </CardTitle>
          <p className="mt-1 text-xl font-semibold text-foreground">
            {totalLessons} <span className="text-sm font-medium text-muted-foreground">lessons</span>
          </p>
        </div>
        <span className="text-xs font-medium text-muted-foreground">
          {weekLabel}
        </span>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
            No lessons this week
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <XAxis
                dataKey="dayName"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
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
                  const tooltipData = payload[0].payload;
                  return (
                    <div className="rounded-lg border border-border/60 bg-background px-3 py-2 shadow-lg">
                      <p className="mb-1 text-xs text-muted-foreground">
                        {tooltipData.dayName}
                      </p>
                      <p className="text-sm font-medium text-foreground">
                        {tooltipData.lessonCount} lesson
                        {tooltipData.lessonCount !== 1 ? "s" : ""}
                      </p>
                    </div>
                  );
                }}
              />
              <Bar
                dataKey="lessonCount"
                fill="var(--primary)"
                radius={[8, 8, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
