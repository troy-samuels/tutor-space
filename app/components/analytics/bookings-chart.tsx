"use client";

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { BookingsByPeriod } from "@/lib/data/analytics-metrics";

interface BookingsChartProps {
  data: BookingsByPeriod[];
  isLoading?: boolean;
  onHoverChange?: (hovering: boolean) => void;
  dimmed?: boolean;
}

export function BookingsChart({ data, isLoading, onHoverChange, dimmed }: BookingsChartProps) {
  const totalCompleted = data.reduce((sum, d) => sum + d.completed, 0);

  if (isLoading) {
    return (
      <Card className="rounded-3xl border border-border/60 bg-white/90 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">
            Lessons by Week
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
      className={cn(
        "rounded-3xl border border-border/60 bg-white/90 shadow-sm transition-opacity duration-200",
        dimmed && "opacity-80"
      )}
      onMouseEnter={() => onHoverChange?.(true)}
      onMouseLeave={() => onHoverChange?.(false)}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-semibold text-foreground">
          Lessons by Week
        </CardTitle>
        <span className="text-sm text-muted-foreground">
          {totalCompleted} completed
        </span>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
            No lesson data for this period
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <XAxis
                dataKey="period"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                width={30}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const data = payload[0].payload;
                  return (
                    <div className="rounded-lg border border-border/60 bg-background px-3 py-2 shadow-lg">
                      <p className="text-xs font-medium text-foreground">{data.period}</p>
                      <div className="mt-1 space-y-0.5 text-xs">
                        <p className="text-emerald-600">Completed: {data.completed}</p>
                        <p className="text-amber-600">Pending: {data.pending}</p>
                        <p className="text-red-600">Cancelled: {data.cancelled}</p>
                      </div>
                    </div>
                  );
                }}
              />
              <Bar
                dataKey="completed"
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
