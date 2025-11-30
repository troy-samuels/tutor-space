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
    const search = searchParams.get("search");
    const status = searchParams.get("status");
    const tutorId = searchParams.get("tutorId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from("students")
      .select(
        `
        id,
        full_name,
        email,
        phone,
        timezone,
        status,
        calendar_access_status,
        source,
        created_at,
        tutor_id,
        profiles!tutor_id (
          full_name,
          email,
          username
        )
      `,
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    if (tutorId) {
      query = query.eq("tutor_id", tutorId);
    }

    const { data: students, count, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      students: students || [],
      total: count || 0,
      page,
      limit,
    });
  } catch (error) {
    console.error("Admin students list error:", error);

    if (error instanceof Error && error.message.includes("authentication")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Failed to fetch students" },
      { status: 500 }
    );
  }
}
