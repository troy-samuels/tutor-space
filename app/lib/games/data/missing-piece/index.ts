/**
 * Missing Piece puzzle loader.
 * Selects the correct puzzle for today based on language and date.
 */

import type { MissingPiecePuzzle } from "./types";
import { PUZZLES_ES } from "./puzzles-es";
import { PUZZLES_FR } from "./puzzles-fr";
import { PUZZLES_DE } from "./puzzles-de";
import { getDailySeed, getPuzzleNumber } from "../../daily-seed";

const ALL_PUZZLES: Record<string, MissingPiecePuzzle[]> = {
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
 * Uses the daily seed to select puzzle.
 */
export function getTodaysPuzzle(language: string): MissingPiecePuzzle | null {
  const puzzles = ALL_PUZZLES[language];
  if (!puzzles || puzzles.length === 0) return null;

  const seed = getDailySeed("missing-piece", language);
  const puzzleNumber = getPuzzleNumber();

  // Select puzzle by cycling through available puzzles
  const index = seed % puzzles.length;
  const puzzle = puzzles[index];

  return {
    ...puzzle,
    number: puzzleNumber,
  };
}

// Re-export types
export type { MissingPiecePuzzle, MissingPieceSentence, MissingPieceGameState, SentenceCategory } from "./types";
