export type CognitiveLoadState = "focused" | "balanced" | "boosted";

export interface CognitiveGovernorInput {
  recentErrors: number;
  recentAvgResponseMs: number;
  streak: number;
}

export interface CognitiveGovernorOutput {
  state: CognitiveLoadState;
  decorOpacity: number;
  audioLowPass: number;
  paceMultiplier: number;
}

export function computeCognitiveGovernor(input: CognitiveGovernorInput): CognitiveGovernorOutput {
  if (input.recentErrors >= 2 || input.recentAvgResponseMs > 2600) {
    return {
      state: "focused",
      decorOpacity: 0.5,
      audioLowPass: 0.6,
      paceMultiplier: 0.92,
    };
  }

  if (input.streak >= 4 && input.recentAvgResponseMs < 1600) {
    return {
      state: "boosted",
      decorOpacity: 1,
      audioLowPass: 1,
      paceMultiplier: 1.05,
    };
  }

  return {
    state: "balanced",
    decorOpacity: 0.82,
    audioLowPass: 0.85,
    paceMultiplier: 1,
  };
}
