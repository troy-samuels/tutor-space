/**
 * Unified share card generator for all TutorLingua games.
 * Generates Wordle-style emoji grids for each game type.
 */

import { isTelegram, tgShareInline } from "@/lib/telegram";
import { getLanguageLabel } from "./language-utils";
import { getPuzzleNumber } from "./daily-seed";

/* ——— Language flag map ——— */
const FLAG_MAP: Record<string, string> = {
  en: "🇬🇧",
  es: "🇪🇸",
  fr: "🇫🇷",
  de: "🇩🇪",
  it: "🇮🇹",
  pt: "🇧🇷",
  ja: "🇯🇵",
  ko: "🇰🇷",
  zh: "🇨🇳",
  nl: "🇳🇱",
  ar: "🇸🇦",
};

function getFlag(lang: string): string {
  return FLAG_MAP[lang] || "🌍";
}

const SITE_URL = "tutorlingua.com/games";
const BOT_URL = "t.me/tutorlingua_games_bot/games";

/* ——— Connections Share ——— */
export interface ConnectionsShareData {
  language: string;
  puzzleNumber: number;
  /** Order of categories solved, each with difficulty colour */
  solvedOrder: Array<{ difficulty: "yellow" | "green" | "blue" | "purple"; correct: boolean }>;
  mistakes: number;
  categoriesFound: number;
  totalCategories: number;
  timeMs: number;
}

const CONNECTIONS_EMOJI: Record<string, string> = {
  yellow: "🟨",
  green: "🟩",
  blue: "🟦",
  purple: "🟪",
};

export function generateConnectionsShare(data: ConnectionsShareData): string {
  const flag = getFlag(data.language);
  const lines: string[] = [];

  lines.push(`${flag} Lingua Connections #${data.puzzleNumber}`);

  // Build grid — each row is a guess attempt
  for (const attempt of data.solvedOrder) {
    if (attempt.correct) {
      const emoji = CONNECTIONS_EMOJI[attempt.difficulty] || "⬜";
      lines.push(`${emoji}${emoji}${emoji}${emoji}`);
    } else {
      lines.push("⬜⬜⬜⬜");
    }
  }

  lines.push("");
  lines.push(`${data.categoriesFound}/${data.totalCategories} · ${data.mistakes} mistake${data.mistakes !== 1 ? "s" : ""}`);
  lines.push("");
  lines.push(`Play: ${BOT_URL}`);

  return lines.join("\n");
}

/* ——— Word Ladder Share ——— */
export interface WordLadderShareData {
  language: string;
  puzzleNumber: number;
  startWord: string;
  targetWord: string;
  steps: number;
  par: number;
  timeMs: number;
  won: boolean;
}

export function generateWordLadderShare(data: WordLadderShareData): string {
  const flag = getFlag(data.language);
  const lines: string[] = [];

  lines.push(`${flag} Word Ladder #${data.puzzleNumber}`);
  lines.push(`${data.startWord} → ${data.targetWord}`);

  if (data.won) {
    const diff = data.steps - data.par;
    const stars = diff <= 0 ? "⭐⭐⭐" : diff === 1 ? "⭐⭐" : "⭐";
    // Visualise steps as chain links
    const chain = Array(data.steps).fill("🔗").join("");
    lines.push(chain);
    lines.push(`${data.steps} steps (par ${data.par}) ${stars}`);
  } else {
    lines.push("❌ Not solved");
  }

  lines.push("");
  lines.push(`Play: ${BOT_URL}`);

  return lines.join("\n");
}

/* ——— Daily Decode Share ——— */
export interface DailyDecodeShareData {
  language: string;
  puzzleNumber: number;
  lettersRevealed: number;
  totalLetters: number;
  hintsUsed: number;
  timeMs: number;
  won: boolean;
}

