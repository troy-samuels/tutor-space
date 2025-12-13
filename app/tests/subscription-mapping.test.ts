import test from "node:test";
import assert from "node:assert/strict";

import { mapPriceIdToPlan } from "../lib/payments/subscriptions.ts";

test("maps lifetime price ID to tutor_life", () => {
  process.env.STRIPE_LIFETIME_PRICE_ID = "price_lifetime_test";
  process.env.STRIPE_ALL_ACCESS_PRICE_ID = "price_all_access_test";

  assert.equal(mapPriceIdToPlan("price_lifetime_test"), "tutor_life");
});

test("maps all-access price ID to all_access", () => {
  process.env.STRIPE_LIFETIME_PRICE_ID = "price_lifetime_test";
  process.env.STRIPE_ALL_ACCESS_PRICE_ID = "price_all_access_test";

  assert.equal(mapPriceIdToPlan("price_all_access_test"), "all_access");
});

test("maps yearly all-access price ID to all_access", () => {
  process.env.STRIPE_LIFETIME_PRICE_ID = "price_lifetime_test";
  process.env.STRIPE_ALL_YEAR_ACCESS_PRICE_ID = "price_all_year_access_test";

  assert.equal(mapPriceIdToPlan("price_all_year_access_test"), "all_access");
});

test("does not unlock paid plan for unknown price IDs", () => {
  process.env.STRIPE_LIFETIME_PRICE_ID = "price_lifetime_test";
  process.env.STRIPE_ALL_ACCESS_PRICE_ID = "price_all_access_test";
  process.env.STRIPE_ALL_YEAR_ACCESS_PRICE_ID = "price_all_year_access_test";

  assert.equal(mapPriceIdToPlan("unknown_price"), "professional");
});

test("falls back to professional when no prices are configured", () => {
  delete process.env.STRIPE_LIFETIME_PRICE_ID;
  delete process.env.STRIPE_ALL_ACCESS_PRICE_ID;
  delete process.env.STRIPE_ALL_YEAR_ACCESS_PRICE_ID;

  assert.equal(mapPriceIdToPlan("unknown_price"), "professional");
});
