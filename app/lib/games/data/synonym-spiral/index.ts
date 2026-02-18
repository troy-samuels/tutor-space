/**
 * Synonym Spiral puzzle loader.
 * Selects the correct puzzle for today based on language and date.
 */

import type { SynonymSpiralPuzzle } from "./types";
import { PUZZLES_EN } from "./puzzles-en";
import { PUZZLES_ES } from "./puzzles-es";
import { PUZZLES_FR } from "./puzzles-fr";
import { PUZZLES_DE } from "./puzzles-de";
import { getDailySeed, getPuzzleNumber, seededShuffle } from "../../daily-seed";

const ALL_PUZZLES: Record<string, SynonymSpiralPuzzle[]> = {
  en: PUZZLES_EN,
  es: PUZZLES_ES,
  fr: PUZZLES_FR,
  de: PUZZLES_DE,
};

export const SUPPORTED_SPIRAL_LANGUAGES = [
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
] as const;

/**
 * Get today's puzzle for a given language.
 * Uses chain recombination for extended content:
 * - Collects all chains from all puzzles into a pool
 * - Deterministically selects 5 chains per day
 * - This gives far more unique daily combinations than base puzzle count
 */
export function getTodaysSpiralPuzzle(language: string): SynonymSpiralPuzzle | null {
  const puzzles = ALL_PUZZLES[language];
  if (!puzzles || puzzles.length === 0) return null;

  const seed = getDailySeed("synonym-spiral", language);
  const puzzleNumber = getPuzzleNumber();

  // Collect all chains into a pool
  const chainPool = puzzles.flatMap((p) => p.chains);

  // If pool is small, use original logic
  if (chainPool.length <= 5) {
    const index = seed % puzzles.length;
    return { ...puzzles[index], number: puzzleNumber };
  }

  // Select 5 chains deterministically
  const shuffled = seededShuffle(chainPool, seed);
  const selected = shuffled.slice(0, 5) as [
    import("./types").SynonymChain,
    import("./types").SynonymChain,
    import("./types").SynonymChain,
    import("./types").SynonymChain,
    import("./types").SynonymChain,
  ];

  return {
    number: puzzleNumber,
    language,
    date: new Date().toISOString().split("T")[0],
    chains: selected,
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
