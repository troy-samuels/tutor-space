"use client";

/**
 * Achievement Definitions and Checking Logic
 */

import type { Achievement, EngagementStats } from "./types";

// ============================================================================
// ACHIEVEMENT DEFINITIONS
// ============================================================================

export const ACHIEVEMENTS: Achievement[] = [
  // Practice Achievements
  {
    id: "first-exercise",
    name: "First Steps",
    description: "Complete your first exercise",
    icon: "🎯",
    criteria: { type: "exercises_completed", threshold: 1, timeWindow: "all_time" },
    unlockedAt: null,
    category: "practice",
    rarity: "common",
    xpReward: 10,
  },
  {
    id: "10-exercises",
    name: "Committed Learner",
    description: "Complete 10 exercises",
    icon: "📚",
    criteria: { type: "exercises_completed", threshold: 10, timeWindow: "all_time" },
    unlockedAt: null,
    category: "practice",
    rarity: "common",
    xpReward: 25,
  },
  {
    id: "50-exercises",
    name: "Dedicated Student",
    description: "Complete 50 exercises",
    icon: "🎓",
    criteria: { type: "exercises_completed", threshold: 50, timeWindow: "all_time" },
    unlockedAt: null,
    category: "practice",
    rarity: "rare",
    xpReward: 50,
  },
  {
    id: "100-exercises",
    name: "Practice Master",
    description: "Complete 100 exercises",
    icon: "👑",
    criteria: { type: "exercises_completed", threshold: 100, timeWindow: "all_time" },
    unlockedAt: null,
    category: "practice",
    rarity: "epic",
    xpReward: 100,
  },
  {
    id: "500-exercises",
    name: "Language Warrior",
    description: "Complete 500 exercises",
    icon: "⚔️",
    criteria: { type: "exercises_completed", threshold: 500, timeWindow: "all_time" },
    unlockedAt: null,
    category: "practice",
    rarity: "legendary",
    xpReward: 250,
  },

  // Streak Achievements
  {
    id: "3-day-streak",
    name: "Getting Consistent",
    description: "Maintain a 3-day practice streak",
    icon: "🔥",
    criteria: { type: "streak_days", threshold: 3 },
    unlockedAt: null,
    category: "streak",
    rarity: "common",
    xpReward: 20,
  },
  {
    id: "7-day-streak",
    name: "Week Warrior",
    description: "Maintain a 7-day practice streak",
    icon: "⭐",
    criteria: { type: "streak_days", threshold: 7 },
    unlockedAt: null,
    category: "streak",
    rarity: "rare",
    xpReward: 50,
  },
  {
    id: "30-day-streak",
    name: "Month Master",
    description: "Maintain a 30-day practice streak",
    icon: "💎",
    criteria: { type: "streak_days", threshold: 30 },
    unlockedAt: null,
    category: "streak",
    rarity: "epic",
    xpReward: 150,
  },
  {
    id: "100-day-streak",
    name: "Century Club",
    description: "Maintain a 100-day practice streak",
    icon: "🏆",
    criteria: { type: "streak_days", threshold: 100 },
    unlockedAt: null,
    category: "streak",
    rarity: "legendary",
    xpReward: 500,
  },

  // Mastery Achievements
  {
    id: "perfect-score",
    name: "Perfectionist",
    description: "Score 100% in a practice session",
    icon: "✨",
    criteria: { type: "perfect_score", timeWindow: "session" },
    unlockedAt: null,
    category: "mastery",
    rarity: "rare",
    xpReward: 30,
  },
  {
    id: "speed-demon",
    name: "Speed Demon",
    description: "Answer a question in under 5 seconds",
    icon: "⚡",
    criteria: { type: "speed", threshold: 5000 },
    unlockedAt: null,
    category: "mastery",
    rarity: "rare",
    xpReward: 25,
  },
  {
    id: "high-accuracy",
    name: "Sharp Mind",
    description: "Maintain 90% accuracy over 20 exercises",
    icon: "🎯",
    criteria: { type: "accuracy", threshold: 90, timeWindow: "all_time" },
    unlockedAt: null,
    category: "mastery",
    rarity: "epic",
    xpReward: 75,
  },

  // Language Achievements
  {
    id: "polyglot-3",
    name: "Polyglot",
    description: "Practice 3 different languages",
    icon: "🌍",
    criteria: { type: "languages", threshold: 3 },
    unlockedAt: null,
    category: "social",
    rarity: "rare",
    xpReward: 50,
  },
  {
    id: "polyglot-5",
    name: "Global Citizen",
    description: "Practice 5 different languages",
    icon: "🌎",
    criteria: { type: "languages", threshold: 5 },
    unlockedAt: null,
    category: "social",
    rarity: "epic",
    xpReward: 100,
  },

  // Time-based Achievements
  {
    id: "early-bird",
    name: "Early Bird",
    description: "Practice before 8 AM",
    icon: "🌅",
    criteria: { type: "time_of_day", timeWindow: "session" },
    unlockedAt: null,
    category: "milestone",
    rarity: "common",
    xpReward: 15,
  },
  {
    id: "night-owl",
    name: "Night Owl",
    description: "Practice after 10 PM",
    icon: "🦉",
    criteria: { type: "time_of_day", timeWindow: "session" },
    unlockedAt: null,
    category: "milestone",
    rarity: "common",
    xpReward: 15,
  },

  // XP Achievements
  {
    id: "1000-xp",
    name: "XP Collector",
    description: "Earn 1,000 total XP",
    icon: "💰",
    criteria: { type: "xp_earned", threshold: 1000, timeWindow: "all_time" },
    unlockedAt: null,
    category: "milestone",
    rarity: "rare",
    xpReward: 50,
  },
  {
    id: "5000-xp",
    name: "XP Hoarder",
    description: "Earn 5,000 total XP",
    icon: "💎",
    criteria: { type: "xp_earned", threshold: 5000, timeWindow: "all_time" },
    unlockedAt: null,
    category: "milestone",
    rarity: "epic",
    xpReward: 150,
  },
  {
    id: "10000-xp",
    name: "XP Legend",
    description: "Earn 10,000 total XP",
    icon: "👑",
    criteria: { type: "xp_earned", threshold: 10000, timeWindow: "all_time" },
    unlockedAt: null,
    category: "milestone",
    rarity: "legendary",
    xpReward: 500,
  },

  // Review Achievements
  {
    id: "reviews-complete-10",
    name: "Review Rookie",
    description: "Complete 10 spaced repetition reviews",
    icon: "📝",
    criteria: { type: "reviews_completed", threshold: 10, timeWindow: "all_time" },
    unlockedAt: null,
    category: "practice",
    rarity: "common",
    xpReward: 20,
  },
  {
    id: "reviews-complete-50",
    name: "Review Specialist",
    description: "Complete 50 spaced repetition reviews",
    icon: "📖",
    criteria: { type: "reviews_completed", threshold: 50, timeWindow: "all_time" },
    unlockedAt: null,
    category: "practice",
    rarity: "rare",
    xpReward: 50,
  },
];

