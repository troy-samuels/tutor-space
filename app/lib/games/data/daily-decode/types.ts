/**
 * Daily Decode puzzle types.
 */

import type { CefrLevel } from "@/lib/games/cefr";

export type DecodeDifficulty = "easy" | "medium" | "hard";

export interface DecodePuzzle {
  /** Puzzle number */
  number: number;
  /** Target language code */
  language: string;
  /** Date string YYYY-MM-DD */
  date: string;
  /** The original plaintext quote */
  plaintext: string;
  /** Author of the quote */
  author: string;
  /** Difficulty level */
  difficulty: DecodeDifficulty;
  /** CEFR level for this puzzle */
  cefrLevel?: CefrLevel;
}

export interface CipherMap {
  /** Maps each plaintext letter to its cipher letter */
  encrypt: Record<string, string>;
  /** Maps each cipher letter to its plaintext letter */
  decrypt: Record<string, string>;
}

export interface DailyDecodeGameState {
  puzzle: DecodePuzzle;
  /** The cipher mapping used for this puzzle */
  cipher: CipherMap;
  /** The encoded text */
  encodedText: string;
  /** Player's current letter mappings: cipher letter → guessed plaintext letter */
  playerMappings: Record<string, string>;
  /** Currently selected cipher letter (for keyboard input) */
  selectedLetter: string | null;
  /** Number of hints used */
  hintsUsed: number;
  /** Maximum hints allowed */
  maxHints: number;
  /** Letters revealed by hints */
  hintedLetters: Set<string>;
  /** Is the game complete? */
  isComplete: boolean;
  /** Did the player win? */
  isWon: boolean;
  /** Number of mistakes (wrong letter placements that were later corrected) */
  mistakes: number;
  /** Time started */
  startTime: number;
  /** Time completed */
  endTime?: number;
}
