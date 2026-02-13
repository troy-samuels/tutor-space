import { createServiceRoleClient } from "@/lib/supabase/admin";
import { storeExerciseBank } from "@/lib/practice/exercise-bank";

type AdminClient = NonNullable<ReturnType<typeof createServiceRoleClient>>;

type PracticeLevel = "beginner" | "intermediate" | "advanced" | "all";

const DEFAULT_ASSIGNMENT_TITLE = "AI practice for your next lesson";
const DEFAULT_ASSIGNMENT_INSTRUCTIONS =
  "Use this AI practice to reinforce what you learned in your recent lesson.";

const MAX_TOPICS = 8;
const MAX_GRAMMAR_FOCUS = 12;
const MAX_VOCAB_FOCUS = 20;
const MAX_TRANSCRIPT_CHARS = 1600;

type ProcessingLogLevel = "info" | "warn" | "error";

type LogProcessingInput = {
  entityType: string;
  entityId: string;
  level: ProcessingLogLevel;
  message: string;
  meta?: Record<string, unknown>;
};

type HomeworkRow = {
  id: string;
  due_date: string | null;
  practice_assignment_id: string | null;
};

type PracticeAssignmentRow = {
  id: string;
  homework_assignment_id: string | null;
  scenario_id: string | null;
  due_date: string | null;
  title: string | null;
  instructions: string | null;
};

type PracticeContext = {
  homeworkId: string | null;
  dueDate: string | null;
  assignment: PracticeAssignmentRow | null;
};

export type GenerateExerciseBanksFromLessonInput = {
  recordingId: string;
  tutorId: string;
  studentId: string;
  bookingId?: string | null;
  transcript: string;
  topics: string[];
  grammarFocus: string[];
  vocabulary: string[];
  homeworkAssignmentId?: string | null;
  practiceAssignmentId?: string | null;
  dueDate?: string | null;
  language?: string | null;
  level?: string | null;
};

export type GenerateExerciseBanksFromLessonResult = {
  status: "created" | "updated" | "already_generated" | "skipped";
  scenarioId: string | null;
  practiceAssignmentId: string | null;
};

