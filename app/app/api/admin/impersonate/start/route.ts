import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { requireAdmin, logAdminAction, getClientIP } from "@/lib/admin/auth";
import {
  createImpersonationSession,
  setImpersonationCookie,
} from "@/lib/admin/impersonation";

export async function POST(request: NextRequest) {
  try {
    const adminSession = await requireAdmin(request);

    const supabase = createServiceRoleClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Service unavailable" },
        { status: 503 }
      );
    }

    const { tutorId, reason } = await request.json();

    if (!tutorId || !reason) {
      return NextResponse.json(
        { error: "Tutor ID and reason are required" },
        { status: 400 }
      );
    }

    if (reason.trim().length < 5) {
      return NextResponse.json(
        { error: "Please provide a detailed reason (at least 5 characters)" },
        { status: 400 }
      );
    }

    // Get tutor details
    const { data: tutor, error: tutorError } = await supabase
      .from("profiles")
      .select("id, full_name, email, role")
      .eq("id", tutorId)
      .single();

    if (tutorError || !tutor) {
      return NextResponse.json({ error: "Tutor not found" }, { status: 404 });
    }

    if (tutor.role !== "tutor") {
      return NextResponse.json(
        { error: "Can only impersonate tutors" },
        { status: 400 }
      );
    }

    // Create impersonation session record
    const { data: sessionRecord, error: sessionError } = await supabase
      .from("impersonation_sessions")
      .insert({
        admin_user_id: adminSession.adminId,
        tutor_id: tutorId,
        reason: reason.trim(),
        is_active: true,
      })
      .select()
      .single();

    if (sessionError || !sessionRecord) {
      console.error("Error creating impersonation session:", sessionError);
      return NextResponse.json(
        { error: "Failed to create impersonation session" },
        { status: 500 }
      );
    }

    // Log the action
    await logAdminAction(adminSession.adminId, "impersonate_start", {
      targetType: "tutor",
      targetId: tutorId,
      metadata: {
        tutorEmail: tutor.email,
        reason: reason.trim(),
        sessionId: sessionRecord.id,
      },
      ipAddress: getClientIP(request),
      userAgent: request.headers.get("user-agent") || undefined,
    });

    // Create impersonation cookie
    const impersonationToken = await createImpersonationSession({
      adminId: adminSession.adminId,
      adminEmail: adminSession.email,
      tutorId: tutor.id,
      tutorName: tutor.full_name || tutor.email,
      sessionId: sessionRecord.id,
      reason: reason.trim(),
    });

    await setImpersonationCookie(impersonationToken);

    return NextResponse.json({
      success: true,
      redirect: "/dashboard",
      tutor: {
        id: tutor.id,
        name: tutor.full_name,
        email: tutor.email,
      },
    });
  } catch (error) {
    console.error("Impersonation start error:", error);

    if (error instanceof Error && error.message.includes("authentication")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Failed to start impersonation" },
      { status: 500 }
    );
  }
}
