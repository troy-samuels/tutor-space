import test from "node:test";
import assert from "node:assert/strict";

import { mapPriceIdToPlan } from "../lib/payments/subscriptions.ts";

test("maps lifetime price ID to founder_lifetime", () => {
  process.env.STRIPE_LIFETIME_PRICE_ID = "price_lifetime_test";
  process.env.STRIPE_ALL_ACCESS_PRICE_ID = "price_all_access_test";

  assert.equal(mapPriceIdToPlan("price_lifetime_test"), "founder_lifetime");
});

test("maps all-access price ID to growth", () => {
  process.env.STRIPE_LIFETIME_PRICE_ID = "price_lifetime_test";
  process.env.STRIPE_ALL_ACCESS_PRICE_ID = "price_all_access_test";

  assert.equal(mapPriceIdToPlan("price_all_access_test"), "growth");
});

test("falls back to growth when an all-access price is configured", () => {
  process.env.STRIPE_LIFETIME_PRICE_ID = "price_lifetime_test";
  process.env.STRIPE_ALL_ACCESS_PRICE_ID = "price_all_access_test";

  assert.equal(mapPriceIdToPlan("unknown_price"), "growth");
});

test("falls back to professional when no prices are configured", () => {
  delete process.env.STRIPE_LIFETIME_PRICE_ID;
  delete process.env.STRIPE_ALL_ACCESS_PRICE_ID;

  assert.equal(mapPriceIdToPlan("unknown_price"), "professional");
});
