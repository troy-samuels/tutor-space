import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildNeonLayout } from "@/lib/games/runtime/neon/layout";

describe("neon runtime layout", () => {
  it("keeps spawn band safely above playfield", () => {
    const layout = buildNeonLayout({ width: 360, height: 520, laneCount: 3 });
    assert.ok(layout.spawnBandBottom <= layout.playfieldTop - 12);
  });

  it("keeps drop path inside valid bands", () => {
    const layout = buildNeonLayout({ width: 360, height: 520, laneCount: 3 });
    assert.ok(layout.dropStartY >= layout.spawnBandTop);
    assert.ok(layout.dropStartY <= layout.spawnBandBottom);
    assert.ok(layout.dropEndY < layout.optionBaselineY - 12);
    assert.ok(layout.dropEndY > layout.dropStartY + 40);
  });

  it("supports narrower mobile widths without overlap", () => {
    const layout = buildNeonLayout({ width: 320, height: 520, laneCount: 3 });
    assert.ok(layout.spawnBandBottom <= layout.playfieldTop - 12);
    assert.equal(layout.lanes.length, 3);
  });
});
