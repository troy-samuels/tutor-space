import test from "node:test";
import assert from "node:assert/strict";

import {
  normalizeSignupCheckoutStatus,
  isSignupCheckoutExpired,
} from "../lib/services/signup-checkout.ts";

test("normalizeSignupCheckoutStatus maps Stripe statuses", () => {
  assert.equal(normalizeSignupCheckoutStatus("open"), "open");
  assert.equal(normalizeSignupCheckoutStatus("complete"), "complete");
  assert.equal(normalizeSignupCheckoutStatus("expired"), "expired");
});

test("normalizeSignupCheckoutStatus defaults to canceled for unknown status", () => {
  assert.equal(normalizeSignupCheckoutStatus(null), "canceled");
  assert.equal(normalizeSignupCheckoutStatus(undefined), "canceled");
  assert.equal(normalizeSignupCheckoutStatus("unknown" as any), "canceled");
});

test("isSignupCheckoutExpired respects expiry timestamps", () => {
  const now = new Date("2025-01-01T00:00:00.000Z");
  // Past expiry should be expired
  assert.equal(
    isSignupCheckoutExpired("2024-12-31T23:59:59.000Z", now),
    true
  );
  // Expiry within 5-minute buffer is treated as expired (to avoid race conditions)
  assert.equal(
    isSignupCheckoutExpired("2025-01-01T00:04:59.000Z", now),
    true
  );
  // Expiry more than 5 minutes in the future should NOT be expired
  assert.equal(
    isSignupCheckoutExpired("2025-01-01T00:06:00.000Z", now),
    false
  );
});
