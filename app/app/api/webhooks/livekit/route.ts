import { NextRequest, NextResponse } from "next/server";
import { WebhookReceiver } from "livekit-server-sdk";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { getDeepgramClient, isDeepgramConfigured } from "@/lib/deepgram";
import { analyzeTranscript } from "@/lib/analysis/lesson-insights";

type AdminClient = NonNullable<ReturnType<typeof createServiceRoleClient>>;

type TutorApprovalPreference = "require_approval" | "auto_send";

/**
 * LiveKit Webhook Handler
 *
 * Receives egress events from LiveKit Cloud.
 * On egress_ended: updates DB and fires Deepgram transcription (fire-and-forget).
 *
 * Configure webhook URL in LiveKit Cloud dashboard:
 * https://your-app.com/api/webhooks/livekit
 */

function extractStorageObjectPath(location: string, fallbackBucket: string): {
  bucket: string;
  objectPath: string | null;
} {
  if (!location) return { bucket: fallbackBucket, objectPath: null };

  try {
    const url = new URL(location);
    const pathname = url.pathname;

    const matchS3 = pathname.match(/\/storage\/v1\/s3\/([^/]+)\/(.+)$/);
    if (matchS3) {
      return { bucket: matchS3[1]!, objectPath: matchS3[2]! };
    }

    const matchPublic = pathname.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
    if (matchPublic) {
      return { bucket: matchPublic[1]!, objectPath: matchPublic[2]! };
    }
  } catch {
    // Not a URL; treat as a raw object path.
  }

  if (!location.includes("://")) {
    return { bucket: fallbackBucket, objectPath: location.replace(/^\/+/, "") };
  }

  return { bucket: fallbackBucket, objectPath: null };
}

