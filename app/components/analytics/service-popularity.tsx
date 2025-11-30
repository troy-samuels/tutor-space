"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ServicePopularity } from "@/lib/data/analytics-metrics";

interface ServicePopularityChartProps {
  data: ServicePopularity[];
  isLoading?: boolean;
}

export function ServicePopularityChart({ data, isLoading }: ServicePopularityChartProps) {
  if (isLoading) {
    return (
      <Card className="rounded-3xl border border-border/60 bg-white/90 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">
            Popular Services
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 animate-pulse rounded-lg bg-muted/40" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-3xl border border-border/60 bg-white/90 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-foreground">
          Popular Services
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground">No service data for this period</p>
        ) : (
          <div className="space-y-3">
            {data.map((service, index) => (
              <div key={service.serviceName} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span
                    className="font-medium text-foreground truncate max-w-[180px]"
                    title={service.serviceName}
                  >
                    {service.serviceName}
                  </span>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{service.bookingCount} bookings</span>
                    <span className="font-semibold text-foreground">{service.percentage}%</span>
                  </div>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted/40">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${service.percentage}%`,
                      backgroundColor: getBarColor(index),
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function getBarColor(index: number): string {
  const colors = [
    "hsl(var(--primary))",
    "hsl(210, 100%, 50%)",
    "hsl(280, 100%, 60%)",
    "hsl(160, 100%, 40%)",
    "hsl(30, 100%, 50%)",
  ];
  return colors[index % colors.length];
}
