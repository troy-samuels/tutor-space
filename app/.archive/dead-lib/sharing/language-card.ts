/**
 * Language Card Generator for TutorLingua.
 *
 * Generates shareable language card data for social sharing.
 * The visual rendering is handled by the LanguageCard React component
 * and the OG image route for server-side generation.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type LanguageCardData = {
  /** Language name. */
  language: string;
  /** Language flag emoji. */
  flag: string;
  /** Score 0-100. */
  score: number;
  /** CEFR-ish level label. */
  level: string;
  /** Percentile ranking (e.g., 73 = "better than 73% of learners"). */
  percentile: number;
  /** Date of the practice session. */
  date: string;
  /** Optional: player name for personalisation. */
  playerName?: string;
  /** Personality copy line. */
  tagline: string;
  /** Session ID for deep linking. */
  sessionId: string;
};

// ---------------------------------------------------------------------------
// Tagline Generator
// ---------------------------------------------------------------------------

const SCORE_TAGLINES: { min: number; lines: string[] }[] = [
  {
    min: 90,
    lines: [
      "Native-level vibes. Tutors are impressed.",
      "You crushed it. Time to flex.",
      "Top of the class. Share this.",
    ],
  },
  {
    min: 80,
    lines: [
      "Seriously impressive. Keep climbing.",
      "You're in the top tier. Don't stop now.",
      "Strong performance. Your tutor will love this.",
    ],
  },
  {
    min: 70,
    lines: [
      "Solid skills. Room to grow, but you're on track.",
      "You're getting there. A few more sessions and you'll fly.",
      "Good foundations. Time to level up.",
    ],
  },
  {
    min: 60,
    lines: [
      "Decent start. Consistency is key.",
      "You know more than you think. Keep practising.",
      "The basics are clicking. Push for more.",
    ],
  },
  {
    min: 0,
    lines: [
      "Everyone starts somewhere. You just did.",
      "First step taken. That's what matters.",
      "The hardest part is starting. You've done it.",
    ],
  },
];

/**
 * Generate a personality-driven tagline based on score.
 */
export function generateTagline(score: number, language: string, level: string): string {
  const bucket = SCORE_TAGLINES.find((b) => score >= b.min) ?? SCORE_TAGLINES[SCORE_TAGLINES.length - 1];
  const line = bucket.lines[Math.floor(Math.random() * bucket.lines.length)];
  return line;
}

/**
 * Generate a percentile-style tagline.
 */
export function generatePercentileTagline(score: number, language: string, level: string): string {
  const percentile = calculatePercentile(score);
  return `You're a ${level} ${language} speaker — better than ${percentile}% of learners`;
}

// ---------------------------------------------------------------------------
// Percentile Estimation
// ---------------------------------------------------------------------------

/**
 * Estimate a percentile from a score.
 * Uses a simple sigmoid-ish curve — replace with real data when available.
 */
export function calculatePercentile(score: number): number {
  if (score >= 95) return 98;
  if (score >= 90) return 95;
  if (score >= 85) return 90;
  if (score >= 80) return 85;
  if (score >= 75) return 78;
  if (score >= 70) return 70;
  if (score >= 65) return 62;
  if (score >= 60) return 55;
  if (score >= 55) return 45;
  if (score >= 50) return 38;
  if (score >= 40) return 25;
  if (score >= 30) return 15;
  return 8;
}

// ---------------------------------------------------------------------------
// Card Data Builder
// ---------------------------------------------------------------------------

const LANGUAGE_FLAGS: Record<string, string> = {
  Spanish: "🇪🇸",
  French: "🇫🇷",
  German: "🇩🇪",
  Italian: "🇮🇹",
  Portuguese: "🇵🇹",
  Japanese: "🇯🇵",
  Korean: "🇰🇷",
  Chinese: "🇨🇳",
  Dutch: "🇳🇱",
  Russian: "🇷🇺",
  Arabic: "🇸🇦",
  Hindi: "🇮🇳",
  Turkish: "🇹🇷",
  Polish: "🇵🇱",
  Swedish: "🇸🇪",
};

/**
 * Build a complete LanguageCardData payload.
 */
export function buildLanguageCard(params: {
  language: string;
  score: number;
  level: string;
  sessionId: string;
  playerName?: string;
}): LanguageCardData {
  const flag = LANGUAGE_FLAGS[params.language] || "🌍";
  const percentile = calculatePercentile(params.score);
  const tagline = generatePercentileTagline(params.score, params.language, params.level);
  const date = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return {
    language: params.language,
    flag,
    score: params.score,
    level: params.level,
    percentile,
    date,
    playerName: params.playerName,
    tagline,
    sessionId: params.sessionId,
  };
}
