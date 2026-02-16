/**
 * Odd One Out puzzle types.
 */

export interface OddOneOutRound {
  /** The 4 words displayed */
  words: [string, string, string, string];
  /** Index of the odd one out (0-3) */
  oddIndex: number;
  /** Category that the 3 matching words share */
  category: string;
  /** Explanation shown after the round */
  explanation: string;
  /** Difficulty level */
  difficulty: 1 | 2 | 3;
}

export interface OddOneOutPuzzle {
  /** Puzzle number */
  number: number;
  /** Target language code */
  language: string;
  /** Date string YYYY-MM-DD */
  date: string;
  /** 10 rounds per puzzle */
  rounds: OddOneOutRound[];
}

export interface OddOneOutGameState {
  puzzle: OddOneOutPuzzle;
  /** Current round index (0-9) */
  currentRound: number;
  /** Score (correct answers) */
  score: number;
  /** Lives remaining (starts at 3) */
  lives: number;
  /** Max lives */
  maxLives: number;
  /** Is the game complete? */
  isComplete: boolean;
  /** Did the player win (finished all rounds with lives > 0)? */
  isWon: boolean;
  /** Time started */
  startTime: number;
  /** Time completed */
  endTime?: number;
  /** Results per round: true = correct, false = wrong, null = not yet played */
  roundResults: (boolean | null)[];
}
