import type { ServiceRoleClient } from "@/lib/supabase/admin";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import type { Exercise } from "@/lib/practice/exercise-bank";
import { getExerciseBankForSession } from "@/lib/practice/exercise-bank";

export type SessionBlock =
  | { type: "exercise"; exercise: Exercise }
  | { type: "conversation"; aiGenerated: true };

type SessionPlanRow = {
  id: string;
  student_id: string;
  language: string;
  level: string | null;
  topic: string | null;
  session_plan: unknown;
  scenario:
    | { max_messages: number | null }
    | Array<{ max_messages: number | null }>
    | null;
};

function createConversationOnlyPlan(totalTurns: number): SessionBlock[] {
  return Array.from({ length: Math.max(1, totalTurns) }, () => ({
    type: "conversation",
    aiGenerated: true as const,
  }));
}

function isValidExercise(value: unknown): value is Exercise {
  if (!value || typeof value !== "object") return false;
  const raw = value as Record<string, unknown>;

  return (
    typeof raw.id === "string"
    && typeof raw.type === "string"
    && typeof raw.prompt === "string"
    && typeof raw.correctAnswer === "string"
    && typeof raw.explanation === "string"
  );
}

function parseStoredPlan(value: unknown): SessionBlock[] | null {
  if (!Array.isArray(value)) return null;

  const parsed: SessionBlock[] = [];

  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const block = item as Record<string, unknown>;

    if (block.type === "conversation") {
      parsed.push({ type: "conversation", aiGenerated: true });
      continue;
    }

    if (block.type === "exercise" && isValidExercise(block.exercise)) {
      parsed.push({ type: "exercise", exercise: block.exercise });
    }
  }

  return parsed.length > 0 ? parsed : null;
}

/**
 * Plans session blocks from an exercise list.
 * Exported to keep planning logic testable.
 */
export function buildHybridPlanFromExercises(params: {
  totalTurns: number;
  exercises: Exercise[];
}): SessionBlock[] {
  const totalTurns = Math.max(1, params.totalTurns);
  if (params.exercises.length === 0 || totalTurns < 3) {
    return createConversationOnlyPlan(totalTurns);
  }

  const plan = createConversationOnlyPlan(totalTurns);

  const warmupTurns = Math.min(2, totalTurns);
  const wrapupTurns = Math.min(2, Math.max(0, totalTurns - warmupTurns));
  const middleStart = warmupTurns;
  const middleEnd = Math.max(middleStart, totalTurns - wrapupTurns);

  let exerciseCursor = 0;
  let index = middleStart;

  while (index < middleEnd && exerciseCursor < params.exercises.length) {
    for (let i = 0; i < 2 && index < middleEnd && exerciseCursor < params.exercises.length; i += 1) {
      plan[index] = {
        type: "exercise",
        exercise: params.exercises[exerciseCursor],
      };
      index += 1;
      exerciseCursor += 1;
    }

    // Keep a conversation gap between exercise clusters.
    index += 2;
  }

  if (!plan.some((block) => block.type === "exercise")) {
    plan[Math.min(middleStart, totalTurns - 1)] = {
      type: "exercise",
      exercise: params.exercises[0],
    };
  }

  return plan;
}

/**
 * Plans the session structure: a sequence of exercise blocks
 * interspersed with conversation blocks.
 */
export async function planSessionBlocks(params: {
  studentId: string;
  language: string;
  level: string;
  topic?: string;
  totalTurns: number;
  /** Optional deterministic seed for tests */
  exerciseSeed?: Exercise[];
}): Promise<SessionBlock[]> {
  const totalTurns = Math.max(1, params.totalTurns);

  if (Array.isArray(params.exerciseSeed) && params.exerciseSeed.length > 0) {
    return buildHybridPlanFromExercises({
      totalTurns,
      exercises: params.exerciseSeed,
    });
  }

  const adminClient = createServiceRoleClient();
  if (!adminClient) {
    return createConversationOnlyPlan(totalTurns);
  }

  const bank = await getExerciseBankForSession(adminClient, {
    studentId: params.studentId,
    language: params.language,
    level: params.level,
    topic: params.topic,
  });

  if (!bank || bank.exercises.length === 0) {
    return createConversationOnlyPlan(totalTurns);
  }

  const exercises = bank.exercises.map((exercise) => ({
    ...exercise,
    bankId: exercise.bankId || bank.id,
  }));

  return buildHybridPlanFromExercises({ totalTurns, exercises });
}

/**
 * Gets an existing persisted session plan, or creates and stores one.
 */
export async function getOrCreateSessionPlan(
  adminClient: ServiceRoleClient,
  sessionId: string
): Promise<SessionBlock[]> {
  const { data: rowRaw, error } = await adminClient
    .from("student_practice_sessions")
    .select(`
      id,
      student_id,
      language,
      level,
      topic,
      session_plan,
      scenario:practice_scenarios (
        max_messages
      )
    `)
    .eq("id", sessionId)
    .maybeSingle();

  if (error || !rowRaw) {
    return [];
  }

  const row = rowRaw as SessionPlanRow;

  const existingPlan = parseStoredPlan(row.session_plan);
  if (existingPlan && existingPlan.length > 0) {
    return existingPlan;
  }

  const scenario = Array.isArray(row.scenario) ? row.scenario[0] : row.scenario;
  const maxMessages = scenario?.max_messages ?? 20;
  const totalTurns = Math.max(1, Math.floor(maxMessages / 2));

  const generatedPlan = await planSessionBlocks({
    studentId: row.student_id,
    language: row.language,
    level: row.level || "intermediate",
    topic: row.topic || undefined,
    totalTurns,
  });

  if (generatedPlan.length > 0) {
    await adminClient
      .from("student_practice_sessions")
      .update({ session_plan: generatedPlan })
      .eq("id", sessionId);
  }

  return generatedPlan;
}

/**
 * Formats a deterministic assistant response for an exercise-scored turn.
 */
export function formatExerciseResponse(
  exercise: Exercise,
  result: { correct: boolean; score: number; feedback: string }
): string {
  const scorePercent = Math.round(result.score * 100);
  const optionBlock =
    exercise.type === "multiple_choice" && exercise.options && exercise.options.length > 0
      ? `\nOptions: ${exercise.options.join(" | ")}`
      : "";

  return [
    `Exercise: ${exercise.prompt}${optionBlock}`,
    result.correct
      ? `Result: Correct (${scorePercent}%).`
      : `Result: Not yet (${scorePercent}%).`,
    result.feedback,
  ].join("\n\n");
}
