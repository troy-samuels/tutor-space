import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import OpenAI from "openai";
import { extractPlainText } from "@/lib/analysis/lesson-insights";
import { assertGoogleDataIsolation } from "@/lib/ai/google-compliance";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { slugifyKebab } from "@/lib/utils/slug";

type AdminClient = NonNullable<ReturnType<typeof createServiceRoleClient>>;

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;
const DEEPGRAM_WEBHOOK_SECRET = process.env.DEEPGRAM_WEBHOOK_SECRET?.trim();

/**
 * @google-compliance
 * OpenAI is used only for transcript-derived marketing clip summaries.
 * External calendar data (calendar_events, calendar_connections) is NEVER included.
 */
const MARKETING_CLIP_SYSTEM_PROMPT = [
  "You are a language-learning content strategist analyzing lesson transcripts.",
  "Identify ONE high-value teaching moment (30-60s) where a specific concept is explained clearly.",
  "Return a marketing_clip object with: title (viral style), topic, start_time, end_time, and summary.",
  "Use seconds for start_time and end_time. Summary should be 1-2 sentences and student-friendly.",
].join(" ");

function toNumberOrNull(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function secretsMatch(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

function extractWebhookToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (authHeader) {
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    if (match?.[1]) {
      return match[1].trim();
    }
  }

  return (
    request.headers.get("x-webhook-secret")?.trim()
    || request.headers.get("x-deepgram-webhook-secret")?.trim()
    || null
  );
}

async function ensureUniqueSlug(client: AdminClient, baseSlug: string): Promise<string> {
  let attempt = 0;
  let candidate = baseSlug;

  while (attempt < 5) {
    const { data } = await client
      .from("marketing_clips")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();

    if (!data) return candidate;
    attempt += 1;
    candidate = `${baseSlug}-${attempt + 1}`;
  }

  return `${baseSlug}-${Date.now()}`;
}

async function generateMarketingClip(transcript: string) {
  if (!openai || !transcript || transcript.length < 50) return null;

  try {
    assertGoogleDataIsolation({
      provider: "openai",
      context: "deepgram-webhook.generateMarketingClip",
      data: { transcript },
      sources: ["lesson_recordings.transcript_json"],
    });

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: MARKETING_CLIP_SYSTEM_PROMPT },
        { role: "user", content: transcript.slice(0, 12000) },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content);
    const clip = parsed.marketing_clip ?? parsed;

    if (clip && typeof clip === "object") {
      return {
        title: typeof clip.title === "string" ? clip.title : null,
        topic: typeof clip.topic === "string" ? clip.topic : null,
        summary: typeof clip.summary === "string" ? clip.summary : null,
        start_time: toNumberOrNull(clip.start_time),
        end_time: toNumberOrNull(clip.end_time),
      };
    }
  } catch (error) {
    console.error("[Deepgram Webhook] OpenAI marketing clip error:", error);
  }

  return null;
}

async function insertMarketingClip(params: {
  client: AdminClient;
  recording: { id: string; tutor_id: string; storage_path: string | null };
  clip: {
    title: string | null;
    topic: string | null;
    summary: string | null;
    start_time: number | null;
    end_time: number | null;
  };
  transcriptFallback: string;
}) {
  const { client, recording, clip, transcriptFallback } = params;
  if (!recording?.id || !recording?.tutor_id || !recording?.storage_path) {
    console.warn("[Deepgram Webhook] Missing recording details for marketing clip insert");
    return;
  }

  const { data: existing } = await client
    .from("marketing_clips")
    .select("id")
    .eq("recording_id", recording.id)
    .limit(1)
    .maybeSingle();

  if (existing) {
    console.log("[Deepgram Webhook] Marketing clip already exists for recording", recording.id);
    return;
  }

  const fallbackTitle = clip.title && clip.title.trim().length > 0
    ? clip.title
    : "Lesson highlight";
  const baseSlug = slugifyKebab(fallbackTitle, {
    fallback: `lesson-${recording.id.slice(0, 8)}`,
    maxLength: 96,
  });
  const slug = await ensureUniqueSlug(client, baseSlug);

  const { error } = await client
    .from("marketing_clips")
    .insert({
      recording_id: recording.id,
      tutor_id: recording.tutor_id,
      storage_path: recording.storage_path,
      title: clip.title ?? fallbackTitle,
      slug,
      topic: clip.topic ?? null,
      start_time: clip.start_time,
      end_time: clip.end_time,
      transcript_snippet: clip.summary ?? transcriptFallback.slice(0, 280),
    });

  if (error) {
    console.error("[Deepgram Webhook] Failed to insert marketing clip:", error);
  } else {
    console.log("[Deepgram Webhook] Marketing clip captured for recording", recording.id);
  }
}

