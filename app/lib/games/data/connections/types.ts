/**
 * Lingua Connections puzzle types.
 */

import type { CefrLevel } from "@/lib/games/cefr";

export type Difficulty = "yellow" | "green" | "blue" | "purple";

/** HIGH-2: Per-word false friend metadata */
export interface WordEntry {
  /** The word string */
  word: string;
  /** Is this word a false friend? */
  falseFriend?: boolean;
  /** What players assume it means vs what it actually means (e.g. "ACTUAL = current ≠ actual") */
  falseFriendMeaning?: string;
}

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
  /** Optional per-word metadata with false friend info */
  wordEntries?: WordEntry[];
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
  /** HIGH-2: False friends the player encountered during play */
  falseFriendsEncountered?: Array<{ word: string; meaning: string }>;
}
