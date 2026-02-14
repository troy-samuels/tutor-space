import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { errorResponse } from "@/lib/api/error-responses";
import { createPracticeGreetingMessage, type GreetingContext } from "@/lib/practice/greeting";
import { getCurrentPracticePeriod, getStudentPracticeAccess } from "@/lib/practice/access";

type ScenarioContext = {
  id?: string | null;
  language?: string | null;
  level?: string | null;
  topic?: string | null;
  vocabulary_focus?: unknown;
  grammar_focus?: unknown;
};

type AssignmentRow = {
  id: string;
  title: string | null;
  scenario: ScenarioContext | ScenarioContext[] | null;
};

type StudentRow = {
  id: string;
  tutor_id: string | null;
  full_name: string | null;
};

type SessionRow = {
  id: string;
  has_audio_input: boolean | null;
  mode: "text" | "audio" | null;
  message_count: number | null;
  started_at: string;
  ended_at: string | null;
  language: string;
  level: string | null;
  topic: string | null;
};

const SESSION_REQUEST_SCHEMA = z
  .object({
    assignmentId: z.string().uuid(),
    mode: z.enum(["text", "audio"]),
  })
  .strict();

/**
 * Normalizes vocabulary and grammar focus arrays from DB JSON fields.
 *
 * @param value - Raw JSON value from Supabase.
 * @returns Sanitized non-empty string list.
 */
function normalizeFocusList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => item.length > 0);
}

/**
 * Builds greeting context payload for new or resumed sessions.
 *
 * @param params - Scenario and fallback values used by greeting generation.
 * @returns Greeting context consumed by `createPracticeGreetingMessage`.
 */
function buildGreetingContext(params: {
  scenario: ScenarioContext | null;
  fallbackLanguage: string;
  fallbackLevel: string | null;
  fallbackTopic: string | null;
  studentName?: string;
}): GreetingContext {
  const { scenario, fallbackLanguage, fallbackLevel, fallbackTopic, studentName } = params;

  return {
    language: scenario?.language || fallbackLanguage || "English",
    level: scenario?.level ?? fallbackLevel ?? null,
    topic: scenario?.topic ?? fallbackTopic ?? null,
    vocabularyFocus: normalizeFocusList(scenario?.vocabulary_focus),
    grammarFocus: normalizeFocusList(scenario?.grammar_focus),
    studentName,
  };
}

/**
 * Creates or resumes a practice session while enforcing tier-based limits.
 */
