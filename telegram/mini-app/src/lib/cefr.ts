/**
 * CEFR Level System for TutorLingua Games
 *
 * Maps the Common European Framework of Reference for Languages
 * to game difficulty, content selection, and progression tracking.
 */

export type CefrLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export interface CefrLevelConfig {
  level: CefrLevel;
  label: string;
  description: string;
  colour: string;
  /** Tailwind bg class */
  bgClass: string;
  /** Tailwind text class */
  textClass: string;
  /** Approximate vocabulary size at this level */
  vocabSize: number;
  /** XP multiplier */
  xpMultiplier: number;
}

export const CEFR_LEVELS: Record<CefrLevel, CefrLevelConfig> = {
  A1: {
    level: "A1",
    label: "Beginner",
    description: "Basic phrases, greetings, simple present tense",
    colour: "#10B981",
    bgClass: "bg-emerald-500",
    textClass: "text-emerald-500",
    vocabSize: 500,
    xpMultiplier: 1,
  },
  A2: {
    level: "A2",
    label: "Elementary",
    description: "Everyday situations, past tense, descriptions",
    colour: "#3B82F6",
    bgClass: "bg-blue-500",
    textClass: "text-blue-500",
    vocabSize: 1000,
    xpMultiplier: 1.5,
  },
  B1: {
    level: "B1",
    label: "Intermediate",
    description: "Opinions, subjunctive basics, idioms",
    colour: "#F59E0B",
    bgClass: "bg-amber-500",
    textClass: "text-amber-500",
    vocabSize: 2000,
    xpMultiplier: 2,
  },
  B2: {
    level: "B2",
    label: "Upper Intermediate",
    description: "Complex grammar, nuance, formal register",
    colour: "#8B5CF6",
    bgClass: "bg-violet-500",
    textClass: "text-violet-500",
    vocabSize: 4000,
    xpMultiplier: 3,
  },
  C1: {
    level: "C1",
    label: "Advanced",
    description: "Fluent expression, complex texts, professional contexts",
    colour: "#EC4899",
    bgClass: "bg-pink-500",
    textClass: "text-pink-500",
    vocabSize: 8000,
    xpMultiplier: 4,
  },
  C2: {
    level: "C2",
    label: "Mastery",
    description: "Near-native fluency, literary nuance, all registers",
    colour: "#DC2626",
    bgClass: "bg-red-600",
    textClass: "text-red-600",
    vocabSize: 16000,
    xpMultiplier: 5,
  },
};

export const CEFR_ORDER: CefrLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

/** Get the next CEFR level, or null if at max */
export function getNextLevel(current: CefrLevel): CefrLevel | null {
  const idx = CEFR_ORDER.indexOf(current);
  return idx < CEFR_ORDER.length - 1 ? CEFR_ORDER[idx + 1] : null;
}

/** Get the previous CEFR level, or null if at min */
export function getPrevLevel(current: CefrLevel): CefrLevel | null {
  const idx = CEFR_ORDER.indexOf(current);
  return idx > 0 ? CEFR_ORDER[idx - 1] : null;
}

/**
 * Determine recommended level based on accuracy.
 * - ≥80% correct at current level → suggest next level
 * - <60% correct → suggest previous level
 * - Otherwise → stay at current
 */
/**
 * @param accuracy - Value between 0 and 1 (0% to 100%). Values > 1 are clamped.
 */
export function getRecommendedLevel(
  currentLevel: CefrLevel,
  accuracy: number
): { level: CefrLevel; reason: "up" | "down" | "stay" } {
  // Normalise: if someone passes 0-100 instead of 0-1, clamp to 0-1
  const normAccuracy = accuracy > 1 ? Math.min(accuracy / 100, 1) : Math.max(0, accuracy);
  if (normAccuracy >= 0.8) {
    const next = getNextLevel(currentLevel);
    if (next) return { level: next, reason: "up" };
  }
  if (normAccuracy < 0.6) {
    const prev = getPrevLevel(currentLevel);
    if (prev) return { level: prev, reason: "down" };
  }
  return { level: currentLevel, reason: "stay" };
}

/**
 * Calculate XP for a game session.
 */
export function calculateXp(
  cefrLevel: CefrLevel,
  correctAnswers: number,
  totalQuestions: number,
  baseXpPerQuestion: number = 10
): number {
  const config = CEFR_LEVELS[cefrLevel];
  const accuracy = totalQuestions > 0 ? correctAnswers / totalQuestions : 0;
  const accuracyBonus = accuracy >= 0.9 ? 1.25 : accuracy >= 0.7 ? 1.0 : 0.75;
  return Math.round(
    correctAnswers * baseXpPerQuestion * config.xpMultiplier * accuracyBonus
  );
}
