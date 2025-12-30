"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { EngagementDataPoint } from "@/lib/data/analytics-metrics";

interface UtilizationChartProps {
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

export function UtilizationChart({
  data,
  isLoading,
  onHoverChange,
  dimmed,
}: UtilizationChartProps) {
  const lessonsColor = "var(--primary)";
  const axisColor = "var(--muted-foreground)";

  if (isLoading) {
    return (
      <Card className="rounded-[24px] border border-border/50 bg-white/70 shadow-sm backdrop-blur">
        <CardHeader className="pb-2">
          <div className="h-3 w-32 animate-pulse rounded bg-muted/40" />
        </CardHeader>
        <CardContent>
          <div className="h-[220px] w-full animate-pulse rounded bg-muted/20" />
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
      className={cn(
        "rounded-[24px] border border-border/50 bg-white/80 shadow-[0_10px_30px_rgba(0,0,0,0.04)] transition-all hover:shadow-lg backdrop-blur",
        dimmed && "opacity-60"
      )}
      onMouseEnter={() => onHoverChange?.(true)}
      onMouseLeave={() => onHoverChange?.(false)}
    >
      <CardHeader className="flex flex-row items-center justify-between px-5 pt-5 pb-3">
        <div>
          <CardTitle className="text-sm font-semibold tracking-tight text-muted-foreground">
            Teaching Activity
          </CardTitle>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
            {totalLessons} <span className="text-sm font-medium text-muted-foreground">lessons</span>
          </p>
        </div>
        <span className="text-xs font-medium text-muted-foreground">
          {weekLabel}
        </span>
      </CardHeader>
      <CardContent className="mt-0 px-5 pb-6">
        <ResponsiveContainer width="100%" height={230}>
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 16, left: -6, bottom: 0 }}
          >
            <XAxis
              dataKey="dayName"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: axisColor }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: axisColor }}
              width={40}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                fontSize: "12px",
              }}
              formatter={(value: number) => [value, "Lessons"]}
              labelFormatter={(label) => label}
            />
            <Bar
              dataKey="lessonCount"
              fill={lessonsColor}
              radius={[8, 8, 0, 0]}
              maxBarSize={40}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
