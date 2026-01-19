import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";

import { isPracticeOpenAIConfigured } from "../../../lib/practice/openai.ts";

const originalKey = process.env.OPENAI_API_KEY;

afterEach(() => {
  if (typeof originalKey === "undefined") {
    delete process.env.OPENAI_API_KEY;
  } else {
    process.env.OPENAI_API_KEY = originalKey;
  }
});

describe("AI Practice OpenAI config", () => {
  it("returns false when no API key is set", async () => {
    delete process.env.OPENAI_API_KEY;
    assert.equal(await isPracticeOpenAIConfigured(), false);
  });

  it("returns false when the key is whitespace", async () => {
    process.env.OPENAI_API_KEY = "   ";
    assert.equal(await isPracticeOpenAIConfigured(), false);
  });

  it("returns true when the key is set", async () => {
    process.env.OPENAI_API_KEY = " sk-test ";
    assert.equal(await isPracticeOpenAIConfigured(), true);
  });
});
