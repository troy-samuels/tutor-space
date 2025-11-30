import test from "node:test";
import assert from "node:assert/strict";

import type { ApplicationFeePolicy, FeeComputationResult } from "../lib/types/payments.ts";
// To be implemented
import { computeApplicationFee } from "../lib/payments/fees.ts";

test("computeApplicationFee percent with floor", () => {
  const policy: ApplicationFeePolicy = { type: "percent", percent: 10, minFeeCents: 99 };
  const result: FeeComputationResult = computeApplicationFee(5000, policy); // $50.00
  assert.equal(result.applicationFeeCents, 500); // 10%
  assert.equal(result.netToTutorCents, 4500);
});

test("computeApplicationFee flat", () => {
  const policy: ApplicationFeePolicy = { type: "flat", amountCents: 299 };
  const result: FeeComputationResult = computeApplicationFee(2000, policy); // $20.00
  assert.equal(result.applicationFeeCents, 299);
  assert.equal(result.netToTutorCents, 1701);
});
