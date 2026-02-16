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
 * Uses round recombination for extended content:
 * - With N puzzles × 10 rounds each, we have a large round pool
 * - Each day, we deterministically select 10 rounds from the pool
 * - Rounds are sorted by difficulty (easy → hard) for good pacing
 * - This gives us effectively unlimited unique daily puzzles
 */
export function getTodaysPuzzle(language: string): OddOneOutPuzzle | null {
  const puzzles = ALL_PUZZLES[language];
  if (!puzzles || puzzles.length === 0) return null;

  const seed = getDailySeed("odd-one-out", language);
  const puzzleNumber = getPuzzleNumber();

  // Collect all rounds into a pool
  const roundPool = puzzles.flatMap((p) => p.rounds);

  // If pool is small enough that recombination doesn't help, use original logic
  if (roundPool.length <= 10) {
    const index = seed % puzzles.length;
    return { ...puzzles[index], number: puzzleNumber };
  }

  // Select 10 rounds deterministically from the pool
  const shuffled = seededShuffle(roundPool, seed);
  const selected = shuffled.slice(0, 10);

  // Sort by difficulty for good pacing (easy → hard)
  selected.sort((a, b) => a.difficulty - b.difficulty);

  return {
    number: puzzleNumber,
    language,
    date: new Date().toISOString().split("T")[0],
    rounds: selected,
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
