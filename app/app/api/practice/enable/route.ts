import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import {
  getTutorHasPracticeAccess,
  getStudentPracticeAccess,
} from "@/lib/practice/access";

/**
 * POST /api/practice/enable
 * Enables free tier AI Practice for a student (no Stripe required)
 * Access gate: Tutor must have Studio tier subscription
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const adminClient = createServiceRoleClient();

    if (!adminClient) {
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { studentId } = await request.json();

    if (!studentId) {
      return NextResponse.json({ error: "Student ID required" }, { status: 400 });
    }

    // Verify student belongs to the authenticated user
    const { data: student } = await supabase
      .from("students")
      .select(`
        *,
        profiles:tutor_id (
          id,
          full_name
        )
      `)
      .eq("id", studentId)
      .eq("user_id", user.id)
      .single();

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    if (!student.tutor_id) {
      return NextResponse.json({ error: "No tutor assigned" }, { status: 400 });
    }

    const hasPracticeColumns = Object.prototype.hasOwnProperty.call(
      student,
      "ai_practice_free_tier_enabled"
    );

    if (!hasPracticeColumns) {
      return NextResponse.json(
        { error: "AI Practice is not configured for this environment." },
        { status: 503 }
      );
    }

    // Check if already enabled
    if (student.ai_practice_free_tier_enabled) {
      return NextResponse.json({
        success: true,
        alreadyEnabled: true,
        message: "AI Practice is already enabled",
      });
    }

    // Check if tutor has Studio tier
    const tutorHasStudio = await getTutorHasPracticeAccess(
      adminClient,
      student.tutor_id
    );

    if (!tutorHasStudio) {
      const profileRaw = Array.isArray(student.profiles)
        ? student.profiles[0]
        : student.profiles;
      const tutorName = profileRaw?.full_name || "Your tutor";
      return NextResponse.json(
        {
          error: `${tutorName} needs a Studio subscription to enable AI Practice for students`,
          code: "TUTOR_NOT_STUDIO",
          tutorNeedsStudio: true,
        },
        { status: 403 }
      );
    }

    // Enable free tier access (no Stripe)
    const { error: updateError } = await adminClient
      .from("students")
      .update({
        ai_practice_enabled: true,
        ai_practice_free_tier_enabled: true,
        ai_practice_free_tier_started_at: new Date().toISOString(),
      })
      .eq("id", studentId);

    if (updateError) {
      console.error("[Practice Enable] Failed to enable:", updateError);
      return NextResponse.json(
        { error: "Failed to enable access" },
        { status: 500 }
      );
    }

    // Create initial usage period using the new DB function
    const { data: usagePeriod, error: periodError } = await adminClient.rpc(
      "get_or_create_free_usage_period",
      {
        p_student_id: studentId,
        p_tutor_id: student.tutor_id,
      }
    );

    if (periodError) {
      console.error("[Practice Enable] Failed to create usage period:", periodError);
      // Don't fail the request - the student can still use the service
    }

    return NextResponse.json({
      success: true,
      isFreeUser: true,
      usagePeriod: usagePeriod || null,
      message: "AI Practice enabled successfully",
    });
  } catch (error) {
    console.error("[Practice Enable] Error:", error);
    return NextResponse.json(
      { error: "Failed to enable AI Practice" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/practice/enable
 * Checks if AI Practice can be enabled for the current student
 * Returns tutor Studio status and current access state
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const adminClient = createServiceRoleClient();

    if (!adminClient) {
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get student record
    const { data: student } = await supabase
      .from("students")
      .select("id, tutor_id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (!student) {
      return NextResponse.json(
        { error: "Student record not found" },
        { status: 404 }
      );
    }

    // Get full access status
    const accessStatus = await getStudentPracticeAccess(adminClient, student.id);

    return NextResponse.json({
      canEnable: accessStatus.hasAccess,
      reason: accessStatus.reason,
      tutorName: accessStatus.tutorName,
      isFreeUser: accessStatus.isFreeUser,
    });
  } catch (error) {
    console.error("[Practice Enable Check] Error:", error);
    return NextResponse.json(
      { error: "Failed to check access" },
      { status: 500 }
    );
  }
}
