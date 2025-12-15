import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import {
  analyzeTranscript,
  extractPlainText,
  analyzeWithOpenAI,
  generateDrillsFromErrors,
} from "@/lib/analysis/lesson-insights";
import { processEnhancedAnalysis } from "@/lib/analysis/enhanced-processor";
import { notifyDrillsAssigned } from "@/lib/actions/notifications";
import { recordSystemEvent, recordSystemMetric, startDuration } from "@/lib/monitoring";

type AdminClient = NonNullable<ReturnType<typeof createServiceRoleClient>>;
type TutorApprovalPreference = "require_approval" | "auto_send";

const BATCH_LIMIT = 5;

async function logProcessing(client: ReturnType<typeof createServiceRoleClient>, params: {
  entityType: string;
  entityId: string;
  level: "info" | "warn" | "error";
  message: string;
  meta?: Record<string, unknown>;
}) {
  if (!client) return;
  await client.from("processing_logs").insert({
    entity_type: params.entityType,
    entity_id: params.entityId,
    level: params.level,
    message: params.message,
    meta: params.meta ?? {},
  });
}

async function upsertDrills(
  client: AdminClient,
  recording: { id: string; student_id: string; tutor_id: string; booking_id?: string; created_at?: string },
  drills: Array<{
    content: Record<string, unknown>;
    focus_area?: string | null;
    source_timestamp_seconds?: number | null;
    drill_type?: string;
  }>,
  approvalPreference: TutorApprovalPreference
): Promise<{ drillCount: number; studentUserId: string | null; tutorName: string | null } | null> {
  if (!recording?.id || !recording?.student_id || !recording?.tutor_id) return null;
  if (!Array.isArray(drills) || drills.length === 0) return null;

  // Avoid duplicates by skipping if drills already exist for this recording
  const { count } = await client
    .from("lesson_drills")
    .select("id", { count: "exact", head: true })
    .eq("recording_id", recording.id);

  if ((count ?? 0) > 0) return null;

  // Determine visibility based on tutor preference
  const visibleToStudent = approvalPreference === "auto_send";
  const tutorApproved = approvalPreference === "auto_send";

  // Fetch tutor name and student's auth user ID for notification
  const [tutorResult, studentResult] = await Promise.all([
    client
      .from("profiles")
      .select("full_name")
      .eq("id", recording.tutor_id)
      .single(),
    client
      .from("students")
      .select("user_id")
      .eq("id", recording.student_id)
      .single(),
  ]);

  const tutorName = tutorResult.data?.full_name || null;
  const studentUserId = studentResult.data?.user_id || null;

  // Fetch student's next booking for due date linkage
  const { data: nextBooking } = await client
    .from("bookings")
    .select("id, scheduled_at")
    .eq("student_id", recording.student_id)
    .eq("tutor_id", recording.tutor_id)
    .in("status", ["confirmed", "pending"])
    .gte("scheduled_at", new Date().toISOString())
    .order("scheduled_at", { ascending: true })
    .limit(1)
    .single();

  const dueDate = nextBooking?.scheduled_at ?? null;

  // Insert drills with booking link, due date, and visibility settings
  const { data: insertedDrills } = await client.from("lesson_drills").insert(
    drills.map((drill) => {
      // Determine source based on drill type or focus area
      let source: "auto_fluency" | "auto_grammar" | "auto_vocabulary" = "auto_fluency";
      if (drill.drill_type === "grammar" || drill.focus_area?.includes("grammar")) {
        source = "auto_grammar";
      } else if (drill.drill_type === "vocabulary" || drill.focus_area?.includes("vocab")) {
        source = "auto_vocabulary";
      }

      return {
        recording_id: recording.id,
        student_id: recording.student_id,
        tutor_id: recording.tutor_id,
        content: drill.content,
        focus_area: drill.focus_area ?? null,
        source_timestamp_seconds: drill.source_timestamp_seconds ?? null,
        drill_type: drill.drill_type ?? "pronunciation",
        booking_id: nextBooking?.id ?? null,
        due_date: dueDate,
        status: "pending",
        source,
        visible_to_student: visibleToStudent,
        tutor_approved: tutorApproved,
        tutor_approved_at: tutorApproved ? new Date().toISOString() : null,
      };
    })
  ).select("id");

  // Determine homework status based on tutor preference
  const homeworkStatus = approvalPreference === "auto_send" ? "assigned" : "draft";

  // Auto-create homework assignment if drills were created and there's a next booking
  if (insertedDrills && insertedDrills.length > 0 && nextBooking) {
    const { data: homework } = await client
      .from("homework_assignments")
      .insert({
        tutor_id: recording.tutor_id,
        student_id: recording.student_id,
        booking_id: nextBooking.id,
        recording_id: recording.id,
        title: "Practice from your recent lesson",
        instructions: `Review ${drills.length} practice items generated from your recent lesson recording. Focus on the areas highlighted by your tutor.`,
        due_date: dueDate,
        status: homeworkStatus,
        source: "auto_lesson_analysis",
        tutor_reviewed: approvalPreference === "auto_send",
        tutor_reviewed_at: approvalPreference === "auto_send" ? new Date().toISOString() : null,
      })
      .select("id")
      .single();

    // Link drills to the homework assignment
    if (homework?.id) {
      await client
        .from("lesson_drills")
        .update({
          homework_assignment_id: homework.id,
          status: homeworkStatus === "assigned" ? "assigned" : "pending"
        })
        .eq("recording_id", recording.id);
    }
  }

  return { drillCount: drills.length, studentUserId, tutorName };
}

