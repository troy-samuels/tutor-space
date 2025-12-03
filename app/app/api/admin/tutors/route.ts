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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const search = searchParams.get("search") || "";
    const plan = searchParams.get("plan") || "";
    const stripeStatus = searchParams.get("stripeStatus") || "";
    const activity = searchParams.get("activity") || "";
    const sortBy = searchParams.get("sortBy") || "created_at";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from("profiles")
      .select(
        `
        id,
        email,
        full_name,
        username,
        avatar_url,
        plan,
        role,
        stripe_account_id,
        stripe_charges_enabled,
        stripe_onboarding_status,
        onboarding_completed,
        timezone,
        created_at,
        updated_at,
        last_login_at
      `,
        { count: "exact" }
      )
      .eq("role", "tutor");

    // Apply filters
    if (search) {
      query = query.or(
        `full_name.ilike.%${search}%,email.ilike.%${search}%,username.ilike.%${search}%`
      );
    }

    if (plan) {
      query = query.eq("plan", plan);
    }

    if (stripeStatus) {
      if (stripeStatus === "connected") {
        query = query.eq("stripe_charges_enabled", true);
      } else if (stripeStatus === "pending") {
        query = query
          .not("stripe_account_id", "is", null)
          .eq("stripe_charges_enabled", false);
      } else if (stripeStatus === "none") {
        query = query.is("stripe_account_id", null);
      }
    }

    // Apply activity filter
    if (activity) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 14); // 14 days threshold

      if (activity === "inactive") {
        // Tutors who haven't logged in for 14+ days OR never logged in
        query = query.or(
          `last_login_at.lt.${cutoffDate.toISOString()},last_login_at.is.null`
        );
      } else if (activity === "active") {
        // Tutors who logged in within the last 14 days
        query = query.gte("last_login_at", cutoffDate.toISOString());
      } else if (activity === "never") {
        // Tutors who have never logged in
        query = query.is("last_login_at", null);
      }
    }

    // Apply sorting
    const validSortColumns = [
      "created_at",
      "full_name",
      "email",
      "plan",
      "updated_at",
      "last_login_at",
    ];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : "created_at";
    query = query.order(sortColumn, {
      ascending: sortOrder === "asc",
    });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: tutors, error, count } = await query;

    if (error) {
      console.error("Error fetching tutors:", error);
      return NextResponse.json(
        { error: "Failed to fetch tutors" },
        { status: 500 }
      );
    }

    // Get student counts for each tutor
    const tutorIds = tutors?.map((t) => t.id) || [];
    const { data: studentCounts } = await supabase
      .from("students")
      .select("tutor_id")
      .in("tutor_id", tutorIds);

    // Count students per tutor
    const studentCountMap: Record<string, number> = {};
    studentCounts?.forEach((s) => {
      studentCountMap[s.tutor_id] = (studentCountMap[s.tutor_id] || 0) + 1;
    });

    // Get 30-day revenue for each tutor (if payments_audit exists)
    const thirtyDaysAgo = new Date(
      Date.now() - 30 * 24 * 60 * 60 * 1000
    ).toISOString();
    const { data: revenueData } = await supabase
      .from("payments_audit")
      .select("tutor_id, amount_cents")
      .in("tutor_id", tutorIds)
      .gte("created_at", thirtyDaysAgo);

    // Sum revenue per tutor
    const revenueMap: Record<string, number> = {};
    revenueData?.forEach((r) => {
      const amount = Number(r.amount_cents || 0);
      if (amount > 0) {
        revenueMap[r.tutor_id] = (revenueMap[r.tutor_id] || 0) + amount;
      }
    });

    // Enrich tutors with counts
    const enrichedTutors = tutors?.map((tutor) => ({
      ...tutor,
      studentCount: studentCountMap[tutor.id] || 0,
      revenue30d: revenueMap[tutor.id] || 0,
    }));

    return NextResponse.json({
      tutors: enrichedTutors,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error("Admin tutors API error:", error);

    if (error instanceof Error && error.message.includes("authentication")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
