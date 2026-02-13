import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { extractPlainText } from "@/lib/analysis/lesson-insights";
import { generateExerciseBanksFromLesson } from "@/lib/practice/exercise-generator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const DEFAULT_BATCH_LIMIT = 20;
const MAX_BATCH_LIMIT = 100;

type BackfillRecordingRow = {
  id: string;
  tutor_id: string;
  student_id: string;
  booking_id: string | null;
  transcript_json: unknown;
  key_points: unknown;
  tutor_speech_analysis: unknown;
  student_speech_analysis: unknown;
};

type BackfillItemResult = {
  recordingId: string;
  status: "created" | "updated" | "already_generated" | "skipped" | "error";
  error?: string;
};

function normalizeList(value: unknown, limit: number): string[] {
  if (!Array.isArray(value)) return [];

  const deduped = new Set<string>();
  const normalized: string[] = [];
  for (const item of value) {
    if (typeof item !== "string") continue;
    const cleaned = item.replace(/\s+/g, " ").trim();
    if (!cleaned) continue;
    const key = cleaned.toLowerCase();
    if (deduped.has(key)) continue;
    deduped.add(key);
    normalized.push(cleaned);
    if (normalized.length >= limit) break;
  }
  return normalized;
}

function collectTopicSignals(recording: BackfillRecordingRow): string[] {
  const keyPoints = normalizeList(recording.key_points, 12);
  const tutorAnalysis =
    recording.tutor_speech_analysis &&
    typeof recording.tutor_speech_analysis === "object"
      ? (recording.tutor_speech_analysis as Record<string, unknown>)
      : null;

  const focusTopics = normalizeList(tutorAnalysis?.focusTopics, 12);
  const inferredObjectivesRaw = Array.isArray(tutorAnalysis?.inferredObjectives)
    ? tutorAnalysis?.inferredObjectives
    : [];
  const inferredTopics = inferredObjectivesRaw
    .map((item) => {
      if (!item || typeof item !== "object") return "";
      const topic = (item as Record<string, unknown>).topic;
      return typeof topic === "string" ? topic : "";
    })
    .filter((topic) => topic.length > 0);

  return normalizeList([...keyPoints, ...focusTopics, ...inferredTopics], 8);
}

function collectGrammarSignals(recording: BackfillRecordingRow): string[] {
  const tutorAnalysis =
    recording.tutor_speech_analysis &&
    typeof recording.tutor_speech_analysis === "object"
      ? (recording.tutor_speech_analysis as Record<string, unknown>)
      : null;
  const studentAnalysis =
    recording.student_speech_analysis &&
    typeof recording.student_speech_analysis === "object"
      ? (recording.student_speech_analysis as Record<string, unknown>)
      : null;

  const tutorGrammar = normalizeList(tutorAnalysis?.focusGrammar, 16);

  const studentErrorsRaw = Array.isArray(studentAnalysis?.errors) ? studentAnalysis.errors : [];
  const studentGrammar = studentErrorsRaw
    .map((item) => {
      if (!item || typeof item !== "object") return "";
      const error = item as Record<string, unknown>;
      const category = typeof error.category === "string" ? error.category : "";
      const type = typeof error.type === "string" ? error.type : "";
      return category || type;
    })
    .filter((value) => value.length > 0);

  return normalizeList([...tutorGrammar, ...studentGrammar], 12);
}

function collectVocabularySignals(recording: BackfillRecordingRow): string[] {
  const tutorAnalysis =
    recording.tutor_speech_analysis &&
    typeof recording.tutor_speech_analysis === "object"
      ? (recording.tutor_speech_analysis as Record<string, unknown>)
      : null;
  const studentAnalysis =
    recording.student_speech_analysis &&
    typeof recording.student_speech_analysis === "object"
      ? (recording.student_speech_analysis as Record<string, unknown>)
      : null;

  const tutorVocabulary = normalizeList(tutorAnalysis?.focusVocabulary, 24);
  const studentVocabulary = normalizeList(studentAnalysis?.vocabularyUsed, 24);

  return normalizeList([...tutorVocabulary, ...studentVocabulary], 20);
}

function parseBatchLimit(request: Request): number {
  const url = new URL(request.url);
  const rawLimit = url.searchParams.get("limit");
  if (!rawLimit) return DEFAULT_BATCH_LIMIT;

  const parsed = Number.parseInt(rawLimit, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_BATCH_LIMIT;
  return Math.min(parsed, MAX_BATCH_LIMIT);
}

async function runBackfill(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error("[ExerciseBackfillCron] CRON_SECRET is not configured");
    return NextResponse.json({ error: "Cron secret not configured" }, { status: 500 });
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminClient = createServiceRoleClient();
  if (!adminClient) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  const batchLimit = parseBatchLimit(request);

  const { data, error } = await adminClient
    .from("lesson_recordings")
    .select(`
      id,
      tutor_id,
      student_id,
      booking_id,
      transcript_json,
      key_points,
      tutor_speech_analysis,
      student_speech_analysis
    `)
    .eq("status", "completed")
    .not("transcript_json", "is", null)
    .or("practice_exercises_generated.is.null,practice_exercises_generated.eq.false")
    .order("created_at", { ascending: false })
    .limit(batchLimit);

  if (error) {
    console.error("[ExerciseBackfillCron] Failed to load recordings:", error);
    return NextResponse.json({ error: "Failed to load recordings" }, { status: 500 });
  }

  const recordings = (data ?? []) as BackfillRecordingRow[];
  if (recordings.length === 0) {
    return NextResponse.json({
      processed: 0,
      created: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
    });
  }

  const itemResults: BackfillItemResult[] = [];

  for (const recording of recordings) {
    try {
      const topics = collectTopicSignals(recording);
      const grammarFocus = collectGrammarSignals(recording);
      const vocabulary = collectVocabularySignals(recording);
      const transcript = extractPlainText(recording.transcript_json, { role: "student" });

      const generation = await generateExerciseBanksFromLesson({
        recordingId: recording.id,
        tutorId: recording.tutor_id,
        studentId: recording.student_id,
        bookingId: recording.booking_id,
        transcript,
        topics,
        grammarFocus,
        vocabulary,
      });

      itemResults.push({
        recordingId: recording.id,
        status: generation.status,
      });
    } catch (generationError) {
      console.error(
        `[ExerciseBackfillCron] Failed to process recording ${recording.id}:`,
        generationError
      );
      itemResults.push({
        recordingId: recording.id,
        status: "error",
        error:
          generationError instanceof Error
            ? generationError.message
            : String(generationError),
      });
    }
  }

  const created = itemResults.filter((item) => item.status === "created").length;
  const updated = itemResults.filter((item) => item.status === "updated").length;
  const skipped = itemResults.filter(
    (item) => item.status === "skipped" || item.status === "already_generated"
  ).length;
  const failed = itemResults.filter((item) => item.status === "error").length;

  return NextResponse.json({
    processed: itemResults.length,
    created,
    updated,
    skipped,
    failed,
    results: itemResults,
  });
}

export async function GET(request: Request) {
  return runBackfill(request);
}

export async function POST(request: Request) {
  return runBackfill(request);
}
