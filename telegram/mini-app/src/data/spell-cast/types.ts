/**
 * Spell Cast (Honeycomb) game types.
 */

import type { CefrLevel } from '@/lib/cefr';

export interface HexPuzzle {
  id: string;
  language: string;
  letters: string[]; // 19 letters (centre + 2 rings)
  centerIndex: number; // Index of the golden centre hex (usually 0)
  minWords: number; // Minimum words to find
  pangramWord?: string; // Optional word that uses all letters
}

export interface ValidWord {
  word: string;
  cefrLevel: CefrLevel;
  frequency: number; // 1-100, higher = more common
}

export interface SpellCastGameState {
  puzzle: HexPuzzle;
  foundWords: Set<string>;
  currentWord: string;
  selectedHexes: number[];
  score: number;
  combo: number; // Current combo multiplier
  lastWordTime: number; // Timestamp of last word found
  startTime: number;
  timeRemaining: number; // milliseconds
  isComplete: boolean;
}
