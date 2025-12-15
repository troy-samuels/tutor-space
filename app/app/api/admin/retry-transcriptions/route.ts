import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { getDeepgramClient, isDeepgramConfigured } from "@/lib/deepgram";

function parseSupabaseStoragePath(
  value: string,
  fallbackBucket: string
): { bucket: string; objectPath: string | null; fallbackUrl: string | null } {
  try {
    const url = new URL(value);
    const pathname = url.pathname;

    const matchS3 = pathname.match(/\/storage\/v1\/s3\/([^/]+)\/(.+)$/);
    if (matchS3) {
      const bucket = matchS3[1]!;
      const objectPath = matchS3[2]!;
      const publicFallback = value.includes(".storage.supabase.co/storage/v1/s3/")
        ? value.replace(".storage.supabase.co/storage/v1/s3/", ".supabase.co/storage/v1/object/public/")
        : value;
      return { bucket, objectPath, fallbackUrl: publicFallback };
    }

    const matchPublic = pathname.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
    if (matchPublic) {
      return { bucket: matchPublic[1]!, objectPath: matchPublic[2]!, fallbackUrl: value };
    }
  } catch {
    // Not a URL.
  }

  if (!value.includes("://")) {
    return { bucket: fallbackBucket, objectPath: value.replace(/^\/+/, ""), fallbackUrl: null };
  }

  return { bucket: fallbackBucket, objectPath: null, fallbackUrl: value };
}

/**
 * Admin endpoint to retry transcription for stuck recordings.
 * Fetches all recordings with status='transcribing' and re-processes them.
 *
 * Usage: POST /api/admin/retry-transcriptions
 */
export async function POST(request: NextRequest) {
  // Basic auth check - in production you'd want proper admin auth
  if (!process.env.ADMIN_SECRET) {
    return NextResponse.json(
      { error: "ADMIN_SECRET not configured" },
      { status: 503 }
    );
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.ADMIN_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isDeepgramConfigured()) {
    return NextResponse.json({ error: "Deepgram not configured" }, { status: 503 });
  }

  const supabase = createServiceRoleClient();
  if (!supabase) {
    return NextResponse.json({ error: "DB unavailable" }, { status: 503 });
  }

  // Fetch all stuck recordings
  const { data: stuckRecordings, error: fetchError } = await supabase
    .from("lesson_recordings")
    .select("id, egress_id, storage_path, booking_id")
    .eq("status", "transcribing");

  if (fetchError) {
    console.error("[Retry Transcriptions] Failed to fetch recordings:", fetchError);
    return NextResponse.json({ error: "Failed to fetch recordings" }, { status: 500 });
  }

  if (!stuckRecordings || stuckRecordings.length === 0) {
    return NextResponse.json({ message: "No stuck recordings found", processed: 0 });
  }

  console.log(`[Retry Transcriptions] Found ${stuckRecordings.length} stuck recordings`);

  const deepgram = getDeepgramClient();
  const results: Array<{ egress_id: string; success: boolean; error?: string }> = [];

  const fallbackBucket = process.env.SUPABASE_S3_BUCKET || "recordings";

  for (const recording of stuckRecordings) {
    const parsed = parseSupabaseStoragePath(recording.storage_path, fallbackBucket);

    let publicUrl: string | null = parsed.fallbackUrl;
    if (parsed.objectPath) {
      const signed = await supabase.storage
        .from(parsed.bucket)
        .createSignedUrl(parsed.objectPath, 60 * 60);
      publicUrl = signed.data?.signedUrl ?? null;
    }

    if (!publicUrl) {
      await supabase
        .from("lesson_recordings")
        .update({ status: "failed" })
        .eq("egress_id", recording.egress_id);

      results.push({
        egress_id: recording.egress_id,
        success: false,
        error: "Failed to create signed URL for recording",
      });
      continue;
    }

    console.log(`[Retry Transcriptions] Processing ${recording.egress_id}: ${publicUrl}`);

    try {
      const { result, error: dgError } = await deepgram.listen.prerecorded.transcribeUrl(
        { url: publicUrl },
        {
          model: "nova-2",
          smart_format: true,
          punctuate: true,
          diarize: true,
          utterances: true,
          paragraphs: true,
          filler_words: true,
          detect_language: true,
        }
      );

      if (dgError) {
        console.error(`[Retry Transcriptions] Deepgram error for ${recording.egress_id}:`, dgError);

        await supabase
          .from("lesson_recordings")
          .update({ status: "failed" })
          .eq("egress_id", recording.egress_id);

        results.push({ egress_id: recording.egress_id, success: false, error: String(dgError) });
      } else if (result) {
        console.log(`[Retry Transcriptions] Transcription complete for ${recording.egress_id}`);

        const { error: updateError } = await supabase
          .from("lesson_recordings")
          .update({
            transcript_json: result.results,
            status: "completed",
          })
          .eq("egress_id", recording.egress_id);

        if (updateError) {
          console.error(`[Retry Transcriptions] DB update error for ${recording.egress_id}:`, updateError);
          results.push({ egress_id: recording.egress_id, success: false, error: String(updateError) });
        } else {
          results.push({ egress_id: recording.egress_id, success: true });
        }
      }
    } catch (err) {
      console.error(`[Retry Transcriptions] Error for ${recording.egress_id}:`, err);

      await supabase
        .from("lesson_recordings")
        .update({ status: "failed" })
        .eq("egress_id", recording.egress_id);

      results.push({ egress_id: recording.egress_id, success: false, error: String(err) });
    }
  }

  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;

  console.log(`[Retry Transcriptions] Complete: ${successCount} succeeded, ${failCount} failed`);

  return NextResponse.json({
    message: `Processed ${stuckRecordings.length} recordings`,
    processed: stuckRecordings.length,
    succeeded: successCount,
    failed: failCount,
    results,
  });
}
