import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  try {
    const supabase = createServiceRoleClient();
    if (!supabase) {
      return NextResponse.json({ error: "Admin client unavailable" }, { status: 500 });
    }

    const url = new URL(req.url);
    const tutorId = url.searchParams.get("tutorId");
    const days = Number(url.searchParams.get("days") ?? "30");

    // Aggregate totals from payments_audit (bookings + products; refunds are negative)
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const query = supabase
      .from("payments_audit")
      .select("amount_cents, application_fee_cents, created_at, tutor_id")
      .gte("created_at", since)
      .order("created_at", { ascending: false });

    const { data, error } = tutorId ? await query.eq("tutor_id", tutorId) : await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const totals = (data ?? []).reduce(
      (acc, row) => {
        const amount = Number(row.amount_cents ?? 0);
        const fee = Number(row.application_fee_cents ?? 0);
        acc.grossCents += amount > 0 ? amount : 0;
        acc.refundsCents += amount < 0 ? -amount : 0;
        acc.feesCents += fee > 0 ? fee : 0;
        return acc;
      },
      { grossCents: 0, refundsCents: 0, feesCents: 0 }
    );

    const netCents = Math.max(0, totals.grossCents - totals.refundsCents - totals.feesCents);

    return NextResponse.json({
      since,
      grossCents: totals.grossCents,
      refundsCents: totals.refundsCents,
      feesCents: totals.feesCents,
      netCents,
      count: (data ?? []).length,
    });
  } catch (error) {
    console.error("Analytics summary failed", error);
    return NextResponse.json({ error: "Failed to load analytics" }, { status: 500 });
  }
}


