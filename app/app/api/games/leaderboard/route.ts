import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";

function todayUtc(): string {
  return new Date().toISOString().split("T")[0];
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const gameSlug = (url.searchParams.get("gameSlug") || "relay-sprint").slice(0, 64);
  const mode = (url.searchParams.get("mode") || "daily").slice(0, 24);
  const language = (url.searchParams.get("language") || "en").slice(0, 8);
  const leaderboardDate = (url.searchParams.get("date") || todayUtc()).slice(0, 10);

  const admin = createServiceRoleClient();
  if (!admin) {
    return NextResponse.json({ success: false, error: "Service unavailable" }, { status: 503 });
  }

  const { data, error } = await admin
    .from("game_rank_entries")
    .select("user_id, score, duration_ms, created_at")
    .eq("game_slug", gameSlug)
    .eq("mode", mode)
    .eq("language", language)
    .eq("leaderboard_date", leaderboardDate)
    .order("score", { ascending: false })
    .order("duration_ms", { ascending: true })
    .limit(100);

  if (error) {
    return NextResponse.json({ success: false, error: "Failed to load leaderboard" }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    gameSlug,
    mode,
    language,
    leaderboardDate,
    entries: data ?? [],
  });
}
