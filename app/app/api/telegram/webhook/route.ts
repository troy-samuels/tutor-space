/**
 * Telegram Bot Webhook Handler
 * Handles bot commands and inline queries for TutorLingua Games.
 *
 * Setup:
 * 1. Create bot via @BotFather
 * 2. Set webhook: https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://tutorlingua.co/api/telegram/webhook
 * 3. Add TELEGRAM_BOT_TOKEN to env
 */

import { NextRequest, NextResponse } from "next/server";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const MINI_APP_URL = "https://tutorlingua.co/games";

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: { id: number; first_name: string; username?: string };
    chat: { id: number; type: string };
    text?: string;
    entities?: Array<{ type: string; offset: number; length: number }>;
  };
  inline_query?: {
    id: string;
    from: { id: number; first_name: string };
    query: string;
  };
  callback_query?: {
    id: string;
    from: { id: number; first_name: string };
    data: string;
    message?: { chat: { id: number }; message_id: number };
  };
}

/* ——— Telegram API helper ——— */
async function tgApi(method: string, body: Record<string, unknown>) {
  if (!BOT_TOKEN) return null;
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

/* ——— Command handlers ——— */

async function handleStart(chatId: number, firstName: string) {
  await tgApi("sendMessage", {
    chat_id: chatId,
    text: `Hey ${firstName}! 👋\n\n🎮 *TutorLingua Retro Reboot* is live.\n\n3 new games · EN + ES · Daily + Practice\n\nTap below to play:`,
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [{ text: "🎮 Play Now", web_app: { url: MINI_APP_URL } }],
        [
          { text: "🟦 Byte Choice", web_app: { url: `${MINI_APP_URL}/byte-choice` } },
          { text: "🟩 Pixel Pairs", web_app: { url: `${MINI_APP_URL}/pixel-pairs` } },
        ],
        [
          { text: "🟪 Relay Sprint", web_app: { url: `${MINI_APP_URL}/relay-sprint` } },
          { text: "🗺️ World Map", web_app: { url: `${MINI_APP_URL}/world-map` } },
        ],
      ],
    },
  });
}

async function handlePlay(chatId: number) {
  await tgApi("sendMessage", {
    chat_id: chatId,
    text: "🎮 Today's retro run is ready! Pick your mode:",
    reply_markup: {
      inline_keyboard: [
        [{ text: "🎮 Open Retro Hub", web_app: { url: MINI_APP_URL } }],
        [
          { text: "🇬🇧 EN Daily", web_app: { url: `${MINI_APP_URL}/byte-choice?lang=en&mode=daily` } },
          { text: "🇪🇸 ES Daily", web_app: { url: `${MINI_APP_URL}/byte-choice?lang=es&mode=daily` } },
        ],
      ],
    },
  });
}

async function handleStreak(chatId: number) {
  await tgApi("sendMessage", {
    chat_id: chatId,
    text: "🔥 *Your Streak*\n\nOpen the games to see your current streak and stats.\n\n_Streaks are saved locally on your device._",
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [[{ text: "📊 View Stats", web_app: { url: MINI_APP_URL } }]],
    },
  });
}

async function handleLanguage(chatId: number, args: string) {
  const lang = args.trim().toLowerCase();
  const langMap: Record<string, { name: string; flag: string }> = {
    en: { name: "English", flag: "🇬🇧" },
    es: { name: "Español", flag: "🇪🇸" },
  };

  if (lang && langMap[lang]) {
    const { name, flag } = langMap[lang];
    await tgApi("sendMessage", {
      chat_id: chatId,
      text: `${flag} Playing in *${name}*! Tap to start:`,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [{ text: `${flag} Play in ${name}`, web_app: { url: `${MINI_APP_URL}/byte-choice?lang=${lang}` } }],
        ],
      },
    });
  } else {
    await tgApi("sendMessage", {
      chat_id: chatId,
      text: "🌍 Choose your language:",
      reply_markup: {
        inline_keyboard: [
          [
            { text: "🇬🇧 English", callback_data: "lang_en" },
            { text: "🇪🇸 Español", callback_data: "lang_es" },
          ],
        ],
      },
    });
  }
}

async function handleHelp(chatId: number) {
  await tgApi("sendMessage", {
    chat_id: chatId,
    text: `📖 *TutorLingua Retro — Commands*\n\n/play — Open today's run\n/bytechoice — Byte Choice\n/pixelpairs — Pixel Pairs\n/relaysprint — Relay Sprint\n/worldmap — Progress map\n/language — Change language\n/streak — Your streak & stats\n/help — This message\n\n💡 *Tip:* Type @tutorlingua\\_games\\_bot in any chat to share your challenge links!`,
    parse_mode: "Markdown",
  });
}

async function handleGameCommand(chatId: number, game: string) {
  const gameMap: Record<string, { name: string; emoji: string; slug: string }> = {
    bytechoice: { name: "Byte Choice", emoji: "🟦", slug: "byte-choice" },
    pixelpairs: { name: "Pixel Pairs", emoji: "🟩", slug: "pixel-pairs" },
    relaysprint: { name: "Relay Sprint", emoji: "🟪", slug: "relay-sprint" },
    worldmap: { name: "World Map", emoji: "🗺️", slug: "world-map" },
  };

  const g = gameMap[game];
  if (!g) return;

  await tgApi("sendMessage", {
    chat_id: chatId,
    text: `${g.emoji} *${g.name}*\n\nNew puzzle available! Tap to play:`,
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [{ text: `${g.emoji} Play ${g.name}`, web_app: { url: `${MINI_APP_URL}/${g.slug}` } }],
      ],
    },
  });
}

