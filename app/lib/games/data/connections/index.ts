/**
 * Lingua Connections puzzle loader.
 * Selects the correct puzzle for today based on language and date.
 */

import type { ConnectionsPuzzle } from "./types";
import { PUZZLES_ES } from "./puzzles-es";
import { PUZZLES_ES_EXTRA } from "./puzzles-es-extra";
import { PUZZLES_FR } from "./puzzles-fr";
import { PUZZLES_DE } from "./puzzles-de";
import { getDailySeed, getTodayUTC, getPuzzleNumber, seededShuffle } from "../../daily-seed";

const ALL_PUZZLES: Record<string, ConnectionsPuzzle[]> = {
  es: [...PUZZLES_ES, ...PUZZLES_ES_EXTRA],
  fr: PUZZLES_FR,
  de: PUZZLES_DE,
};

export const SUPPORTED_GAME_LANGUAGES = [
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
] as const;

/**
 * Get today's puzzle for a given language.
 * Uses the daily seed to select and shuffle.
 */
export function getTodaysPuzzle(language: string): ConnectionsPuzzle | null {
  const puzzles = ALL_PUZZLES[language];
  if (!puzzles || puzzles.length === 0) return null;

  const today = getTodayUTC();
  const seed = getDailySeed("connections", language, today);
  const puzzleNumber = getPuzzleNumber();

  // Select puzzle by cycling through available puzzles
  const index = seed % puzzles.length;
  const puzzle = puzzles[index];

  // Return puzzle with shuffled words and updated number
  return {
    ...puzzle,
    number: puzzleNumber,
    date: today,
  };
}

/**
 * Get all 16 words from a puzzle, shuffled for display.
 */
export function getShuffledWords(puzzle: ConnectionsPuzzle): string[] {
  const allWords = puzzle.categories.flatMap((c) => c.words);
  const seed = getDailySeed("connections-shuffle", puzzle.language, puzzle.date);
  return seededShuffle(allWords, seed);
}

/**
 * Check if a set of 4 words matches any unsolved category.
 */
export function checkGuess(
  puzzle: ConnectionsPuzzle,
  selectedWords: string[],
  solvedCategories: string[]
): {
  correct: boolean;
  category?: ConnectionsPuzzle["categories"][number];
  oneAway?: boolean;
} {
  if (selectedWords.length !== 4) {
    return { correct: false };
  }

  const selectedSet = new Set(selectedWords);

  for (const category of puzzle.categories) {
    // Skip already solved
    if (solvedCategories.includes(category.name)) continue;

    const categorySet = new Set(category.words);
    const overlap = selectedWords.filter((w) => categorySet.has(w)).length;

    if (overlap === 4) {
      return { correct: true, category };
    }

    if (overlap === 3) {
      return { correct: false, oneAway: true };
    }
  }

  return { correct: false, oneAway: false };
}

/**
 * Generate shareable text for a completed game.
 */
export function generateShareText(
  puzzleNumber: number,
  language: string,
  solveOrder: string[],
  mistakes: number,
  timeMs: number
): string {
  const flag =
    SUPPORTED_GAME_LANGUAGES.find((l) => l.code === language)?.flag || "🌍";

  const difficultyEmoji: Record<string, string> = {
    yellow: "🟨",
    green: "🟩",
    blue: "🟦",
    purple: "🟪",
  };

  const grid = solveOrder.map((d) => difficultyEmoji[d] || "⬜").join("");
  const timeStr = formatTime(timeMs);
  const mistakeStr = mistakes === 0 ? "Perfect!" : `${mistakes} mistake${mistakes > 1 ? "s" : ""}`;

  return [
    `Lingua Connections ${flag} #${puzzleNumber}`,
    grid,
    `${mistakeStr} · ${timeStr}`,
    `tutorlingua.co/games/connections`,
  ].join("\n");
}

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

// Re-export types
export type { ConnectionsPuzzle, ConnectionsGameState } from "./types";
export type { Difficulty, ConnectionCategory } from "./types";
