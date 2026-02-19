import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";

const PROGRESS_SCHEMA = z.object({
  language: z.enum(["en", "es", "fr", "de"]),
  startingCefr: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]).nullable().optional(),
  calibratedDifficulty: z.number().int().min(0).max(100).optional(),
  difficultyDelta: z.number().int().min(-100).max(100).optional(),
  cognitiveLoadState: z.enum(["focused", "balanced", "boosted"]).optional(),
  ahaSpike: z.boolean().optional(),
  skillTrackDeltas: z.array(z.object({
    track: z.string().trim().min(1).max(48),
    delta: z.number().int().min(-20).max(20),
  })).max(10).optional(),
  tokenDelta: z.number().int().min(-200).max(500).default(0),
  xpDelta: z.number().int().min(-500).max(1000).default(0),
  unlockNode: z.string().trim().min(1).max(64).optional(),
  sourceRunId: z.string().uuid().optional(),
});

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = PROGRESS_SCHEMA.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({
      success: false,
      error: "Invalid payload",
      details: parsed.error.flatten(),
    }, { status: 400 });
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    }

    const admin = createServiceRoleClient();
    if (!admin) {
      return NextResponse.json({ success: false, error: "Service unavailable" }, { status: 503 });
    }

    const now = new Date().toISOString();
    const input = parsed.data;

    const [inventoryResult, unlockResult, learningResult, existingSkillsResult] = await Promise.all([
      admin
        .from("game_meta_inventory")
        .select("tokens, xp")
        .eq("user_id", user.id)
        .maybeSingle(),
      admin
        .from("game_meta_node_unlocks")
        .select("node_slug")
        .eq("user_id", user.id),
      admin
        .from("game_learning_profiles")
        .select("current_cefr, calibrated_difficulty, runs_count, last_aha_at")
        .eq("user_id", user.id)
        .eq("language", input.language)
        .maybeSingle(),
      admin
        .from("game_skill_mastery")
        .select("track, mastery_score")
        .eq("user_id", user.id)
        .eq("language", input.language),
    ]);

    const currentTokens = Number(inventoryResult.data?.tokens ?? 0);
    const currentXp = Number(inventoryResult.data?.xp ?? 0);
    const nextTokens = Math.max(0, currentTokens + input.tokenDelta);
    const nextXp = Math.max(0, currentXp + input.xpDelta);

    await admin
      .from("game_meta_inventory")
      .upsert(
        {
          user_id: user.id,
          tokens: nextTokens,
          xp: nextXp,
        },
        { onConflict: "user_id" },
      );

    const currentRuns = Number(learningResult.data?.runs_count ?? 0);
    const nextRuns = currentRuns + 1;
    const nextAhaAt = input.ahaSpike ? now : (learningResult.data?.last_aha_at ?? null);

    await admin
      .from("game_learning_profiles")
      .upsert(
        {
          user_id: user.id,
          language: input.language,
          current_cefr: input.startingCefr ?? (learningResult.data?.current_cefr ?? null),
          calibrated_difficulty: input.calibratedDifficulty ?? Number(learningResult.data?.calibrated_difficulty ?? 35),
          last_difficulty_delta: input.difficultyDelta ?? 0,
          cognitive_load_state: input.cognitiveLoadState ?? "balanced",
          last_aha_at: nextAhaAt,
          runs_count: nextRuns,
          updated_at: now,
        },
        { onConflict: "user_id,language" },
      );

    if (input.skillTrackDeltas && input.skillTrackDeltas.length > 0) {
      const existingSkills = new Map<string, number>(
        (existingSkillsResult.data ?? []).map((row) => [row.track, Number(row.mastery_score ?? 50)]),
      );

      await admin
        .from("game_skill_mastery")
        .upsert(
          input.skillTrackDeltas.map((entry) => ({
            user_id: user.id,
            language: input.language,
            track: entry.track,
            mastery_score: clamp((existingSkills.get(entry.track) ?? 50) + entry.delta, 0, 100),
            last_delta: entry.delta,
            updated_at: now,
          })),
          { onConflict: "user_id,language,track" },
        );
    }

    if (input.unlockNode) {
      await admin
        .from("game_meta_node_unlocks")
        .upsert(
          {
            user_id: user.id,
            node_slug: input.unlockNode,
            source_run_id: input.sourceRunId ?? null,
          },
          { onConflict: "user_id,node_slug" },
        );
    }

    const unlockedNodes = [
      ...new Set(
        [
          "byte-choice",
          ...(unlockResult.data ?? []).map((row) => row.node_slug),
          input.unlockNode ?? null,
        ].filter((node): node is string => Boolean(node)),
      ),
    ];

    return NextResponse.json({
      success: true,
      profile: {
        tokens: nextTokens,
        xp: nextXp,
        unlockedNodes,
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to persist progress" }, { status: 500 });
  }
}
