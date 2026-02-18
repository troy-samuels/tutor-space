/**
 * Daily notification sender for TutorLingua Games.
 * Called by cron job to send daily puzzle reminders to opted-in users.
 * 
 * POST /api/telegram/notify
 * Headers: Authorization: Bearer <CRON_SECRET>
 * 
 * For now, this is a placeholder that can be called manually.
 * Production: use Vercel Cron or external scheduler.
 */

import { NextRequest, NextResponse } from "next/server";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CRON_SECRET = process.env.CRON_SECRET;
const MINI_APP_URL = "https://tutorlingua.co/games";

/* ——— Daily messages — rotated by day of week ——— */
const DAILY_MESSAGES = [
  { text: "🧩 Monday's puzzles are live! Start the week sharp.", emoji: "🧩" },
  { text: "🪜 New Word Ladder ready — can you beat par today?", emoji: "🪜" },
  { text: "🔐 Today's cipher is particularly tricky...", emoji: "🔐" },
  { text: "🎯 Spot the odd one out — trust your instincts!", emoji: "🎯" },
  { text: "📝 Missing Piece Friday — test your grammar!", emoji: "📝" },
  { text: "🌀 Weekend synonym challenge is here!", emoji: "🌀" },
  { text: "🔥 Sunday puzzle marathon — can you do all 6?", emoji: "🔥" },
];

/* ——— Streak reminder variants ——— */
function getStreakMessage(streak: number): string {
  if (streak >= 30) return `🔥 ${streak}-day streak! You're on fire. Don't break it now.`;
  if (streak >= 14) return `🔥 ${streak} days and counting! Keep it alive.`;
  if (streak >= 7) return `🔥 Week-long streak! Today's puzzles are waiting.`;
  if (streak >= 3) return `🔥 ${streak}-day streak! One more day…`;
  return "🎮 New puzzles are ready! Play today to start a streak.";
}

async function tgApi(method: string, body: Record<string, unknown>) {
  if (!BOT_TOKEN) return null;
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

async function sendDailyNotification(chatId: number, streak: number = 0) {
  const dayOfWeek = new Date().getDay(); // 0 = Sunday
  const message = DAILY_MESSAGES[dayOfWeek];
  const streakText = streak > 0 ? `\n\n${getStreakMessage(streak)}` : "";

  await tgApi("sendMessage", {
    chat_id: chatId,
    text: `${message.text}${streakText}`,
    reply_markup: {
      inline_keyboard: [
        [{ text: "🎮 Play Now", web_app: { url: MINI_APP_URL } }],
      ],
    },
  });
}

export async function POST(request: NextRequest) {
  // Auth check
  const authHeader = request.headers.get("authorization");
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!BOT_TOKEN) {
    return NextResponse.json({ error: "Bot not configured" }, { status: 503 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { chatIds, streak } = body as { chatIds?: number[]; streak?: number };

    if (!chatIds || chatIds.length === 0) {
      return NextResponse.json({ error: "No chat IDs provided" }, { status: 400 });
    }

    const results = await Promise.allSettled(
      chatIds.map((id) => sendDailyNotification(id, streak ?? 0))
    );

    const sent = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    return NextResponse.json({ sent, failed, total: chatIds.length });
  } catch (error) {
    console.error("Notification error:", error);
    return NextResponse.json({ error: "Failed to send notifications" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    info: "POST with { chatIds: number[], streak?: number } to send daily notifications",
    bot: BOT_TOKEN ? "configured" : "not configured",
  });
}
