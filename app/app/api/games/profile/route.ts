import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: true, authenticated: false, profile: null, recentRuns: [] });
    }

    const admin = createServiceRoleClient();
    if (!admin) {
      return NextResponse.json({
        success: true,
        authenticated: true,
        localOnly: true,
        profile: [],
        recentRuns: [],
      });
    }

    const [profileRows, recentRuns] = await Promise.all([
      admin
        .from("game_player_profiles")
        .select("game_slug, language, runs_played, wins, best_score, avg_accuracy, first_success_p50_ms, last_played_at")
        .eq("user_id", user.id)
        .order("last_played_at", { ascending: false })
        .limit(50)
        .then((r) => r.data ?? []),
      admin
        .from("game_runs")
        .select("id, game_slug, mode, language, score, accuracy, duration_ms, mistakes, is_won, completed_at")
        .eq("user_id", user.id)
        .eq("status", "completed")
        .order("completed_at", { ascending: false })
        .limit(20)
        .then((r) => r.data ?? []),
    ]);

    return NextResponse.json({
      success: true,
      authenticated: true,
      profile: profileRows,
      recentRuns,
    });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to load profile" }, { status: 500 });
  }
}
