import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceRoleClient } from "@/lib/supabase/admin";

type RouteParams = {
  params: Promise<{ code: string }>;
};

const CODE_SCHEMA = z.string().trim().min(4).max(32).regex(/^[A-Z0-9]+$/);

export async function GET(_request: Request, { params }: RouteParams) {
  const { code: rawCode } = await params;
  const parsedCode = CODE_SCHEMA.safeParse(rawCode.toUpperCase());
  if (!parsedCode.success) {
    return NextResponse.json({ success: false, error: "Invalid challenge code" }, { status: 400 });
  }

  const admin = createServiceRoleClient();
  if (!admin) {
    return NextResponse.json({ success: false, error: "Service unavailable" }, { status: 503 });
  }

  const code = parsedCode.data;

  const { data: challenge, error } = await admin
    .from("game_challenges")
    .select("code, game_slug, mode, seed, difficulty_band, ui_version, curve_version, stumble_text, expires_at, created_at")
    .eq("code", code)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ success: false, error: "Failed to load challenge" }, { status: 500 });
  }

  if (!challenge) {
    return NextResponse.json({ success: false, error: "Challenge not found" }, { status: 404 });
  }

  if (challenge.expires_at && Date.parse(challenge.expires_at) < Date.now()) {
    return NextResponse.json({ success: false, error: "Challenge expired" }, { status: 410 });
  }

  const { count: attempts } = await admin
    .from("game_challenge_attempts")
    .select("id", { count: "exact", head: true })
    .eq("challenge_code", code);

  return NextResponse.json({
    success: true,
    challenge: {
      code: challenge.code,
      gameSlug: challenge.game_slug,
      mode: challenge.mode,
      seed: challenge.seed,
      difficultyBand: challenge.difficulty_band,
      uiVersion: challenge.ui_version,
      curveVersion: challenge.curve_version,
      stumbleText: challenge.stumble_text,
      expiresAt: challenge.expires_at,
      createdAt: challenge.created_at,
      attempts: attempts ?? 0,
    },
  });
}