async function processRecording(client: AdminClient, recording: {
  id: string;
  tutor_id: string;
  student_id: string;
  booking_id?: string;
  transcript_json: unknown;
  created_at?: string;
}) {
  const recordingId = recording.id;

  await logProcessing(client, {
    entityType: "lesson_recording",
    entityId: recordingId,
    level: "info",
    message: "Analysis started",
  });

  await client
    .from("lesson_recordings")
    .update({ status: "analyzing" })
    .eq("id", recordingId);

  try {
    // Fetch tutor's approval preference and name
    const { data: tutorProfile } = await client
      .from("profiles")
      .select("auto_homework_approval, full_name")
      .eq("id", recording.tutor_id)
      .single();

    const approvalPreference: TutorApprovalPreference =
      (tutorProfile?.auto_homework_approval as TutorApprovalPreference) ?? "require_approval";
    const tutorName = tutorProfile?.full_name || undefined;

    // Try enhanced analysis first
    let useEnhancedAnalysis = true;
    let enhancedResult = null;

    try {
      enhancedResult = await processEnhancedAnalysis({
        recordingId,
        transcriptJson: recording.transcript_json,
        tutorId: recording.tutor_id,
        studentId: recording.student_id,
        bookingId: recording.booking_id,
        tutorName,
      });

      await logProcessing(client, {
        entityType: "lesson_recording",
        entityId: recordingId,
        level: "info",
        message: "Enhanced analysis completed",
        meta: {
          objectives_found: enhancedResult.lessonObjectives.length,
          drills_generated: enhancedResult.drillPackage.drillCount,
          engagement_score: enhancedResult.engagementScore,
          l1_interference_level: enhancedResult.l1InterferenceAnalysis.overallLevel,
        },
      });
    } catch (enhancedError) {
      console.warn("[Lesson Analysis] Enhanced analysis failed, falling back to basic:", enhancedError);
      useEnhancedAnalysis = false;
      await logProcessing(client, {
        entityType: "lesson_recording",
        entityId: recordingId,
        level: "warn",
        message: "Enhanced analysis failed, using basic analysis",
        meta: { error: (enhancedError as Error).message },
      });
    }

    let finalSummary: string;
    let keyPoints: string[];
    let fluencyFlags: Record<string, unknown>;
    let allDrills: Array<{
      content: Record<string, unknown>;
      focus_area?: string | null;
      source_timestamp_seconds?: number | null;
      drill_type?: string;
    }>;

    if (useEnhancedAnalysis && enhancedResult) {
      // Use enhanced analysis results
      finalSummary = enhancedResult.summaryMd;
      keyPoints = enhancedResult.keyPoints;
      fluencyFlags = {
        engagement_score: enhancedResult.engagementScore,
        speaking_ratio: enhancedResult.interactionMetrics.speakingRatio,
        turn_count: enhancedResult.interactionMetrics.turnCount,
        confusion_count: enhancedResult.interactionMetrics.confusionIndicators.length,
        l1_interference_level: enhancedResult.l1InterferenceAnalysis.overallLevel,
      };
      allDrills = enhancedResult.legacyDrills;
    } else {
      // Fall back to basic analysis
      const basicAnalysis = analyzeTranscript(recording.transcript_json);
      const transcriptText = extractPlainText(recording.transcript_json);
      const { grammarErrors, vocabGaps, summary: aiSummary } = await analyzeWithOpenAI(transcriptText);
      const aiDrills = generateDrillsFromErrors(grammarErrors, vocabGaps);

      allDrills = [...basicAnalysis.drills, ...aiDrills];
      keyPoints = basicAnalysis.keyPoints;
      fluencyFlags = basicAnalysis.fluencyFlags;

      finalSummary = aiSummary && aiSummary.length > 0
        ? `### AI Analysis\n${aiSummary}\n\n${basicAnalysis.summaryMd}`
        : basicAnalysis.summaryMd;
    }

    await client
      .from("lesson_recordings")
      .update({
        ai_summary_md: finalSummary,
        ai_summary: finalSummary,
        key_points: keyPoints,
        fluency_flags: fluencyFlags,
        status: "completed",
        tutor_notified_at: new Date().toISOString(),
      })
      .eq("id", recordingId);

    const drillResult = await upsertDrills(client, recording, allDrills, approvalPreference);

    // Send notification to student if drills were created, student has a user account, and auto_send is enabled
    if (drillResult && drillResult.drillCount > 0 && drillResult.studentUserId && approvalPreference === "auto_send") {
      await notifyDrillsAssigned({
        studentUserId: drillResult.studentUserId,
        tutorName: drillResult.tutorName || "Your tutor",
        drillCount: drillResult.drillCount,
        lessonDate: recording.created_at,
      });
    }

    // Send notification to tutor about analysis completion
    await notifyTutorAnalysisReady(client, {
      tutorId: recording.tutor_id,
      studentId: recording.student_id,
      bookingId: recording.booking_id,
      recordingId: recordingId,
      drillCount: allDrills.length,
    });

    await logProcessing(client, {
      entityType: "lesson_recording",
      entityId: recordingId,
      level: "info",
      message: "Analysis completed",
      meta: {
        key_points: keyPoints?.length ?? 0,
        total_drills: allDrills?.length ?? 0,
        notification_sent: !!drillResult?.studentUserId && approvalPreference === "auto_send",
        approval_preference: approvalPreference,
        used_enhanced_analysis: useEnhancedAnalysis,
      },
    });
  } catch (error) {
    console.error("[Lesson Analysis] Error:", error);
    await client
      .from("lesson_recordings")
      .update({ status: "failed" })
      .eq("id", recordingId);
    await logProcessing(client, {
      entityType: "lesson_recording",
      entityId: recordingId,
      level: "error",
      message: "Analysis failed",
      meta: { error: (error as Error).message },
    });
  }
}

