import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { requireAdmin, logAdminAction, getClientIP } from "@/lib/admin/auth";

export async function GET(request: NextRequest) {
  try {
    const adminSession = await requireAdmin(request);

    const supabase = createServiceRoleClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Service unavailable" },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const tutorId = searchParams.get("tutorId");

    // Build query
    let query = supabase
      .from("students")
      .select(`
        id,
        full_name,
        email,
        phone,
        timezone,
        proficiency_level,
        native_language,
        learning_goals,
        notes,
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
      `)
      .order("created_at", { ascending: false });

    if (tutorId) {
      query = query.eq("tutor_id", tutorId);
    }

    const { data: students, error } = await query;

    if (error) throw error;

    // Generate CSV
    const headers = [
      "ID",
      "Student Name",
      "Student Email",
      "Phone",
      "Timezone",
      "Proficiency Level",
      "Native Language",
      "Learning Goals",
      "Notes",
      "Status",
      "Calendar Access",
      "Source",
      "Created At",
      "Tutor ID",
      "Tutor Name",
      "Tutor Email",
    ];

    const rows = (students || []).map((student) => {
      const tutorRaw = Array.isArray(student.profiles) ? student.profiles[0] : student.profiles;
      const tutor = tutorRaw
        ? {
            full_name: tutorRaw.full_name ?? null,
            email: tutorRaw.email ?? "",
            username: tutorRaw.username ?? null,
          }
        : null;
      return [
        student.id,
        student.full_name || "",
        student.email,
        student.phone || "",
        student.timezone || "",
        student.proficiency_level || "",
        student.native_language || "",
        student.learning_goals || "",
        student.notes || "",
        student.status || "",
        student.calendar_access_status || "",
        student.source || "",
        student.created_at ? new Date(student.created_at).toISOString() : "",
        student.tutor_id,
        tutor?.full_name || "",
        tutor?.email || "",
      ];
    });

    const csv = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    // Log the export action
    await logAdminAction(adminSession.adminId, "export_students", {
      metadata: {
        count: students?.length || 0,
        tutorId: tutorId || "all",
      },
      ipAddress: getClientIP(request),
      userAgent: request.headers.get("user-agent") || undefined,
    });

    // Return CSV file
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="students-export-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error("Export students error:", error);

    if (error instanceof Error && error.message.includes("authentication")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Failed to export students" },
      { status: 500 }
    );
  }
}
