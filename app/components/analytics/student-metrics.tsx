"use client";

import { Users, UserPlus, UserCheck, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { StudentMetrics } from "@/lib/data/analytics-metrics";

interface StudentMetricsCardProps {
  data: StudentMetrics | null;
  isLoading?: boolean;
  dimmed?: boolean;
}

export function StudentMetricsCard({ data, isLoading, dimmed }: StudentMetricsCardProps) {
  if (isLoading) {
    return (
      <Card className="rounded-3xl border border-border/60 bg-white/90 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">
            Student Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 animate-pulse rounded-lg bg-muted/40" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="rounded-3xl border border-border/60 bg-white/90 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">
            Student Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No student data available</p>
        </CardContent>
      </Card>
    );
  }

  const metrics = [
    {
      icon: Users,
      label: "Total Students",
      value: data.totalStudents,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      icon: UserPlus,
      label: "New Students",
      value: data.newStudents,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      icon: UserCheck,
      label: "Returning",
      value: data.returningStudents,
      subtext: `${data.retentionRate}% retention`,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      icon: AlertTriangle,
      label: "Churn Risk",
      value: data.churnRiskStudents,
      subtext: "30+ days inactive",
      color: "text-amber-600",
      bgColor: "bg-amber-50",
    },
  ];

  return (
    <Card
      className={cn(
        "rounded-3xl border border-border/60 bg-white/90 shadow-sm transition-opacity duration-200",
        dimmed && "opacity-80"
      )}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-foreground">
          Student Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="flex items-center justify-between rounded-2xl border border-border/60 bg-muted/30 px-3 py-2"
          >
            <div className="flex items-center gap-2.5">
              <div className={`rounded-full p-1.5 ${metric.bgColor}`}>
                <metric.icon className={`h-3.5 w-3.5 ${metric.color}`} />
              </div>
              <div>
                <p className="text-xs font-medium text-foreground">{metric.label}</p>
                {metric.subtext && (
                  <p className="text-xs text-muted-foreground">{metric.subtext}</p>
                )}
              </div>
            </div>
            <span className="text-lg font-semibold text-foreground">{metric.value}</span>
          </div>
        ))}
        <div className="mt-3 rounded-2xl border border-border/60 bg-primary/5 px-3 py-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">Avg. lessons per student</p>
            <span className="text-lg font-semibold text-primary">{data.avgLessonsPerStudent}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
