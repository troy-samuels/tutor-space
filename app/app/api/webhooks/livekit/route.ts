import { NextRequest, NextResponse } from "next/server";
import { CallbackUrl, type PrerecordedSchema } from "@deepgram/sdk";
import { WebhookReceiver } from "livekit-server-sdk";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { getDeepgramClient, isDeepgramConfigured } from "@/lib/deepgram";

export const runtime = "nodejs";

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

    const { error: dbError } = await supabase
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
      .maybeSingle();

    if (dbError) {
      console.error("[LiveKit Webhook] DB Insert Error:", dbError);
      // Continue anyway - don't fail the webhook
    } else {
      console.log("[LiveKit Webhook] DB record upserted successfully for egress:", egress.egressId);
    }

    // 6. Transcribe with Deepgram (async callback in prod, sync fallback in dev)
    if (isDeepgramConfigured()) {
      const deepgram = getDeepgramClient();

      const { data: languageProfile } = await supabase
        .from("student_language_profiles")
        .select("target_language, dialect_variant")
        .eq("student_id", booking.student_id)
        .order("lessons_analyzed", { ascending: false })
        .limit(1)
        .maybeSingle();

      let publicUrl: string | null = null;
      if (objectPath) {
        const signed = await supabase.storage.from(bucket).createSignedUrl(objectPath, 6 * 60 * 60);
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

      const urlForDeepgram = publicUrl || fileResult.location;
      console.log(`[LiveKit Webhook] Starting Deepgram transcription for: ${urlForDeepgram}`);

      try {
        const deepgramLanguage =
          typeof languageProfile?.dialect_variant === "string" && languageProfile.dialect_variant.trim().length > 0
            ? languageProfile.dialect_variant
            : typeof languageProfile?.target_language === "string" && languageProfile.target_language.trim().length > 0
              ? languageProfile.target_language
              : null;

        const transcriptionOptions: PrerecordedSchema = {
          model: "nova-3",
          smart_format: true,
          punctuate: true,
          diarize: true,
          utterances: true,
          paragraphs: true,
          filler_words: true,
          ...(deepgramLanguage ? { language: deepgramLanguage } : { detect_language: true }),
        };

        const callbackBase = (process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin).replace(/\/$/, "");
        const useCallback = process.env.NODE_ENV === "production" && callbackBase.startsWith("https://");

        const { result, error: dgError } = useCallback
          ? await deepgram.listen.prerecorded.transcribeUrlCallback(
              { url: urlForDeepgram },
              new CallbackUrl(
                `${callbackBase}/api/webhooks/deepgram?egress_id=${encodeURIComponent(egress.egressId)}`
              ),
              transcriptionOptions
            )
          : await deepgram.listen.prerecorded.transcribeUrl({ url: urlForDeepgram }, transcriptionOptions);

        if (dgError) {
          console.error("[LiveKit Webhook] Deepgram error:", dgError);
          await supabase
            .from("lesson_recordings")
            .update({ status: "failed" })
            .eq("egress_id", egress.egressId);
        } else if (result) {
          if (useCallback) {
            console.log("[LiveKit Webhook] Deepgram async transcription started:", result);
          } else {
            console.log("[LiveKit Webhook] Transcription complete, updating DB...");

            const { error: updateError } = await supabase
              .from("lesson_recordings")
              .update({
                transcript_json: (result as { results?: unknown })?.results,
                status: "completed",
              })
              .eq("egress_id", egress.egressId);

            if (updateError) {
              console.error("[LiveKit Webhook] Failed to update transcript:", updateError);
            } else {
              console.log("[LiveKit Webhook] Transcript saved successfully for egress:", egress.egressId);
            }
          }
        }
      } catch (err) {
        console.error("[LiveKit Webhook] Deepgram transcription error:", err);
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
