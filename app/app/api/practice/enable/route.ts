import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { errorResponse } from "@/lib/api/error-responses";
import { getStudentPracticeAccess } from "@/lib/practice/access";

/**
 * Marks the authenticated student as enabled for legacy free-tier flags.
 *
 * Practice access is now tier-driven for all students, but this endpoint is
 * retained for backward compatibility with existing clients.
 */
export async function POST(request: Request) {
  const requestId = randomUUID();
  const respondError = (message: string, status: number, code: string) =>
    errorResponse(message, { status, code, extra: { requestId } });

  try {
    const supabase = await createClient();
    const adminClient = createServiceRoleClient();

    if (!adminClient) {
      return respondError("Service unavailable", 503, "SERVICE_UNAVAILABLE");
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return respondError("Unauthorized", 401, "UNAUTHORIZED");
    }

    const payload = await parseEnablePayload(request);
    if (!payload.success) {
      return respondError("Student ID required", 400, "INVALID_INPUT");
    }

    const { studentId } = payload;
    const { data: student, error: studentError } = await adminClient
      .from("students")
      .select("id, user_id")
      .eq("id", studentId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (studentError) {
      console.error("[Practice Enable] Failed to load student:", studentError);
      return respondError("Failed to load student", 500, "DATABASE_ERROR");
    }

    if (!student) {
      return respondError("Student not found", 404, "STUDENT_NOT_FOUND");
    }

    const { error: updateError } = await adminClient
      .from("students")
      .update({
        ai_practice_enabled: true,
        ai_practice_free_tier_enabled: true,
        ai_practice_free_tier_started_at: new Date().toISOString(),
      })
      .eq("id", studentId);

    if (updateError) {
      console.error("[Practice Enable] Failed to update student:", updateError);
      return respondError("Failed to enable access", 500, "DATABASE_ERROR");
    }

    const access = await getStudentPracticeAccess(adminClient, studentId);
    if (!access.hasAccess) {
      const status = access.reason === "student_not_found" ? 404 : 500;
      return respondError(access.message, status, access.reason.toUpperCase());
    }

    return NextResponse.json({
      success: true,
      tier: access.tier,
      showUpgradePrompt: access.showUpgradePrompt,
      upgradePriceCents: access.upgradePrice,
      isFreeUser: access.isFreeUser,
    });
  } catch (error) {
    console.error("[Practice Enable] Error:", error);
    return respondError("Failed to enable AI Practice", 500, "INTERNAL_ERROR");
  }
}

/**
 * Returns current practice availability for the authenticated student.
 */
export async function GET() {
  const requestId = randomUUID();
  const respondError = (message: string, status: number, code: string) =>
    errorResponse(message, { status, code, extra: { requestId } });

  try {
    const supabase = await createClient();
    const adminClient = createServiceRoleClient();

    if (!adminClient) {
      return respondError("Service unavailable", 503, "SERVICE_UNAVAILABLE");
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return respondError("Unauthorized", 401, "UNAUTHORIZED");
    }

    const { data: student, error: studentError } = await adminClient
      .from("students")
      .select("id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (studentError) {
      console.error("[Practice Enable Check] Failed to load student:", studentError);
      return respondError("Failed to check access", 500, "DATABASE_ERROR");
    }

    if (!student) {
      return respondError("Student record not found", 404, "STUDENT_NOT_FOUND");
    }

    const access = await getStudentPracticeAccess(adminClient, student.id);
    if (!access.hasAccess) {
      const status = access.reason === "student_not_found" ? 404 : 500;
      return respondError(access.message, status, access.reason.toUpperCase());
    }

    return NextResponse.json({
      canEnable: true,
      tier: access.tier,
      isFreeUser: access.isFreeUser,
      showUpgradePrompt: access.showUpgradePrompt,
      upgradePriceCents: access.upgradePrice,
      tutorName: access.tutorName || null,
    });
  } catch (error) {
    console.error("[Practice Enable Check] Error:", error);
    return respondError("Failed to check access", 500, "INTERNAL_ERROR");
  }
}

/**
 * Safely parses the enable payload.
 *
 * @param request - Incoming POST request.
 * @returns Validated payload marker.
 */
async function parseEnablePayload(
  request: Request
): Promise<{ success: true; studentId: string } | { success: false }> {
  try {
    const body = await request.json();
    if (body && typeof body.studentId === "string" && body.studentId.trim().length > 0) {
      return { success: true, studentId: body.studentId.trim() };
    }
    return { success: false };
  } catch {
    return { success: false };
  }
}
