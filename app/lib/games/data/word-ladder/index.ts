/**
 * Word Ladder puzzle loader.
 * Selects the correct puzzle for today based on language and date.
 */

import type { WordLadderPuzzle } from "./types";
import { PUZZLES_EN } from "./puzzles-en";
import { PUZZLES_ES } from "./puzzles-es";
import { PUZZLES_FR } from "./puzzles-fr";
import { PUZZLES_DE } from "./puzzles-de";
import { getDailySeed, getTodayUTC, getPuzzleNumber } from "../../daily-seed";

const ALL_PUZZLES: Record<string, WordLadderPuzzle[]> = {
  en: PUZZLES_EN,
  es: PUZZLES_ES,
  fr: PUZZLES_FR,
  de: PUZZLES_DE,
};

export const SUPPORTED_GAME_LANGUAGES = [
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
] as const;

/**
 * Get today's puzzle for a given language.
 */
export function getTodaysPuzzle(language: string): WordLadderPuzzle | null {
  const puzzles = ALL_PUZZLES[language];
  if (!puzzles || puzzles.length === 0) return null;

  const today = getTodayUTC();
  const seed = getDailySeed("word-ladder", language, today);
  const puzzleNumber = getPuzzleNumber();

  // Select puzzle by cycling through available puzzles
  const index = seed % puzzles.length;
  const puzzle = puzzles[index];

  return {
    ...puzzle,
    number: puzzleNumber,
    date: today,
  };
}

/**
 * Check if a word differs by exactly one letter from another.
 */
export function differsbyOneLetter(word1: string, word2: string): boolean {
  if (word1.length !== word2.length) return false;
  let diffCount = 0;
  for (let i = 0; i < word1.length; i++) {
    if (word1[i] !== word2[i]) diffCount++;
  }
  return diffCount === 1;
}

/**
 * Validate a step in the word ladder.
 */
export function validateStep(
  currentWord: string,
  newWord: string,
  validWords: Set<string>
): { valid: boolean; error?: string } {
  const upper = newWord.toUpperCase();

  if (upper.length !== currentWord.length) {
    return { valid: false, error: `Word must be ${currentWord.length} letters` };
  }

  if (!differsbyOneLetter(currentWord, upper)) {
    return { valid: false, error: "Changed more than one letter" };
  }

  if (!validWords.has(upper)) {
    return { valid: false, error: "Not a valid word" };
  }

  return { valid: true };
}

/**
 * Generate shareable text for a completed game.
 */
export function generateShareText(
  puzzleNumber: number,
  language: string,
  steps: number,
  par: number,
  timeMs: number
): string {
  const flag =
    SUPPORTED_GAME_LANGUAGES.find((l) => l.code === language)?.flag || "🌍";

  const timeStr = formatTime(timeMs);
  const parDiff = steps - par;
  const parStr =
    parDiff === 0
      ? "par"
      : parDiff > 0
        ? `+${parDiff} over par`
        : `${parDiff} under par!`;

  // Build chain emoji
  const chain = Array.from({ length: steps + 1 }, (_, i) =>
    i === 0 ? "🟢" : i === steps ? "🏆" : "🔗"
  ).join("");

  return [
    `Word Ladder ${flag} #${puzzleNumber}`,
    chain,
    `${steps} steps (${parStr}) · ⏱ ${timeStr}`,
    `tutorlingua.co/games/word-ladder`,
  ].join("\n");
}

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

// Re-export types
export type { WordLadderPuzzle, WordLadderGameState } from "./types";
