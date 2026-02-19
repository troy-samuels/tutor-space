export type GameMode = "daily" | "practice" | "challenge" | "ranked";

export type DeviceClass = "mobile" | "desktop" | "telegram";

export type DifficultyTier = "onboarding" | "foundation" | "pressure" | "mastery";

export type CefrLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export type CognitiveLoadState = "focused" | "balanced" | "boosted";

export interface GameRunStartPayload {
  gameSlug: string;
  mode: GameMode;
  language: "en" | "es" | "fr" | "de" | "it" | "pt";
  deviceClass: DeviceClass;
  gameVersion?: "v3";
  startingCefr?: CefrLevel | null;
  calibratedDifficulty?: number;
  challengeCode?: string;
  uiVersion?: string;
}

export interface GameRunStartResponse {
  success: boolean;
  persisted: boolean;
  runId: string;
  startedAt: string;
  localOnly?: boolean;
}

export interface GameRunCompletePayload {
  runId: string;
  score: number;
  maxScore: number;
  accuracy: number;
  timeMs: number;
  mistakes: number;
  maxCombo: number;
  falseFriendHits: number;
  firstCorrectMs: number | null;
  startingCefr?: CefrLevel | null;
  firstMeaningfulActionMs?: number | null;
  curveVersion?: string;
  uiVersion?: string;
  gameVersion?: "v3";
  calibratedDifficulty?: number;
  difficultyDelta?: number;
  skillTrackDeltas?: Array<{ track: string; delta: number }>;
  cognitiveLoadState?: CognitiveLoadState;
  ahaSpike?: boolean;
  shareCardVersion?: string;
  challengeCode?: string;
  replayed: boolean;
  tierReached: DifficultyTier;
  metadata?: Record<string, unknown>;
}

export interface GameRunCompleteResponse {
  success: boolean;
  persisted: boolean;
  localOnly?: boolean;
}

export interface GameWeaknessSummary {
  topic: string;
  count: number;
  examples: string[];
}

export interface NeonRuntimeHudState {
  timeLeftMs: number;
  score: number;
  lives: number;
  combo: number;
  maxCombo: number;
  hits: number;
  misses: number;
  waveIndex: number;
  clue: string;
  options: [string, string, string];
  correctIndex: 0 | 1 | 2;
  isBoss: boolean;
  isFalseFriend: boolean;
  tier: DifficultyTier;
  feedback: "idle" | "correct" | "wrong" | "timeout";
  speedMs: number;
}

export interface NeonRuntimeCompletePayload {
  score: number;
  maxScore: number;
  accuracy: number;
  mistakes: number;
  maxCombo: number;
  falseFriendHits: number;
  timeMs: number;
  isWon: boolean;
  replayed: boolean;
  tierReached: DifficultyTier;
  firstCorrectMs: number | null;
  firstMeaningfulActionMs: number | null;
  curveVersion: string;
  uiVersion: string;
}
