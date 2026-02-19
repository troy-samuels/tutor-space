import { getV3RunSeed, makeRng, pick } from "./shared";
import { pickSmartQuestions } from "../progress/smart-picker";
import { getPool, type PoolRow, type GameLanguage, type SourceLanguage } from "./pools/index";

export type { PoolRow, GameLanguage, SourceLanguage };

export interface ByteChoiceQuestion {
  prompt: string;
  options: [string, string, string];
  correctIndex: 0 | 1 | 2;
  track: "recognition" | "false-friends";
  band: "A1" | "A2" | "B1" | "B2";
}

export interface ByteChoicePuzzle {
  gameSlug: "byte-choice";
  language: string;
  puzzleNumber: number;
  seed: number;
  questions: ByteChoiceQuestion[];
}

const QUESTIONS_PER_ROUND = 10;

export function getByteChoicePuzzle(
  language: GameLanguage,
  seedOverride?: number | null,
  cefr?: "A1" | "A2" | "B1" | "B2" | null,
  sourceLanguage?: SourceLanguage,
): ByteChoicePuzzle {
  const { seed, puzzleNumber } = getV3RunSeed("byte-choice", language, seedOverride);
  const rng = makeRng(seed);

  const pool = getPool(language, sourceLanguage);

  // Client-side: use smart picker with spaced repetition
  // Server-side (SSR): fall back to random selection (no localStorage)
  const useSmartPicker = typeof window !== "undefined";

  let selectedRows: PoolRow[];

  if (useSmartPicker) {
    selectedRows = pickSmartQuestions(pool, {
      languagePair: language,
      cefrBand: cefr,
      count: QUESTIONS_PER_ROUND,
      rng,
    });
  } else {
    // SSR fallback: random selection with CEFR band weighting
    selectedRows = pickRandomFallback(pool, cefr, QUESTIONS_PER_ROUND, rng);
  }

  // Convert selected rows to questions
  const questions: ByteChoiceQuestion[] = selectedRows.map((row) => {
    const optionBag = [row.correct, ...row.distractors] as const;
    const shuffled = [...optionBag].sort(() => rng() - 0.5) as [string, string, string];
    const correctIndex = shuffled.findIndex((value) => value === row.correct) as 0 | 1 | 2;

    return {
      prompt: row.prompt,
      options: shuffled,
      correctIndex,
      track: row.distractors.some((d) => d.startsWith(row.correct.slice(0, 2)))
        ? "false-friends"
        : "recognition",
      band: row.band,
    };
  });

  return {
    gameSlug: "byte-choice",
    language,
    puzzleNumber,
    seed,
    questions,
  };
}

// ── SSR fallback: random selection with CEFR band weighting ──

function pickRandomFallback(
  pool: PoolRow[],
  cefr: "A1" | "A2" | "B1" | "B2" | null | undefined,
  count: number,
  rng: () => number,
): PoolRow[] {
  const BANDS: Array<"A1" | "A2" | "B1" | "B2"> = ["A1", "A2", "B1", "B2"];

  function buildWeightedPool(): PoolRow[] {
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

  const weightedPool = buildWeightedPool();
  const usedPrompts = new Set<string>();
  const rows: PoolRow[] = [];

  for (let i = 0; i < count; i++) {
    let row: PoolRow;
    let attempts = 0;
    do {
      row = pick(weightedPool, rng);
      attempts++;
    } while (usedPrompts.has(row.prompt) && attempts < 60);
    usedPrompts.add(row.prompt);
    rows.push(row);
  }

  return rows;
}
