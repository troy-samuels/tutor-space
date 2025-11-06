export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-foreground">Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Monitor bookings, revenue, and student outcomes once data connections are wired up.
        </p>
      </header>

      <section className="rounded-3xl border border-brand-brown/20 bg-white/80 p-6 shadow-sm backdrop-blur">
        <h2 className="text-base font-semibold text-foreground">Performance dashboard</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Conversion funnels, lesson completion rates, and marketing attribution reports will appear
          here when analytics instrumentation is enabled.
        </p>
        <p className="mt-4 rounded-2xl border border-dashed border-brand-brown/30 bg-brand-brown/5 px-4 py-3 text-xs text-muted-foreground">
          TODO: hydrate with Supabase materialized views once tracking events from `11-email-system.md`
          and `12-analytics-tracking.md` are implemented.
        </p>
      </section>
    </div>
  );
}
