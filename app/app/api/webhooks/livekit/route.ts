import { NextRequest, NextResponse } from "next/server";
import { CallbackUrl } from "@deepgram/sdk";
import { WebhookReceiver } from "livekit-server-sdk";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import {
  getDeepgramClient,
  isDeepgramConfigured,
  buildTranscriptionOptions,
  shouldEnableCodeSwitching,
} from "@/lib/deepgram";
import { assertGoogleDataIsolation } from "@/lib/ai/google-compliance";
import { updateRecordingStatus } from "@/lib/repositories/recordings";
import { getSignedUrl } from "@/lib/storage/signed-urls";

export const runtime = "nodejs";

const STORAGE_ENDPOINT =
  process.env.DIGITALOCEAN_SPACES_ENDPOINT ??
  process.env.S3_ENDPOINT ??
  process.env.SUPABASE_S3_ENDPOINT;
const STORAGE_ENDPOINT_HOST = (() => {
  const normalized = normalizeStorageEndpoint(STORAGE_ENDPOINT);
  if (!normalized) return null;
  try {
    return new URL(normalized).host;
  } catch {
    return null;
  }
})();

function normalizeStorageEndpoint(value?: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim().replace(/\/+$/, "");
  if (!trimmed) return null;
  if (/^https?:\/\//.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

function buildPublicObjectUrl(bucket: string, objectPath: string): string | null {
  const endpoint = normalizeStorageEndpoint(STORAGE_ENDPOINT);
  if (!endpoint) return null;
  const base = endpoint.replace(/\/+$/, "");
  const safeBucket = bucket.replace(/^\/+|\/+$/g, "");
  const safeObjectPath = objectPath.replace(/^\/+/, "");
  return `${base}/${safeBucket}/${safeObjectPath}`;
}

function redactUrl(value: string): string {
  try {
    const url = new URL(value);
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return value.split("?")[0] ?? value;
  }
}

/**
 * LiveKit Webhook Handler
 *
 * Receives egress events from LiveKit Cloud.
 * On egress_ended: updates DB and fires Deepgram transcription (fire-and-forget).
 *
 * @google-compliance
 * Deepgram receives lesson audio only; external calendar data is never used.
 *
 * Configure webhook URL in LiveKit Cloud dashboard:
 * https://your-app.com/api/webhooks/livekit
 */

function extractStorageObjectPath(location: string, fallbackBucket: string): {
  bucket: string;
  objectPath: string | null;
} {
  if (!location) return { bucket: fallbackBucket, objectPath: null };

  const s3Match = location.match(/^s3:\/\/([^/]+)\/(.+)$/i);
  if (s3Match) {
    return { bucket: s3Match[1]!, objectPath: s3Match[2]! };
  }

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

    if (url.hostname.endsWith(".digitaloceanspaces.com")) {
      const hostParts = url.hostname.split(".");
      const bucket = hostParts.length > 3 ? hostParts[0] : null;
      const objectPath = pathname.replace(/^\/+/, "");
      if (bucket && objectPath) {
        return { bucket, objectPath };
      }
    }

    if (STORAGE_ENDPOINT_HOST && url.hostname === STORAGE_ENDPOINT_HOST) {
      const parts = pathname.split("/").filter(Boolean);
      if (parts.length >= 2) {
        return {
          bucket: parts[0]!,
          objectPath: parts.slice(1).join("/"),
        };
      }
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

    const { data: recording, error: dbError } = await supabase
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
        .select("native_language, target_language, dialect_variant")
        .eq("student_id", booking.student_id)
        .order("lessons_analyzed", { ascending: false })
        .limit(1)
        .maybeSingle();

      let publicUrl: string | null = null;
      const locationIsSupabase =
        fileResult.location.includes(".supabase.co") ||
        fileResult.location.includes("/storage/v1/");

      if (objectPath && locationIsSupabase) {
        publicUrl = await getSignedUrl(supabase, bucket, objectPath, 6 * 60 * 60);
      }

      if (!publicUrl && objectPath) {
        publicUrl = buildPublicObjectUrl(bucket, objectPath);
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
      console.log(
        `[LiveKit Webhook] Starting Deepgram transcription for: ${redactUrl(urlForDeepgram)}`
      );

      try {
        assertGoogleDataIsolation({
          provider: "deepgram",
          context: "livekit-webhook.transcribe",
          data: { recordingId: recording?.id, egressId: egress.egressId },
          sources: ["lesson_recordings.audio"],
        });

        // Build transcription options with code-switching support
        const transcriptionOptions = buildTranscriptionOptions({
          nativeLanguage: languageProfile?.native_language,
          targetLanguage: languageProfile?.target_language,
          dialectVariant: languageProfile?.dialect_variant,
        });

        // Log code-switching decision for debugging
        const codeSwitchingStatus = shouldEnableCodeSwitching(
          languageProfile?.native_language,
          languageProfile?.target_language
        );
        console.log(`[LiveKit Webhook] Code-switching: ${codeSwitchingStatus.reason}`);

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
          const updateResult = await updateRecordingStatus(supabase, {
            egressId: egress.egressId,
            status: "failed",
          });
          if (updateResult.error) {
            console.error("[LiveKit Webhook] Failed to update recording status:", updateResult.error);
          }
        } else if (result) {
          if (useCallback) {
            console.log("[LiveKit Webhook] Deepgram async transcription started:", result);
          } else {
            console.log("[LiveKit Webhook] Transcription complete, updating DB...");

            const updateResult = await updateRecordingStatus(supabase, {
              egressId: egress.egressId,
              status: "completed",
              transcriptJson: (result as { results?: unknown })?.results,
            });

            if (updateResult.error) {
              console.error("[LiveKit Webhook] Failed to update transcript:", updateResult.error);
            } else {
              console.log("[LiveKit Webhook] Transcript saved successfully for egress:", egress.egressId);
            }
          }
        }
      } catch (err) {
        console.error("[LiveKit Webhook] Deepgram transcription error:", err);
        const updateResult = await updateRecordingStatus(supabase, {
          egressId: egress.egressId,
          status: "failed",
        });
        if (updateResult.error) {
          console.error("[LiveKit Webhook] Failed to update recording status:", updateResult.error);
        }
      }
    } else {
      console.warn("[LiveKit Webhook] Deepgram not configured, skipping transcription");
      const updateResult = await updateRecordingStatus(supabase, {
        egressId: egress.egressId,
        status: "completed",
      });
      if (updateResult.error) {
        console.error("[LiveKit Webhook] Failed to update recording status:", updateResult.error);
      }
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
