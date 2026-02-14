/**
 * Engagement System Types
 * 
 * Achievements, streaks, challenges, and daily goals
 */

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  criteria: AchievementCriteria;
  unlockedAt: string | null;
  category: "practice" | "streak" | "mastery" | "social" | "milestone";
  rarity: "common" | "rare" | "epic" | "legendary";
  xpReward: number;
}

export interface AchievementCriteria {
  type:
    | "exercises_completed"
    | "streak_days"
    | "xp_earned"
    | "perfect_score"
    | "speed"
    | "languages"
    | "time_of_day"
    | "reviews_completed"
    | "accuracy";
  threshold?: number;
  timeWindow?: "session" | "day" | "week" | "month" | "all_time";
}

export interface StreakData {
  current: number;
  longest: number;
  freezesAvailable: number;
  lastPracticeDate: string | null;
  freezeUsedAt: string | null;
}

export interface WeeklyChallenge {
  id: string;
  description: string;
  target: number;
  current: number;
  reward: {
    xp: number;
    badge?: string;
  };
  expiresAt: string;
  category: "exercises" | "xp" | "streak" | "accuracy";
}

export interface DailyGoal {
  exerciseTarget: number;
  exercisesCompleted: number;
  xpTarget: number;
  xpEarned: number;
  lastUpdated: string;
}

export interface LevelProgress {
  currentLevel: number;
  currentXp: number;
  xpToNextLevel: number;
  totalXp: number;
}

export interface EngagementStats {
  totalExercises: number;
  totalXp: number;
  currentStreak: number;
  longestStreak: number;
  achievementsUnlocked: number;
  totalAchievements: number;
  averageAccuracy: number;
  fastestCorrectAnswer: number;
  languagesLearned: number;
}
