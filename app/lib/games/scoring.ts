/**
 * Universal game scoring system.
 */

export type CEFRLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export interface GameScore {
  gameSlug: string;
  language: string;
  mode: "daily" | "practice" | "challenge";
  puzzleNumber: number;
  score: number;
  maxScore: number;
  accuracy: number; // 0-100
  timeMs: number;
  mistakes: number;
  maxMistakes: number;
  streak: number;
  shareText: string;
  shareGrid?: string; // emoji grid for text sharing
  challengeId?: string;
  timestamp: number;
}

export interface Mistake {
  item: string;
  expected: string;
  actual: string;
  explanation?: string;
  cefrLevel?: CEFRLevel;
  topic?: string;
}

// CEFR-weighted scoring multipliers
export const CEFR_MULTIPLIERS: Record<CEFRLevel, number> = {
  A1: 1.0,
  A2: 1.2,
  B1: 1.5,
  B2: 2.0,
  C1: 2.5,
  C2: 3.0,
};

/**
 * Calculate time bonus. Faster = more points.
 */
export function timeBonus(timeMs: number, maxTimeMs: number): number {
  const ratio = 1 - Math.min(timeMs / maxTimeMs, 1);
  return Math.round(ratio * 100);
}

/**
 * Calculate accuracy percentage.
 */
export function accuracyPercent(correct: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((correct / total) * 100);
}

/**
 * Generate a "Losing Concept" diagnosis from mistakes.
 * Groups mistakes by topic and returns the weakest area.
 */
export function diagnoseWeakness(mistakes: Mistake[]): {
  topic: string;
  count: number;
  examples: string[];
} | null {
  if (mistakes.length === 0) return null;

  const topicCounts: Record<string, { count: number; examples: string[] }> = {};

  for (const m of mistakes) {
    const topic = m.topic || "General";
    if (!topicCounts[topic]) {
      topicCounts[topic] = { count: 0, examples: [] };
    }
    topicCounts[topic].count++;
    topicCounts[topic].examples.push(m.item);
  }

  const weakest = Object.entries(topicCounts).sort(
    (a, b) => b[1].count - a[1].count
  )[0];

  return {
    topic: weakest[0],
    count: weakest[1].count,
    examples: weakest[1].examples.slice(0, 3),
  };
}
