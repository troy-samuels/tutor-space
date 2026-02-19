import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";

const START_SCHEMA = z.object({
  gameSlug: z.string().trim().min(1).max(64),
  mode: z.enum(["daily", "practice", "challenge", "ranked"]),
  language: z.enum(["en", "es", "fr", "de"]),
  deviceClass: z.enum(["mobile", "desktop", "telegram"]),
  gameVersion: z.literal("v3").optional(),
  startingCefr: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]).nullable().optional(),
  calibratedDifficulty: z.number().int().min(0).max(100).optional(),
  challengeCode: z.string().trim().min(4).max(32).optional(),
  uiVersion: z.string().trim().min(1).max(64).optional(),
});

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = START_SCHEMA.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({
      success: false,
      error: "Invalid payload",
      details: parsed.error.flatten(),
    }, { status: 400 });
  }

  const startedAt = new Date().toISOString();

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({
        success: true,
        persisted: false,
        localOnly: true,
        runId: `local-${randomUUID()}`,
        startedAt,
      });
    }

    const admin = createServiceRoleClient();
    if (!admin) {
      return NextResponse.json({
        success: true,
        persisted: false,
        localOnly: true,
        runId: `local-${randomUUID()}`,
        startedAt,
      });
    }

    const insertPayload = {
      user_id: user.id,
      game_slug: parsed.data.gameSlug,
      mode: parsed.data.mode,
      language: parsed.data.language,
      device_class: parsed.data.deviceClass,
      metadata: {
        gameVersion: parsed.data.gameVersion ?? null,
        startingCefr: parsed.data.startingCefr ?? null,
        calibratedDifficulty: parsed.data.calibratedDifficulty ?? null,
        challengeCode: parsed.data.challengeCode ?? null,
        uiVersion: parsed.data.uiVersion ?? null,
      },
      status: "running",
      started_at: startedAt,
    };

    const { data, error } = await admin
      .from("game_runs")
      .insert(insertPayload)
      .select("id, started_at")
      .single();

    if (error || !data) {
      return NextResponse.json({
        success: true,
        persisted: false,
        localOnly: true,
        runId: `local-${randomUUID()}`,
        startedAt,
      });
    }

    return NextResponse.json({
      success: true,
      persisted: true,
      runId: data.id,
      startedAt: data.started_at,
    });
  } catch {
    return NextResponse.json({
      success: true,
      persisted: false,
      localOnly: true,
      runId: `local-${randomUUID()}`,
      startedAt,
    });
  }
}
