// ──────────────────────────────────────────────
// Smart question picker with spaced-repetition weighting
// Replaces pure-random selection with adaptive scheduling
// ──────────────────────────────────────────────

import type { PoolRow } from "../data/byte-choice";
import { getProgressStore, type WordProgress } from "./word-tracker";

export interface PickerConfig {
  /** Language pair key, e.g. "en" or "es" */
  languagePair: string;
  /** Target CEFR band (filters available pool) */
  cefrBand?: "A1" | "A2" | "B1" | "B2" | null;
  /** Number of questions to pick */
  count: number;
  /** RNG function for deterministic seeds */
  rng: () => number;
}

// ── CEFR band filtering ──

const BANDS: Array<"A1" | "A2" | "B1" | "B2"> = ["A1", "A2", "B1", "B2"];

/**
 * Build a weighted pool filtered by CEFR band.
 * 60% target band, 25% one below, 15% one above.
 * Edge bands (A1, B2) get adjusted distributions.
 */
function filterByBand(
  pool: PoolRow[],
  cefr: "A1" | "A2" | "B1" | "B2" | null | undefined,
): PoolRow[] {
  if (!cefr) return [...pool];

  const bandIndex = BANDS.indexOf(cefr);
  const byBand: Record<string, PoolRow[]> = { A1: [], A2: [], B1: [], B2: [] };
  for (const row of pool) {
    byBand[row.band].push(row);
  }

  let weights: Record<string, number>;
  if (bandIndex === 0) {
    weights = { A1: 75, A2: 25, B1: 0, B2: 0 };
  } else if (bandIndex === BANDS.length - 1) {
    weights = { A1: 0, A2: 0, B1: 25, B2: 75 };
  } else {
    weights = { A1: 0, A2: 0, B1: 0, B2: 0 };
    weights[cefr] = 60;
    weights[BANDS[bandIndex - 1]] = 25;
    weights[BANDS[bandIndex + 1]] = 15;
  }

  // Build weighted pool by repeating rows proportionally
  const weighted: PoolRow[] = [];
  for (const band of BANDS) {
    const w = weights[band];
    if (w > 0 && byBand[band].length > 0) {
      for (const row of byBand[band]) {
        for (let j = 0; j < w; j++) {
          weighted.push(row);
        }
      }
    }
  }

  return weighted.length > 0 ? weighted : [...pool];
}

// ── Progress-based scoring ──

const MS_24H = 24 * 60 * 60 * 1000;

function scoreWord(wp: WordProgress | null): number {
  if (!wp || wp.seen === 0) return 1.0; // Never seen

  // Got wrong recently (within 24h)
  if (wp.lastWrong !== null) {
    const age = Date.now() - wp.lastWrong;
    if (age < MS_24H) return 3.0;
    // Got wrong older
    if (wp.mastery < 4) return 2.0;
  }

  switch (wp.mastery) {
    case 2:
      return 1.5; // Learning
    case 3:
      return 0.5; // Familiar
    case 4:
      return 0.2; // Mastered
    default:
      return 1.0; // Seen (mastery 1) or new
  }
}

// ── Weighted random pick (mutates `candidates` by removing picked item) ──

function weightedPick(
  candidates: PoolRow[],
  weights: number[],
  rng: () => number,
): { row: PoolRow; index: number } | null {
  if (candidates.length === 0) return null;

  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  if (totalWeight <= 0) {
    // Fallback: uniform pick
    const idx = Math.floor(rng() * candidates.length);
    return { row: candidates[idx], index: idx };
  }

  let r = rng() * totalWeight;
  for (let i = 0; i < candidates.length; i++) {
    r -= weights[i];
    if (r <= 0) return { row: candidates[i], index: i };
  }

  // Floating point safety
  return { row: candidates[candidates.length - 1], index: candidates.length - 1 };
}

// ── Deduplicate pool (keep first occurrence of each prompt) ──

function deduplicatePool(pool: PoolRow[]): PoolRow[] {
  const seen = new Set<string>();
  const result: PoolRow[] = [];
  for (const row of pool) {
    if (!seen.has(row.prompt)) {
      seen.add(row.prompt);
      result.push(row);
    }
  }
  return result;
}

// ── Main picker ──

/** Pick questions using spaced repetition weighting */
export function pickSmartQuestions(pool: PoolRow[], config: PickerConfig): PoolRow[] {
  const { languagePair, cefrBand, count, rng } = config;

  // Step 1: Filter by CEFR band (weighted)
  const bandFiltered = filterByBand(pool, cefrBand);

  // Step 2: Deduplicate — the band weighting creates duplicates
  const unique = deduplicatePool(bandFiltered);

  // Step 3: Load progress
  const store = getProgressStore();

  // Step 4: Categorise words
  const wrongBefore: PoolRow[] = [];
  const unseen: PoolRow[] = [];
  const rest: PoolRow[] = [];

  for (const row of unique) {
    const key = `${languagePair}:${row.prompt}`;
    const wp = store.words[key] ?? null;

    if (!wp || wp.seen === 0) {
      unseen.push(row);
    } else if (wp.wrong > 0 && wp.mastery < 4) {
      wrongBefore.push(row);
    } else {
      rest.push(row);
    }
  }

  // Step 5: Guarantee composition
  const minWrong = Math.min(Math.ceil(count * 0.3), wrongBefore.length);
  const minNew = Math.min(Math.ceil(count * 0.2), unseen.length);

  const picked: PoolRow[] = [];
  const usedPrompts = new Set<string>();

  // Helper: pick N items from a bucket using weighted random
  function pickFromBucket(bucket: PoolRow[], n: number): void {
    // Build weights for this bucket
    const candidates = bucket.filter((r) => !usedPrompts.has(r.prompt));
    const weights = candidates.map((r) => {
      const key = `${languagePair}:${r.prompt}`;
      return scoreWord(store.words[key] ?? null);
    });

    for (let i = 0; i < n && candidates.length > 0; i++) {
      const result = weightedPick(candidates, weights, rng);
      if (!result) break;
      picked.push(result.row);
      usedPrompts.add(result.row.prompt);
      candidates.splice(result.index, 1);
      weights.splice(result.index, 1);
    }
  }

  // Fill guaranteed slots
  pickFromBucket(wrongBefore, minWrong);
  pickFromBucket(unseen, minNew);

  // Step 6: Fill remaining from full unique pool (weighted)
  const remaining = count - picked.length;
  if (remaining > 0) {
    const allRemaining = unique.filter((r) => !usedPrompts.has(r.prompt));
    const weights = allRemaining.map((r) => {
      const key = `${languagePair}:${r.prompt}`;
      return scoreWord(store.words[key] ?? null);
    });

    for (let i = 0; i < remaining && allRemaining.length > 0; i++) {
      const result = weightedPick(allRemaining, weights, rng);
      if (!result) break;
      picked.push(result.row);
      usedPrompts.add(result.row.prompt);
      allRemaining.splice(result.index, 1);
      weights.splice(result.index, 1);
    }
  }

  // Shuffle final list so guaranteed slots aren't always first
  for (let i = picked.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [picked[i], picked[j]] = [picked[j], picked[i]];
  }

  return picked;
}
