import type { CefrLevel } from "@/lib/games/cefr";

export type NeonInterceptPromptKind = "core" | "false-friend" | "boss";

export interface NeonInterceptPromptDefinition {
  id: string;
  clue: string;
  correct: string;
  distractors: [string, string];
  cefrLevel: CefrLevel;
  kind?: "core" | "false-friend";
  falseFriendWord?: string;
  explanation?: string;
}

export interface NeonInterceptWave {
  id: string;
  clue: string;
  options: [string, string, string];
  correctIndex: 0 | 1 | 2;
  cefrLevel: CefrLevel;
  kind: NeonInterceptPromptKind;
  falseFriendWord?: string;
  explanation?: string;
}

export interface NeonInterceptPuzzle {
  number: number;
  language: string;
  date: string;
  waves: NeonInterceptWave[];
}

