import { getDailySeed, getPuzzleNumber, seededRandom } from "@/lib/games/daily-seed";

export interface V3RunSeed {
  seed: number;
  puzzleNumber: number;
}

export function getV3RunSeed(gameSlug: string, language: string, seedOverride?: number | null): V3RunSeed {
  const safeSeed = Number.isFinite(seedOverride) && Number(seedOverride) > 0
    ? Math.trunc(Number(seedOverride))
    : getDailySeed(gameSlug, language);

  return {
    seed: safeSeed,
    puzzleNumber: getPuzzleNumber("2026-02-19"),
  };
}

export function pick<T>(items: readonly T[], random: () => number): T {
  return items[Math.floor(random() * items.length)];
}

export function makeRng(seed: number): () => number {
  return seededRandom(seed);
}
