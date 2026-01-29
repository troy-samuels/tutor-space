import test from "node:test";
import assert from "node:assert/strict";

import { findFirstValidUsernameSlug } from "../lib/utils/username-slug.ts";

test("findFirstValidUsernameSlug returns the first valid normalized slug", () => {
  const result = findFirstValidUsernameSlug(["María López", "fallback@example.com"]);
  assert.equal(result, "maria-lopez");
});

test("findFirstValidUsernameSlug skips reserved and too-short candidates", () => {
  const result = findFirstValidUsernameSlug(["tutor", "Li", "troy@example.com"]);
  assert.equal(result, "troy-example-com");
});

test("findFirstValidUsernameSlug skips non-latin names and uses fallback", () => {
  const result = findFirstValidUsernameSlug(["张伟", "zoe@example.com"]);
  assert.equal(result, "zoe-example-com");
});