function sanitizeValue(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function toUniqueList(values: string[], limit: number): string[] {
  const deduped = new Set<string>();
  const normalized: string[] = [];

  for (const rawValue of values) {
    const value = sanitizeValue(rawValue);
    if (!value) continue;
    const key = value.toLowerCase();
    if (deduped.has(key)) continue;
    deduped.add(key);
    normalized.push(value);
    if (normalized.length >= limit) break;
  }

  return normalized;
}

function shorten(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, Math.max(0, maxLength - 1)).trim()}...`;
}

function toLanguageLabel(value?: string | null): string {
  if (!value) return "English";
  const normalized = sanitizeValue(value);
  if (!normalized) return "English";

  const base = normalized.toLowerCase().replace(/_/g, "-").split("-")[0];
  const byCode: Record<string, string> = {
    en: "English",
    es: "Spanish",
    fr: "French",
    de: "German",
    it: "Italian",
    pt: "Portuguese",
    ja: "Japanese",
    zh: "Chinese",
    ko: "Korean",
    nl: "Dutch",
  };

  return byCode[base] ?? normalized;
}

function toPracticeLevel(value?: string | null): PracticeLevel | null {
  if (!value) return null;
  const normalized = sanitizeValue(value).toLowerCase().replace(/\s+/g, "_").replace(/-/g, "_");
  switch (normalized) {
    case "a1":
    case "a2":
    case "beginner":
    case "elementary":
      return "beginner";
    case "b1":
    case "b2":
    case "intermediate":
    case "upper_intermediate":
      return "intermediate";
    case "c1":
    case "c2":
    case "advanced":
    case "proficient":
      return "advanced";
    case "all":
      return "all";
    default:
      return null;
  }
}

async function logProcessing(client: AdminClient, input: LogProcessingInput): Promise<void> {
  try {
    await client.from("processing_logs").insert({
      entity_type: input.entityType,
      entity_id: input.entityId,
      level: input.level,
      message: input.message,
      meta: input.meta ?? {},
    });
  } catch (error) {
    console.error("[ExerciseGenerator] Failed to write processing log:", error);
  }
}

async function getHomeworkById(client: AdminClient, homeworkId: string): Promise<HomeworkRow | null> {
  const { data, error } = await client
    .from("homework_assignments")
    .select("id, due_date, practice_assignment_id")
    .eq("id", homeworkId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const row = data as HomeworkRow;
  return {
    id: row.id,
    due_date: row.due_date ?? null,
    practice_assignment_id: row.practice_assignment_id ?? null,
  };
}

async function getHomeworkByRecordingId(
  client: AdminClient,
  recordingId: string
): Promise<HomeworkRow | null> {
  const { data, error } = await client
    .from("homework_assignments")
    .select("id, due_date, practice_assignment_id")
    .eq("recording_id", recordingId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const row = data as HomeworkRow;
  return {
    id: row.id,
    due_date: row.due_date ?? null,
    practice_assignment_id: row.practice_assignment_id ?? null,
  };
}

async function getPracticeAssignmentById(
  client: AdminClient,
  assignmentId: string
): Promise<PracticeAssignmentRow | null> {
  const { data, error } = await client
    .from("practice_assignments")
    .select("id, homework_assignment_id, scenario_id, due_date, title, instructions")
    .eq("id", assignmentId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const row = data as PracticeAssignmentRow;
  return {
    id: row.id,
    homework_assignment_id: row.homework_assignment_id ?? null,
    scenario_id: row.scenario_id ?? null,
    due_date: row.due_date ?? null,
    title: row.title ?? null,
    instructions: row.instructions ?? null,
  };
}

async function getPracticeAssignmentByHomeworkId(
  client: AdminClient,
  homeworkId: string
): Promise<PracticeAssignmentRow | null> {
  const { data, error } = await client
    .from("practice_assignments")
    .select("id, homework_assignment_id, scenario_id, due_date, title, instructions")
    .eq("homework_assignment_id", homeworkId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const row = data as PracticeAssignmentRow;
  return {
    id: row.id,
    homework_assignment_id: row.homework_assignment_id ?? null,
    scenario_id: row.scenario_id ?? null,
    due_date: row.due_date ?? null,
    title: row.title ?? null,
    instructions: row.instructions ?? null,
  };
}

async function resolvePracticeContext(
  client: AdminClient,
  input: GenerateExerciseBanksFromLessonInput
): Promise<PracticeContext> {
  let homework = input.homeworkAssignmentId
    ? await getHomeworkById(client, input.homeworkAssignmentId)
    : await getHomeworkByRecordingId(client, input.recordingId);

  let assignment: PracticeAssignmentRow | null = input.practiceAssignmentId
    ? await getPracticeAssignmentById(client, input.practiceAssignmentId)
    : null;

  if (!assignment && homework?.practice_assignment_id) {
    assignment = await getPracticeAssignmentById(client, homework.practice_assignment_id);
  }

  if (!assignment && homework?.id) {
    assignment = await getPracticeAssignmentByHomeworkId(client, homework.id);
  }

  if (!homework && assignment?.homework_assignment_id) {
    homework = await getHomeworkById(client, assignment.homework_assignment_id);
  }

  return {
    homeworkId: homework?.id ?? null,
    dueDate: assignment?.due_date ?? homework?.due_date ?? input.dueDate ?? null,
    assignment,
  };
}

function buildSystemPrompt(params: {
  language: string;
  level: PracticeLevel | null;
  topic: string | null;
  grammarFocus: string[];
  vocabulary: string[];
  transcript: string;
}): string {
  const levelInstruction = params.level
    ? `Student level is ${params.level}. Keep prompts aligned to this level.`
    : "Use intermediate-level language unless the student seems advanced.";

  const topicInstruction = params.topic
    ? `Primary topic: ${params.topic}.`
    : "Primary topic: recent lesson review.";

  const grammarInstruction = params.grammarFocus.length > 0
    ? `Grammar priorities: ${params.grammarFocus.join(", ")}.`
    : "Grammar priorities: reinforce sentence clarity and tense consistency.";

  const vocabularyInstruction = params.vocabulary.length > 0
    ? `Target vocabulary: ${params.vocabulary.join(", ")}.`
    : "Target vocabulary: reuse key words from the recent lesson.";

  const transcriptSnippet = params.transcript
    ? shorten(params.transcript, MAX_TRANSCRIPT_CHARS)
    : "";

  const transcriptContext = transcriptSnippet
    ? `Lesson transcript excerpt (reference only): ${transcriptSnippet}`
    : "No transcript excerpt available.";

  return `You are a friendly ${params.language} conversation coach helping a student practice material from their recent tutoring lesson.

