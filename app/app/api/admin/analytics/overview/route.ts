import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin/auth";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const supabase = createServiceRoleClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Service unavailable" },
        { status: 503 }
      );
    }

    const now = new Date();
    const startOfMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    ).toISOString();
    const thirtyDaysAgo = new Date(
      now.getTime() - 30 * 24 * 60 * 60 * 1000
    ).toISOString();

    // Run queries in parallel for performance
    const [
      tutorCountResult,
      studentCountResult,
      profilesResult,
      bookingsResult,
      revenueResult,
      activeTutorsResult,
    ] = await Promise.all([
      // Total tutors
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("role", "tutor"),

      // Total students
      supabase.from("students").select("id", { count: "exact", head: true }),

      // Subscription distribution
      supabase.from("profiles").select("plan").eq("role", "tutor"),

      // Bookings this month
      supabase
        .from("bookings")
        .select("id, status")
        .gte("created_at", startOfMonth),

      // Revenue this month (from payments_audit)
      supabase
        .from("payments_audit")
        .select("amount_cents, application_fee_cents")
        .gte("created_at", startOfMonth),

      // Active tutors (with bookings in last 30 days)
      supabase
        .from("bookings")
        .select("tutor_id")
        .gte("created_at", thirtyDaysAgo),
    ]);

    // Calculate subscription distribution
    const plans = profilesResult.data || [];
    const subscriptionDistribution = {
      founder: plans.filter((p) => p.plan === "founder_lifetime" || !p.plan).length,
    };

    // Calculate revenue
    const revenueData = revenueResult.data || [];
    const revenue = revenueData.reduce(
      (acc, row) => {
        const amount = Number(row.amount_cents || 0);
        const fee = Number(row.application_fee_cents || 0);
        if (amount > 0) {
          acc.gross += amount;
        } else {
          acc.refunds += Math.abs(amount);
        }
        acc.fees += fee;
        return acc;
      },
      { gross: 0, refunds: 0, fees: 0 }
    );

    // Calculate active tutors (unique tutors with bookings)
    const activeTutorIds = new Set(
      (activeTutorsResult.data || []).map((b) => b.tutor_id)
    );

    // Calculate booking stats
    const bookings = bookingsResult.data || [];
    const bookingStats = {
      total: bookings.length,
      completed: bookings.filter((b) => b.status === "completed").length,
      confirmed: bookings.filter((b) => b.status === "confirmed").length,
      cancelled: bookings.filter((b) => b.status === "cancelled").length,
      pending: bookings.filter((b) => b.status === "pending").length,
    };

    return NextResponse.json({
      tutors: {
        total: tutorCountResult.count || 0,
        active: activeTutorIds.size,
      },
      students: {
        total: studentCountResult.count || 0,
      },
      revenue: {
        grossCents: revenue.gross,
        refundsCents: revenue.refunds,
        feesCents: revenue.fees,
        netCents: revenue.gross - revenue.refunds,
      },
      subscriptions: subscriptionDistribution,
      bookings: bookingStats,
      period: {
        start: startOfMonth,
        end: now.toISOString(),
      },
    });
  } catch (error) {
    console.error("Admin overview API error:", error);

    if (error instanceof Error && error.message.includes("authentication")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
