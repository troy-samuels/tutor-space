/**
 * Missing Piece puzzle loader.
 * Selects the correct puzzle for today based on language and date.
 * Supports CEFR-level filtering for adaptive difficulty.
 */

import type { MissingPiecePuzzle } from "./types";
import { CEFR_ORDER, type CefrLevel } from "@/lib/games/cefr";
import { PUZZLES_ES } from "./puzzles-es";
import { PUZZLES_FR } from "./puzzles-fr";
import { PUZZLES_DE } from "./puzzles-de";
import { PUZZLES_ES_A1 } from "./puzzles-es-a1";
import { PUZZLES_ES_A2 } from "./puzzles-es-a2";
import { PUZZLES_ES_B1 } from "./puzzles-es-b1";
import { PUZZLES_ES_B2 } from "./puzzles-es-b2";
import { getDailySeed, getPuzzleNumber } from "../../daily-seed";

/** Legacy puzzles (mixed difficulty) */
const ALL_PUZZLES: Record<string, MissingPiecePuzzle[]> = {
  es: PUZZLES_ES,
  fr: PUZZLES_FR,
  de: PUZZLES_DE,
};

/** CEFR-graded puzzles by language and level */
const CEFR_PUZZLES: Record<string, Record<CefrLevel, MissingPiecePuzzle[]>> = {
  es: {
    A1: PUZZLES_ES_A1,
    A2: PUZZLES_ES_A2,
    B1: PUZZLES_ES_B1,
    B2: PUZZLES_ES_B2,
  },
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

/**
 * Get a puzzle for a specific CEFR level.
 * Falls back to legacy puzzles if no CEFR-graded content exists.
 */
export function getPuzzleForLevel(
  language: string,
  cefrLevel: CefrLevel
): MissingPiecePuzzle | null {
  const langPuzzles = CEFR_PUZZLES[language];
  if (langPuzzles) {
    const levelPuzzles = langPuzzles[cefrLevel];
    if (levelPuzzles && levelPuzzles.length > 0) {
      const seed = getDailySeed("missing-piece", `${language}-${cefrLevel}`);
      const index = seed % levelPuzzles.length;
      return { ...levelPuzzles[index], number: getPuzzleNumber() };
    }
  }
  // Fallback to legacy
  return getTodaysPuzzle(language);
}

/**
 * Get all available CEFR levels for a language.
 */
export function getAvailableLevels(language: string): CefrLevel[] {
  const langPuzzles = CEFR_PUZZLES[language];
  if (!langPuzzles) return [];
  return CEFR_ORDER.filter(
    (level) => langPuzzles[level] && langPuzzles[level].length > 0
  );
}

// Re-export types
export type { MissingPiecePuzzle, MissingPieceSentence, MissingPieceGameState, SentenceCategory } from "./types";
