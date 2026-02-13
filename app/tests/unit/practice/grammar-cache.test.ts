import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getCacheMetrics,
  getOrGenerateGrammarExplanation,
  warmGrammarExplanation,
} from "../../../lib/practice/grammar-cache.ts";

function createUniqueLookup() {
  const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return {
    category: `test-category-${id}`,
    language: "en",
    level: "beginner",
  };
}

describe("grammar cache", () => {
  it("generates once on miss and serves from local cache afterwards", async () => {
    const lookup = createUniqueLookup();
    const before = getCacheMetrics();

    const first = await getOrGenerateGrammarExplanation(lookup, () => "Generated explanation");
    assert.equal(first.source, "generated");
    assert.equal(first.entry.explanation, "Generated explanation");

    const second = await getOrGenerateGrammarExplanation(lookup, () => "Should not be used");
    assert.equal(second.source, "local");
    assert.equal(second.entry.explanation, "Generated explanation");

    const after = getCacheMetrics();
    assert.equal(after.generationCount, before.generationCount + 1);
    assert.ok(after.missCount >= before.missCount + 1);
    assert.ok(after.hitCount >= before.hitCount + 1);
    assert.ok(after.localHit >= before.localHit + 1);
  });

  it("warms entries with deterministic default explanations", async () => {
    const lookup = {
      category: "verb-tense",
      language: "es",
      level: "intermediate",
    };

    const result = await warmGrammarExplanation(lookup);
    assert.ok(result.entry.explanation.length > 0);
    assert.equal(result.entry.language, "es");
    assert.equal(result.entry.level, "intermediate");
  });
});
