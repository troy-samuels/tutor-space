import { createClient } from "@/lib/supabase/server";

async function fetchSummary(tutorId?: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const url = new URL("/api/analytics/payments/summary", baseUrl);
  url.searchParams.set("days", "30");
  if (tutorId) url.searchParams.set("tutorId", tutorId);
  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

export default async function PaymentsAnalyticsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const summary = await fetchSummary(user?.id);

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Payments Analytics</h1>
        <p className="text-gray-600 mt-2">Basic 30-day summary (free tier)</p>
      </div>

      {summary ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-lg border p-4">
            <div className="text-xs text-muted-foreground">Gross</div>
            <div className="text-xl font-semibold">${(summary.grossCents / 100).toFixed(2)}</div>
          </div>
          <div className="rounded-lg border p-4">
            <div className="text-xs text-muted-foreground">Refunds</div>
            <div className="text-xl font-semibold">${(summary.refundsCents / 100).toFixed(2)}</div>
          </div>
          <div className="rounded-lg border p-4">
            <div className="text-xs text-muted-foreground">Fees</div>
            <div className="text-xl font-semibold">${(summary.feesCents / 100).toFixed(2)}</div>
          </div>
          <div className="rounded-lg border p-4">
            <div className="text-xs text-muted-foreground">Net</div>
            <div className="text-xl font-semibold">${(summary.netCents / 100).toFixed(2)}</div>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border p-4 text-sm text-muted-foreground">
          No data yet. Payments will appear here within 24h.
        </div>
      )}
    </div>
  );
}


