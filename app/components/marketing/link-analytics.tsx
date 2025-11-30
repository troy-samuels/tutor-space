"use client";

import { format } from "date-fns";

type LinkAnalyticsProps = {
  series?: Array<{ date: string; count: number }>;
};

export function LinkAnalytics({ series }: LinkAnalyticsProps) {
  if (series === undefined) {
    return (
      <div className="rounded-3xl border border-dashed border-border bg-muted/50 px-5 py-4 text-xs text-muted-foreground">
        Create the <code>link_events</code> table from <strong>01-database-schema.md</strong> to unlock click analytics.
      </div>
    );
  }

  const total = series.reduce((sum, point) => sum + point.count, 0);
  const max = Math.max(...series.map((point) => point.count), 1);

  const width = 240;
  const height = 70;
  const points = series
    .map((point, index) => {
      const x = (index / Math.max(series.length - 1, 1)) * width;
      const y = height - (point.count / max) * (height - 10);
      return `${x},${y}`;
    })
    .join(" ");

  const labels = series.map((point) =>
    format(new Date(point.date), "EEE")
  );

  return (
    <div className="rounded-3xl border border-border bg-white/90 p-5 shadow-sm backdrop-blur">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary/70">Last 7 days</p>
          <p className="text-2xl font-semibold text-foreground">{total}</p>
        </div>
        <span className="text-xs text-muted-foreground">Total clicks</span>
      </header>

      <div className="mt-4">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-24 w-full">
          <polyline
            fill="none"
            stroke="rgba(138, 63, 28, 0.65)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
          />
          {series.map((point, index) => {
            const x = (index / Math.max(series.length - 1, 1)) * width;
            const y = height - (point.count / max) * (height - 10);
            return (
              <circle
                key={point.date}
                cx={x}
                cy={y}
                r={4}
                className="fill-primary/80"
              />
            );
          })}
        </svg>
        <div className="mt-2 flex justify-between text-[11px] uppercase tracking-wide text-muted-foreground">
          {labels.map((label, index) => (
            <span key={`${label}-${index}`}>{label}</span>
          ))}
        </div>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        Monitor which CTAs resonate. Upgrade to Growth later to unlock UTM tracking and lead attribution.
      </p>
    </div>
  );
}