${levelInstruction}
${topicInstruction}
${grammarInstruction}
${vocabularyInstruction}

Instructions:
1. Keep responses to 2-4 sentences and ask follow-up questions.
2. Encourage active student output, not long tutor explanations.
3. If the student makes a significant grammar mistake, correct it briefly and keep the conversation moving.
4. Recycle lesson vocabulary naturally.

${transcriptContext}`;
}

function buildAssignmentInstructions(params: {
  topic: string | null;
  grammarFocus: string[];
  vocabulary: string[];
}): string {
  const focusLines: string[] = [];

  if (params.topic) {
    focusLines.push(`Topic: ${params.topic}`);
  }
  if (params.grammarFocus.length > 0) {
    focusLines.push(`Grammar: ${params.grammarFocus.slice(0, 4).join(", ")}`);
  }
  if (params.vocabulary.length > 0) {
    focusLines.push(`Vocabulary: ${params.vocabulary.slice(0, 8).join(", ")}`);
  }

  if (focusLines.length === 0) {
    return "Use this practice session to review the most important points from your latest lesson recording.";
  }

  return `Practice the focus areas from your latest lesson. ${focusLines.join(" | ")}`;
}

async function resolveLanguageAndLevel(
  client: AdminClient,
  input: GenerateExerciseBanksFromLessonInput
): Promise<{ language: string; level: PracticeLevel | null }> {
  let language = toLanguageLabel(input.language);
  let level = toPracticeLevel(input.level);

  if (language !== "English" && level) {
    return { language, level };
  }

  const { data: profile } = await client
    .from("student_language_profiles")
    .select("target_language")
    .eq("student_id", input.studentId)
    .order("lessons_analyzed", { ascending: false })
    .limit(1)
    .maybeSingle();

  const profileRow = profile as { target_language?: string | null } | null;
  if (profileRow?.target_language) {
    language = toLanguageLabel(profileRow.target_language);
  }

  if (!level) {
    const { data: student } = await client
      .from("students")
      .select("proficiency_level")
      .eq("id", input.studentId)
      .maybeSingle();

    const studentRow = student as { proficiency_level?: string | null } | null;
    level = toPracticeLevel(studentRow?.proficiency_level ?? null);
  }

  return { language, level };
}

async function markExercisesGenerated(client: AdminClient, recordingId: string): Promise<void> {
  await client
    .from("lesson_recordings")
    .update({ practice_exercises_generated: true })
    .eq("id", recordingId);
}

export async function generateExerciseBanksFromLesson(
  input: GenerateExerciseBanksFromLessonInput
): Promise<GenerateExerciseBanksFromLessonResult> {
  const client = createServiceRoleClient();
  if (!client) {
    return {
      status: "skipped",
      scenarioId: null,
      practiceAssignmentId: input.practiceAssignmentId ?? null,
    };
  }

  const topics = toUniqueList(input.topics, MAX_TOPICS);
  const grammarFocus = toUniqueList(input.grammarFocus, MAX_GRAMMAR_FOCUS);
  const vocabulary = toUniqueList(input.vocabulary, MAX_VOCAB_FOCUS);
  const transcript = sanitizeValue(input.transcript || "");

  const hasSourceContent =
    transcript.length > 0 ||
    topics.length > 0 ||
    grammarFocus.length > 0 ||
    vocabulary.length > 0;

  if (!hasSourceContent) {
    await logProcessing(client, {
      entityType: "lesson_recording",
      entityId: input.recordingId,
      level: "warn",
      message: "Exercise generation skipped: no usable lesson content",
    });
    return {
      status: "skipped",
      scenarioId: null,
      practiceAssignmentId: input.practiceAssignmentId ?? null,
    };
  }

  try {
    const context = await resolvePracticeContext(client, input);
    if (context.assignment?.scenario_id) {
      await markExercisesGenerated(client, input.recordingId);
      await logProcessing(client, {
        entityType: "lesson_recording",
        entityId: input.recordingId,
        level: "info",
        message: "Exercise generation skipped: assignment already linked to scenario",
        meta: {
          practice_assignment_id: context.assignment.id,
          scenario_id: context.assignment.scenario_id,
        },
      });
      return {
        status: "already_generated",
        scenarioId: context.assignment.scenario_id,
        practiceAssignmentId: context.assignment.id,
      };
    }

    const { language, level } = await resolveLanguageAndLevel(client, input);
    const topic = topics[0] ?? null;
    const scenarioTitle = topic
      ? shorten(`Lesson Practice: ${topic}`, 120)
      : `Lesson Practice (${new Date().toISOString().slice(0, 10)})`;

    const scenarioDescription = buildAssignmentInstructions({
      topic,
      grammarFocus,
      vocabulary,
    });

    const systemPrompt = buildSystemPrompt({
      language,
      level,
      topic,
      grammarFocus,
      vocabulary,
      transcript,
    });

    const { id: scenarioId } = await storeExerciseBank(client, {
      tutorId: input.tutorId,
      title: scenarioTitle,
      description: scenarioDescription,
      language,
      level,
      topic,
      vocabularyFocus: vocabulary,
      grammarFocus,
      systemPrompt,
      exampleConversation: {
        source: "lesson_analysis",
        recording_id: input.recordingId,
        booking_id: input.bookingId ?? null,
        generated_at: new Date().toISOString(),
      },
    });

    const assignmentInstructions = buildAssignmentInstructions({
      topic,
      grammarFocus,
      vocabulary,
    });

    let practiceAssignmentId = context.assignment?.id ?? null;

    if (context.assignment) {
      const shouldUpdateTitle =
        !context.assignment.title || context.assignment.title === DEFAULT_ASSIGNMENT_TITLE;
      const shouldUpdateInstructions =
        !context.assignment.instructions ||
        context.assignment.instructions === DEFAULT_ASSIGNMENT_INSTRUCTIONS;

      const updatePayload: Record<string, unknown> = {
        scenario_id: scenarioId,
      };
      if (shouldUpdateTitle) {
        updatePayload.title = scenarioTitle;
      }
      if (shouldUpdateInstructions) {
        updatePayload.instructions = assignmentInstructions;
      }
      if (!context.assignment.due_date && context.dueDate) {
        updatePayload.due_date = context.dueDate;
      }

      const { error: updateError } = await client
        .from("practice_assignments")
        .update(updatePayload)
        .eq("id", context.assignment.id);

      if (updateError) throw updateError;
    } else {
      const { data: insertedAssignment, error: insertError } = await client
        .from("practice_assignments")
        .insert({
          tutor_id: input.tutorId,
          student_id: input.studentId,
          scenario_id: scenarioId,
          homework_assignment_id: context.homeworkId,
          title: scenarioTitle,
          instructions: assignmentInstructions,
          due_date: context.dueDate,
          status: "assigned",
        })
        .select("id")
        .single();

      if (insertError || !insertedAssignment) {
        throw insertError ?? new Error("Failed to create practice assignment");
      }
      practiceAssignmentId = (insertedAssignment as { id: string }).id;
    }

    if (context.homeworkId && practiceAssignmentId) {
      await client
        .from("homework_assignments")
        .update({ practice_assignment_id: practiceAssignmentId })
        .eq("id", context.homeworkId);
    }

    await markExercisesGenerated(client, input.recordingId);
    await logProcessing(client, {
      entityType: "lesson_recording",
      entityId: input.recordingId,
      level: "info",
      message: "Exercise bank generated from lesson analysis",
      meta: {
        scenario_id: scenarioId,
        practice_assignment_id: practiceAssignmentId,
        homework_assignment_id: context.homeworkId,
        topic_count: topics.length,
        grammar_focus_count: grammarFocus.length,
        vocabulary_count: vocabulary.length,
      },
    });

    return {
      status: context.assignment ? "updated" : "created",
      scenarioId,
      practiceAssignmentId,
    };
  } catch (error) {
    await logProcessing(client, {
      entityType: "lesson_recording",
      entityId: input.recordingId,
      level: "error",
      message: "Exercise bank generation failed",
      meta: {
        error: error instanceof Error ? error.message : String(error),
      },
    });
    throw error;
  }
}
