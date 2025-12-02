import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { verifyAdminSession } from "@/lib/admin/session";

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("admin_session")?.value;

  const admin = await verifyAdminSession(sessionToken);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const contentType = searchParams.get("content_type");
  const priority = searchParams.get("priority");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = (page - 1) * limit;

  const supabase = createServiceRoleClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Database connection failed" },
      { status: 500 }
    );
  }

  let query = supabase
    .from("content_reports")
    .select(`
      *,
      resolved_admin:resolved_by (
        id,
        email,
        full_name
      )
    `, { count: "exact" });

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  if (contentType && contentType !== "all") {
    query = query.eq("content_type", contentType);
  }

  if (priority && priority !== "all") {
    query = query.eq("priority", priority);
  }

  query = query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  const { data: reports, error, count } = await query;

  if (error) {
    console.error("Error fetching reports:", error);
    return NextResponse.json(
      { error: "Failed to fetch reports" },
      { status: 500 }
    );
  }

  // Get stats
  const { data: stats } = await supabase
    .from("content_reports")
    .select("status, priority")
    .then(({ data }) => {
      if (!data) return { data: null };
      const pending = data.filter((r) => r.status === "pending").length;
      const reviewing = data.filter((r) => r.status === "reviewing").length;
      const urgent = data.filter((r) => r.priority === "urgent" && r.status !== "resolved" && r.status !== "dismissed").length;
      const today = data.filter((r) => {
        const createdAt = new Date((r as { created_at?: string }).created_at || "");
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        return createdAt >= todayStart;
      }).length;

      return {
        data: {
          pending,
          reviewing,
          urgent,
          today,
        },
      };
    });

  return NextResponse.json({
    reports: reports || [],
    total: count || 0,
    stats: stats || { pending: 0, reviewing: 0, urgent: 0, today: 0 },
  });
}

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("admin_session")?.value;

  const admin = await verifyAdminSession(sessionToken);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { reportId, action, value, notes } = body;

  if (!reportId || !action) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const supabase = createServiceRoleClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Database connection failed" },
      { status: 500 }
    );
  }

  // Get current report
  const { data: report, error: fetchError } = await supabase
    .from("content_reports")
    .select("*")
    .eq("id", reportId)
    .single();

  if (fetchError || !report) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  const updateData: Record<string, unknown> = {};
  let previousValue: string | null = null;

  switch (action) {
    case "update_status":
      previousValue = report.status;
      updateData.status = value;
      if (value === "resolved" || value === "dismissed") {
        updateData.resolved_at = new Date().toISOString();
        updateData.resolved_by = admin.id;
      }
      break;

    case "update_priority":
      previousValue = report.priority;
      updateData.priority = value;
      break;

    case "resolve":
      previousValue = report.status;
      updateData.status = "resolved";
      updateData.resolution_action = value;
      updateData.resolution_notes = notes;
      updateData.resolved_at = new Date().toISOString();
      updateData.resolved_by = admin.id;
      break;

    case "dismiss":
      previousValue = report.status;
      updateData.status = "dismissed";
      updateData.resolution_notes = notes;
      updateData.resolved_at = new Date().toISOString();
      updateData.resolved_by = admin.id;
      break;

    case "reopen":
      previousValue = report.status;
      updateData.status = "pending";
      updateData.resolved_at = null;
      updateData.resolved_by = null;
      updateData.resolution_action = null;
      updateData.resolution_notes = null;
      break;

    default:
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  // Update report
  const { error: updateError } = await supabase
    .from("content_reports")
    .update(updateData)
    .eq("id", reportId);

  if (updateError) {
    console.error("Error updating report:", updateError);
    return NextResponse.json(
      { error: "Failed to update report" },
      { status: 500 }
    );
  }

  // Log action
  await supabase.from("moderation_actions").insert({
    report_id: reportId,
    admin_id: admin.id,
    action,
    previous_value: previousValue,
    new_value: value || updateData.status,
    notes,
  });

  return NextResponse.json({ success: true });
}
