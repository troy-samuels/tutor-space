/**
 * Missing Piece puzzle types.
 */

import type { CefrLevel } from "@/lib/games/cefr";

export type SentenceCategory =
  | "grammar"
  | "vocabulary"
  | "preposition"
  | "gender"
  | "tense"
  | "idiom";

export interface MissingPieceSentence {
  /** Sentence with ___ for the blank */
  sentence: string;
  /** 4 options to choose from */
  options: [string, string, string, string];
  /** Index of the correct option (0-3) */
  correctIndex: number;
  /** Explanation of why the answer is correct */
  explanation: string;
  /** Category of the sentence */
  category: SentenceCategory;
  /** Difficulty level (legacy — prefer cefrLevel) */
  difficulty: 1 | 2 | 3;
  /** CEFR level tag */
  cefrLevel?: CefrLevel;
  /** Grammar topic tag for struggle detection */
  grammarTopic?: string;
}

export interface MissingPiecePuzzle {
  /** Puzzle number */
  number: number;
  /** Target language code */
  language: string;
  /** Date string YYYY-MM-DD */
  date: string;
  /** CEFR level for this puzzle */
  cefrLevel?: CefrLevel;
  /** 15 sentences per puzzle */
  sentences: MissingPieceSentence[];
}

export interface MissingPieceGameState {
  puzzle: MissingPiecePuzzle;
  /** Current sentence index (0-14) */
  currentSentence: number;
  /** Score (correct answers) */
  score: number;
  /** Lives remaining (starts at 3) */
  lives: number;
  /** Max lives */
  maxLives: number;
  /** Is the game complete? */
  isComplete: boolean;
  /** Did the player win (finished all sentences with lives > 0)? */
  isWon: boolean;
  /** Time started */
  startTime: number;
  /** Time completed */
  endTime?: number;
  /** Results per sentence: true = correct, false = wrong, null = not yet played */
  sentenceResults: (boolean | null)[];
}
