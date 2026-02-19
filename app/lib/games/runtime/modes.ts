import type { DifficultyTier, GameMode } from "./types";

interface ModeAdaptiveConfig {
  maxSpeedupPct: number;
  maxSlowdownPct: number;
  missRecoveryPct: number;
}

interface ModePhaseConfig {
  onboardingEnd: number;
  flowEnd: number;
  onboardingSpeedMs: number;
  flowSpeedMs: number;
  pressureSpeedMs: number;
}

export interface RuntimeModeConfig {
  mode: GameMode;
  label: string;
  sessionMs: number;
  startSpeedMs: number;
  endSpeedMs: number;
  lives: number;
  ranked: boolean;
  falseFriendMultiplier: number;
  scoreMultiplier: number;
  phases: ModePhaseConfig;
  adaptive: ModeAdaptiveConfig;
}

const MODE_CONFIGS: Record<GameMode, RuntimeModeConfig> = {
  daily: {
    mode: "daily",
    label: "Daily",
    sessionMs: 90_000,
    startSpeedMs: 3_700,
    endSpeedMs: 2_150,
    lives: 3,
    ranked: false,
    falseFriendMultiplier: 1,
    scoreMultiplier: 1,
    phases: {
      onboardingEnd: 0.26,
      flowEnd: 0.72,
      onboardingSpeedMs: 3_700,
      flowSpeedMs: 3_000,
      pressureSpeedMs: 2_220,
    },
    adaptive: {
      maxSpeedupPct: 0.07,
      maxSlowdownPct: 0.2,
      missRecoveryPct: 0.07,
    },
  },
  practice: {
    mode: "practice",
    label: "Practice",
    sessionMs: 120_000,
    startSpeedMs: 3_950,
    endSpeedMs: 2_350,
    lives: 5,
    ranked: false,
    falseFriendMultiplier: 1.15,
    scoreMultiplier: 0.95,
    phases: {
      onboardingEnd: 0.28,
      flowEnd: 0.76,
      onboardingSpeedMs: 3_950,
      flowSpeedMs: 3_200,
      pressureSpeedMs: 2_420,
    },
    adaptive: {
      maxSpeedupPct: 0.06,
      maxSlowdownPct: 0.22,
      missRecoveryPct: 0.08,
    },
  },
  challenge: {
    mode: "challenge",
    label: "Challenge",
    sessionMs: 80_000,
    startSpeedMs: 3_350,
    endSpeedMs: 1_900,
    lives: 3,
    ranked: false,
    falseFriendMultiplier: 1.05,
    scoreMultiplier: 1.25,
    phases: {
      onboardingEnd: 0.22,
      flowEnd: 0.68,
      onboardingSpeedMs: 3_350,
      flowSpeedMs: 2_620,
      pressureSpeedMs: 1_980,
    },
    adaptive: {
      maxSpeedupPct: 0.09,
      maxSlowdownPct: 0.18,
      missRecoveryPct: 0.06,
    },
  },
  ranked: {
    mode: "ranked",
    label: "Ranked",
    sessionMs: 75_000,
    startSpeedMs: 3_200,
    endSpeedMs: 1_780,
    lives: 3,
    ranked: true,
    falseFriendMultiplier: 1.1,
    scoreMultiplier: 1.35,
    phases: {
      onboardingEnd: 0.24,
      flowEnd: 0.68,
      onboardingSpeedMs: 3_200,
      flowSpeedMs: 2_480,
      pressureSpeedMs: 1_840,
    },
    adaptive: {
      maxSpeedupPct: 0.09,
      maxSlowdownPct: 0.17,
      missRecoveryPct: 0.06,
    },
  },
};

export function getModeConfig(mode: GameMode): RuntimeModeConfig {
  return MODE_CONFIGS[mode];
}

export function listModes(): RuntimeModeConfig[] {
  return [
    MODE_CONFIGS.daily,
    MODE_CONFIGS.practice,
    MODE_CONFIGS.challenge,
    MODE_CONFIGS.ranked,
  ];
}

export function parseGameMode(input: string | null | undefined): GameMode {
  if (input === "practice" || input === "challenge" || input === "ranked" || input === "daily") {
    return input;
  }
  return "daily";
}

export function computeAdaptiveSpeedMs(args: {
  modeConfig: RuntimeModeConfig;
  elapsedMs: number;
  accuracy: number;
  combo: number;
}): number {
  const { modeConfig, elapsedMs, accuracy, combo } = args;
  const progress = clamp(elapsedMs / modeConfig.sessionMs, 0, 1);
  const base = computePhaseBaseSpeed(modeConfig, progress);

  const accuracyBias = accuracy < 0.7 ? (0.7 - accuracy) * 0.35 : (0.8 - accuracy) * 0.12;
  const comboBias = combo >= 7 ? -0.05 : combo >= 4 ? -0.03 : combo <= 1 ? 0.02 : 0;
  const missRecoveryBias = accuracy < 0.55 ? modeConfig.adaptive.missRecoveryPct : 0;

  const bias = clamp(
    accuracyBias + comboBias + missRecoveryBias,
    -modeConfig.adaptive.maxSpeedupPct,
    modeConfig.adaptive.maxSlowdownPct,
  );

  const adapted = Math.round(base * (1 + bias));
  const floor = Math.round(modeConfig.phases.pressureSpeedMs * 0.92);
  const ceiling = Math.round(modeConfig.phases.onboardingSpeedMs * 1.14);
  return clamp(adapted, floor, ceiling);
}

function computePhaseBaseSpeed(modeConfig: RuntimeModeConfig, progress: number): number {
  const { phases } = modeConfig;

  if (progress <= phases.onboardingEnd) {
    return lerp(
      phases.onboardingSpeedMs,
      phases.flowSpeedMs,
      progress / phases.onboardingEnd,
    );
  }

  if (progress <= phases.flowEnd) {
    return lerp(
      phases.flowSpeedMs,
      phases.pressureSpeedMs,
      (progress - phases.onboardingEnd) / (phases.flowEnd - phases.onboardingEnd),
    );
  }

  const pressureProgress = (progress - phases.flowEnd) / Math.max(0.001, 1 - phases.flowEnd);
  const pressureRamp = lerp(phases.pressureSpeedMs, modeConfig.endSpeedMs, pressureProgress);
  return Math.max(modeConfig.endSpeedMs, pressureRamp);
}

export function deriveDifficultyTier(args: {
  elapsedMs: number;
  sessionMs: number;
  accuracy: number;
  combo: number;
}): DifficultyTier {
  const { elapsedMs, sessionMs, accuracy, combo } = args;
  const progress = clamp(elapsedMs / sessionMs, 0, 1);

  if (progress < 0.22) return "onboarding";
  if (progress < 0.58) return "foundation";
  if (accuracy >= 0.84 && combo >= 5) return "mastery";
  return "pressure";
}

function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * clamp(t, 0, 1);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
