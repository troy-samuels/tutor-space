/**
 * Synonym Spiral puzzle loader.
 * Selects the correct puzzle for today based on language and date.
 */

import type { SynonymSpiralPuzzle } from "./types";
import { PUZZLES_ES } from "./puzzles-es";
import { PUZZLES_FR } from "./puzzles-fr";
import { PUZZLES_DE } from "./puzzles-de";
import { getDailySeed, getPuzzleNumber } from "../../daily-seed";

const ALL_PUZZLES: Record<string, SynonymSpiralPuzzle[]> = {
  es: PUZZLES_ES,
  fr: PUZZLES_FR,
  de: PUZZLES_DE,
};

export const SUPPORTED_SPIRAL_LANGUAGES = [
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
] as const;

/**
 * Get today's puzzle for a given language.
 * Uses the daily seed to select.
 */
export function getTodaysSpiralPuzzle(language: string): SynonymSpiralPuzzle | null {
  const puzzles = ALL_PUZZLES[language];
  if (!puzzles || puzzles.length === 0) return null;

  const seed = getDailySeed("synonym-spiral", language);
  const puzzleNumber = getPuzzleNumber();

  // Select puzzle by cycling through available puzzles
  const index = seed % puzzles.length;
  const puzzle = puzzles[index];

  return {
    ...puzzle,
    number: puzzleNumber,
  };
}

/**
 * Get a puzzle for a specific language (non-daily, for direct selection).
 */
export function getSpiralPuzzleForLanguage(lang: string): SynonymSpiralPuzzle {
  const puzzles = ALL_PUZZLES[lang] || PUZZLES_ES;
  const seed = getDailySeed("synonym-spiral", lang);
  const puzzleNumber = getPuzzleNumber();
  const index = seed % puzzles.length;
  return { ...puzzles[index], number: puzzleNumber };
}

/**
 * Generate shareable text for a completed game.
 */
export function generateSpiralShareText(
  puzzleNumber: number,
  language: string,
  roundDepths: number[],
  totalTimeMs: number
): string {
  const flag =
    SUPPORTED_SPIRAL_LANGUAGES.find((l) => l.code === language)?.flag || "🌍";

  const avgDepth = roundDepths.length > 0
    ? (roundDepths.reduce((a, b) => a + b, 0) / roundDepths.length).toFixed(1)
    : "0";

  const depthEmojis = roundDepths.map((d) => {
    if (d >= 5) return "🟣";
    if (d >= 4) return "🔵";
    if (d >= 3) return "🟢";
    if (d >= 2) return "🟡";
    if (d >= 1) return "⚪";
    return "⬜";
  }).join("");

  const timeStr = formatTime(totalTimeMs);

  return [
    `Synonym Spiral #${puzzleNumber} ${flag}`,
    `Depth ${avgDepth}/5 avg · ⏱ ${timeStr}`,
    depthEmojis,
    `🌀`,
    `tutorlingua.co/games/synonym-spiral`,
  ].join("\n");
}

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

// Re-export types
export type { SynonymSpiralPuzzle, SynonymChain, SynonymLevel, DepthLevel, RoundResult, SynonymSpiralGameState } from "./types";
