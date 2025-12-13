"use client";

import type { ReactNode } from "react";
import { DollarSign, CalendarCheck, Users, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCountUp } from "@/lib/hooks/useCountUp";

interface OverviewData {
  revenue: number;
  lessons: number;
  students: number;
  retentionRate: number;
}

interface OverviewCardsProps {
  data: OverviewData | null;
  isLoading?: boolean;
}

export function OverviewCards({ data, isLoading }: OverviewCardsProps) {
  // Animated values for "big numbers"
  const animatedRevenue = useCountUp(data?.revenue ?? 0, 1200);
  const animatedStudents = useCountUp(data?.students ?? 0, 1000);
  const animatedLessons = useCountUp(data?.lessons ?? 0, 1000);
  const animatedRetention = useCountUp(data?.retentionRate ?? 0, 1000);

  const cards = [
    {
      icon: <DollarSign className="h-5 w-5 text-emerald-600" />,
      label: "Revenue",
      value: `$${animatedRevenue.toLocaleString()}`,
      helper: "Total for period",
      bgColor: "bg-emerald-50",
    },
    {
      icon: <CalendarCheck className="h-5 w-5 text-blue-600" />,
      label: "Lessons",
      value: animatedLessons,
      helper: "Completed sessions",
      bgColor: "bg-blue-50",
    },
    {
      icon: <Users className="h-5 w-5 text-purple-600" />,
      label: "Students",
      value: animatedStudents,
      helper: "Active learners",
      bgColor: "bg-purple-50",
    },
    {
      icon: <TrendingUp className="h-5 w-5 text-amber-600" />,
      label: "Retention",
      value: `${animatedRetention}%`,
      helper: "Students returning",
      bgColor: "bg-amber-50",
    },
  ];

  if (isLoading) {
    return (
      <div data-testid="overview-cards-loading" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="rounded-3xl border border-border/60 bg-white/90 shadow-sm">
            <CardHeader className="pb-2">
              <div className="h-4 w-24 animate-pulse rounded bg-muted/40" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-20 animate-pulse rounded bg-muted/40" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div data-testid="overview-cards" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <OverviewCard key={card.label} {...card} />
      ))}
    </div>
  );
}

function OverviewCard({
  icon,
  label,
  value,
  helper,
  bgColor,
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
  helper: string;
  bgColor: string;
}) {
  const testId = `metric-card-${label.toLowerCase()}`;
  return (
    <Card data-testid={testId} className="flex h-full flex-col rounded-3xl border border-border/60 bg-white/90 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 px-4 pt-4 pb-2">
        <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </CardTitle>
        <div className={`rounded-full p-1.5 ${bgColor}`}>{icon}</div>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0">
        <p data-testid={`${testId}-value`} className="text-2xl font-semibold leading-tight text-foreground">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
      </CardContent>
    </Card>
  );
}
