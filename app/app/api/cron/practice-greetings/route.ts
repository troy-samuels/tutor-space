import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { createPracticeGreetingMessage, type GreetingContext } from "@/lib/practice/greeting";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BATCH_LIMIT = 25;

type ScenarioRow = {
  id: string;
  language?: string | null;
  level?: string | null;
  topic?: string | null;
  vocabulary_focus?: unknown;
  grammar_focus?: unknown;
};

type SessionRow = {
  id: string;
  student_id: string;
  scenario_id: string | null;
  language: string;
  level: string | null;
  topic: string | null;
  message_count: number | null;
  started_at: string | null;
};

function normalizeFocusList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => item.length > 0);
}

function buildGreetingContext(params: {
  session: SessionRow;
  scenario: ScenarioRow | null;
  studentName?: string | null;
}): GreetingContext {
  const { session, scenario, studentName } = params;
  return {
    language: scenario?.language || session.language || "English",
    level: scenario?.level ?? session.level ?? null,
    topic: scenario?.topic ?? session.topic ?? null,
    vocabularyFocus: normalizeFocusList(scenario?.vocabulary_focus),
    grammarFocus: normalizeFocusList(scenario?.grammar_focus),
    studentName: studentName || undefined,
  };
}

export async function POST(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    console.error("[PracticeGreetingsCron] Unauthorized request");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminClient = createServiceRoleClient();
  if (!adminClient) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  try {
    const { data: sessions, error: sessionsError } = await adminClient
      .from("student_practice_sessions")
      .select("id, student_id, scenario_id, language, level, topic, message_count, started_at")
      .is("ended_at", null)
      .eq("message_count", 0)
      .order("started_at", { ascending: true })
      .limit(BATCH_LIMIT);

    if (sessionsError) {
      console.error("[PracticeGreetingsCron] Failed to load sessions:", sessionsError);
      return NextResponse.json(
        { error: "Failed to load sessions" },
        { status: 500 }
      );
    }

    if (!sessions || sessions.length === 0) {
      return NextResponse.json({ processed: 0, created: 0, skipped: 0, failed: 0 });
    }

    const scenarioIds = sessions
      .map((session) => session.scenario_id)
      .filter((id): id is string => typeof id === "string");
    const studentIds = sessions.map((session) => session.student_id);

    const [{ data: scenarios }, { data: students }] = await Promise.all([
      scenarioIds.length > 0
        ? adminClient
          .from("practice_scenarios")
          .select("id, language, level, topic, vocabulary_focus, grammar_focus")
          .in("id", scenarioIds)
        : Promise.resolve({ data: [] as ScenarioRow[] }),
      studentIds.length > 0
        ? adminClient
          .from("students")
          .select("id, full_name")
          .in("id", studentIds)
        : Promise.resolve({ data: [] as Array<{ id: string; full_name: string | null }> }),
    ]);

    const scenarioMap = new Map((scenarios || []).map((scenario) => [scenario.id, scenario]));
    const studentMap = new Map((students || []).map((student) => [student.id, student.full_name]));

    let created = 0;
    let skipped = 0;
    let failed = 0;

    for (const session of sessions as SessionRow[]) {
      const scenario = session.scenario_id ? scenarioMap.get(session.scenario_id) || null : null;
      const studentName = studentMap.get(session.student_id) || null;
      const context = buildGreetingContext({ session, scenario, studentName });

      const result = await createPracticeGreetingMessage({
        adminClient,
        sessionId: session.id,
        context,
      });

      if (result.status === "created") {
        created += 1;
      } else if (result.status === "skipped") {
        skipped += 1;
      } else {
        failed += 1;
      }
    }

    return NextResponse.json({
      processed: sessions.length,
      created,
      skipped,
      failed,
    });
  } catch (error) {
    console.error("[PracticeGreetingsCron] Unexpected error:", error);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (process.env.NODE_ENV !== "development" && cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Use POST with authorization" }, { status: 405 });
  }

  return POST(request);
}
