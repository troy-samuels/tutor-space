/**
 * Streak calculation and management for TutorLingua.
 *
 * Streaks track consecutive days of practice activity.
 * Visible across all student pages in the nav header.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type StreakData = {
  /** Current consecutive day streak. */
  current: number;
  /** Longest ever streak. */
  longest: number;
  /** Whether today's practice is complete. */
  todayComplete: boolean;
  /** Last practice date (ISO string). */
  lastPracticeDate: string | null;
};

// ---------------------------------------------------------------------------
// Core Logic
// ---------------------------------------------------------------------------

/**
 * Calculate a student's current streak from their practice history.
 *
 * @param studentId - Student's user ID.
 * @param supabase - Supabase client.
 * @returns Streak data.
 */
export async function getStudentStreak(
  studentId: string,
  supabase: SupabaseClient
): Promise<StreakData> {
  // Get practice dates (most recent first), last 90 days
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const { data: sessions } = await supabase
    .from("student_practice_sessions")
    .select("created_at")
    .eq("student_id", studentId)
    .gte("created_at", ninetyDaysAgo.toISOString())
    .order("created_at", { ascending: false });

  if (!sessions || sessions.length === 0) {
    return { current: 0, longest: 0, todayComplete: false, lastPracticeDate: null };
  }

  // Extract unique dates (in student's local timezone — use UTC for simplicity)
  const uniqueDates = new Set<string>();
  for (const session of sessions) {
    const date = session.created_at.split("T")[0];
    uniqueDates.add(date);
  }

  const sortedDates = [...uniqueDates].sort().reverse(); // Most recent first
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  const todayComplete = sortedDates[0] === today;

  // Count current streak
  let current = 0;
  let checkDate = todayComplete ? today : yesterday;

  // If the most recent date isn't today or yesterday, streak is broken
  if (sortedDates[0] !== today && sortedDates[0] !== yesterday) {
    return {
      current: 0,
      longest: calculateLongestStreak(sortedDates),
      todayComplete: false,
      lastPracticeDate: sortedDates[0],
    };
  }

  for (const date of sortedDates) {
    if (date === checkDate) {
      current++;
      // Move to previous day
      const prevDate = new Date(checkDate);
      prevDate.setDate(prevDate.getDate() - 1);
      checkDate = prevDate.toISOString().split("T")[0];
    } else if (date < checkDate) {
      break; // Gap found
    }
  }

  return {
    current,
    longest: Math.max(current, calculateLongestStreak(sortedDates)),
    todayComplete,
    lastPracticeDate: sortedDates[0],
  };
}

/**
 * Calculate the longest streak from a sorted (desc) list of date strings.
 */
function calculateLongestStreak(sortedDatesDesc: string[]): number {
  if (sortedDatesDesc.length === 0) return 0;

  const dates = [...sortedDatesDesc].reverse(); // Ascending
  let longest = 1;
  let current = 1;

  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1]);
    const curr = new Date(dates[i]);
    const diffDays = (curr.getTime() - prev.getTime()) / 86400000;

    if (diffDays === 1) {
      current++;
      longest = Math.max(longest, current);
    } else if (diffDays > 1) {
      current = 1;
    }
    // diffDays === 0 means same day, skip
  }

  return longest;
}

/**
 * Check if a student's streak is at risk (practised yesterday but not today).
 * Useful for push notification triggers.
 */
export function isStreakAtRisk(streak: StreakData): boolean {
  if (streak.current === 0) return false;
  return !streak.todayComplete;
}
