"use client";

/**
 * Enhanced Streak Management with Freeze Support
 */

import type { StreakData } from "./types";

const STREAK_STORAGE_KEY = "tl_streak_data";
const MAX_FREEZES = 2;

/**
 * Get current streak data
 */
export function getStreakData(): StreakData {
  if (typeof window === "undefined") {
    return {
      current: 0,
      longest: 0,
      freezesAvailable: MAX_FREEZES,
      lastPracticeDate: null,
      freezeUsedAt: null,
    };
  }

  const stored = localStorage.getItem(STREAK_STORAGE_KEY);
  if (!stored) {
    return {
      current: 0,
      longest: 0,
      freezesAvailable: MAX_FREEZES,
      lastPracticeDate: null,
      freezeUsedAt: null,
    };
  }

  try {
    return JSON.parse(stored) as StreakData;
  } catch {
    return {
      current: 0,
      longest: 0,
      freezesAvailable: MAX_FREEZES,
      lastPracticeDate: null,
      freezeUsedAt: null,
    };
  }
}

/**
 * Update streak after practice
 */
export function updateStreak(): StreakData {
  const current = getStreakData();
  const now = new Date();
  const today = now.toISOString().split("T")[0];

  // Already practiced today
  if (current.lastPracticeDate === today) {
    return current;
  }

  let newCurrent = current.current;
  let newLongest = current.longest;

  if (!current.lastPracticeDate) {
    // First practice ever
    newCurrent = 1;
  } else {
    const lastPractice = new Date(current.lastPracticeDate);
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    if (current.lastPracticeDate === yesterdayStr) {
      // Practiced yesterday - continue streak
      newCurrent = current.current + 1;
    } else {
      // Missed a day - streak broken (unless freeze was used)
      newCurrent = 1;
    }
  }

  newLongest = Math.max(newLongest, newCurrent);

  const updated: StreakData = {
    current: newCurrent,
    longest: newLongest,
    freezesAvailable: current.freezesAvailable,
    lastPracticeDate: today,
    freezeUsedAt: current.freezeUsedAt,
  };

  saveStreakData(updated);
  return updated;
}

/**
 * Use a streak freeze
 */
export function useStreakFreeze(): StreakData | null {
  const current = getStreakData();

  if (current.freezesAvailable <= 0) {
    return null; // No freezes available
  }

  const now = new Date();
  const today = now.toISOString().split("T")[0];

  // Check if already used freeze today
  if (current.freezeUsedAt === today) {
    return null;
  }

  const updated: StreakData = {
    ...current,
    freezesAvailable: current.freezesAvailable - 1,
    freezeUsedAt: today,
    lastPracticeDate: today, // Freeze counts as practice
  };

  saveStreakData(updated);
  return updated;
}

/**
 * Award streak freeze (e.g., from achievement or purchase)
 */
export function awardStreakFreeze(): StreakData {
  const current = getStreakData();
  const updated: StreakData = {
    ...current,
    freezesAvailable: Math.min(current.freezesAvailable + 1, MAX_FREEZES),
  };

  saveStreakData(updated);
  return updated;
}

/**
 * Check if streak is at risk (not practiced today)
 */
export function isStreakAtRisk(): boolean {
  const current = getStreakData();
  if (current.current === 0) return false;

  const today = new Date().toISOString().split("T")[0];
  return current.lastPracticeDate !== today;
}

/**
 * Check if streak is broken (missed yesterday without freeze)
 */
export function isStreakBroken(): boolean {
  const current = getStreakData();
  if (!current.lastPracticeDate) return false;

  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];
  const twoDaysAgo = new Date(now);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  const twoDaysAgoStr = twoDaysAgo.toISOString().split("T")[0];

  // If last practice was 2+ days ago and no freeze today, streak is broken
  if (current.lastPracticeDate <= twoDaysAgoStr) {
    const today = now.toISOString().split("T")[0];
    return current.freezeUsedAt !== today && current.freezeUsedAt !== yesterdayStr;
  }

  return false;
}

/**
 * Reset streak (for testing or manual reset)
 */
export function resetStreak(): StreakData {
  const fresh: StreakData = {
    current: 0,
    longest: 0,
    freezesAvailable: MAX_FREEZES,
    lastPracticeDate: null,
    freezeUsedAt: null,
  };

  saveStreakData(fresh);
  return fresh;
}

/**
 * Save streak data to localStorage
 */
function saveStreakData(data: StreakData): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify(data));
}