export async function POST(request: NextRequest) {
  const respondError = (
    message: string,
    status: number,
    code: string,
    extra?: Record<string, unknown>
  ) => errorResponse(message, { status, code, extra });

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

    const rawBody = await safeParseRequestJson(request);
    if (!rawBody.success) {
      return respondError("Invalid JSON body", 400, "INVALID_JSON");
    }

    const parsedBody = SESSION_REQUEST_SCHEMA.safeParse(rawBody.data);
    if (!parsedBody.success) {
      return respondError("Invalid request body", 400, "INVALID_INPUT", {
        details: parsedBody.error.flatten(),
      });
    }

    const { assignmentId, mode } = parsedBody.data;

    const { data: studentRaw, error: studentError } = await adminClient
      .from("students")
      .select("id, tutor_id, full_name")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (studentError) {
      console.error("[Session API] Failed to load student:", studentError);
      return respondError("Failed to load student profile", 500, "DATABASE_ERROR");
    }

    if (!studentRaw) {
      return respondError("Student not found", 404, "STUDENT_NOT_FOUND");
    }

    const student = studentRaw as StudentRow;
    const practiceAccess = await getStudentPracticeAccess(adminClient, student.id);
    if (!practiceAccess.hasAccess) {
      const status = practiceAccess.reason === "student_not_found" ? 404 : 500;
      return respondError(practiceAccess.message, status, practiceAccess.reason.toUpperCase());
    }

    if (mode === "audio" && !practiceAccess.audioEnabled) {
      return respondError("Audio practice is locked for your current tier", 402, "FEATURE_LOCKED", {
        tier: practiceAccess.tier,
        showUpgradePrompt: practiceAccess.showUpgradePrompt,
        upgradePriceCents: practiceAccess.upgradePrice,
      });
    }

    const { data: assignmentRaw, error: assignmentError } = await adminClient
      .from("practice_assignments")
      .select(`
        id,
        title,
        scenario:practice_scenarios (
          id,
          language,
          level,
          topic,
          vocabulary_focus,
          grammar_focus,
          system_prompt
        )
      `)
      .eq("id", assignmentId)
      .eq("student_id", student.id)
      .maybeSingle();

    if (assignmentError) {
      console.error("[Session API] Failed to load assignment:", assignmentError);
      return respondError("Failed to load assignment", 500, "DATABASE_ERROR");
    }

    if (!assignmentRaw) {
      return respondError("Assignment not found", 404, "ASSIGNMENT_NOT_FOUND");
    }

    const assignment = assignmentRaw as AssignmentRow;
    const scenario = (Array.isArray(assignment.scenario)
      ? assignment.scenario[0]
      : assignment.scenario) as ScenarioContext | null;

    const { data: existingSessionRaw, error: existingSessionError } = await adminClient
      .from("student_practice_sessions")
      .select("id, has_audio_input, mode, message_count, started_at, ended_at, language, level, topic")
      .eq("assignment_id", assignmentId)
      .is("ended_at", null)
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingSessionError) {
      console.error("[Session API] Failed to load existing session:", existingSessionError);
      return respondError("Failed to load existing session", 500, "DATABASE_ERROR");
    }

    if (existingSessionRaw) {
      const existingSession = existingSessionRaw as SessionRow;

      if ((existingSession.message_count ?? 0) === 0) {
        const greetingContext = buildGreetingContext({
          scenario,
          fallbackLanguage: existingSession.language,
          fallbackLevel: existingSession.level,
          fallbackTopic: existingSession.topic,
          studentName: student.full_name || (user.user_metadata?.full_name as string | undefined) || undefined,
        });

        void createPracticeGreetingMessage({
          adminClient,
          sessionId: existingSession.id,
          context: greetingContext,
        }).catch((error) => {
          console.error("[Session API] Failed to backfill greeting:", error);
        });
      }

      return NextResponse.json({
        session: {
          ...existingSession,
          mode: existingSession.mode || (existingSession.has_audio_input ? "audio" : "text"),
        },
        isExisting: true,
        practice: {
          tier: practiceAccess.tier,
          sessionsPerMonth: practiceAccess.sessionsPerMonth,
          textTurnsPerSession: practiceAccess.textTurnsPerSession,
          audioEnabled: practiceAccess.audioEnabled,
          adaptiveEnabled: practiceAccess.adaptiveEnabled,
          voiceInputEnabled: practiceAccess.voiceInputEnabled,
          showUpgradePrompt: practiceAccess.showUpgradePrompt,
          upgradePriceCents: practiceAccess.upgradePrice,
        },
      });
    }

    if (practiceAccess.sessionsPerMonth !== -1) {
      const { periodStart, periodEnd } = getCurrentPracticePeriod();
      const sessionsUsedThisMonth = await countSessionsForPeriod(
        adminClient,
        student.id,
        periodStart.toISOString(),
        periodEnd.toISOString()
      );

      if (sessionsUsedThisMonth >= practiceAccess.sessionsPerMonth) {
        return respondError(
          "Monthly practice session limit reached",
          402,
          "SESSION_LIMIT_REACHED",
          {
            tier: practiceAccess.tier,
            sessionsUsedThisMonth,
            sessionsAllowance: practiceAccess.sessionsPerMonth,
            showUpgradePrompt: practiceAccess.showUpgradePrompt,
            upgradePriceCents: practiceAccess.upgradePrice,
          }
        );
      }
    }

    const { data: newSession, error: createError } = await adminClient
      .from("student_practice_sessions")
      .insert({
        student_id: student.id,
        tutor_id: student.tutor_id,
        assignment_id: assignmentId,
        scenario_id: scenario?.id || null,
        language: scenario?.language || "English",
        level: scenario?.level || null,
        topic: scenario?.topic || null,
        has_audio_input: mode === "audio",
        mode,
      })
      .select("id, has_audio_input, mode, message_count, started_at, ended_at")
      .single();

    if (createError || !newSession) {
      console.error("[Session API] Failed to create session:", createError);
      return respondError("Failed to create session", 500, "DATABASE_ERROR");
    }

    const { error: updateAssignmentError } = await adminClient
      .from("practice_assignments")
      .update({ status: "in_progress" })
      .eq("id", assignmentId);

    if (updateAssignmentError) {
      console.error("[Session API] Failed to update assignment status:", updateAssignmentError);
    }

    const greetingContext = buildGreetingContext({
      scenario,
      fallbackLanguage: scenario?.language || "English",
      fallbackLevel: scenario?.level ?? null,
      fallbackTopic: scenario?.topic ?? null,
      studentName: student.full_name || (user.user_metadata?.full_name as string | undefined) || undefined,
    });

    void createPracticeGreetingMessage({
      adminClient,
      sessionId: newSession.id,
      context: greetingContext,
    }).catch((error) => {
      console.error("[Session API] Failed to generate greeting:", error);
    });

    return NextResponse.json({
      session: {
        ...newSession,
        mode: newSession.mode || (newSession.has_audio_input ? "audio" : "text"),
      },
      isExisting: false,
      practice: {
        tier: practiceAccess.tier,
        sessionsPerMonth: practiceAccess.sessionsPerMonth,
        textTurnsPerSession: practiceAccess.textTurnsPerSession,
        audioEnabled: practiceAccess.audioEnabled,
        adaptiveEnabled: practiceAccess.adaptiveEnabled,
        voiceInputEnabled: practiceAccess.voiceInputEnabled,
        showUpgradePrompt: practiceAccess.showUpgradePrompt,
        upgradePriceCents: practiceAccess.upgradePrice,
      },
    });
  } catch (error) {
    console.error("[Session API] Error:", error);
    return respondError("Internal server error", 500, "INTERNAL_ERROR");
  }
}

/**
 * Counts the number of sessions started in a monthly period.
 *
 * @param adminClient - Service-role Supabase client.
 * @param studentId - Student UUID.
 * @param periodStartIso - Inclusive period start.
 * @param periodEndIso - Exclusive period end.
 * @returns Number of sessions started in the period.
 */
async function countSessionsForPeriod(
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
    console.error("[Session API] Failed to count sessions:", error);
    return 0;
  }

  return count ?? 0;
}

/**
 * Safely parses JSON payload from request body.
 *
 * @param request - Incoming request.
 * @returns Parse result with either JSON data or an error marker.
 */
async function safeParseRequestJson(
  request: NextRequest
): Promise<{ success: true; data: unknown } | { success: false }> {
  try {
    const body = await request.json();
    return { success: true, data: body };
  } catch {
    return { success: false };
  }
}
