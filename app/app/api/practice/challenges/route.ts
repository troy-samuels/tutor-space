import { randomUUID } from "node:crypto";
import { z } from "zod";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { errorResponse } from "@/lib/api/error-responses";
import { generateChallengeLink } from "@/lib/practice/deep-links";
import { createPracticeChallenge } from "@/lib/practice/virality-store";

const CREATE_CHALLENGE_SCHEMA = z
  .object({
    challengerName: z.string().trim().max(120).optional(),
    language: z.string().trim().min(1).max(60),
    level: z.string().trim().min(1).max(60),
    challengerScore: z.number().int().min(0).max(100),
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
 * Creates a shareable practice challenge.
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

    const parsedBody = CREATE_CHALLENGE_SCHEMA.safeParse(parsedJson.data);
    if (!parsedBody.success) {
      return respondError("Invalid request payload", 400, "invalid_request", {
        validation: parsedBody.error.flatten(),
      });
    }

    const adminClient = createServiceRoleClient();
    if (!adminClient) {
      return respondError("Service unavailable", 503, "service_unavailable");
    }

    let challengerStudentId: string | null = null;
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user?.id) {
        const { data: student } = await adminClient
          .from("students")
          .select("id")
          .eq("user_id", user.id)
          .limit(1)
          .maybeSingle();
        challengerStudentId = student?.id ?? null;
      }
    } catch {
      challengerStudentId = null;
    }

    const challenge = await createPracticeChallenge(adminClient, {
      challengerId: challengerStudentId,
      challengerName: parsedBody.data.challengerName || "A learner",
      language: parsedBody.data.language,
      level: parsedBody.data.level,
      challengerScore: parsedBody.data.challengerScore,
    });

    const challengeLink = generateChallengeLink({
      challengerId: challenge.id,
      language: challenge.language,
      level: challenge.level,
      score: challenge.challenger_score,
    });

    return NextResponse.json({
      success: true,
      challenge,
      challengeLink,
      requestId,
    });
  } catch (error) {
    console.error("[Practice Challenges] Failed to create challenge:", error);
    return respondError("Failed to create challenge", 500, "internal_error");
  }
}