async function notifyTutorAnalysisReady(
  client: AdminClient,
  params: {
    tutorId: string;
    studentId: string;
    bookingId?: string;
    recordingId: string;
    drillCount: number;
  }
) {
  const { tutorId, studentId, bookingId, recordingId, drillCount } = params;

  // Get student name for the notification
  const { data: student } = await client
    .from("students")
    .select("full_name, email")
    .eq("id", studentId)
    .single();

  const studentName = student?.full_name || student?.email || "A student";

  // Create notification for the tutor
  await client.from("notifications").insert({
    user_id: tutorId,
    type: "lesson_analysis_ready",
    title: "Lesson Analysis Ready",
    message: drillCount > 0
      ? `Analysis complete for ${studentName}'s lesson. ${drillCount} practice items generated and ready for review.`
      : `Analysis complete for ${studentName}'s lesson. Review the insights and create practice materials.`,
    metadata: {
      student_id: studentId,
      student_name: studentName,
      booking_id: bookingId,
      recording_id: recordingId,
      drill_count: drillCount,
    },
    action_url: `/students/${studentId}?tab=homework`,
    read: false,
  });

  console.log(`[Lesson Analysis] Notified tutor ${tutorId} about analysis ready for recording ${recordingId}`);
}

export async function GET() {
  const endTimer = startDuration("cron:lesson-analysis");
  const adminClient = createServiceRoleClient();
  if (!adminClient) {
    void recordSystemEvent({
      source: "cron:lesson-analysis",
      message: "Service role client unavailable",
      meta: { stage: "init" },
    });
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  // Find recordings that need analysis
  const { data: recordings, error } = await adminClient
    .from("lesson_recordings")
    .select("id, tutor_id, student_id, booking_id, transcript_json, status, created_at")
    .in("status", ["completed", "analyzing"])
    .or("ai_summary_md.is.null,key_points.is.null,fluency_flags.is.null")
    .order("created_at", { ascending: false })
    .limit(BATCH_LIMIT);

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
    await processRecording(adminClient, recording);
  }

  const durationMs = endTimer();
  void recordSystemMetric({ metric: "cron:lesson-analysis:duration_ms", value: durationMs ?? 0, sampleRate: 0.25 });
  void recordSystemMetric({ metric: "cron:lesson-analysis:processed", value: recordings.length, sampleRate: 0.5 });

  return NextResponse.json({ processed: recordings.length, duration_ms: durationMs });
}

export async function POST() {
  return GET();
}
