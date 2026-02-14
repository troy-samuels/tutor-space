import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

export type AnonymousPracticeSessionInput = {
  language: string;
  level?: string | null;
  score?: number | null;
  results?: Record<string, unknown>;
  attributionTutorId?: string | null;
  attributionSource?: string | null;
};

export type PracticeChallengeInput = {
  challengerId?: string | null;
  challengerName?: string | null;
  language: string;
  level: string;
  challengerScore: number;
};

export type PracticeChallengeCompletionInput = {
  challengeId: string;
  respondentId?: string | null;
  respondentScore: number;
};

type AnonymousSessionRow = {
  id: string;
  session_token: string;
};

type PracticeChallengeRow = {
  id: string;
  challenger_id: string | null;
  challenger_name: string | null;
  language: string;
  level: string;
  challenger_score: number;
  respondent_id: string | null;
  respondent_score: number | null;
  status: "open" | "completed" | "expired";
};

/**
 * Creates a random session token for anonymous practice persistence.
 *
 * @returns Stable random token.
 */
export function createAnonymousSessionToken(): string {
  return `anon_${randomUUID().replace(/-/g, "")}`;
}

/**
 * Creates a new anonymous practice session row.
 *
 * @param client - Supabase client.
 * @param input - Anonymous session payload.
 * @returns Created anonymous session identifiers.
 */
export async function createAnonymousPracticeSession(
  client: SupabaseClient,
  input: AnonymousPracticeSessionInput
): Promise<{ id: string; sessionToken: string }> {
  if (!input.language || input.language.trim().length === 0) {
    throw new Error("Language is required");
  }

  const sessionToken = createAnonymousSessionToken();

  const { data, error } = await client
    .from("anonymous_practice_sessions")
    .insert({
      session_token: sessionToken,
      language: input.language.trim(),
      level: input.level ?? null,
      score: input.score ?? null,
      results: input.results ?? {},
      attribution_tutor_id: input.attributionTutorId ?? null,
      attribution_source: input.attributionSource ?? null,
    })
    .select("id, session_token")
    .single();

  if (error || !data) {
    throw new Error(`Failed to create anonymous session: ${error?.message ?? "Unknown error"}`);
  }

  const row = data as AnonymousSessionRow;
  return {
    id: row.id,
    sessionToken: row.session_token,
  };
}

/**
 * Claims an anonymous session for a student account.
 *
 * @param client - Supabase client.
 * @param params - Claim payload.
 * @returns Claimed session ID.
 */
export async function claimAnonymousPracticeSession(
  client: SupabaseClient,
  params: {
    sessionToken: string;
    studentId: string;
  }
): Promise<{ sessionId: string }> {
  if (!params.sessionToken || !params.studentId) {
    throw new Error("Session token and student ID are required");
  }

  const now = new Date().toISOString();
  const { data, error } = await client
    .from("anonymous_practice_sessions")
    .update({
      claimed_by_student_id: params.studentId,
      claimed_at: now,
    })
    .eq("session_token", params.sessionToken)
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`Failed to claim anonymous session: ${error?.message ?? "Unknown error"}`);
  }

  return {
    sessionId: (data as { id: string }).id,
  };
}

/**
 * Creates a practice challenge row.
 *
 * @param client - Supabase client.
 * @param input - Challenge payload.
 * @returns Created challenge row.
 */
export async function createPracticeChallenge(
  client: SupabaseClient,
  input: PracticeChallengeInput
): Promise<PracticeChallengeRow> {
  if (!input.language || !input.level) {
    throw new Error("Language and level are required");
  }

  if (!Number.isFinite(input.challengerScore)) {
    throw new Error("Challenger score must be a finite number");
  }

  const { data, error } = await client
    .from("practice_challenges")
    .insert({
      challenger_id: input.challengerId ?? null,
      challenger_name: input.challengerName ?? null,
      language: input.language,
      level: input.level,
      challenger_score: Math.max(0, Math.min(100, Math.round(input.challengerScore))),
      status: "open",
    })
    .select(
      "id, challenger_id, challenger_name, language, level, challenger_score, respondent_id, respondent_score, status"
    )
    .single();

  if (error || !data) {
    throw new Error(`Failed to create challenge: ${error?.message ?? "Unknown error"}`);
  }

  return data as PracticeChallengeRow;
}

/**
 * Completes an existing practice challenge with respondent data.
 *
 * @param client - Supabase client.
 * @param input - Challenge completion payload.
 * @returns Updated challenge row.
 */
export async function completePracticeChallenge(
  client: SupabaseClient,
  input: PracticeChallengeCompletionInput
): Promise<PracticeChallengeRow> {
  if (!input.challengeId) {
    throw new Error("Challenge ID is required");
  }

  if (!Number.isFinite(input.respondentScore)) {
    throw new Error("Respondent score must be a finite number");
  }

  let completionQuery = client
    .from("practice_challenges")
    .update({
      respondent_id: input.respondentId ?? null,
      respondent_score: Math.max(0, Math.min(100, Math.round(input.respondentScore))),
      status: "completed",
      completed_at: new Date().toISOString(),
    })
    .eq("id", input.challengeId)
    .eq("status", "open");

  completionQuery = input.respondentId
    ? completionQuery.or(`respondent_id.is.null,respondent_id.eq.${input.respondentId}`)
    : completionQuery.is("respondent_id", null);

  const { data, error } = await completionQuery
    .select(
      "id, challenger_id, challenger_name, language, level, challenger_score, respondent_id, respondent_score, status"
    )
    .limit(1);

  if (error) {
    throw new Error(`Failed to complete challenge: ${error.message}`);
  }

  const row = data?.[0];
  if (!row) {
    throw new Error("Challenge is already completed");
  }

  return row as PracticeChallengeRow;
}
