import { randomUUID } from "node:crypto";
import { z } from "zod";
import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { errorResponse } from "@/lib/api/error-responses";
import { ingestRecapAttempt } from "@/lib/recap/srs-bridge";
import type { RecapExercise } from "@/lib/recap/types";

type RouteParams = {
  params: Promise<{ shortId: string }>;
};

const ATTEMPT_SCHEMA = z
  .object({
    score: z.number().int().min(0).max(100),
    total: z.number().int().min(1).max(100),
    timeSpentSeconds: z.number().int().min(0).optional(),
    answers: z
      .array(
        z.object({
          exerciseIndex: z.number().int().min(0),
          answer: z.union([z.string(), z.number()]),
          correct: z.boolean(),
          timeMs: z.number().int().min(0),
        })
      )
      .max(20),
    studentFingerprint: z.string().trim().optional(),
  })
  .strict()
  .refine((data) => data.score <= data.total, {
    message: "Score cannot exceed total",
  })
  .refine((data) => data.answers.length <= data.total, {
    message: "More answers than total exercises",
  });

async function safeParseJson(
  request: Request
): Promise<{ success: true; data: unknown } | { success: false }> {
  try {
    const data = await request.json();
    return { success: true, data };
  } catch {
    return { success: false };
  }
}

export async function POST(request: Request, { params }: RouteParams) {
  const requestId = randomUUID();
  const { shortId } = await params;

  const respondError = (
    message: string,
    status: number,
    code: string,
    details?: Record<string, unknown>
  ) =>
    errorResponse(message, {
      status,
      code,
      details,
      extra: { requestId },
    });

  try {
    const parsedJson = await safeParseJson(request);
    if (!parsedJson.success) {
      return respondError("Invalid JSON body", 400, "invalid_request");
    }

    const parsedBody = ATTEMPT_SCHEMA.safeParse(parsedJson.data);
    if (!parsedBody.success) {
      return respondError("Invalid request payload", 400, "invalid_request", {
        validation: parsedBody.error.flatten(),
      });
    }

    const adminClient = createServiceRoleClient();
    if (!adminClient) {
      return respondError("Service unavailable", 503, "service_unavailable");
    }

    // Find the recap by short_id
    const { data: recap, error: fetchError } = await adminClient
      .from("recaps")
      .select("id")
      .eq("short_id", shortId)
      .single();

    if (fetchError || !recap) {
      return respondError("Recap not found", 404, "not_found");
    }

    const { score, total, timeSpentSeconds, answers, studentFingerprint } =
      parsedBody.data;

    // Insert the attempt
    const { data: attempt, error: insertError } = await adminClient
      .from("recap_attempts")
      .insert({
        recap_id: recap.id,
        student_fingerprint: studentFingerprint ?? null,
        score,
        total,
        time_spent_seconds: timeSpentSeconds ?? null,
        answers: answers as unknown as Record<string, unknown>[],
      })
      .select("id, completed_at")
      .single();

    if (insertError || !attempt) {
      console.error("[Recap Attempt] Insert failed:", insertError);
      return respondError("Failed to save attempt", 500, "internal_error");
    }

    // ── SRS Bridge: ingest exercise results into spaced repetition ──
    // Fire-and-forget — don't block the response on SRS processing
    if (answers.length > 0) {
      const { data: parentRecap } = await adminClient
        .from("recaps")
        .select(
          "id, tutor_id, tutor_fingerprint, exercises, summary"
        )
        .eq("id", recap.id)
        .single();

      if (parentRecap?.exercises) {
        ingestRecapAttempt({
          recapId: parentRecap.id,
          tutorId:
            parentRecap.tutor_id ?? parentRecap.tutor_fingerprint ?? "unknown",
          studentFingerprint: studentFingerprint ?? "anonymous",
          studentId: null, // Recap students aren't authenticated
          exercises: parentRecap.exercises as unknown as RecapExercise[],
          answers,
          language:
            (parentRecap.summary as Record<string, unknown>)?.language as string ??
            "Unknown",
          level:
            ((parentRecap.summary as Record<string, unknown>)?.level as string) ??
            null,
        }).catch((err) => {
          console.error("[Recap SRS Bridge] Ingestion failed:", err);
        });
      }
    }

    return NextResponse.json({
      success: true,
      attemptId: attempt.id,
      completedAt: attempt.completed_at,
      requestId,
    });
  } catch (error) {
    console.error("[Recap Attempt] Error:", error);
    return respondError("Failed to record attempt", 500, "internal_error");
  }
}
