export type SkillTrack =
  | "recognition"
  | "recall"
  | "false-friends"
  | "context"
  | "speed";

export interface SkillTrackDelta {
  track: SkillTrack;
  delta: number;
}

export interface SkillSnapshot {
  recognition: number;
  recall: number;
  "false-friends": number;
  context: number;
  speed: number;
}

export const DEFAULT_SKILLS: SkillSnapshot = {
  recognition: 50,
  recall: 50,
  "false-friends": 50,
  context: 50,
  speed: 50,
};
