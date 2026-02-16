/**
 * Pre-generated hex puzzles for Spell Cast.
 * 30 puzzles per language (one month of daily puzzles).
 */

import type { HexPuzzle } from './types';
import { getDailySeed, getTodayUTC, getPuzzleNumber } from '@/lib/daily-seed';

// Spanish puzzles (sample — would have 30 in production)
const SPANISH_HEX_PUZZLES: HexPuzzle[] = [
  {
    id: 'es-1',
    language: 'es',
    letters: ['A', 'C', 'S', 'O', 'M', 'T', 'E', 'L', 'R', 'N', 'D', 'I', 'U', 'P', 'B', 'G', 'H', 'V', 'F'],
    centerIndex: 0,
    minWords: 15,
  },
  {
    id: 'es-2',
    language: 'es',
    letters: ['E', 'R', 'T', 'A', 'S', 'O', 'N', 'D', 'L', 'I', 'C', 'M', 'P', 'U', 'B', 'G', 'V', 'H', 'F'],
    centerIndex: 0,
    minWords: 15,
  },
  {
    id: 'es-3',
    language: 'es',
    letters: ['O', 'L', 'S', 'A', 'R', 'T', 'E', 'N', 'D', 'I', 'C', 'M', 'P', 'U', 'B', 'G', 'V', 'H', 'J'],
    centerIndex: 0,
    minWords: 15,
  },
];

// French puzzles (sample)
const FRENCH_HEX_PUZZLES: HexPuzzle[] = [
  {
    id: 'fr-1',
    language: 'fr',
    letters: ['E', 'A', 'R', 'T', 'S', 'N', 'O', 'I', 'L', 'U', 'C', 'D', 'M', 'P', 'B', 'V', 'H', 'G', 'F'],
    centerIndex: 0,
    minWords: 15,
  },
  {
    id: 'fr-2',
    language: 'fr',
    letters: ['A', 'E', 'S', 'R', 'T', 'N', 'I', 'O', 'L', 'U', 'C', 'D', 'M', 'P', 'B', 'V', 'G', 'H', 'F'],
    centerIndex: 0,
    minWords: 15,
  },
];

// German puzzles (sample)
const GERMAN_HEX_PUZZLES: HexPuzzle[] = [
  {
    id: 'de-1',
    language: 'de',
    letters: ['E', 'N', 'R', 'T', 'S', 'A', 'I', 'D', 'H', 'U', 'C', 'L', 'M', 'G', 'B', 'F', 'W', 'K', 'Z'],
    centerIndex: 0,
    minWords: 15,
  },
  {
    id: 'de-2',
    language: 'de',
    letters: ['E', 'R', 'N', 'T', 'S', 'A', 'I', 'D', 'H', 'U', 'C', 'L', 'M', 'G', 'B', 'F', 'W', 'K', 'V'],
    centerIndex: 0,
    minWords: 15,
  },
];

const ALL_HEX_PUZZLES: Record<string, HexPuzzle[]> = {
  es: SPANISH_HEX_PUZZLES,
  fr: FRENCH_HEX_PUZZLES,
  de: GERMAN_HEX_PUZZLES,
};

/**
 * Get today's hex puzzle for a language.
 */
export function getTodaysHexPuzzle(language: string): HexPuzzle | null {
  const puzzles = ALL_HEX_PUZZLES[language];
  if (!puzzles || puzzles.length === 0) return null;

  const today = getTodayUTC();
  const seed = getDailySeed('spell-cast', language, today);
  
  // Cycle through available puzzles
  const index = seed % puzzles.length;
  const puzzle = puzzles[index];
  return puzzle || null;
}

/**
 * Get puzzle number for today.
 */
export function getSpellCastPuzzleNumber(): number {
  return getPuzzleNumber();
}
