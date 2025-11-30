import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getRevenueOverTime,
  getStudentMetrics,
  getBookingMetrics,
  getServicePopularity,
  getBookingsByPeriod,
  getTotalRevenue,
} from "@/lib/data/analytics-metrics";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const tutorIdParam = url.searchParams.get("tutorId");
    const days = Number(url.searchParams.get("days") ?? "30");

    // Only allow tutors to see their own data (or allow admin to see any)
    const tutorId = tutorIdParam === user.id ? tutorIdParam : user.id;

    // Fetch all metrics in parallel
    const [revenue, studentMetrics, bookingMetrics, servicePopularity, bookingsByPeriod, totalRevenue] =
      await Promise.all([
        getRevenueOverTime(tutorId, days, supabase),
        getStudentMetrics(tutorId, days, supabase),
        getBookingMetrics(tutorId, days, supabase),
        getServicePopularity(tutorId, days, supabase),
        getBookingsByPeriod(tutorId, days, supabase),
        getTotalRevenue(tutorId, days, supabase),
      ]);

    return NextResponse.json({
      revenue,
      studentMetrics,
      bookingMetrics,
      servicePopularity,
      bookingsByPeriod,
      totalRevenue,
    });
  } catch (error) {
    console.error("Error fetching tutor metrics:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
