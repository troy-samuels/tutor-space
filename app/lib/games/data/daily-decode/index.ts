/**
 * Daily Decode puzzle loader.
 * Selects the correct puzzle for today based on language and date.
 */

import type { DecodePuzzle } from "./types";
import { PUZZLES_ES } from "./puzzles-es";
import { PUZZLES_FR } from "./puzzles-fr";
import { PUZZLES_DE } from "./puzzles-de";
import { getDailySeed, getTodayUTC, getPuzzleNumber } from "../../daily-seed";
import { generateCipher, encryptText, getUniqueLetters } from "./cipher";
import type { CipherMap } from "./types";

const ALL_PUZZLES: Record<string, DecodePuzzle[]> = {
  es: PUZZLES_ES,
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
 */
export function getTodaysPuzzle(language: string): DecodePuzzle | null {
  const puzzles = ALL_PUZZLES[language];
  if (!puzzles || puzzles.length === 0) return null;

  const today = getTodayUTC();
  const seed = getDailySeed("daily-decode", language, today);
  const puzzleNumber = getPuzzleNumber();

  const index = seed % puzzles.length;
  const puzzle = puzzles[index];

  return {
    ...puzzle,
    number: puzzleNumber,
    date: today,
  };
}

/**
 * Prepare a puzzle for play: generate cipher and encode text.
 */
export function preparePuzzle(puzzle: DecodePuzzle): {
  cipher: CipherMap;
  encodedText: string;
  uniqueLetters: string[];
} {
  const seed = getDailySeed("daily-decode-cipher", puzzle.language, puzzle.date);
  const cipher = generateCipher(seed, puzzle.language);
  const encodedText = encryptText(puzzle.plaintext, cipher);
  const uniqueLetters = getUniqueLetters(puzzle.plaintext);

  return { cipher, encodedText, uniqueLetters };
}

/**
 * Generate shareable text for a completed game.
 */
export function generateShareText(
  puzzleNumber: number,
  language: string,
  hintsUsed: number,
  timeMs: number
): string {
  const flag =
    SUPPORTED_GAME_LANGUAGES.find((l) => l.code === language)?.flag || "🌍";

  const timeStr = formatTime(timeMs);
  const hintStr =
    hintsUsed === 0
      ? "No hints!"
      : `${hintsUsed} hint${hintsUsed !== 1 ? "s" : ""}`;

  // Build decode progress bar
  const blocks = "🟩🟩🟩🟩🟩";

  return [
    `Daily Decode ${flag} #${puzzleNumber}`,
    blocks,
    `${hintStr} · ⏱ ${timeStr}`,
    `tutorlingua.co/games/daily-decode`,
  ].join("\n");
}

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

// Re-export
export type { DecodePuzzle, DailyDecodeGameState, CipherMap } from "./types";
export { generateCipher, encryptText, getUniqueLetters, stripAccent } from "./cipher";