export function generateDailyDecodeShare(data: DailyDecodeShareData): string {
  const flag = getFlag(data.language);
  const lines: string[] = [];

  lines.push(`${flag} Daily Decode #${data.puzzleNumber}`);

  if (data.won) {
    const pct = Math.round((data.lettersRevealed / data.totalLetters) * 100);
    // Progress bar
    const filled = Math.round(pct / 10);
    const bar = "🟩".repeat(filled) + "⬜".repeat(10 - filled);
    lines.push(bar);
    lines.push(`Cracked in ${formatShareTime(data.timeMs)}`);
    if (data.hintsUsed > 0) {
      lines.push(`${data.hintsUsed} hint${data.hintsUsed !== 1 ? "s" : ""} used`);
    } else {
      lines.push("No hints! 🧠");
    }
  } else {
    lines.push("🔐 Not cracked");
  }

  lines.push("");
  lines.push(`Play: ${BOT_URL}`);

  return lines.join("\n");
}

/* ——— Missing Piece Share ——— */
export interface MissingPieceShareData {
  language: string;
  puzzleNumber: number;
  correct: number;
  total: number;
  timeMs: number;
}

export function generateMissingPieceShare(data: MissingPieceShareData): string {
  const flag = getFlag(data.language);
  const lines: string[] = [];

  lines.push(`${flag} Missing Piece #${data.puzzleNumber}`);

  // Row of ticks and crosses
  const grid = Array(data.total)
    .fill(null)
    .map((_, i) => (i < data.correct ? "✅" : "❌"))
    .join("");
  lines.push(grid);
  lines.push(`${data.correct}/${data.total} correct · ${formatShareTime(data.timeMs)}`);

  lines.push("");
  lines.push(`Play: ${BOT_URL}`);

  return lines.join("\n");
}

/* ——— Odd One Out Share ——— */
export interface OddOneOutShareData {
  language: string;
  puzzleNumber: number;
  /** Array of round results — true if got it right */
  rounds: boolean[];
  timeMs: number;
}

export function generateOddOneOutShare(data: OddOneOutShareData): string {
  const flag = getFlag(data.language);
  const lines: string[] = [];

  lines.push(`${flag} Odd One Out #${data.puzzleNumber}`);

  // Two rows of 5 emoji each
  const emojis = data.rounds.map((r) => (r ? "🟢" : "🔴"));
  if (emojis.length > 5) {
    lines.push(emojis.slice(0, 5).join(""));
    lines.push(emojis.slice(5, 10).join(""));
  } else {
    lines.push(emojis.join(""));
  }

  const correct = data.rounds.filter(Boolean).length;
  lines.push(`${correct}/${data.rounds.length} spotted · ${formatShareTime(data.timeMs)}`);

  lines.push("");
  lines.push(`Play: ${BOT_URL}`);

  return lines.join("\n");
}

/* ——— Synonym Spiral Share ——— */
export interface SynonymSpiralShareData {
  language: string;
  puzzleNumber: number;
  /** Max depth reached per chain (1-5) */
  chainDepths: number[];
  totalScore: number;
  timeMs: number;
}

export function generateSynonymSpiralShare(data: SynonymSpiralShareData): string {
  const flag = getFlag(data.language);
  const lines: string[] = [];

  lines.push(`${flag} Synonym Spiral #${data.puzzleNumber}`);

  // Visualise each chain as ascending blocks
  const depthEmoji = ["⬜", "🟨", "🟧", "🟥", "🟪", "⬛"];
  for (const depth of data.chainDepths) {
    const bar = Array(5)
      .fill(null)
      .map((_, i) => (i < depth ? depthEmoji[Math.min(i + 1, 5)] : "⬜"))
      .join("");
    lines.push(bar);
  }

  lines.push(`Score: ${data.totalScore} · ${formatShareTime(data.timeMs)}`);

  lines.push("");
  lines.push(`Play: ${BOT_URL}`);

  return lines.join("\n");
}

/* ——— Share dispatch ——— */

/**
 * Copy share text to clipboard and optionally trigger Telegram inline share.
 * Returns true if shared via Telegram, false if copied to clipboard.
 */
export async function shareResult(text: string): Promise<"telegram" | "clipboard" | "failed"> {
  // Try Telegram native share first
  if (isTelegram()) {
    const shared = tgShareInline(text);
    if (shared) return "telegram";
  }

  // Fallback: clipboard
  try {
    await navigator.clipboard.writeText(text);
    return "clipboard";
  } catch {
    // Final fallback: execCommand
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      return "clipboard";
    } catch {
      return "failed";
    }
  }
}

/* ——— Helpers ——— */

function formatShareTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
