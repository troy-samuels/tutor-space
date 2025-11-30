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
    const plan = searchParams.get("plan");

    // Build query
    let query = supabase
      .from("profiles")
      .select(`
        id,
        full_name,
        email,
        username,
        plan,
        stripe_account_id,
        stripe_charges_enabled,
        created_at,
        onboarding_completed,
        timezone,
        languages_taught,
        languages_spoken,
        video_conferencing_url
      `)
      .eq("role", "tutor")
      .order("created_at", { ascending: false });

    if (plan && plan !== "all") {
      query = query.eq("plan", plan);
    }

    const { data: tutors, error } = await query;

    if (error) throw error;

    // Generate CSV
    const headers = [
      "ID",
      "Full Name",
      "Email",
      "Username",
      "Plan",
      "Stripe Connected",
      "Stripe Charges Enabled",
      "Created At",
      "Onboarding Completed",
      "Timezone",
      "Languages Taught",
      "Languages Spoken",
      "Video URL",
    ];

    const rows = (tutors || []).map((tutor) => [
      tutor.id,
      tutor.full_name || "",
      tutor.email,
      tutor.username || "",
      tutor.plan || "founder_lifetime",
      tutor.stripe_account_id ? "Yes" : "No",
      tutor.stripe_charges_enabled ? "Yes" : "No",
      tutor.created_at ? new Date(tutor.created_at).toISOString() : "",
      tutor.onboarding_completed ? "Yes" : "No",
      tutor.timezone || "",
      Array.isArray(tutor.languages_taught)
        ? tutor.languages_taught.join("; ")
        : "",
      Array.isArray(tutor.languages_spoken)
        ? tutor.languages_spoken.join("; ")
        : "",
      tutor.video_conferencing_url || "",
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    // Log the export action
    await logAdminAction(adminSession.adminId, "export_tutors", {
      metadata: {
        count: tutors?.length || 0,
        filter: plan || "all",
      },
      ipAddress: getClientIP(request),
      userAgent: request.headers.get("user-agent") || undefined,
    });

    // Return CSV file
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="tutors-export-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error("Export tutors error:", error);

    if (error instanceof Error && error.message.includes("authentication")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Failed to export tutors" },
      { status: 500 }
    );
  }
}
