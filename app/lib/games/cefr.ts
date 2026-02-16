/**
 * CEFR Level System for TutorLingua Games
 *
 * Maps the Common European Framework of Reference for Languages
 * to game difficulty, content selection, and progression tracking.
 */

export type CefrLevel = "A1" | "A2" | "B1" | "B2";

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
};

export const CEFR_ORDER: CefrLevel[] = ["A1", "A2", "B1", "B2"];

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

/**
 * Grammar topics introduced at each CEFR level.
 * Higher levels implicitly include all lower-level topics (cumulative).
 * Use `getTopicsForLevel()` for the full cumulative set.
 */
export const GRAMMAR_SCOPE: Record<CefrLevel, string[]> = {
  A1: [
    "present-tense-regular",
    "articles-definite",
    "articles-indefinite",
    "gender-agreement",
    "basic-prepositions",
    "ser-estar-basic",
    "numbers",
    "basic-questions",
    "basic-negation",
    "basic-adjectives",
  ],
  A2: [
    "preterite-regular",
    "imperfect-regular",
    "preterite-vs-imperfect",
    "ir-a-future",
    "reflexive-verbs",
    "object-pronouns-direct",
    "object-pronouns-indirect",
    "comparatives-superlatives",
    "por-vs-para-basic",
    "false-friends",
  ],
  B1: [
    "subjunctive-present-basic",
    "subjunctive-triggers",
    "conditional-tense",
    "por-vs-para-advanced",
    "relative-clauses",
    "reported-speech",
    "passive-voice-basic",
    "common-idioms",
    "abstract-nouns",
    "discourse-markers",
  ],
  B2: [
    "subjunctive-advanced",
    "subjunctive-imperfect",
    "complex-conditionals",
    "passive-advanced",
    "formal-register",
    "advanced-idioms",
    "collocations",
    "subjunctive-relative-clauses",
    "nuanced-prepositions",
    "style-register-awareness",
  ],
};

/**
 * Get the cumulative set of grammar topics valid at a given level.
 * E.g. A2 includes all A1 + A2 topics; B2 includes everything.
 */
export function getTopicsForLevel(level: CefrLevel): Set<string> {
  const idx = CEFR_ORDER.indexOf(level);
  const topics = new Set<string>();
  for (let i = 0; i <= idx; i++) {
    for (const topic of GRAMMAR_SCOPE[CEFR_ORDER[i]]) {
      topics.add(topic);
    }
  }
  return topics;
}

/**
 * Vocabulary themes by CEFR level.
 */
export const VOCAB_THEMES: Record<CefrLevel, string[]> = {
  A1: [
    "greetings", "family", "food-basic", "colours", "numbers",
    "days-months", "weather-basic", "clothing-basic", "body-parts", "house-rooms",
  ],
  A2: [
    "travel", "shopping", "directions", "hobbies", "emotions",
    "restaurant", "transport", "health-basic", "work-basic", "daily-routines",
  ],
  B1: [
    "work-advanced", "health-detailed", "media", "opinions", "environment",
    "relationships", "culture", "technology", "education", "politics-basic",
  ],
  B2: [
    "academic", "economics", "law-basic", "philosophy", "arts",
    "science", "formal-correspondence", "debate", "abstract-concepts", "humour-irony",
  ],
};
