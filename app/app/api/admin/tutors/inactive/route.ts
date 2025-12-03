import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin/auth";

const INACTIVE_DAYS_THRESHOLD = 14;

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

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || String(INACTIVE_DAYS_THRESHOLD));

    // Calculate the cutoff date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // Get count of inactive tutors (for alert badge)
    const { count: inactiveCount, error: countError } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "tutor")
      .or(`last_login_at.lt.${cutoffDate.toISOString()},last_login_at.is.null`);

    if (countError) {
      console.error("Error counting inactive tutors:", countError);
      return NextResponse.json(
        { error: "Failed to count inactive tutors" },
        { status: 500 }
      );
    }

    // Get total tutor count for context
    const { count: totalCount } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "tutor");

    return NextResponse.json({
      inactiveCount: inactiveCount || 0,
      totalCount: totalCount || 0,
      thresholdDays: days,
      cutoffDate: cutoffDate.toISOString(),
    });
  } catch (error) {
    console.error("Admin inactive tutors API error:", error);

    if (error instanceof Error && error.message.includes("authentication")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