// ============================================================================
// ACHIEVEMENT CHECKING
// ============================================================================

/**
 * Check which achievements should be unlocked based on current stats
 * Returns newly unlocked achievements only
 */
export function checkAchievements(
  stats: EngagementStats,
  existingAchievements: Achievement[]
): Achievement[] {
  const newlyUnlocked: Achievement[] = [];
  const now = new Date().toISOString();

  for (const achievement of ACHIEVEMENTS) {
    // Skip if already unlocked
    const existing = existingAchievements.find((a) => a.id === achievement.id);
    if (existing?.unlockedAt) continue;

    let shouldUnlock = false;

    switch (achievement.criteria.type) {
      case "exercises_completed":
        shouldUnlock =
          stats.totalExercises >= (achievement.criteria.threshold || 0);
        break;

      case "streak_days":
        shouldUnlock =
          stats.currentStreak >= (achievement.criteria.threshold || 0);
        break;

      case "xp_earned":
        shouldUnlock = stats.totalXp >= (achievement.criteria.threshold || 0);
        break;

      case "accuracy":
        shouldUnlock =
          stats.averageAccuracy >= (achievement.criteria.threshold || 0);
        break;

      case "languages":
        shouldUnlock =
          stats.languagesLearned >= (achievement.criteria.threshold || 0);
        break;

      case "speed":
        shouldUnlock =
          stats.fastestCorrectAnswer > 0 &&
          stats.fastestCorrectAnswer <= (achievement.criteria.threshold || Infinity);
        break;

      case "reviews_completed":
        // Would need review stats - placeholder for now
        shouldUnlock = false;
        break;

      case "perfect_score":
      case "time_of_day":
        // These need to be checked per-session, not from aggregate stats
        // Will be handled separately
        shouldUnlock = false;
        break;
    }

    if (shouldUnlock) {
      newlyUnlocked.push({
        ...achievement,
        unlockedAt: now,
      });
    }
  }

  return newlyUnlocked;
}

/**
 * Get total achievement progress
 */
export function getAchievementProgress(
  unlockedAchievements: Achievement[]
): {
  unlocked: number;
  total: number;
  percentage: number;
  xpEarned: number;
} {
  const unlocked = unlockedAchievements.filter((a) => a.unlockedAt).length;
  const total = ACHIEVEMENTS.length;
  const percentage = Math.round((unlocked / total) * 100);
  const xpEarned = unlockedAchievements
    .filter((a) => a.unlockedAt)
    .reduce((sum, a) => sum + a.xpReward, 0);

  return {
    unlocked,
    total,
    percentage,
    xpEarned,
  };
}

/**
 * Get achievements by category
 */
export function getAchievementsByCategory(category: Achievement["category"]): Achievement[] {
  return ACHIEVEMENTS.filter((a) => a.category === category);
}

/**
 * Get achievements by rarity
 */
export function getAchievementsByRarity(rarity: Achievement["rarity"]): Achievement[] {
  return ACHIEVEMENTS.filter((a) => a.rarity === rarity);
}