/* ——— Inline query handler ——— */

async function handleInlineQuery(queryId: string, query: string) {
  // When users type @tutorlingua_games_bot, show options to share
  const results = [
    {
      type: "article",
      id: "invite_play",
      title: "🎮 Invite to Play",
      description: "Share a link to TutorLingua Games",
      input_message_content: {
        message_text:
          "🎮 *TutorLingua Retro Reboot*\n\nThree sensory language games. Daily runs and challenge links.\n\n👉 Play now: https://t.me/tutorlingua_games_bot",
        parse_mode: "Markdown",
      },
      reply_markup: {
        inline_keyboard: [[{ text: "🎮 Play Now", url: "https://t.me/tutorlingua_games_bot" }]],
      },
    },
    {
      type: "article",
      id: "challenge_byte_choice",
      title: "🟦 Challenge: Byte Choice",
      description: "Challenge a friend to Byte Choice",
      input_message_content: {
        message_text:
          "🟦 *Challenge: Byte Choice*\n\nFeel the word and pick fast. Can you beat my run?\n\n👉 Play: https://t.me/tutorlingua_games_bot/games",
        parse_mode: "Markdown",
      },
      reply_markup: {
        inline_keyboard: [[{ text: "🟦 Accept Challenge", url: "https://t.me/tutorlingua_games_bot/games" }]],
      },
    },
    {
      type: "article",
      id: "challenge_relay_sprint",
      title: "🟪 Challenge: Relay Sprint",
      description: "Challenge a friend to Relay Sprint",
      input_message_content: {
        message_text:
          "🟪 *Challenge: Relay Sprint*\n\nI stumbled at 4s. Can you beat my rhythm?\n\n👉 Play: https://t.me/tutorlingua_games_bot/games",
        parse_mode: "Markdown",
      },
      reply_markup: {
        inline_keyboard: [[{ text: "🟪 Accept Challenge", url: "https://t.me/tutorlingua_games_bot/games" }]],
      },
    },
  ];

  await tgApi("answerInlineQuery", {
    inline_query_id: queryId,
    results,
    cache_time: 300,
    is_personal: false,
  });
}

/* ——— Callback query handler ——— */

async function handleCallbackQuery(callbackId: string, data: string, chatId?: number) {
  // Language selection callbacks
  if (data.startsWith("lang_") && chatId) {
    const lang = data.replace("lang_", "");
    await handleLanguage(chatId, lang);
  }

  await tgApi("answerCallbackQuery", { callback_query_id: callbackId });
}

/* ——— Main webhook handler ——— */

export async function POST(request: NextRequest) {
  if (!BOT_TOKEN) {
    return NextResponse.json({ error: "Bot not configured" }, { status: 503 });
  }

  try {
    const update: TelegramUpdate = await request.json();

    // Handle messages (commands)
    if (update.message?.text) {
      const chatId = update.message.chat.id;
      const text = update.message.text.trim();
      const firstName = update.message.from.first_name;

      // Extract command
      const isCommand = update.message.entities?.some((e) => e.type === "bot_command" && e.offset === 0);

      if (isCommand) {
        const [cmd, ...args] = text.split(/\s+/);
        const command = cmd.toLowerCase().replace("@tutorlingua_games_bot", "");

        switch (command) {
          case "/start":
            await handleStart(chatId, firstName);
            break;
          case "/play":
            await handlePlay(chatId);
            break;
          case "/streak":
            await handleStreak(chatId);
            break;
          case "/language":
            await handleLanguage(chatId, args.join(" "));
            break;
          case "/bytechoice":
            await handleGameCommand(chatId, "bytechoice");
            break;
          case "/pixelpairs":
            await handleGameCommand(chatId, "pixelpairs");
            break;
          case "/relaysprint":
            await handleGameCommand(chatId, "relaysprint");
            break;
          case "/worldmap":
            await handleGameCommand(chatId, "worldmap");
            break;
          case "/help":
            await handleHelp(chatId);
            break;
          default:
            // Unknown command — show help
            await handleHelp(chatId);
        }
      }
    }

    // Handle inline queries
    if (update.inline_query) {
      await handleInlineQuery(update.inline_query.id, update.inline_query.query);
    }

    // Handle callback queries
    if (update.callback_query) {
      await handleCallbackQuery(
        update.callback_query.id,
        update.callback_query.data,
        update.callback_query.message?.chat.id,
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Telegram webhook error:", error);
    return NextResponse.json({ ok: true }); // Always return 200 to Telegram
  }
}

// Verify webhook is accessible
export async function GET() {
  return NextResponse.json({
    status: "ok",
    bot: BOT_TOKEN ? "configured" : "not configured",
    hint: BOT_TOKEN ? undefined : "Set TELEGRAM_BOT_TOKEN in environment variables",
  });
}
