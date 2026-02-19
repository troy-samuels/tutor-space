/**
 * Per-game daily progress tracking (localStorage).
 * Used by the game hub to show played/won status rings.
 * Also awards tokens on game completion.
 */

import { awardGameComplete } from "@/lib/games/tokens";

const STORAGE_KEY = "tl-game-progress";

export type GameStatus = "unplayed" | "played" | "won";

export interface DailyGameProgress {
  /** ISO date string (YYYY-MM-DD) */
  date: string;
  /** Map of game slug to status */
  games: Record<string, GameStatus>;
}

function getTodayStr(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Get today's game progress from localStorage.
 */
export function getDailyProgress(): DailyGameProgress {
  if (typeof window === "undefined") {
    return { date: getTodayStr(), games: {} };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { date: getTodayStr(), games: {} };
    const data = JSON.parse(raw) as DailyGameProgress;
    // Reset if it's a new day
    if (data.date !== getTodayStr()) {
      return { date: getTodayStr(), games: {} };
    }
    return data;
  } catch {
    return { date: getTodayStr(), games: {} };
  }
}

/**
 * Record a game result for today.
 * Also awards tokens: +20 for mastery (won), +10 for completion.
 */
export function recordDailyProgress(
  gameSlug: string,
  won: boolean
): DailyGameProgress {
  const progress = getDailyProgress();
  const previousStatus = progress.games[gameSlug];

  progress.games[gameSlug] = won ? "won" : "played";
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }

  // Award tokens for first completion of this game today
  if (!previousStatus || previousStatus === "unplayed") {
    awardGameComplete(won);
  }

  return progress;
}

/**
 * Get the status of a specific game for today.
 */
export function getGameStatus(gameSlug: string): GameStatus {
  const progress = getDailyProgress();
  return progress.games[gameSlug] ?? "unplayed";
}

/**
 * Count how many games have been played/won today.
 */
export function getTodayStats(): { played: number; won: number; total: number } {
  const progress = getDailyProgress();
  const statuses = Object.values(progress.games);
  return {
    played: statuses.filter((s) => s === "played" || s === "won").length,
    won: statuses.filter((s) => s === "won").length,
    total: statuses.length,
  };
}