export async function POST(request: NextRequest) {
  // 1. Get raw body and authorization header
  const body = await request.text();
  const authHeader = request.headers.get("authorization");

  // 2. Validate LiveKit environment variables
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!apiKey || !apiSecret) {
    console.error("[LiveKit Webhook] Missing LIVEKIT_API_KEY or LIVEKIT_API_SECRET");
    return NextResponse.json(
      { error: "LiveKit not configured" },
      { status: 503 }
    );
  }

  // 3. Verify webhook signature using LiveKit SDK
  const receiver = new WebhookReceiver(apiKey, apiSecret);

  let event;
  try {
    event = await receiver.receive(body, authHeader ?? undefined);
  } catch (err) {
    console.error("[LiveKit Webhook] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  console.log(`[LiveKit Webhook] Received event: ${event.event}`);

  // 4. Handle egress_ended event
  if (event.event === "egress_ended") {
    const egress = event.egressInfo;

    if (!egress) {
      console.warn("[LiveKit Webhook] No egressInfo in egress_ended event");
      return NextResponse.json({ received: true });
    }

    // Get file location from egress result
    const fileResult = egress.fileResults?.[0];

    if (!fileResult?.location) {
      console.warn("[LiveKit Webhook] No file location in egress_ended");
      return NextResponse.json({ received: true });
    }

    console.log(`[LiveKit Webhook] Egress completed: ${egress.egressId}, file: ${fileResult.location}`);

    // 5. Update database - set status to 'transcribing'
    const supabase = createServiceRoleClient();
    if (!supabase) {
      console.error("[LiveKit Webhook] Failed to create Supabase client");
      return NextResponse.json({ error: "DB unavailable" }, { status: 503 });
    }

    const fallbackBucket = process.env.SUPABASE_S3_BUCKET || "recordings";
    const { bucket, objectPath } = extractStorageObjectPath(fileResult.location, fallbackBucket);
    const storagePath = objectPath ?? fileResult.location;

    // Look up booking to get tutor_id and student_id (required fields)
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("id, tutor_id, student_id, scheduled_at")
      .eq("id", egress.roomName)
      .single();

    if (bookingError || !booking) {
      console.error("[LiveKit Webhook] Failed to find booking:", egress.roomName, bookingError);
      return NextResponse.json({ received: true });
    }

    const { data: recordingRow, error: dbError } = await supabase
      .from("lesson_recordings")
      .upsert({
        booking_id: egress.roomName,  // roomName is the booking ID
        tutor_id: booking.tutor_id,
        student_id: booking.student_id,
        egress_id: egress.egressId,
        storage_path: storagePath,
        status: "transcribing",
        duration_seconds: fileResult.duration
          ? Math.round(Number(fileResult.duration) / 1000000000) // nanoseconds to seconds
          : null,
      }, {
        onConflict: "egress_id"
      })
      .select("id")
      .single();

    if (dbError) {
      console.error("[LiveKit Webhook] DB Insert Error:", dbError);
      // Continue anyway - don't fail the webhook
    } else {
      console.log("[LiveKit Webhook] DB record upserted successfully for egress:", egress.egressId);
    }

    // 6. Transcribe synchronously with Deepgram (no callback - ngrok blocks it)
    if (isDeepgramConfigured()) {
      const deepgram = getDeepgramClient();

      let publicUrl: string | null = null;
      if (objectPath) {
        const signed = await supabase.storage.from(bucket).createSignedUrl(objectPath, 60 * 60);
        publicUrl = signed.data?.signedUrl ?? null;
      }

      // Fallback if we couldn't parse the object path (legacy / misconfigured location).
      if (!publicUrl) {
        publicUrl = fileResult.location;
        if (publicUrl.includes(".storage.supabase.co/storage/v1/s3/")) {
          publicUrl = publicUrl.replace(
            ".storage.supabase.co/storage/v1/s3/",
            ".supabase.co/storage/v1/object/public/"
          );
        }
      }

      console.log(`[LiveKit Webhook] Starting Deepgram transcription for: ${publicUrl}`);

      try {
        const { result, error: dgError } = await deepgram.listen.prerecorded.transcribeUrl(
          { url: publicUrl },
          {
            model: "nova-2",
            smart_format: true,
            diarize: true,
          }
        );

        if (dgError) {
          console.error("[LiveKit Webhook] Deepgram error:", dgError);
        } else if (result) {
          console.log("[LiveKit Webhook] Transcription complete, updating DB...");

          const { error: updateError } = await supabase
            .from("lesson_recordings")
            .update({
              transcript_json: result.results,
              status: "completed",
            })
            .eq("egress_id", egress.egressId);

          if (updateError) {
            console.error("[LiveKit Webhook] Failed to update transcript:", updateError);
          } else {
            console.log("[LiveKit Webhook] Transcript saved successfully for egress:", egress.egressId);
            await processRecordingAnalysis({
              supabase,
              egressId: egress.egressId,
              recordingId: recordingRow?.id ?? null,
              booking,
              transcriptJson: result.results,
            });
          }
        }
      } catch (err) {
        console.error("[LiveKit Webhook] Deepgram transcription error:", err);
        // Update status to failed so we know something went wrong
        await supabase
          .from("lesson_recordings")
          .update({ status: "failed" })
          .eq("egress_id", egress.egressId);
      }
    } else {
      console.warn("[LiveKit Webhook] Deepgram not configured, skipping transcription");
      await supabase
        .from("lesson_recordings")
        .update({ status: "completed" })
        .eq("egress_id", egress.egressId);
    }

    // 7. Return 200 to LiveKit
    return NextResponse.json({ received: true });
  }

  // Handle egress_started event (optional logging)
  if (event.event === "egress_started") {
    console.log(`[LiveKit Webhook] Egress started: ${event.egressInfo?.egressId}`);
    return NextResponse.json({ received: true });
  }

  // Handle other events
  console.log(`[LiveKit Webhook] Unhandled event type: ${event.event}`);
  return NextResponse.json({ received: true });
}

async function processRecordingAnalysis(params: {
  supabase: AdminClient;
  egressId: string;
  recordingId: string | null;
  booking: { id: string; tutor_id: string; student_id: string; scheduled_at: string | null };
  transcriptJson: unknown;
}) {
  const { supabase, booking, egressId } = params;

  // Fetch recording if ID missing or transcript not provided
  const recordingId = params.recordingId;
  const { data: recording } = await supabase
    .from("lesson_recordings")
    .select("id, tutor_id, student_id, booking_id, transcript_json")
    .eq(recordingId ? "id" : "egress_id", recordingId ?? egressId)
    .maybeSingle();

  const targetRecordingId = recording?.id ?? recordingId;
  const transcriptJson = params.transcriptJson ?? recording?.transcript_json;

  if (!targetRecordingId || !transcriptJson) {
    console.warn("[LiveKit Webhook] Skipping analysis (missing recording or transcript)");
    return;
  }

  // Fetch tutor's approval preference
  const { data: tutorProfile } = await supabase
    .from("profiles")
    .select("auto_homework_approval")
    .eq("id", booking.tutor_id)
    .single();

  const approvalPreference: TutorApprovalPreference =
    (tutorProfile?.auto_homework_approval as TutorApprovalPreference) ?? "require_approval";

  // Mark analyzing
  await supabase
    .from("lesson_recordings")
    .update({ status: "analyzing" })
    .eq("id", targetRecordingId);

  try {
    const { summaryMd, keyPoints, fluencyFlags, drills } = analyzeTranscript(transcriptJson);

    await supabase
      .from("lesson_recordings")
      .update({
        ai_summary_md: summaryMd,
        key_points: keyPoints,
        fluency_flags: fluencyFlags,
        status: "completed",
        tutor_notified_at: new Date().toISOString(),
      })
      .eq("id", targetRecordingId);

    await upsertDrills(
      supabase,
      targetRecordingId,
      booking.student_id,
      booking.tutor_id,
      drills,
      approvalPreference
    );

    await ensureHomeworkAndPractice({
      supabase,
      tutorId: booking.tutor_id,
      studentId: booking.student_id,
      bookingId: booking.id,
      recordingId: targetRecordingId,
      nextBookingIso: await getNextBookingDate(supabase, booking.tutor_id, booking.student_id, booking.scheduled_at),
      keyPoints,
      drills,
      approvalPreference,
    });

    // Send notification to tutor about analysis completion
    await notifyTutorAnalysisReady(supabase, {
      tutorId: booking.tutor_id,
      studentId: booking.student_id,
      bookingId: booking.id,
      recordingId: targetRecordingId,
      drillCount: drills.length,
    });
  } catch (error) {
    console.error("[LiveKit Webhook] Analysis failed:", error);
    await supabase
      .from("lesson_recordings")
      .update({ status: "failed" })
      .eq("id", targetRecordingId);
  }
}

async function upsertDrills(
  supabase: AdminClient,
  recordingId: string,
  studentId: string,
  tutorId: string,
  drills: Array<{
    content: Record<string, unknown>;
    focus_area?: string | null;
    source_timestamp_seconds?: number | null;
    drill_type?: string;
  }> = [],
  approvalPreference: TutorApprovalPreference = "require_approval"
) {
  if (!drills.length) return;

  const { count } = await supabase
    .from("lesson_drills")
    .select("id", { count: "exact", head: true })
    .eq("recording_id", recordingId);

  if ((count ?? 0) > 0) return;

  // Determine visibility based on tutor preference
  const visibleToStudent = approvalPreference === "auto_send";
  const tutorApproved = approvalPreference === "auto_send";

  await supabase.from("lesson_drills").insert(
    drills.map((drill) => {
      // Determine source based on drill type or focus area
      let source: "auto_fluency" | "auto_grammar" | "auto_vocabulary" = "auto_fluency";
      if (drill.drill_type === "grammar" || drill.focus_area?.includes("grammar")) {
        source = "auto_grammar";
      } else if (drill.drill_type === "vocabulary" || drill.focus_area?.includes("vocab")) {
        source = "auto_vocabulary";
      }

      return {
        recording_id: recordingId,
        student_id: studentId,
        tutor_id: tutorId,
        content: drill.content,
        focus_area: drill.focus_area ?? null,
        source_timestamp_seconds: drill.source_timestamp_seconds ?? null,
        drill_type: drill.drill_type ?? "pronunciation",
        source,
        visible_to_student: visibleToStudent,
        tutor_approved: tutorApproved,
        tutor_approved_at: tutorApproved ? new Date().toISOString() : null,
      };
    })
  );
}

async function ensureHomeworkAndPractice(params: {
  supabase: AdminClient;
  tutorId: string;
  studentId: string;
  bookingId: string;
  recordingId: string;
  nextBookingIso: string | null;
  keyPoints: Array<{ kind?: string; text?: string | null }> | null;
  drills: Array<{ content?: Record<string, unknown> }> | null;
  approvalPreference: TutorApprovalPreference;
}) {
  const { supabase, tutorId, studentId, bookingId, recordingId, nextBookingIso, approvalPreference } = params;

  // Determine status based on tutor preference
  const homeworkStatus = approvalPreference === "auto_send" ? "assigned" : "draft";

  // Skip if homework already exists for this booking
  const { data: existingHw } = await supabase
    .from("homework_assignments")
    .select("id, practice_assignment_id, due_date")
    .eq("tutor_id", tutorId)
    .eq("student_id", studentId)
    .eq("booking_id", bookingId)
    .limit(1);

  const dueDate = nextBookingIso ?? null;

  if (existingHw && existingHw.length > 0) {
    const hw = existingHw[0];
    // Backfill due date if missing
    if (!hw.due_date && dueDate) {
      await supabase
        .from("homework_assignments")
        .update({ due_date: dueDate })
        .eq("id", hw.id);
    }
    return;
  }

  const struggleLines =
    (params.keyPoints || [])
      .filter((kp) => kp?.kind === "struggle" && typeof kp.text === "string")
      .map((kp) => kp.text as string)
      .slice(0, 3) || [];

  const homeworkInstructions = struggleLines.length
    ? `Focus before next lesson:\n- ${struggleLines.join("\n- ")}`
    : "Review today's key points and be ready to discuss questions next session.";

  const { data: homework, error: hwError } = await supabase
    .from("homework_assignments")
    .insert({
      tutor_id: tutorId,
      student_id: studentId,
      booking_id: bookingId,
      recording_id: recordingId,
      title: "Homework before next lesson",
      instructions: homeworkInstructions,
      due_date: dueDate,
      status: homeworkStatus,
      source: "auto_lesson_analysis",
      tutor_reviewed: approvalPreference === "auto_send",
      tutor_reviewed_at: approvalPreference === "auto_send" ? new Date().toISOString() : null,
    })
    .select("id")
    .single();

  if (hwError || !homework?.id) {
    if (hwError) console.error("[LiveKit Webhook] Failed to create homework:", hwError);
    return;
  }

  // Auto-create practice linked to homework if we have drills
  const practicePrompt =
    params.drills && params.drills.length > 0
      ? Object.values(params.drills[0].content || {})
          .map((v) => (typeof v === "string" ? v : ""))
          .filter(Boolean)
          .slice(0, 2)
          .join(" · ")
      : null;

  if (!practicePrompt) return;

  const { data: practice, error: practiceError } = await supabase
    .from("practice_assignments")
    .insert({
      tutor_id: tutorId,
      student_id: studentId,
      homework_assignment_id: homework.id,
      title: "AI practice before next lesson",
      instructions: practicePrompt,
      due_date: dueDate,
      status: homeworkStatus,
    })
    .select("id")
    .single();

  if (practiceError) {
    console.error("[LiveKit Webhook] Failed to create practice assignment:", practiceError);
    return;
  }

  if (practice?.id) {
    await supabase
      .from("homework_assignments")
      .update({ practice_assignment_id: practice.id })
      .eq("id", homework.id);
  }
}

async function getNextBookingDate(
  supabase: AdminClient,
  tutorId: string,
  studentId: string,
  currentBookingAt: string | null
): Promise<string | null> {
  const baseline = currentBookingAt ? new Date(currentBookingAt).getTime() : Date.now();
  const after = new Date(Math.max(Date.now(), baseline)).toISOString();

  const { data: nextBooking } = await supabase
    .from("bookings")
    .select("scheduled_at")
    .eq("tutor_id", tutorId)
    .eq("student_id", studentId)
    .in("status", ["pending", "confirmed"])
    .gt("scheduled_at", after)
    .order("scheduled_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  return nextBooking?.scheduled_at ?? null;
}

async function notifyTutorAnalysisReady(
  supabase: AdminClient,
  params: {
    tutorId: string;
    studentId: string;
    bookingId: string;
    recordingId: string;
    drillCount: number;
  }
) {
  const { tutorId, studentId, bookingId, recordingId, drillCount } = params;

  // Get student name for the notification
  const { data: student } = await supabase
    .from("students")
    .select("full_name, email")
    .eq("id", studentId)
    .single();

  const studentName = student?.full_name || student?.email || "A student";

  // Create notification for the tutor
  await supabase.from("notifications").insert({
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

  console.log(`[LiveKit Webhook] Notified tutor ${tutorId} about analysis ready for recording ${recordingId}`);
}
