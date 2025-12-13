import test from "node:test";
import assert from "node:assert/strict";

import { detectUserTimezone, formatTimezonePreview, groupTimezones } from "../lib/utils/timezones.ts";

test("groupTimezones narrows results by search term", () => {
  const groups = groupTimezones("new_york");
  const flattened = groups.flatMap((group) => group.timezones.map((tz) => tz.toLowerCase()));

  assert.ok(flattened.length > 0, "Should return at least one timezone");
  assert.ok(flattened.some((tz) => tz.includes("new_york")), "Should include matching city");
});

test("formatTimezonePreview produces readable output", () => {
  const preview = formatTimezonePreview("UTC", new Date("2024-01-01T12:00:00Z"));

  assert.match(preview, /UTC/, "Preview includes zone abbreviation");
  assert.match(preview, /12:00/i, "Preview includes time");
});

test("detectUserTimezone returns a non-empty string", () => {
  const timezone = detectUserTimezone();

  assert.ok(typeof timezone === "string");
  assert.ok(timezone.length > 0);
});
