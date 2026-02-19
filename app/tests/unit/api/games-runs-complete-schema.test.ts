import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { completeGameRunSchema } from "@/lib/games/runtime/validation";

function basePayload() {
  return {
    runId: "run_123",
    score: 90,
    maxScore: 140,
    accuracy: 71,
    timeMs: 58_000,
    mistakes: 3,
    maxCombo: 5,
    falseFriendHits: 2,
    firstCorrectMs: 2_400,
    replayed: false,
    tierReached: "pressure" as const,
    metadata: { puzzleNumber: 2, language: "en", mode: "ranked" },
  };
}

describe("complete game run schema", () => {
  it("accepts payloads without new telemetry fields", () => {
    const parsed = completeGameRunSchema.safeParse(basePayload());
    assert.equal(parsed.success, true);
  });

  it("accepts payloads with firstMeaningfulActionMs + versions", () => {
    const parsed = completeGameRunSchema.safeParse({
      ...basePayload(),
      firstMeaningfulActionMs: 1_250,
      curveVersion: "neon-v2-phase-2026-02-19",
      uiVersion: "neon-ui-pm-2026-02-19",
    });
    assert.equal(parsed.success, true);
  });

  it("accepts v3 telemetry fields while keeping old payload compatibility", () => {
    const parsed = completeGameRunSchema.safeParse({
      ...basePayload(),
      gameVersion: "v3",
      startingCefr: "A2",
      calibratedDifficulty: 44,
      difficultyDelta: 3,
      skillTrackDeltas: [
        { track: "recognition", delta: 2 },
        { track: "speed", delta: 1 },
      ],
      cognitiveLoadState: "balanced",
      ahaSpike: true,
      shareCardVersion: "v3-share-1",
      challengeCode: "ABCD1234",
    });
    assert.equal(parsed.success, true);
  });

  it("rejects invalid version strings", () => {
    const parsed = completeGameRunSchema.safeParse({
      ...basePayload(),
      curveVersion: "",
    });
    assert.equal(parsed.success, false);
  });

  it("rejects invalid challenge codes", () => {
    const parsed = completeGameRunSchema.safeParse({
      ...basePayload(),
      challengeCode: "x",
    });
    assert.equal(parsed.success, false);
  });
});
