/**
 * Lingua Connections puzzle loader.
 * Selects the correct puzzle for today based on language and date.
 */

import type { ConnectionsPuzzle } from './types';
import { PUZZLES_ES } from './puzzles-es';
import { PUZZLES_FR } from './puzzles-fr';
import { PUZZLES_DE } from './puzzles-de';
import { getDailySeed, getTodayUTC, getPuzzleNumber, seededShuffle } from '@/lib/daily-seed';

const ALL_PUZZLES: Record<string, ConnectionsPuzzle[]> = {
  es: PUZZLES_ES,
  fr: PUZZLES_FR,
  de: PUZZLES_DE,
};

export const SUPPORTED_GAME_LANGUAGES = [
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
] as const;

/**
 * Get today's puzzle for a given language.
 * Uses the daily seed to select and shuffle.
 */
export function getTodaysPuzzle(language: string): ConnectionsPuzzle | null {
  const puzzles = ALL_PUZZLES[language];
  if (!puzzles || puzzles.length === 0) return null;

  const today = getTodayUTC();
  const seed = getDailySeed('connections', language, today);
  const puzzleNumber = getPuzzleNumber();

  // Select puzzle by cycling through available puzzles
  const index = seed % puzzles.length;
  const puzzle = puzzles[index];

  // Return puzzle with updated number and date
  return {
    ...puzzle,
    language,
    number: puzzleNumber,
    date: today,
  };
}

/**
 * Get all 16 words from a puzzle, shuffled for display.
 */
export function getShuffledWords(puzzle: ConnectionsPuzzle): string[] {
  const allWords = puzzle.categories.flatMap((c) => c.words);
  const seed = getDailySeed('connections-shuffle', puzzle.language, puzzle.date);
  return seededShuffle(allWords, seed);
}

// Re-export types
export type { ConnectionsPuzzle, ConnectionsGameState, Difficulty, ConnectionCategory } from './types';
