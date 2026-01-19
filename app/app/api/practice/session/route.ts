import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { createPracticeGreetingMessage, type GreetingContext } from "@/lib/practice/greeting";

type ScenarioContext = {
  language?: string | null;
  level?: string | null;
  topic?: string | null;
  vocabulary_focus?: unknown;
  grammar_focus?: unknown;
};

function normalizeFocusList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => item.length > 0);
}

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
 * POST /api/practice/session
 * Creates a new practice session with specified mode
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { assignmentId, mode } = body;

    if (!assignmentId) {
      return NextResponse.json(
        { error: "Missing assignmentId" },
        { status: 400 }
      );
    }

    if (!mode || !["text", "audio"].includes(mode)) {
      return NextResponse.json(
        { error: "Invalid mode. Must be 'text' or 'audio'" },
        { status: 400 }
      );
    }

    const adminClient = createServiceRoleClient();
    if (!adminClient) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Get student record
    const { data: student } = await adminClient
      .from("students")
      .select("id, tutor_id, full_name")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (!student) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    // Get assignment with scenario (include focus areas for greeting)
    const { data: assignment } = await adminClient
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
      .single();

    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }

    const scenario = (Array.isArray(assignment.scenario)
      ? assignment.scenario[0]
      : assignment.scenario) as ScenarioContext | null;

    // Check for existing active session
    const { data: existingSession } = await adminClient
      .from("student_practice_sessions")
      .select("id, has_audio_input, message_count, started_at, ended_at, language, level, topic")
      .eq("assignment_id", assignmentId)
      .is("ended_at", null)
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingSession) {
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

      // Return existing session with mode derived from has_audio_input
      return NextResponse.json({
        session: {
          ...existingSession,
          mode: existingSession.has_audio_input ? "audio" : "text",
        },
        isExisting: true,
      });
    }

    // Create new session with has_audio_input based on mode
    const { data: newSession, error } = await adminClient
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
      })
      .select("id, has_audio_input, message_count, started_at, ended_at")
      .single();

    if (error) {
      console.error("[Session API] Failed to create session:", error);
      return NextResponse.json(
        { error: "Failed to create session" },
        { status: 500 }
      );
    }

    // Update assignment status to in_progress
    await adminClient
      .from("practice_assignments")
      .update({ status: "in_progress" })
      .eq("id", assignmentId);

    // Generate personalized greeting for new session (async, non-blocking)
    if (newSession) {
      const fallbackLanguage = scenario?.language || "English";
      const fallbackLevel = scenario?.level ?? null;
      const fallbackTopic = scenario?.topic ?? null;

      const greetingContext = buildGreetingContext({
        scenario,
        fallbackLanguage,
        fallbackLevel,
        fallbackTopic,
        studentName: student.full_name || (user.user_metadata?.full_name as string | undefined) || undefined,
      });

      void createPracticeGreetingMessage({
        adminClient,
        sessionId: newSession.id,
        context: greetingContext,
      }).catch((error) => {
        console.error("[Session API] Failed to generate greeting:", error);
      });
    }

    return NextResponse.json({
      session: {
        ...newSession,
        mode: newSession?.has_audio_input ? "audio" : "text",
      },
      isExisting: false,
    });
  } catch (error) {
    console.error("[Session API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
