import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  computeAdaptiveSpeedMs,
  deriveDifficultyTier,
  getModeConfig,
  parseGameMode,
} from "@/lib/games/runtime/modes";

describe("games runtime mode utilities", () => {
  it("parses known modes and falls back to daily", () => {
    assert.equal(parseGameMode("daily"), "daily");
    assert.equal(parseGameMode("practice"), "practice");
    assert.equal(parseGameMode("challenge"), "challenge");
    assert.equal(parseGameMode("ranked"), "ranked");
    assert.equal(parseGameMode("unknown"), "daily");
    assert.equal(parseGameMode(null), "daily");
  });

  it("uses a monotonic phase curve from onboarding to pressure", () => {
    const config = getModeConfig("daily");

    const checkpoints = [0, 0.3, 0.6, 0.9].map((progress) => computeAdaptiveSpeedMs({
      modeConfig: config,
      elapsedMs: Math.round(config.sessionMs * progress),
      accuracy: 0.78,
      combo: 2,
    }));

    assert.ok(checkpoints[0] > checkpoints[1]);
    assert.ok(checkpoints[1] > checkpoints[2]);
    assert.ok(checkpoints[2] >= checkpoints[3]);
  });

  it("applies recovery slowdown after weak accuracy and speedup on high combo", () => {
    const config = getModeConfig("ranked");
    const elapsedMs = Math.round(config.sessionMs * 0.5);

    const neutral = computeAdaptiveSpeedMs({
      modeConfig: config,
      elapsedMs,
      accuracy: 0.78,
      combo: 2,
    });

    const recovery = computeAdaptiveSpeedMs({
      modeConfig: config,
      elapsedMs,
      accuracy: 0.5,
      combo: 0,
    });

    const momentum = computeAdaptiveSpeedMs({
      modeConfig: config,
      elapsedMs,
      accuracy: 0.9,
      combo: 8,
    });

    assert.ok(recovery > neutral);
    assert.ok(momentum < neutral);
  });

  it("derives onboarding then pressure/mastery tiers by progress and quality", () => {
    assert.equal(deriveDifficultyTier({ elapsedMs: 5_000, sessionMs: 100_000, accuracy: 1, combo: 0 }), "onboarding");
    assert.equal(deriveDifficultyTier({ elapsedMs: 65_000, sessionMs: 100_000, accuracy: 0.7, combo: 2 }), "pressure");
    assert.equal(deriveDifficultyTier({ elapsedMs: 80_000, sessionMs: 100_000, accuracy: 0.9, combo: 5 }), "mastery");
  });
});
