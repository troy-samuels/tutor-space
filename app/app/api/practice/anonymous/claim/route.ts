import { randomUUID } from "node:crypto";
import { z } from "zod";
import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { errorResponse } from "@/lib/api/error-responses";
import { getServerAttributionCookie } from "@/lib/practice/attribution";
import { resolveAttributedTutor } from "@/lib/practice/attribution-resolver";
import { claimAnonymousPracticeSession } from "@/lib/practice/virality-store";

type StudentRow = {
  id: string;
  tutor_id: string | null;
};

const CLAIM_ANONYMOUS_SESSION_SCHEMA = z
  .object({
    email: z.string().trim().email(),
    fullName: z.string().trim().max(120).optional(),
    sessionToken: z.string().trim().min(8).max(255),
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
 * Generates a fallback name from email when no explicit full name is supplied.
 *
 * @param email - Student email address.
 * @returns Human-readable fallback name.
 */
function deriveNameFromEmail(email: string): string {
  const local = email.split("@")[0] || "Student";
  const normalized = local.replace(/[._-]+/g, " ").trim();
  if (normalized.length === 0) {
    return "Student";
  }
  return normalized
    .split(" ")
    .map((segment) => `${segment.charAt(0).toUpperCase()}${segment.slice(1)}`)
    .join(" ");
}

/**
 * Finds a candidate student record by email and preferred tutor relation.
 *
 * @param adminClient - Service role client.
 * @param email - Student email.
 * @param preferredTutorId - Attributed tutor ID when available.
 * @returns Best matching student row or `null`.
 */
async function findExistingStudent(
  adminClient: NonNullable<ReturnType<typeof createServiceRoleClient>>,
  email: string,
  preferredTutorId: string | null
): Promise<StudentRow | null> {
  const { data, error } = await adminClient
    .from("students")
    .select("id, tutor_id")
    .eq("email", email)
    .limit(10);

  if (error || !data || data.length === 0) {
    return null;
  }

  const exactTutorMatch = preferredTutorId
    ? data.find((row) => row.tutor_id === preferredTutorId)
    : null;

  const unlinkedMatch = data.find((row) => !row.tutor_id);
  const selected = exactTutorMatch || unlinkedMatch || data[0];

  if (!selected?.id) {
    return null;
  }

  return {
    id: selected.id,
    tutor_id: selected.tutor_id ?? null,
  };
}

/**
 * Claims an anonymous practice session by creating/linking a student record.
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

    const parsedBody = CLAIM_ANONYMOUS_SESSION_SCHEMA.safeParse(parsedJson.data);
    if (!parsedBody.success) {
      return respondError("Invalid request payload", 400, "invalid_request", {
        validation: parsedBody.error.flatten(),
      });
    }

    const adminClient = createServiceRoleClient();
    if (!adminClient) {
      return respondError("Service unavailable", 503, "service_unavailable");
    }

    const email = parsedBody.data.email.trim().toLowerCase();
    const attribution = await getServerAttributionCookie();
    const resolvedAttribution = await resolveAttributedTutor(adminClient, attribution);

    const existingStudent = await findExistingStudent(
      adminClient,
      email,
      resolvedAttribution?.tutorId ?? null
    );

    let studentId = existingStudent?.id ?? null;
    if (!studentId) {
      const { data: insertedStudent, error: insertStudentError } = await adminClient
        .from("students")
        .insert({
          tutor_id: resolvedAttribution?.tutorId ?? null,
          user_id: null,
          full_name: parsedBody.data.fullName?.trim() || deriveNameFromEmail(email),
          email,
          status: "active",
          calendar_access_status: resolvedAttribution?.tutorId ? "pending" : null,
          source: "practice_ghost_profile",
        })
        .select("id")
        .single();

      if (insertStudentError || !insertedStudent?.id) {
        return respondError("Failed to create student profile", 500, "internal_error");
      }

      studentId = insertedStudent.id;
    } else if (!existingStudent?.tutor_id && resolvedAttribution?.tutorId) {
      await adminClient
        .from("students")
        .update({
          tutor_id: resolvedAttribution.tutorId,
          calendar_access_status: "pending",
          source: "practice_ghost_profile",
          updated_at: new Date().toISOString(),
        })
        .eq("id", studentId);
    }

    if (!studentId) {
      return respondError("Failed to resolve student profile", 500, "internal_error");
    }

    await claimAnonymousPracticeSession(adminClient, {
      sessionToken: parsedBody.data.sessionToken,
      studentId,
    });

    return NextResponse.json({
      success: true,
      message: "Your progress is saved! Continue practising or find a tutor.",
      studentId,
      requestId,
    });
  } catch (error) {
    console.error("[Anonymous Practice Claim] Failed to claim session:", error);
    return respondError("Failed to save progress", 500, "internal_error");
  }
}
