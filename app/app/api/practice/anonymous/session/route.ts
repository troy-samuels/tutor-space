import { randomUUID } from "node:crypto";
import { z } from "zod";
import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { errorResponse } from "@/lib/api/error-responses";
import { getServerAttributionCookie } from "@/lib/practice/attribution";
import { resolveAttributedTutor } from "@/lib/practice/attribution-resolver";
import { createAnonymousPracticeSession } from "@/lib/practice/virality-store";

const CREATE_ANONYMOUS_SESSION_SCHEMA = z
  .object({
    language: z.string().trim().min(1).max(60),
    level: z.string().trim().max(60).nullable().optional(),
    score: z.number().int().min(0).max(100).nullable().optional(),
    results: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();

/**
 * Parses JSON request body without throwing.
 *
 * @param request - Incoming request.
 * @returns Parsed payload or failure marker.
 */
async function safeParseJson(request: Request): Promise<{ success: true; data: unknown } | { success: false }> {
  try {
    const data = await request.json();
    return { success: true, data };
  } catch {
    return { success: false };
  }
}

/**
 * Creates an anonymous practice session token for 0-friction conversion.
 */
export async function POST(request: Request) {
  const requestId = randomUUID();
  const respondError = (message: string, status: number, code: string, details?: Record<string, unknown>) =>
    errorResponse(message, { status, code, details, extra: { requestId } });

  try {
    const parsedJson = await safeParseJson(request);
    if (!parsedJson.success) {
      return respondError("Invalid JSON body", 400, "invalid_request");
    }

    const parsedBody = CREATE_ANONYMOUS_SESSION_SCHEMA.safeParse(parsedJson.data);
    if (!parsedBody.success) {
      return respondError("Invalid request payload", 400, "invalid_request", {
        validation: parsedBody.error.flatten(),
      });
    }

    const adminClient = createServiceRoleClient();
    if (!adminClient) {
      return respondError("Service unavailable", 503, "service_unavailable");
    }

    const attribution = await getServerAttributionCookie();
    const resolvedAttribution = await resolveAttributedTutor(adminClient, attribution);

    const session = await createAnonymousPracticeSession(adminClient, {
      language: parsedBody.data.language,
      level: parsedBody.data.level ?? null,
      score: parsedBody.data.score ?? null,
      results: parsedBody.data.results ?? {},
      attributionTutorId: resolvedAttribution?.tutorId ?? null,
      attributionSource: attribution?.source ?? null,
    });

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      sessionToken: session.sessionToken,
      requestId,
    });
  } catch (error) {
    console.error("[Anonymous Practice Session] Failed to create session:", error);
    return respondError("Failed to create anonymous session", 500, "internal_error");
  }
}
