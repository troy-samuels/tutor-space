import test from "node:test";
import assert from "node:assert/strict";

import type { TutorStripeStatus } from "../lib/types/payments.ts";
// To be implemented
import { extractTutorStripeStatus } from "../lib/payments/connect-status.ts";

test("extractTutorStripeStatus maps Stripe account to internal status", () => {
  const stripeAccount = {
    id: "acct_abc",
    charges_enabled: true,
    payouts_enabled: true,
    default_currency: "usd",
    country: "US",
    details_submitted: true,
    requirements: {
      disabled_reason: null,
      currently_due: [],
      eventually_due: [],
      past_due: [],
      pending_verification: [],
    },
  } as unknown as Record<string, unknown>;

  const status: TutorStripeStatus = extractTutorStripeStatus(stripeAccount);
  assert.equal(status.accountId, "acct_abc");
  assert.equal(status.chargesEnabled, true);
  assert.equal(status.payoutsEnabled, true);
  assert.equal(status.onboardingStatus, "completed");
  assert.equal(status.defaultCurrency, "usd");
  assert.equal(status.country, "US");
  assert.equal(status.disabledReason, null);
  assert.deepEqual(status.currentlyDue, []);
  assert.deepEqual(status.eventuallyDue, []);
  assert.deepEqual(status.pastDue, []);
  assert.deepEqual(status.pendingVerification, []);
  assert.equal(status.detailsSubmitted, true);
});
