import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { errorResponse } from "@/lib/api/error-responses";
import {
  getCurrentPracticePeriod,
  getStudentPracticeAccess,
  type StudentPracticeTier,
} from "@/lib/practice/access";

type StudentUsageRow = {
  id: string;
};

type ActiveSessionUsageRow = {
  id: string;
  message_count: number | null;
};

export interface PracticeUsageStats {
  tier: StudentPracticeTier;
  sessionsUsedThisMonth: number;
  sessionsAllowance: number;
  textTurnsUsedThisSession: number;
  textTurnsAllowance: number;
  audioEnabled: boolean;
  adaptiveEnabled: boolean;
  voiceInputEnabled: boolean;
  canUpgrade: boolean;
  upgradePriceCents: number | null;
  periodStart: string;
  periodEnd: string;
}

/**
 * Returns tier-based usage and allowance details for the authenticated student.
 */
export async function GET() {
  const requestId = randomUUID();
  const respondError = (
    message: string,
    status: number,
    code: string,
    extra?: Record<string, unknown>
  ) =>
    errorResponse(message, {
      status,
      code,
      extra: {
        requestId,
        ...extra,
      },
    });

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

    const student = await loadStudent(adminClient, user.id);
    if (!student) {
      return respondError("Student record not found", 404, "STUDENT_NOT_FOUND");
    }

    const access = await getStudentPracticeAccess(adminClient, student.id);
    if (!access.hasAccess) {
      const status = access.reason === "student_not_found" ? 404 : 500;
      return respondError(access.message, status, access.reason.toUpperCase());
    }

    const { periodStart, periodEnd } = getCurrentPracticePeriod();
    const periodStartIso = periodStart.toISOString();
    const periodEndIso = periodEnd.toISOString();

    const sessionsUsedThisMonth = await countSessionsForCurrentPeriod(
      adminClient,
      student.id,
      periodStartIso,
      periodEndIso
    );
    const textTurnsUsedThisSession = await getCurrentSessionTextTurns(
      adminClient,
      student.id
    );

    const stats: PracticeUsageStats = {
      tier: access.tier,
      sessionsUsedThisMonth,
      sessionsAllowance: access.sessionsPerMonth,
      textTurnsUsedThisSession,
      textTurnsAllowance: access.textTurnsPerSession,
      audioEnabled: access.audioEnabled,
      adaptiveEnabled: access.adaptiveEnabled,
      voiceInputEnabled: access.voiceInputEnabled,
      canUpgrade: access.showUpgradePrompt,
      upgradePriceCents: access.upgradePrice,
      periodStart: periodStartIso,
      periodEnd: periodEndIso,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("[Practice Usage] Error:", error);
    return respondError("Failed to fetch usage stats", 500, "INTERNAL_ERROR");
  }
}

/**
 * Loads the student row for the authenticated user.
 *
 * @param adminClient - Service-role Supabase client.
 * @param userId - Authenticated user ID.
 * @returns Student row or `null`.
 */
async function loadStudent(
  adminClient: NonNullable<ReturnType<typeof createServiceRoleClient>>,
  userId: string
): Promise<StudentUsageRow | null> {
  const { data, error } = await adminClient
    .from("students")
    .select("id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[Practice Usage] Failed to load student:", error);
    return null;
  }

  return (data as StudentUsageRow | null) ?? null;
}

/**
 * Counts completed and active sessions in the current billing period.
 *
 * @param adminClient - Service-role Supabase client.
 * @param studentId - Student UUID.
 * @param periodStartIso - Inclusive period start timestamp.
 * @param periodEndIso - Exclusive period end timestamp.
 * @returns Number of sessions started in the period.
 */
async function countSessionsForCurrentPeriod(
  adminClient: NonNullable<ReturnType<typeof createServiceRoleClient>>,
  studentId: string,
  periodStartIso: string,
  periodEndIso: string
): Promise<number> {
  const { count, error } = await adminClient
    .from("student_practice_sessions")
    .select("id", { count: "exact", head: true })
    .eq("student_id", studentId)
    .gte("started_at", periodStartIso)
    .lt("started_at", periodEndIso);

  if (error) {
    console.error("[Practice Usage] Failed to count sessions:", error);
    return 0;
  }

  return count ?? 0;
}

/**
 * Reads the current active session message count for the authenticated student.
 *
 * @param adminClient - Service-role Supabase client.
 * @param studentId - Student UUID.
 * @returns Number of text turns in the active session.
 */
async function getCurrentSessionTextTurns(
  adminClient: NonNullable<ReturnType<typeof createServiceRoleClient>>,
  studentId: string
): Promise<number> {
  const { data, error } = await adminClient
    .from("student_practice_sessions")
    .select("id, message_count")
    .eq("student_id", studentId)
    .is("ended_at", null)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[Practice Usage] Failed to load active session:", error);
    return 0;
  }

  return ((data as ActiveSessionUsageRow | null)?.message_count ?? 0);
}
