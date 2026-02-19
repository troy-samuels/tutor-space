import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getModeConfig } from "@/lib/games/runtime/modes";
import { computeWaveScore, computeWaveScoreCeiling } from "@/lib/games/runtime/neon/scoring";

describe("neon scoring invariants", () => {
  it("rewards sustained combo without runaway inflation", () => {
    const mode = getModeConfig("ranked");

    const combo1 = computeWaveScore({ combo: 1, kind: "core", modeConfig: mode });
    const combo4 = computeWaveScore({ combo: 4, kind: "core", modeConfig: mode });
    const combo10 = computeWaveScore({ combo: 10, kind: "core", modeConfig: mode });

    assert.ok(combo4 > combo1);
    assert.ok(combo10 > combo4);
    assert.ok(combo10 - combo4 < combo4 - combo1 + 8);
  });

  it("keeps boss and false-friend rewards under max wave ceiling", () => {
    const mode = getModeConfig("challenge");
    const ceiling = computeWaveScoreCeiling(mode);
    const boss = computeWaveScore({ combo: 6, kind: "boss", modeConfig: mode });
    const ff = computeWaveScore({ combo: 6, kind: "false-friend", modeConfig: mode });

    assert.ok(boss <= ceiling);
    assert.ok(ff <= ceiling);
    assert.ok(Math.max(boss, ff) <= ceiling);
  });
});
