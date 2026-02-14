import { randomUUID } from "node:crypto";
import { z } from "zod";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { errorResponse } from "@/lib/api/error-responses";
import { completePracticeChallenge } from "@/lib/practice/virality-store";

type RouteParams = {
  params: Promise<{
    challengeId: string;
  }>;
};

const COMPLETE_CHALLENGE_SCHEMA = z
  .object({
    respondentScore: z.number().int().min(0).max(100),
  })
  .strict();

const PUBLIC_CHALLENGE_SELECT =
  "id, challenger_name, language, level, challenger_score, respondent_score, status";

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
 * Loads a challenge by ID.
 */
export async function GET(_request: Request, { params }: RouteParams) {
  const requestId = randomUUID();
  const { challengeId } = await params;
  const respondError = (message: string, status: number, code: string) =>
    errorResponse(message, { status, code, extra: { requestId } });

  try {
    const adminClient = createServiceRoleClient();
    if (!adminClient) {
      return respondError("Service unavailable", 503, "service_unavailable");
    }

    const { data: challenge, error } = await adminClient
      .from("practice_challenges")
      .select(PUBLIC_CHALLENGE_SELECT)
      .eq("id", challengeId)
      .single();

    if (error || !challenge) {
      return respondError("Challenge not found", 404, "not_found");
    }

    return NextResponse.json({
      success: true,
      challenge,
      requestId,
    });
  } catch (error) {
    console.error("[Practice Challenge] Failed to load challenge:", error);
    return respondError("Failed to load challenge", 500, "internal_error");
  }
}

/**
 * Completes a challenge with respondent score.
 */
export async function POST(request: Request, { params }: RouteParams) {
  const requestId = randomUUID();
  const { challengeId } = await params;
  const respondError = (message: string, status: number, code: string, details?: Record<string, unknown>) =>
    errorResponse(message, { status, code, details, extra: { requestId } });

  try {
    const parsedJson = await safeParseJson(request);
    if (!parsedJson.success) {
      return respondError("Invalid JSON body", 400, "invalid_request");
    }

    const parsedBody = COMPLETE_CHALLENGE_SCHEMA.safeParse(parsedJson.data);
    if (!parsedBody.success) {
      return respondError("Invalid request payload", 400, "invalid_request", {
        validation: parsedBody.error.flatten(),
      });
    }

    const adminClient = createServiceRoleClient();
    if (!adminClient) {
      return respondError("Service unavailable", 503, "service_unavailable");
    }

    let respondentStudentId: string | null = null;
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
        respondentStudentId = student?.id ?? null;
      }
    } catch {
      respondentStudentId = null;
    }

    const challenge = await completePracticeChallenge(adminClient, {
      challengeId,
      respondentId: respondentStudentId,
      respondentScore: parsedBody.data.respondentScore,
    });

    return NextResponse.json({
      success: true,
      challenge,
      requestId,
    });
  } catch (error) {
    if (error instanceof Error && /already completed/i.test(error.message)) {
      return respondError("Challenge already completed", 409, "already_completed");
    }

    console.error("[Practice Challenge] Failed to complete challenge:", error);
    return respondError("Failed to complete challenge", 500, "internal_error");
  }
}
