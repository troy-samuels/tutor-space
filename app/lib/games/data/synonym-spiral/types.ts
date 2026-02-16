/**
 * Synonym Spiral puzzle types.
 */

export type DepthLevel = 1 | 2 | 3 | 4 | 5;

export interface SynonymLevel {
  /** Depth 1-5 */
  depth: DepthLevel;
  /** Valid words the player can type at this depth */
  validWords: string[];
  /** Human-readable label for the depth */
  label: string;
}

export interface SynonymChain {
  /** The starting word (simple, A1 level) */
  starterWord: string;
  /** English translation of the starter word */
  starterTranslation: string;
  /** The 5 depth levels with valid synonyms */
  levels: [SynonymLevel, SynonymLevel, SynonymLevel, SynonymLevel, SynonymLevel];
}

export interface SynonymSpiralPuzzle {
  /** Puzzle number */
  number: number;
  /** Target language code */
  language: string;
  /** Date string YYYY-MM-DD */
  date: string;
  /** 5 synonym chains per puzzle */
  chains: [SynonymChain, SynonymChain, SynonymChain, SynonymChain, SynonymChain];
}

export interface RoundResult {
  /** Which chain index (0-4) */
  chainIndex: number;
  /** Max depth reached (0 = failed, 1-5) */
  depthReached: DepthLevel | 0;
  /** Words the player successfully entered */
  wordsEntered: string[];
  /** Time taken in ms */
  timeMs: number;
}

export interface SynonymSpiralGameState {
  puzzle: SynonymSpiralPuzzle;
  /** Current round (0-4) */
  currentRound: number;
  /** Current depth within the round */
  currentDepth: DepthLevel;
  /** Words entered this round */
  wordsThisRound: string[];
  /** Results for completed rounds */
  roundResults: RoundResult[];
  /** Is the whole game complete? */
  isComplete: boolean;
  /** Average depth reached across all rounds */
  averageDepth: number;
  /** Total time in ms */
  totalTimeMs: number;
  /** Start time */
  startTime: number;
  /** End time */
  endTime?: number;
}
