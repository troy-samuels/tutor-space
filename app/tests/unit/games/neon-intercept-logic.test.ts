import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getPuzzleForDate } from "@/lib/games/data/neon-intercept/index";

describe("neon-intercept puzzle generation", () => {
  it("is deterministic for same language and date", () => {
    const first = getPuzzleForDate("es", "2026-02-20");
    const second = getPuzzleForDate("es", "2026-02-20");

    assert.ok(first);
    assert.ok(second);
    assert.deepEqual(first?.waves, second?.waves);
  });

  it("changes when date changes", () => {
    const first = getPuzzleForDate("fr", "2026-02-20");
    const second = getPuzzleForDate("fr", "2026-02-21");

    assert.ok(first);
    assert.ok(second);
    assert.notDeepEqual(
      first?.waves.slice(0, 8).map((w) => w.id),
      second?.waves.slice(0, 8).map((w) => w.id),
    );
  });

  it("builds valid 3-option waves with safe correct indexes", () => {
    const puzzle = getPuzzleForDate("de", "2026-02-20");
    assert.ok(puzzle);

    for (const wave of puzzle!.waves) {
      assert.equal(wave.options.length, 3);
      assert.ok(wave.correctIndex >= 0 && wave.correctIndex <= 2);
      assert.equal(new Set(wave.options).size, 3);
      assert.ok(wave.options[wave.correctIndex]);
    }
  });

  it("injects false-friend content for non-English language runs", () => {
    const puzzle = getPuzzleForDate("es", "2026-02-20");
    assert.ok(puzzle);

    const falseFriendCount = puzzle!.waves.filter((w) => w.kind === "false-friend").length;
    assert.ok(falseFriendCount > 0);
  });

  it("adds regular boss waves", () => {
    const puzzle = getPuzzleForDate("en", "2026-02-20");
    assert.ok(puzzle);

    const bossCount = puzzle!.waves.filter((w) => w.kind === "boss").length;
    assert.ok(bossCount >= 5);
  });
});
