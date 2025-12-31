"use client";

import { Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { StudentMetrics } from "@/lib/data/analytics-metrics";
import type { RevenueSourceBreakdown } from "@/lib/types/analytics-premium";

interface StudentsCardProps {
  studentMetrics: StudentMetrics | null;
  revenueBreakdown: RevenueSourceBreakdown;
  isLoading?: boolean;
}

export function StudentsCard({
  studentMetrics,
  revenueBreakdown,
  isLoading,
}: StudentsCardProps) {
  if (isLoading) {
    return (
      <Card className="rounded-[24px] border border-border/50 bg-white/80 shadow-[0_10px_30px_rgba(0,0,0,0.04)] backdrop-blur">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div className="space-y-3">
              <div className="h-3 w-16 animate-pulse rounded bg-muted/40" />
              <div className="h-8 w-12 animate-pulse rounded bg-muted/40" />
              <div className="h-3 w-32 animate-pulse rounded bg-muted/30" />
            </div>
            <div className="h-10 w-10 animate-pulse rounded-xl bg-muted/30" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const activeStudents =
    studentMetrics?.totalStudents ??
    revenueBreakdown.totalActiveStudents ??
    0;
  const newStudents = studentMetrics?.newStudents ?? 0;
  const retentionRate = studentMetrics?.retentionRate ?? 0;

  return (
    <Card className="rounded-[24px] border border-border/50 bg-white/80 shadow-[0_10px_30px_rgba(0,0,0,0.04)] backdrop-blur transition-shadow hover:shadow-lg">
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Students
            </p>
            <p className="mt-1 text-3xl font-semibold tracking-tight text-foreground">
              {activeStudents}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {newStudents > 0 && (
                <>
                  <span className="font-medium text-primary">+{newStudents}</span> new
                  {" "}&middot;{" "}
                </>
              )}
              <span className="font-medium text-foreground">{retentionRate}%</span> retention
            </p>
          </div>
          <div className="rounded-xl border border-primary/15 bg-primary/10 p-2.5 text-primary">
            <Users className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
