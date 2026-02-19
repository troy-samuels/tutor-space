import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";

const DEFAULT_UNLOCKS = ["byte-choice"];

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({
        success: true,
        authenticated: false,
        profile: {
          tokens: 0,
          xp: 0,
          unlockedNodes: DEFAULT_UNLOCKS,
          learningProfiles: [],
          skillMastery: [],
        },
      });
    }

    const admin = createServiceRoleClient();
    if (!admin) {
      return NextResponse.json({
        success: true,
        authenticated: true,
        localOnly: true,
        profile: {
          tokens: 0,
          xp: 0,
          unlockedNodes: DEFAULT_UNLOCKS,
          learningProfiles: [],
          skillMastery: [],
        },
      });
    }

    const [inventoryResult, unlockResult, learningResult, skillResult] = await Promise.all([
      admin
        .from("game_meta_inventory")
        .select("tokens, xp")
        .eq("user_id", user.id)
        .maybeSingle(),
      admin
        .from("game_meta_node_unlocks")
        .select("node_slug")
        .eq("user_id", user.id)
        .order("unlocked_at", { ascending: true }),
      admin
        .from("game_learning_profiles")
        .select("language, current_cefr, calibrated_difficulty, last_difficulty_delta, cognitive_load_state, runs_count, last_aha_at")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false }),
      admin
        .from("game_skill_mastery")
        .select("language, track, mastery_score, last_delta")
        .eq("user_id", user.id),
    ]);

    const unlockedNodes = (unlockResult.data ?? []).map((row) => row.node_slug).filter(Boolean);

    return NextResponse.json({
      success: true,
      authenticated: true,
      profile: {
        tokens: Number(inventoryResult.data?.tokens ?? 0),
        xp: Number(inventoryResult.data?.xp ?? 0),
        unlockedNodes: unlockedNodes.length > 0 ? unlockedNodes : DEFAULT_UNLOCKS,
        learningProfiles: learningResult.data ?? [],
        skillMastery: skillResult.data ?? [],
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to load profile" }, { status: 500 });
  }
}
