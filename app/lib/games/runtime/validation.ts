import { z } from "zod";

const CEFR_SCHEMA = z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]);

export const completeGameRunSchema = z.object({
  runId: z.string().trim().min(1),
  score: z.number().int().min(0),
  maxScore: z.number().int().min(0),
  accuracy: z.number().min(0).max(100),
  timeMs: z.number().int().min(0),
  mistakes: z.number().int().min(0),
  maxCombo: z.number().int().min(0),
  falseFriendHits: z.number().int().min(0),
  firstCorrectMs: z.number().int().min(0).nullable(),
  startingCefr: CEFR_SCHEMA.nullable().optional(),
  firstMeaningfulActionMs: z.number().int().min(0).nullable().optional(),
  curveVersion: z.string().trim().min(1).max(64).optional(),
  uiVersion: z.string().trim().min(1).max(64).optional(),
  gameVersion: z.literal("v3").optional(),
  calibratedDifficulty: z.number().int().min(0).max(100).optional(),
  difficultyDelta: z.number().int().min(-100).max(100).optional(),
  skillTrackDeltas: z.array(z.object({
    track: z.string().trim().min(1).max(48),
    delta: z.number().int().min(-20).max(20),
  })).max(10).optional(),
  cognitiveLoadState: z.enum(["focused", "balanced", "boosted"]).optional(),
  ahaSpike: z.boolean().optional(),
  shareCardVersion: z.string().trim().min(1).max(64).optional(),
  challengeCode: z.string().trim().min(4).max(32).optional(),
  replayed: z.boolean(),
  tierReached: z.enum(["onboarding", "foundation", "pressure", "mastery"]),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type CompleteGameRunInput = z.infer<typeof completeGameRunSchema>;
