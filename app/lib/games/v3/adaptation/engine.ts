import type { SkillTrackDelta } from "./skill-tracks";

export type CefrLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export interface CalibrationSample {
  responseMs: number;
  isCorrect: boolean;
  usedHint: boolean;
}

export interface DifficultyUpdateInput {
  currentDifficulty: number;
  responseMs: number;
  isCorrect: boolean;
  streak: number;
}

export interface DifficultyUpdateOutput {
  nextDifficulty: number;
  delta: number;
  ahaSpike: boolean;
}

export const CEFR_TO_DIFFICULTY: Record<CefrLevel, number> = {
  A1: 20,
  A2: 35,
  B1: 50,
  B2: 65,
  C1: 80,
  C2: 90,
};

const MIN_DIFFICULTY = 10;
const MAX_DIFFICULTY = 96;
const ACTION_DELTA_CAP = 3;

export function getBaselineDifficulty(cefr: CefrLevel | null | undefined): number {
  if (!cefr) return CEFR_TO_DIFFICULTY.A2;
  return CEFR_TO_DIFFICULTY[cefr];
}

export function calibrateDifficulty(baseline: number, samples: CalibrationSample[]): number {
  if (samples.length === 0) return baseline;

  const correctness = samples.filter((sample) => sample.isCorrect).length / samples.length;
  const avgMs = samples.reduce((sum, sample) => sum + sample.responseMs, 0) / samples.length;
  const hintRate = samples.filter((sample) => sample.usedHint).length / samples.length;

  let delta = 0;
  if (correctness >= 0.84) delta += 3;
  if (correctness <= 0.54) delta -= 3;
  if (avgMs < 1500) delta += 2;
  if (avgMs > 2600) delta -= 2;
  if (hintRate >= 0.5) delta -= 2;

  return clampDifficulty(baseline + clamp(delta, -8, 8));
}

export function updateDifficulty(input: DifficultyUpdateInput): DifficultyUpdateOutput {
  let delta = 0;

  if (input.isCorrect) {
    if (input.responseMs < 1300) delta += 2;
    else if (input.responseMs < 1900) delta += 1;
    if (input.streak >= 4) delta += 1;
  } else {
    delta -= input.responseMs > 2400 ? 3 : 2;
  }

  const boundedDelta = clamp(delta, -ACTION_DELTA_CAP, ACTION_DELTA_CAP);
  const nextDifficulty = clampDifficulty(input.currentDifficulty + boundedDelta);
  const ahaSpike = input.isCorrect && input.responseMs < 1500 && input.currentDifficulty >= 65;

  return {
    nextDifficulty,
    delta: boundedDelta,
    ahaSpike,
  };
}

export function buildSkillTrackDeltas(input: {
  isCorrect: boolean;
  responseMs: number;
  track: SkillTrackDelta["track"];
}): SkillTrackDelta[] {
  const primaryDelta = input.isCorrect
    ? input.responseMs < 1500
      ? 2
      : 1
    : -1;

  return [{
    track: input.track,
    delta: primaryDelta,
  }];
}

function clampDifficulty(value: number): number {
  return clamp(value, MIN_DIFFICULTY, MAX_DIFFICULTY);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
