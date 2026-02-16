/**
 * Odd One Out puzzle loader.
 * Selects the correct puzzle for today based on language and date.
 */

import type { OddOneOutPuzzle } from "./types";
import { PUZZLES_ES } from "./puzzles-es";
import { PUZZLES_FR } from "./puzzles-fr";
import { PUZZLES_DE } from "./puzzles-de";
import { getDailySeed, getPuzzleNumber, seededShuffle } from "../../daily-seed";

const ALL_PUZZLES: Record<string, OddOneOutPuzzle[]> = {
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
export function getTodaysPuzzle(language: string): OddOneOutPuzzle | null {
  const puzzles = ALL_PUZZLES[language];
  if (!puzzles || puzzles.length === 0) return null;

  const seed = getDailySeed("odd-one-out", language);
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
 * Get a puzzle with shuffled word order within each round.
 * The oddIndex is updated to reflect the new position.
 */
export function getShuffledPuzzle(puzzle: OddOneOutPuzzle): OddOneOutPuzzle {
  const seed = getDailySeed("odd-one-out-shuffle", puzzle.language);

  const shuffledRounds = puzzle.rounds.map((round, i) => {
    const roundSeed = seed + i * 7919; // different seed per round
    const indices = [0, 1, 2, 3] as const;
    const shuffledIndices = seededShuffle([...indices], roundSeed);

    const newWords: [string, string, string, string] = [
      round.words[shuffledIndices[0]],
      round.words[shuffledIndices[1]],
      round.words[shuffledIndices[2]],
      round.words[shuffledIndices[3]],
    ];

    const newOddIndex = shuffledIndices.indexOf(round.oddIndex as 0 | 1 | 2 | 3);

    return {
      ...round,
      words: newWords,
      oddIndex: newOddIndex,
    };
  });

  return {
    ...puzzle,
    rounds: shuffledRounds,
  };
}

// Re-export types
export type { OddOneOutPuzzle, OddOneOutRound, OddOneOutGameState } from "./types";
