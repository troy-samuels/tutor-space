import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);

    const { id } = await params;

    const supabase = createServiceRoleClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Service unavailable" },
        { status: 503 }
      );
    }

    // Fetch tutor profile
    const { data: tutor, error: tutorError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single();

    if (tutorError || !tutor) {
      return NextResponse.json({ error: "Tutor not found" }, { status: 404 });
    }

    // Get dates for queries
    const now = new Date();
    const startOfMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    ).toISOString();
    const thirtyDaysAgo = new Date(
      now.getTime() - 30 * 24 * 60 * 60 * 1000
    ).toISOString();

    // Fetch additional data in parallel
    const [
      studentsResult,
      bookingsResult,
      servicesResult,
      revenueResult,
      recentBookingsResult,
    ] = await Promise.all([
      // Students
      supabase
        .from("students")
        .select("id, full_name, email, status, created_at", { count: "exact" })
        .eq("tutor_id", id)
        .order("created_at", { ascending: false })
        .limit(10),

      // Booking stats
      supabase
        .from("bookings")
        .select("id, status, created_at")
        .eq("tutor_id", id),

      // Services
      supabase
        .from("services")
        .select("id, name, duration_minutes, price, currency, is_active")
        .eq("tutor_id", id),

      // Revenue
      supabase
        .from("payments_audit")
        .select("amount_cents, created_at")
        .eq("tutor_id", id),

      // Recent bookings
      supabase
        .from("bookings")
        .select(
          `
          id,
          scheduled_at,
          duration_minutes,
          status,
          payment_status,
          payment_amount,
          currency,
          students!inner(full_name, email)
        `
        )
        .eq("tutor_id", id)
        .order("scheduled_at", { ascending: false })
        .limit(10),
    ]);

    // Calculate booking stats
    const allBookings = bookingsResult.data || [];
    const bookingStats = {
      total: allBookings.length,
      completed: allBookings.filter((b) => b.status === "completed").length,
      confirmed: allBookings.filter((b) => b.status === "confirmed").length,
      cancelled: allBookings.filter((b) => b.status === "cancelled").length,
      pending: allBookings.filter((b) => b.status === "pending").length,
      thisMonth: allBookings.filter((b) => b.created_at >= startOfMonth).length,
    };

    // Calculate revenue stats
    const allRevenue = revenueResult.data || [];
    const revenueStats = {
      total: 0,
      thisMonth: 0,
      last30Days: 0,
    };

    allRevenue.forEach((r) => {
      const amount = Number(r.amount_cents || 0);
      if (amount > 0) {
        revenueStats.total += amount;
        if (r.created_at >= startOfMonth) {
          revenueStats.thisMonth += amount;
        }
        if (r.created_at >= thirtyDaysAgo) {
          revenueStats.last30Days += amount;
        }
      }
    });

    return NextResponse.json({
      tutor,
      students: {
        list: studentsResult.data || [],
        total: studentsResult.count || 0,
      },
      bookings: {
        stats: bookingStats,
        recent: recentBookingsResult.data || [],
      },
      services: servicesResult.data || [],
      revenue: revenueStats,
    });
  } catch (error) {
    console.error("Admin tutor detail API error:", error);

    if (error instanceof Error && error.message.includes("authentication")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
