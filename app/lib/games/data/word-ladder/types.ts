/**
 * Word Ladder puzzle types.
 */

export interface WordLadderPuzzle {
  /** Puzzle number */
  number: number;
  /** Target language code */
  language: string;
  /** Date string YYYY-MM-DD */
  date: string;
  /** Starting word (displayed in green) */
  startWord: string;
  /** Target word to reach (displayed in gold) */
  targetWord: string;
  /** Optimal number of steps (par) */
  par: number;
  /** Set of all valid intermediate words for validation */
  validWords: Set<string>;
  /** One valid solution path (including start and target) */
  optimalPath: string[];
  /** Optional hint */
  hint?: string;
}

export interface WordLadderGameState {
  puzzle: WordLadderPuzzle;
  /** Chain of submitted steps (not including startWord) */
  steps: string[];
  /** Current input value */
  currentInput: string;
  /** Error message to display */
  error: string | null;
  /** Is the game complete? */
  isComplete: boolean;
  /** Did the player win? */
  isWon: boolean;
  /** Number of invalid attempts (mistakes) */
  mistakes: number;
  /** Time started */
  startTime: number;
  /** Time completed */
  endTime?: number;
}