/**
 * Deepgram Webhook Handler
 *
 * Receives transcription results from Deepgram's async callback.
 * Updates lesson_recordings with transcript and sets status to 'completed'.
 */
export async function POST(request: NextRequest) {
  try {
    if (!DEEPGRAM_WEBHOOK_SECRET) {
      console.error("[Deepgram Webhook] DEEPGRAM_WEBHOOK_SECRET is not configured");
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 503 }
      );
    }

    const providedSecret = extractWebhookToken(request);
    if (!providedSecret || !secretsMatch(providedSecret, DEEPGRAM_WEBHOOK_SECRET)) {
      console.warn("[Deepgram Webhook] Invalid webhook secret");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const body = await request.json();

    console.log("[Deepgram Webhook] Received callback");

    // Deepgram callback includes request_id which we can use to match
    // But we need to identify which recording this belongs to
    // The callback URL should include the egress_id as a query param
    const url = new URL(request.url);
    const egressId = url.searchParams.get("egress_id");

    if (!egressId) {
      console.error("[Deepgram Webhook] No egress_id in callback URL");
      return NextResponse.json({ error: "Missing egress_id" }, { status: 400 });
    }

    // Extract transcript from Deepgram response
    const transcript = body?.results?.channels?.[0]?.alternatives?.[0]?.transcript;

    if (!transcript) {
      console.error("[Deepgram Webhook] No transcript in response");
      return NextResponse.json({ received: true });
    }

    console.log(`[Deepgram Webhook] Transcript received for egress: ${egressId}, length: ${transcript.length}`);

    // Update database
    const supabase = createServiceRoleClient();
    if (!supabase) {
      console.error("[Deepgram Webhook] Failed to create Supabase client");
      return NextResponse.json({ error: "DB unavailable" }, { status: 503 });
    }

    const { data: recording, error: dbError } = await supabase
      .from("lesson_recordings")
      .update({
        transcript_json: body.results, // Store full response for speaker diarization
        status: "completed",
      })
      .eq("egress_id", egressId)
      .select("id, tutor_id, storage_path")
      .maybeSingle();

    if (dbError) {
      console.error("[Deepgram Webhook] DB Update Error:", dbError);
      return NextResponse.json({ error: "DB update failed" }, { status: 500 });
    }

    console.log(`[Deepgram Webhook] Successfully updated recording for egress: ${egressId}`);

    const transcriptText = (extractPlainText(body.results) || transcript || "").trim();

    if (recording && transcriptText) {
      const { data: tutorProfile, error: tutorProfileError } = await supabase
        .from("profiles")
        .select("tutor_recording_consent")
        .eq("id", recording.tutor_id)
        .maybeSingle();

      if (tutorProfileError) {
        console.error("[Deepgram Webhook] Failed to check tutor recording consent:", tutorProfileError);
      }

      const hasMarketingConsent = Boolean(tutorProfile?.tutor_recording_consent);

      if (!hasMarketingConsent) {
        console.log("[Deepgram Webhook] Skipping marketing clip generation (tutor not opted in)");
      } else {
        const clip = await generateMarketingClip(transcriptText);
        if (clip) {
          await insertMarketingClip({
            client: supabase,
            recording,
            clip,
            transcriptFallback: transcriptText,
          });
        } else {
          console.warn("[Deepgram Webhook] OpenAI did not return marketing clip data");
        }
      }
    } else {
      console.warn("[Deepgram Webhook] Skipping marketing clip generation (missing recording or transcript)");
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error("[Deepgram Webhook] Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
