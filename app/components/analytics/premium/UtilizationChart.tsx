"use client";

import {
  ComposedChart,
  Bar,
  Line,
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

export function UtilizationChart({
  data,
  isLoading,
  onHoverChange,
  dimmed,
}: UtilizationChartProps) {
  const lessonsColor = "var(--primary)";
  const studentsColor = "var(--muted-foreground)";
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

  // Format date for display
  const chartData = data.map((d) => {
    const date = new Date(d.date);
    return {
      ...d,
      displayDate: date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
    };
  });

  // Aggregate totals for header
  const totalLessons = data.reduce((sum, d) => sum + d.lessonCount, 0);

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
        <div className="flex gap-3 text-xs font-semibold text-muted-foreground">
          <span className="flex items-center gap-1 rounded-full bg-muted/50 px-2 py-1">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: lessonsColor }} />
            Lessons
          </span>
          <span className="flex items-center gap-1 rounded-full bg-muted/40 px-2 py-1">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: studentsColor }} />
            Students
          </span>
        </div>
      </CardHeader>
      <CardContent className="mt-0 px-5 pb-6">
        <ResponsiveContainer width="100%" height={230}>
          <ComposedChart
            data={chartData}
            margin={{ top: 10, right: 16, left: -6, bottom: 0 }}
          >
            <XAxis
              dataKey="displayDate"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: axisColor }}
              interval="preserveStartEnd"
            />
            <YAxis
              yAxisId="left"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: axisColor }}
              width={40}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: axisColor }}
              width={40}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                fontSize: "12px",
              }}
              formatter={(value: number, name: string) => [
                value,
                name === "lessonCount" ? "Lessons" : "Active Students",
              ]}
              labelFormatter={(label) => label}
            />
            <Bar
              yAxisId="left"
              dataKey="lessonCount"
              fill={lessonsColor}
              radius={[8, 8, 8, 8]}
              maxBarSize={20}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="activeStudentCount"
              stroke={studentsColor}
              strokeWidth={2.2}
              dot={false}
              activeDot={{ r: 4, fill: studentsColor }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
