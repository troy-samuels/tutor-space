import test from "node:test";
import assert from "node:assert/strict";

import { requiresSignupCheckout } from "../lib/services/signup-checkout.ts";
import type { SignupCheckoutProfile } from "../lib/services/signup-checkout.ts";

test("requiresSignupCheckout returns true for paid plan without completion or subscription", () => {
  process.env.STRIPE_PRO_MONTHLY_PRICE_ID = "price_pro_monthly_test";

  const profile = {
    stripe_subscription_id: null,
    subscription_status: null,
    signup_checkout_status: null,
    signup_checkout_completed_at: null,
  } satisfies SignupCheckoutProfile;

  assert.equal(requiresSignupCheckout("pro_monthly", profile), true);

  delete process.env.STRIPE_PRO_MONTHLY_PRICE_ID;
});

test("requiresSignupCheckout returns false when checkout already completed", () => {
  process.env.STRIPE_PRO_MONTHLY_PRICE_ID = "price_pro_monthly_test";

  const profile = {
    stripe_subscription_id: null,
    subscription_status: null,
    signup_checkout_status: "complete",
    signup_checkout_completed_at: null,
  } satisfies SignupCheckoutProfile;

  assert.equal(requiresSignupCheckout("pro_monthly", profile), false);

  delete process.env.STRIPE_PRO_MONTHLY_PRICE_ID;
});

test("requiresSignupCheckout returns false when subscription is active", () => {
  process.env.STRIPE_PRO_MONTHLY_PRICE_ID = "price_pro_monthly_test";

  const profile = {
    stripe_subscription_id: "sub_123",
    subscription_status: "active",
    signup_checkout_status: "open",
    signup_checkout_completed_at: null,
  } satisfies SignupCheckoutProfile;

  assert.equal(requiresSignupCheckout("pro_monthly", profile), false);

  delete process.env.STRIPE_PRO_MONTHLY_PRICE_ID;
});

test("requiresSignupCheckout returns false for free plan", () => {
  const profile = {
    stripe_subscription_id: null,
    subscription_status: null,
    signup_checkout_status: null,
    signup_checkout_completed_at: null,
  } satisfies SignupCheckoutProfile;

  assert.equal(requiresSignupCheckout("professional", profile), false);
});
