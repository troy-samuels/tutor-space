"use client";

/**
 * Daily Goal Management
 */

import type { DailyGoal } from "./types";

const GOAL_STORAGE_KEY = "tl_daily_goal";

const DEFAULT_GOALS = {
  exerciseTarget: 5,
  xpTarget: 100,
};

/**
 * Get today's goal
 */
export function getDailyGoal(): DailyGoal {
  if (typeof window === "undefined") {
    return {
      exerciseTarget: DEFAULT_GOALS.exerciseTarget,
      exercisesCompleted: 0,
      xpTarget: DEFAULT_GOALS.xpTarget,
      xpEarned: 0,
      lastUpdated: new Date().toISOString().split("T")[0],
    };
  }

  const stored = localStorage.getItem(GOAL_STORAGE_KEY);
  if (!stored) {
    return {
      exerciseTarget: DEFAULT_GOALS.exerciseTarget,
      exercisesCompleted: 0,
      xpTarget: DEFAULT_GOALS.xpTarget,
      xpEarned: 0,
      lastUpdated: new Date().toISOString().split("T")[0],
    };
  }

  try {
    const goal = JSON.parse(stored) as DailyGoal;
    const today = new Date().toISOString().split("T")[0];

    // Reset if it's a new day
    if (goal.lastUpdated !== today) {
      return {
        exerciseTarget: goal.exerciseTarget,
        exercisesCompleted: 0,
        xpTarget: goal.xpTarget,
        xpEarned: 0,
        lastUpdated: today,
      };
    }

    return goal;
  } catch {
    return {
      exerciseTarget: DEFAULT_GOALS.exerciseTarget,
      exercisesCompleted: 0,
      xpTarget: DEFAULT_GOALS.xpTarget,
      xpEarned: 0,
      lastUpdated: new Date().toISOString().split("T")[0],
    };
  }
}

/**
 * Update goal progress after practice
 */
export function updateGoalProgress(exercisesCompleted: number, xpEarned: number): DailyGoal {
  const current = getDailyGoal();

  const updated: DailyGoal = {
    ...current,
    exercisesCompleted: current.exercisesCompleted + exercisesCompleted,
    xpEarned: current.xpEarned + xpEarned,
    lastUpdated: new Date().toISOString().split("T")[0],
  };

  saveGoal(updated);
  return updated;
}

/**
 * Set custom goal targets
 */
export function setGoalTargets(exerciseTarget: number, xpTarget: number): DailyGoal {
  const current = getDailyGoal();

  const updated: DailyGoal = {
    ...current,
    exerciseTarget,
    xpTarget,
  };

  saveGoal(updated);
  return updated;
}

/**
 * Check if goal is complete
 */
export function isGoalComplete(): boolean {
  const goal = getDailyGoal();
  return (
    goal.exercisesCompleted >= goal.exerciseTarget &&
    goal.xpEarned >= goal.xpTarget
  );
}

/**
 * Get goal progress percentage
 */
export function getGoalProgress(): {
  exerciseProgress: number;
  xpProgress: number;
  overall: number;
} {
  const goal = getDailyGoal();

  const exerciseProgress = Math.min(
    (goal.exercisesCompleted / goal.exerciseTarget) * 100,
    100
  );
  const xpProgress = Math.min((goal.xpEarned / goal.xpTarget) * 100, 100);
  const overall = (exerciseProgress + xpProgress) / 2;

  return {
    exerciseProgress: Math.round(exerciseProgress),
    xpProgress: Math.round(xpProgress),
    overall: Math.round(overall),
  };
}

/**
 * Reset goal (for testing)
 */
export function resetGoal(): DailyGoal {
  const fresh: DailyGoal = {
    exerciseTarget: DEFAULT_GOALS.exerciseTarget,
    exercisesCompleted: 0,
    xpTarget: DEFAULT_GOALS.xpTarget,
    xpEarned: 0,
    lastUpdated: new Date().toISOString().split("T")[0],
  };

  saveGoal(fresh);
  return fresh;
}

/**
 * Save goal to localStorage
 */
function saveGoal(goal: DailyGoal): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(GOAL_STORAGE_KEY, JSON.stringify(goal));
}
