import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { processLessonRecording } from "@/lib/analysis/lesson-analysis-processor";
import { recordSystemEvent, recordSystemMetric, startDuration } from "@/lib/monitoring";

const BATCH_LIMIT = 2;
const STALE_ANALYZING_MINUTES = 120;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 55;

export async function GET(request: Request) {
  // Adapter for older callers; keep implementation in GET_INTERNAL.
  return GET_INTERNAL(request);
}

async function GET_INTERNAL(request: Request) {
  const endTimer = startDuration("cron:lesson-analysis");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error("[Cron] CRON_SECRET is not configured. Aborting job.");
    endTimer();
    return NextResponse.json({ error: "Cron secret not configured" }, { status: 500 });
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    endTimer();
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminClient = createServiceRoleClient();
  if (!adminClient) {
    void recordSystemEvent({
      source: "cron:lesson-analysis",
      message: "Service role client unavailable",
      meta: { stage: "init" },
    });
    endTimer();
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  const needsAnalysisFilter = "ai_summary_md.is.null,key_points.is.null,fluency_flags.is.null";

  const { data: completedRecordings, error: completedError } = await adminClient
    .from("lesson_recordings")
    .select("id, tutor_id, student_id, booking_id, transcript_json, status, created_at, updated_at, tutor_notified_at")
    .eq("status", "completed")
    .not("transcript_json", "is", null)
    .or(needsAnalysisFilter)
    .order("created_at", { ascending: false })
    .limit(BATCH_LIMIT);

  let recordings = completedRecordings;
  let error = completedError;

  if (!error && (!recordings || recordings.length === 0)) {
    const staleBefore = new Date(Date.now() - STALE_ANALYZING_MINUTES * 60 * 1000).toISOString();
    const { data: staleRecordings, error: staleError } = await adminClient
      .from("lesson_recordings")
      .select("id, tutor_id, student_id, booking_id, transcript_json, status, created_at, updated_at, tutor_notified_at")
      .eq("status", "analyzing")
      .or(`updated_at.is.null,updated_at.lt.${staleBefore}`)
      .not("transcript_json", "is", null)
      .or(needsAnalysisFilter)
      .order("created_at", { ascending: false })
      .limit(BATCH_LIMIT);

    recordings = staleRecordings;
    error = staleError;
  }

  if (error) {
    console.error("[Lesson Analysis] Fetch error", error);
    endTimer();
    void recordSystemEvent({
      source: "cron:lesson-analysis",
      message: "Failed to fetch recordings",
      meta: { error: String(error) },
    });
    return NextResponse.json({ error: "Failed to fetch recordings" }, { status: 500 });
  }

  if (!recordings || recordings.length === 0) {
    const durationMs = endTimer();
    void recordSystemMetric({ metric: "cron:lesson-analysis:duration_ms", value: durationMs ?? 0, sampleRate: 0.25 });
    return NextResponse.json({ processed: 0, duration_ms: durationMs });
  }

  for (const recording of recordings) {
    await processLessonRecording(adminClient, recording);
  }

  const durationMs = endTimer();
  void recordSystemMetric({ metric: "cron:lesson-analysis:duration_ms", value: durationMs ?? 0, sampleRate: 0.25 });
  void recordSystemMetric({ metric: "cron:lesson-analysis:processed", value: recordings.length, sampleRate: 0.5 });

  return NextResponse.json({ processed: recordings.length, duration_ms: durationMs });
}

export async function POST(request: Request) {
  return GET_INTERNAL(request);
}
