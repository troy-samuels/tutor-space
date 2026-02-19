import { randomInt } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";

const CREATE_SCHEMA = z.object({
  gameSlug: z.string().trim().min(1).max(64).regex(/^[a-z0-9-]+$/),
  seed: z.number().int().min(0).max(2_147_483_647),
  difficultyBand: z.number().int().min(0).max(100),
  mode: z.enum(["daily", "practice"]),
  uiVersion: z.string().trim().min(1).max(64),
  curveVersion: z.string().trim().min(1).max(64),
  stumbleText: z.string().trim().min(1).max(180).nullable().optional(),
});

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function buildCode(length = 8): string {
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += CODE_CHARS[randomInt(0, CODE_CHARS.length)];
  }
  return out;
}

function expiresInDays(days: number): string {
  const value = new Date();
  value.setDate(value.getDate() + days);
  return value.toISOString();
}

function buildChallengeUrl(
  origin: string,
  params: {
    gameSlug: string;
    code: string;
    seed: number;
    difficultyBand: number;
  },
): string {
  const url = new URL(`/games/${params.gameSlug}`, origin);
  url.searchParams.set("mode", "practice");
  url.searchParams.set("challenge", params.code);
  url.searchParams.set("seed", String(params.seed));
  url.searchParams.set("di", String(params.difficultyBand));
  return url.toString();
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = CREATE_SCHEMA.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({
      success: false,
      error: "Invalid payload",
      details: parsed.error.flatten(),
    }, { status: 400 });
  }

  const origin = new URL(request.url).origin;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const admin = createServiceRoleClient();

    if (!user || !admin) {
      const localCode = `LOCAL${buildCode(4)}`;
      const localUrl = buildChallengeUrl(origin, {
        gameSlug: parsed.data.gameSlug,
        code: localCode,
        seed: parsed.data.seed,
        difficultyBand: parsed.data.difficultyBand,
      });
      return NextResponse.json({
        success: true,
        code: localCode,
        url: localUrl,
        persisted: false,
        localOnly: true,
      });
    }

    for (let attempt = 0; attempt < 6; attempt += 1) {
      const code = buildCode(8);
      const { error } = await admin.from("game_challenges").insert({
        code,
        creator_user_id: user.id,
        game_slug: parsed.data.gameSlug,
        mode: parsed.data.mode,
        seed: parsed.data.seed,
        difficulty_band: parsed.data.difficultyBand,
        ui_version: parsed.data.uiVersion,
        curve_version: parsed.data.curveVersion,
        stumble_text: parsed.data.stumbleText ?? null,
        is_active: true,
        expires_at: expiresInDays(30),
        metadata: {
          version: "v3",
        },
      });

      if (!error) {
        return NextResponse.json({
          success: true,
          code,
          url: buildChallengeUrl(origin, {
            gameSlug: parsed.data.gameSlug,
            code,
            seed: parsed.data.seed,
            difficultyBand: parsed.data.difficultyBand,
          }),
          persisted: true,
        });
      }

      if (error.code !== "23505") {
        return NextResponse.json({ success: false, error: "Failed to create challenge" }, { status: 500 });
      }
    }

    return NextResponse.json({ success: false, error: "Failed to allocate challenge code" }, { status: 500 });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to create challenge" }, { status: 500 });
  }
}
