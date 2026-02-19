import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";

const TOKEN_SPEND_SCHEMA = z.object({
  amount: z.number().int().min(1).max(500),
  unlockNode: z.string().trim().min(1).max(64).optional(),
  source: z.string().trim().min(1).max(64).optional(),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = TOKEN_SPEND_SCHEMA.safeParse(body);
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

    const { data: inventory } = await admin
      .from("game_meta_inventory")
      .select("tokens, xp")
      .eq("user_id", user.id)
      .maybeSingle();

    const currentTokens = Number(inventory?.tokens ?? 0);
    const nextTokens = currentTokens - parsed.data.amount;
    if (nextTokens < 0) {
      return NextResponse.json({ success: false, error: "Not enough tokens" }, { status: 400 });
    }

    await admin
      .from("game_meta_inventory")
      .upsert({
        user_id: user.id,
        tokens: nextTokens,
        xp: Number(inventory?.xp ?? 0),
      }, { onConflict: "user_id" });

    if (parsed.data.unlockNode) {
      await admin
        .from("game_meta_node_unlocks")
        .upsert({
          user_id: user.id,
          node_slug: parsed.data.unlockNode,
          metadata: {
            source: parsed.data.source ?? "token-spend",
            spent: parsed.data.amount,
          },
        }, { onConflict: "user_id,node_slug" });
    }

    return NextResponse.json({
      success: true,
      tokensRemaining: nextTokens,
      unlockedNode: parsed.data.unlockNode ?? null,
    });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to spend token" }, { status: 500 });
  }
}
