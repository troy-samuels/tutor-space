/**
 * Deterministic daily seed generator.
 * Same seed → same puzzle for everyone on a given day.
 */

// Simple hash function for string → number
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Get today's date string in YYYY-MM-DD format (UTC).
 */
export function getTodayUTC(): string {
  const now = new Date();
  return now.toISOString().split("T")[0];
}

/**
 * Generate a deterministic seed for a given game + language + date.
 * Same inputs always produce the same seed.
 */
export function getDailySeed(
  gameSlug: string,
  language: string,
  date: string = getTodayUTC()
): number {
  return hashString(`${gameSlug}:${language}:${date}`);
}

/**
 * Get the puzzle number (days since launch).
 */
export function getPuzzleNumber(
  launchDate: string = "2026-02-16"
): number {
  const launch = new Date(launchDate);
  const today = new Date(getTodayUTC());
  const diffMs = today.getTime() - launch.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
}

/**
 * Seeded random number generator (Mulberry32).
 * Returns a function that produces deterministic random numbers 0-1.
 */
export function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Shuffle an array using a seeded RNG.
 */
export function seededShuffle<T>(array: T[], seed: number): T[] {
  const rng = seededRandom(seed);
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
