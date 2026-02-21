import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { completeGameRunSchema } from "@/lib/games/runtime/validation";

const COMPLETE_SCHEMA = completeGameRunSchema;

type ProfileRow = {
  id: string;
  user_id: string;
  game_slug: string;
  language: string;
  runs_played: number;
  wins: number;
  best_score: number;
  total_score: number;
  total_time_ms: number;
  total_mistakes: number;
  avg_accuracy: number;
  first_success_p50_ms: number | null;
  last_played_at: string;
};

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

function toIsoDate(input = new Date()): string {
  return input.toISOString().split("T")[0];
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = COMPLETE_SCHEMA.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({
      success: false,
      error: "Invalid payload",
      details: parsed.error.flatten(),
    }, { status: 400 });
  }

  if (parsed.data.runId.startsWith("local-")) {
    return NextResponse.json({ success: true, persisted: false, localOnly: true });
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: true, persisted: false, localOnly: true });
    }

    const admin = createServiceRoleClient();
    if (!admin) {
      return NextResponse.json({ success: true, persisted: false, localOnly: true });
    }

    const completedAt = new Date().toISOString();
    const isWon = parsed.data.score > 0 && parsed.data.mistakes < 3;
    const { data: existingRun } = await admin
      .from("game_runs")
      .select("id, metadata")
      .eq("id", parsed.data.runId)
      .eq("user_id", user.id)
      .maybeSingle();

    const existingMetadata = asRecord(existingRun?.metadata);
    const runMetadata = {
      ...existingMetadata,
      ...(parsed.data.metadata ?? {}),
      startingCefr: parsed.data.startingCefr ?? (existingMetadata.startingCefr ?? null),
      firstMeaningfulActionMs: parsed.data.firstMeaningfulActionMs ?? null,
      curveVersion: parsed.data.curveVersion ?? null,
      uiVersion: parsed.data.uiVersion ?? null,
      gameVersion: parsed.data.gameVersion ?? (existingMetadata.gameVersion ?? null),
      calibratedDifficulty: parsed.data.calibratedDifficulty ?? null,
      difficultyDelta: parsed.data.difficultyDelta ?? null,
      skillTrackDeltas: parsed.data.skillTrackDeltas ?? null,
      cognitiveLoadState: parsed.data.cognitiveLoadState ?? null,
      ahaSpike: parsed.data.ahaSpike ?? null,
      shareCardVersion: parsed.data.shareCardVersion ?? null,
      challengeCode: parsed.data.challengeCode ?? null,
    };

    const { data: runRow, error: runError } = await admin
      .from("game_runs")
      .update({
        score: parsed.data.score,
        max_score: parsed.data.maxScore,
        accuracy: parsed.data.accuracy,
        duration_ms: parsed.data.timeMs,
        mistakes: parsed.data.mistakes,
        max_combo: parsed.data.maxCombo,
        false_friend_hits: parsed.data.falseFriendHits,
        first_correct_ms: parsed.data.firstCorrectMs,
        replayed: parsed.data.replayed,
        tier_reached: parsed.data.tierReached,
        metadata: runMetadata,
        status: "completed",
        is_won: isWon,
        completed_at: completedAt,
      })
      .eq("id", parsed.data.runId)
      .eq("user_id", user.id)
      .select("id, game_slug, mode, language, score, duration_ms")
      .single();

    if (runError || !runRow) {
      return NextResponse.json({ success: true, persisted: false, localOnly: true });
    }

    if (parsed.data.challengeCode) {
      await admin
        .from("game_challenge_attempts")
        .insert({
          challenge_code: parsed.data.challengeCode.toUpperCase(),
          run_id: runRow.id,
          user_id: user.id,
          score: parsed.data.score,
          accuracy: parsed.data.accuracy,
          time_ms: parsed.data.timeMs,
          accepted_at: completedAt,
          completed_at: completedAt,
          outcome: "completed",
          metadata: {
            gameSlug: runRow.game_slug,
            mode: runRow.mode,
            language: runRow.language,
          },
        });
    }

    const { data: profileExisting } = await admin
      .from("game_player_profiles")
      .select("*")
      .eq("user_id", user.id)
      .eq("game_slug", runRow.game_slug)
      .eq("language", runRow.language)
      .maybeSingle<ProfileRow>();

    const previousRuns = profileExisting?.runs_played ?? 0;
    const nextRuns = previousRuns + 1;
    const nextWins = (profileExisting?.wins ?? 0) + (isWon ? 1 : 0);
    const nextBestScore = Math.max(profileExisting?.best_score ?? 0, parsed.data.score);
    const nextTotalScore = (profileExisting?.total_score ?? 0) + parsed.data.score;
    const nextTotalTime = (profileExisting?.total_time_ms ?? 0) + parsed.data.timeMs;
    const nextTotalMistakes = (profileExisting?.total_mistakes ?? 0) + parsed.data.mistakes;

    const currentAvg = profileExisting?.avg_accuracy ?? 0;
    const nextAvg = ((currentAvg * previousRuns) + parsed.data.accuracy) / nextRuns;

    const priorP50: number | null = profileExisting?.first_success_p50_ms ?? null;
    let nextP50 = priorP50;
    if (parsed.data.firstCorrectMs !== null) {
      nextP50 = priorP50 === null
        ? parsed.data.firstCorrectMs
        : Math.round((priorP50 + parsed.data.firstCorrectMs) / 2);
    }

    await admin
      .from("game_player_profiles")
      .upsert({
        user_id: user.id,
        game_slug: runRow.game_slug,
        language: runRow.language,
        runs_played: nextRuns,
        wins: nextWins,
        best_score: nextBestScore,
        total_score: nextTotalScore,
        total_time_ms: nextTotalTime,
        total_mistakes: nextTotalMistakes,
        avg_accuracy: Number(nextAvg.toFixed(2)),
        first_success_p50_ms: nextP50,
        last_played_at: completedAt,
      }, {
        onConflict: "user_id,game_slug,language",
      });

    if (runRow.mode === "ranked") {
      await admin.from("game_rank_entries").insert({
        run_id: runRow.id,
        user_id: user.id,
        game_slug: runRow.game_slug,
        mode: runRow.mode,
        language: runRow.language,
        leaderboard_date: toIsoDate(),
        score: runRow.score,
        duration_ms: runRow.duration_ms,
      });
    }

    return NextResponse.json({ success: true, persisted: true });
  } catch {
    return NextResponse.json({ success: true, persisted: false, localOnly: true });
  }
}
