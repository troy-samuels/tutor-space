import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  deleteSemanticCacheValue,
  getSemanticCacheHealth,
  getSemanticCacheValue,
  pingSemanticCache,
  setSemanticCacheValue,
} from "../../../lib/ai/semantic-cache.ts";

describe("semantic cache", () => {
  it("fails open and returns a valid health payload", async () => {
    const key = `semantic-cache-test:${Date.now()}`;

    const setResult = await setSemanticCacheValue(key, { value: "ok" }, { ttlSeconds: 30 });
    assert.equal(typeof setResult, "boolean");

    const value = await getSemanticCacheValue<{ value: string }>(key);
    if (value !== null) {
      assert.equal(value.value, "ok");
    }

    const deleteResult = await deleteSemanticCacheValue(key);
    assert.equal(typeof deleteResult, "boolean");

    const pingResult = await pingSemanticCache();
    assert.equal(typeof pingResult, "boolean");

    const health = await getSemanticCacheHealth();
    assert.equal(typeof health.configured, "boolean");
    assert.ok(["connected", "disconnected", "unconfigured"].includes(health.status));
  });
});
