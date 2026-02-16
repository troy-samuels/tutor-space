/**
 * Lingua Connections puzzle types.
 */

import type { CefrLevel } from "@/lib/cefr";

export type Difficulty = "yellow" | "green" | "blue" | "purple";

export interface ConnectionCategory {
  /** Category name/description — revealed on solve */
  name: string;
  /** The 4 words in this category */
  words: string[];
  /** Difficulty colour */
  difficulty: Difficulty;
  /** Why these words connect — for the "explain" feature */
  explanation: string;
  /** Is this a "false friends" category? */
  isFalseFriends?: boolean;
}

export interface ConnectionsPuzzle {
  /** Puzzle number */
  number: number;
  /** Target language code */
  language: string;
  /** Date string YYYY-MM-DD */
  date: string;
  /** CEFR level for this puzzle */
  cefrLevel?: CefrLevel;
  /** The 4 categories (16 words total) */
  categories: [ConnectionCategory, ConnectionCategory, ConnectionCategory, ConnectionCategory];
  /** Optional "Vibe Clue" hints — lateral/poetic, not direct */
  vibeClues?: string[];
}

export interface ConnectionsGameState {
  puzzle: ConnectionsPuzzle;
  /** Current grid of remaining words */
  remainingWords: string[];
  /** Solved categories so far */
  solvedCategories: ConnectionCategory[];
  /** Number of mistakes */
  mistakes: number;
  /** Maximum mistakes allowed */
  maxMistakes: number;
  /** Currently selected words */
  selectedWords: string[];
  /** Is the game complete? */
  isComplete: boolean;
  /** Did the player win? */
  isWon: boolean;
  /** Time started */
  startTime: number;
  /** Time completed */
  endTime?: number;
  /** Solve order for share grid */
  solveOrder: Difficulty[];
}
