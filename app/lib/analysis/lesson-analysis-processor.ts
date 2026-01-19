import { createServiceRoleClient } from "@/lib/supabase/admin";
import {
  analyzeTranscript,
  extractPlainText,
  analyzeWithOpenAI,
  generateDrillsFromErrors,
} from "@/lib/analysis/lesson-insights";
import { processEnhancedAnalysis } from "@/lib/analysis/enhanced-processor";
import { notifyDrillsAssigned } from "@/lib/actions/notifications";

type AdminClient = NonNullable<ReturnType<typeof createServiceRoleClient>>;
type TutorApprovalPreference = "require_approval" | "auto_send";

const AUTO_SEND_ENABLED = false; // Feature flag: keep auto-send disabled for now.

type LessonRecordingInput = {
  id: string;
  tutor_id: string;
  student_id: string;
  booking_id?: string | null;
  transcript_json: unknown;
  created_at?: string | null;
  updated_at?: string | null;
  status?: string | null;
  tutor_notified_at?: string | null;
};

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
  recording: { id: string; student_id: string; tutor_id: string; booking_id?: string | null; created_at?: string | null },
  drills: Array<{
    content: Record<string, unknown>;
    focus_area?: string | null;
    source_timestamp_seconds?: number | null;
    drill_type?: string;
  }>,
  approvalPreference: TutorApprovalPreference
): Promise<{
  drillCount: number;
  drillsInserted: boolean;
  studentUserId: string | null;
  tutorName: string | null;
  homeworkId: string | null;
  practiceAssignmentId: string | null;
} | null> {
  if (!recording?.id || !recording?.student_id || !recording?.tutor_id) return null;
  if (!Array.isArray(drills)) return null;

  const drillsToInsert = drills;

  // Load existing drills for idempotency and linking.
  const { data: existingDrills } = await client
    .from("lesson_drills")
    .select("id, homework_assignment_id")
    .eq("recording_id", recording.id);

  const hasExistingDrills = (existingDrills?.length ?? 0) > 0;
  if (!hasExistingDrills && drillsToInsert.length === 0) return null;

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

  let drillsInserted = false;
  if (!hasExistingDrills && drillsToInsert.length > 0) {
    // Insert drills with booking link, due date, and visibility settings
    const { data: insertedDrills } = await client.from("lesson_drills").insert(
      drillsToInsert.map((drill) => {
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
    drillsInserted = (insertedDrills?.length ?? 0) > 0;
  }

  // Determine homework status based on tutor preference
  const homeworkStatus = approvalPreference === "auto_send" ? "assigned" : "draft";

  // Find or create homework assignment for this recording
  let homework: { id: string; status: string; practice_assignment_id: string | null } | null = null;
  const { data: existingHomework } = await client
    .from("homework_assignments")
    .select("id, status, practice_assignment_id")
    .eq("recording_id", recording.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingHomework?.id) {
    homework = existingHomework;
  } else if (hasExistingDrills || drillsInserted) {
    const { data: createdHomework } = await client
      .from("homework_assignments")
      .insert({
        tutor_id: recording.tutor_id,
        student_id: recording.student_id,
        booking_id: nextBooking?.id ?? null,
        recording_id: recording.id,
        title: "Practice from your recent lesson",
        instructions: `Review ${hasExistingDrills ? existingDrills?.length ?? 0 : drillsToInsert.length} practice items generated from your recent lesson recording. Focus on the areas highlighted by your tutor.`,
        due_date: dueDate,
        status: homeworkStatus,
        source: "auto_lesson_analysis",
        tutor_reviewed: approvalPreference === "auto_send",
        tutor_reviewed_at: approvalPreference === "auto_send" ? new Date().toISOString() : null,
      })
      .select("id, status, practice_assignment_id")
      .single();

    homework = createdHomework ?? null;
  }

  const drillVisibility = homework?.status === "assigned";

  // Link drills to the homework assignment
  if (homework?.id) {
    await client
      .from("lesson_drills")
      .update({
        homework_assignment_id: homework.id,
        status: drillVisibility ? "assigned" : "pending",
        visible_to_student: drillVisibility,
        tutor_approved: drillVisibility,
        tutor_approved_at: drillVisibility ? new Date().toISOString() : null,
      })
      .eq("recording_id", recording.id);
  }

  let practiceAssignmentId: string | null = homework?.practice_assignment_id ?? null;

  if (homework?.id) {
    if (practiceAssignmentId) {
      const { data: existingPractice } = await client
        .from("practice_assignments")
        .select("id")
        .eq("id", practiceAssignmentId)
        .maybeSingle();
      if (!existingPractice) {
        practiceAssignmentId = null;
      }
    }

    if (!practiceAssignmentId) {
      const { data: existingPractice } = await client
        .from("practice_assignments")
        .select("id")
        .eq("homework_assignment_id", homework.id)
        .maybeSingle();
      practiceAssignmentId = existingPractice?.id ?? null;
    }

    if (!practiceAssignmentId) {
      const { data: newPractice } = await client
        .from("practice_assignments")
        .insert({
          tutor_id: recording.tutor_id,
          student_id: recording.student_id,
          scenario_id: null,
          homework_assignment_id: homework.id,
          title: "AI practice for your next lesson",
          instructions: "Use this AI practice to reinforce what you learned in your recent lesson.",
          due_date: dueDate,
          status: "assigned",
        })
        .select("id")
        .single();
      practiceAssignmentId = newPractice?.id ?? null;
    }

    if (practiceAssignmentId && homework.practice_assignment_id !== practiceAssignmentId) {
      await client
        .from("homework_assignments")
        .update({ practice_assignment_id: practiceAssignmentId })
        .eq("id", homework.id);
    }
  }

  const drillCount = hasExistingDrills ? existingDrills?.length ?? 0 : drillsToInsert.length;

  return {
    drillCount,
    drillsInserted,
    studentUserId,
    tutorName,
    homeworkId: homework?.id ?? null,
    practiceAssignmentId,
  };
}

async function notifyTutorAnalysisReady(
  client: AdminClient,
  params: {
    tutorId: string;
    studentId: string;
    bookingId?: string | null;
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

export async function processLessonRecording(
  client: AdminClient,
  recording: LessonRecordingInput
) {
  const recordingId = recording.id;

  if (recording.status === "analyzing") {
    if (recording.tutor_notified_at) {
      return;
    }

    const claimPayload = { updated_at: new Date().toISOString() };
    let claimQuery = client
      .from("lesson_recordings")
      .update(claimPayload)
      .eq("id", recordingId)
      .eq("status", "analyzing")
      .is("tutor_notified_at", null);

    if (recording.updated_at) {
      claimQuery = claimQuery.eq("updated_at", recording.updated_at);
    }

    const { data: claimed, error: claimError } = await claimQuery
      .select("id")
      .maybeSingle();

    if (claimError) {
      console.error("[Lesson Analysis] Failed to claim analyzing recording", recordingId, claimError);
      return;
    }

    if (!claimed) {
      return;
    }
  }

  if (recording.status === "completed") {
    const { data: claimed, error: claimError } = await client
      .from("lesson_recordings")
      .update({ status: "analyzing", updated_at: new Date().toISOString() })
      .eq("id", recordingId)
      .eq("status", "completed")
      .select("id")
      .maybeSingle();

    if (claimError) {
      console.error("[Lesson Analysis] Failed to claim recording", recordingId, claimError);
      return;
    }

    if (!claimed) {
      // Another worker claimed this recording.
      return;
    }
  }

  await logProcessing(client, {
    entityType: "lesson_recording",
    entityId: recordingId,
    level: "info",
    message: "Analysis started",
  });

  try {
    // Fetch tutor's approval preference and name
    const { data: tutorProfile } = await client
      .from("profiles")
      .select("auto_homework_approval, full_name")
      .eq("id", recording.tutor_id)
      .single();

    const storedApprovalPreference: TutorApprovalPreference =
      (tutorProfile?.auto_homework_approval as TutorApprovalPreference) ?? "require_approval";
    const approvalPreference: TutorApprovalPreference = AUTO_SEND_ENABLED
      ? storedApprovalPreference
      : "require_approval";
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
        bookingId: recording.booking_id ?? undefined,
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
      const basicAnalysis = analyzeTranscript(recording.transcript_json, {
        role: "student",
        tutorName,
      });
      const transcriptText = extractPlainText(recording.transcript_json, {
        role: "student",
        tutorName,
      });
      const { grammarErrors, vocabGaps, summary: aiSummary } = await analyzeWithOpenAI(transcriptText);
      const aiDrills = generateDrillsFromErrors(grammarErrors, vocabGaps);

      allDrills = [...basicAnalysis.drills, ...aiDrills];
      keyPoints = basicAnalysis.keyPoints.map(kp => kp.text);
      fluencyFlags = {
        flags: basicAnalysis.fluencyFlags,
        filler_count: basicAnalysis.fluencyFlags.filter(f => f.type === "filler").length,
        pause_count: basicAnalysis.fluencyFlags.filter(f => f.type === "pause").length,
        stutter_count: basicAnalysis.fluencyFlags.filter(f => f.type === "stutter").length,
      };

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
      })
      .eq("id", recordingId);

    const drillResult = await upsertDrills(client, recording, allDrills, approvalPreference);

    const allowAutoSend = AUTO_SEND_ENABLED && storedApprovalPreference === "auto_send";
    if (drillResult && drillResult.drillsInserted && drillResult.studentUserId && allowAutoSend) {
      await notifyDrillsAssigned({
        studentUserId: drillResult.studentUserId,
        tutorName: drillResult.tutorName || "Your tutor",
        drillCount: drillResult.drillCount,
        lessonDate: recording.created_at ?? undefined,
      });
    }

    const { data: tutorNotificationClaim } = await client
      .from("lesson_recordings")
      .update({ tutor_notified_at: new Date().toISOString() })
      .eq("id", recordingId)
      .is("tutor_notified_at", null)
      .select("id")
      .maybeSingle();

    if (tutorNotificationClaim) {
      await notifyTutorAnalysisReady(client, {
        tutorId: recording.tutor_id,
        studentId: recording.student_id,
        bookingId: recording.booking_id ?? null,
        recordingId: recordingId,
        drillCount: allDrills.length,
      });
    }

    await logProcessing(client, {
      entityType: "lesson_recording",
      entityId: recordingId,
      level: "info",
      message: "Analysis completed",
      meta: {
        key_points: keyPoints?.length ?? 0,
        total_drills: allDrills?.length ?? 0,
        notification_sent: !!drillResult?.studentUserId && drillResult?.drillsInserted && allowAutoSend,
        effective_approval_preference: approvalPreference,
        stored_approval_preference: storedApprovalPreference,
        auto_send_enabled: AUTO_SEND_ENABLED,
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
