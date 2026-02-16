/**
 * Game store — current game state, completion status.
 */

import { create } from 'zustand';

export type GameSlug = 'connections' | 'spell-cast' | 'speed-clash' | 'word-runner' | 'vocab-clash';

export interface GameState {
  // Current game
  currentGame: GameSlug | null;
  puzzleNumber: number;
  
  // Game-specific state (stored as JSON)
  gameData: Record<string, unknown>;
  
  // Completion tracking
  isComplete: boolean;
  isWon: boolean;
  score: number;
  mistakes: number;
  startTime: number;
  endTime: number | null;
  
  // Actions
  startGame: (game: GameSlug, puzzleNumber: number) => void;
  updateGameData: (data: Record<string, unknown>) => void;
  completeGame: (won: boolean, score: number, mistakes: number) => void;
  resetGame: () => void;
}

export const useGameStore = create<GameState>()((set) => ({
  currentGame: null,
  puzzleNumber: 0,
  gameData: {},
  isComplete: false,
  isWon: false,
  score: 0,
  mistakes: 0,
  startTime: 0,
  endTime: null,

  startGame: (game, puzzleNumber) =>
    set({
      currentGame: game,
      puzzleNumber,
      gameData: {},
      isComplete: false,
      isWon: false,
      score: 0,
      mistakes: 0,
      startTime: Date.now(),
      endTime: null,
    }),

  updateGameData: (data) =>
    set((state) => ({
      gameData: { ...state.gameData, ...data },
    })),

  completeGame: (won, score, mistakes) =>
    set({
      isComplete: true,
      isWon: won,
      score,
      mistakes,
      endTime: Date.now(),
    }),

  resetGame: () =>
    set({
      currentGame: null,
      puzzleNumber: 0,
      gameData: {},
      isComplete: false,
      isWon: false,
      score: 0,
      mistakes: 0,
      startTime: 0,
      endTime: null,
    }),
}));
