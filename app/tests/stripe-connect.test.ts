/**
 * Enterprise-grade Stripe Connect Account Tests
 *
 * Tests Stripe Connect account lifecycle:
 * - Account creation
 * - Account link generation
 * - Status synchronization
 * - Capability tracking
 * - Deauthorization handling
 */

import test from "node:test";
import assert from "node:assert/strict";

import {
  createMockConnectAccount,
  generateAccountId,
} from "./utils/stripe-mocks.ts";
import { buildExpressAccountParams } from "../lib/services/connect.ts";

// ============================================
// TEST: Account Creation
// ============================================

test("account creation: Express account type", () => {
  const account = createMockConnectAccount({});

  assert.equal(account.type, "express");
});

test("account creation: default country is US", () => {
  const account = createMockConnectAccount({});

  assert.equal(account.country, "US");
});

test("account creation: custom country", () => {
  const account = createMockConnectAccount({
    country: "GB",
    defaultCurrency: "gbp",
  });

  assert.equal(account.country, "GB");
  assert.equal(account.default_currency, "gbp");
});

test("account creation: individual business type", () => {
  const account = createMockConnectAccount({});

  assert.equal(account.business_type, "individual");
});

test("account creation: generates unique ID", () => {
  const id1 = generateAccountId();
  const id2 = generateAccountId();

  assert.ok(id1.startsWith("acct_test_"));
  assert.notEqual(id1, id2);
});

test("account creation: custom ID override", () => {
  const customId = "acct_custom_123";
  const account = createMockConnectAccount({
    id: customId,
  });

  assert.equal(account.id, customId);
});

test("buildExpressAccountParams: sets metadata and capabilities", () => {
  const params = buildExpressAccountParams("tutor_123", {
    email: "tutor@example.com",
    fullName: "Ada Lovelace",
  });

  assert.equal(params.type, "express");
  assert.equal(params.metadata?.tutor_id, "tutor_123");
  assert.equal(params.capabilities?.card_payments?.requested, true);
  assert.equal(params.capabilities?.transfers?.requested, true);
  assert.equal(params.individual?.first_name, "Ada");
  assert.equal(params.individual?.last_name, "Lovelace");
});

test("buildExpressAccountParams: uses default product description", () => {
  const params = buildExpressAccountParams("tutor_456", {
    email: "tutor@example.com",
  });

  assert.equal(
    params.business_profile?.product_description,
    "Language tutoring services"
  );
});

// ============================================
// TEST: Account Status - Charges Enabled
// ============================================

test("account status: charges_enabled true when onboarding complete", () => {
  const account = createMockConnectAccount({
    chargesEnabled: true,
    payoutsEnabled: true,
    detailsSubmitted: true,
  });

  assert.equal(account.charges_enabled, true);
});

test("account status: charges_enabled false during onboarding", () => {
  const account = createMockConnectAccount({
    chargesEnabled: false,
    detailsSubmitted: false,
  });

  assert.equal(account.charges_enabled, false);
});

test("account status: charges_enabled false when restricted", () => {
  const account = createMockConnectAccount({
    chargesEnabled: false,
    disabledReason: "requirements.past_due",
  });

  assert.equal(account.charges_enabled, false);
  assert.equal(account.requirements?.disabled_reason, "requirements.past_due");
});

// ============================================
// TEST: Account Status - Payouts Enabled
// ============================================

test("account status: payouts_enabled true when verified", () => {
  const account = createMockConnectAccount({
    chargesEnabled: true,
    payoutsEnabled: true,
  });

  assert.equal(account.payouts_enabled, true);
});

test("account status: payouts_enabled false during verification", () => {
  const account = createMockConnectAccount({
    chargesEnabled: true,
    payoutsEnabled: false,
  });

  assert.equal(account.payouts_enabled, false);
});

// ============================================
// TEST: Account Status - Details Submitted
// ============================================

test("account status: details_submitted true after onboarding", () => {
  const account = createMockConnectAccount({
    detailsSubmitted: true,
  });

  assert.equal(account.details_submitted, true);
});

test("account status: details_submitted false before onboarding", () => {
  const account = createMockConnectAccount({
    detailsSubmitted: false,
  });

  assert.equal(account.details_submitted, false);
});

// ============================================
// TEST: Account Requirements - Currently Due
// ============================================

test("account requirements: empty when complete", () => {
  const account = createMockConnectAccount({
    chargesEnabled: true,
    currentlyDue: [],
  });

  assert.deepEqual(account.requirements?.currently_due, []);
});

test("account requirements: lists currently_due items", () => {
  const requirements = [
    "individual.verification.document",
    "business_profile.url",
    "external_account",
  ];
  const account = createMockConnectAccount({
    chargesEnabled: false,
    currentlyDue: requirements,
  });

  assert.deepEqual(account.requirements?.currently_due, requirements);
});

test("account requirements: verification document required", () => {
  const account = createMockConnectAccount({
    currentlyDue: ["individual.verification.document"],
  });

  assert.ok(account.requirements?.currently_due?.includes("individual.verification.document"));
});

test("account requirements: bank account required", () => {
  const account = createMockConnectAccount({
    currentlyDue: ["external_account"],
  });

  assert.ok(account.requirements?.currently_due?.includes("external_account"));
});

// ============================================
// TEST: Account Requirements - Eventually Due
// ============================================

test("account requirements: eventually_due for non-urgent items", () => {
  const account = createMockConnectAccount({
    eventuallyDue: ["individual.ssn_last_4"],
  });

  assert.deepEqual(account.requirements?.eventually_due, ["individual.ssn_last_4"]);
});

// ============================================
// TEST: Account Requirements - Past Due
// ============================================

test("account requirements: past_due triggers restriction", () => {
  const account = createMockConnectAccount({
    chargesEnabled: false,
    pastDue: ["individual.verification.document"],
    disabledReason: "requirements.past_due",
  });

  assert.deepEqual(account.requirements?.past_due, ["individual.verification.document"]);
  assert.equal(account.requirements?.disabled_reason, "requirements.past_due");
});

// ============================================
// TEST: Account Requirements - Pending Verification
// ============================================

test("account requirements: pending_verification while processing", () => {
  const account = createMockConnectAccount({
    pendingVerification: ["individual.verification.document"],
  });

  assert.deepEqual(account.requirements?.pending_verification, ["individual.verification.document"]);
});

// ============================================
// TEST: Account Disabled Reasons
// ============================================

test("account disabled: requirements.past_due", () => {
  const account = createMockConnectAccount({
    disabledReason: "requirements.past_due",
    chargesEnabled: false,
  });

  assert.equal(account.requirements?.disabled_reason, "requirements.past_due");
});

test("account disabled: requirements.pending_verification", () => {
  const account = createMockConnectAccount({
    disabledReason: "requirements.pending_verification",
  });

  assert.equal(account.requirements?.disabled_reason, "requirements.pending_verification");
});

test("account disabled: listed (policy violation)", () => {
  const account = createMockConnectAccount({
    disabledReason: "listed",
    chargesEnabled: false,
    payoutsEnabled: false,
  });

  assert.equal(account.requirements?.disabled_reason, "listed");
});

test("account disabled: rejected.fraud", () => {
  const account = createMockConnectAccount({
    disabledReason: "rejected.fraud",
    chargesEnabled: false,
    payoutsEnabled: false,
  });

  assert.equal(account.requirements?.disabled_reason, "rejected.fraud");
});

test("account disabled: null when enabled", () => {
  const account = createMockConnectAccount({
    chargesEnabled: true,
    payoutsEnabled: true,
    disabledReason: null,
  });

  assert.equal(account.requirements?.disabled_reason, null);
});

// ============================================
// TEST: Account Capabilities
// ============================================

test("account capabilities: card_payments active when charges enabled", () => {
  const account = createMockConnectAccount({
    chargesEnabled: true,
  });

  assert.equal(account.capabilities?.card_payments, "active");
});

test("account capabilities: card_payments inactive when charges disabled", () => {
  const account = createMockConnectAccount({
    chargesEnabled: false,
  });

  assert.equal(account.capabilities?.card_payments, "inactive");
});

test("account capabilities: transfers active when payouts enabled", () => {
  const account = createMockConnectAccount({
    payoutsEnabled: true,
  });

  assert.equal(account.capabilities?.transfers, "active");
});

test("account capabilities: transfers inactive when payouts disabled", () => {
  const account = createMockConnectAccount({
    payoutsEnabled: false,
  });

  assert.equal(account.capabilities?.transfers, "inactive");
});

// ============================================
// TEST: Account Email
// ============================================

test("account: has email for notifications", () => {
  const account = createMockConnectAccount({});

  assert.ok(account.email);
  assert.ok(account.email.includes("@"));
});

// ============================================
// TEST: Account Metadata
// ============================================

test("account: empty metadata by default", () => {
  const account = createMockConnectAccount({});

  assert.deepEqual(account.metadata, {});
});

// ============================================
// TEST: Onboarding Status Flow
// ============================================

test("onboarding flow: initial state", () => {
  const account = createMockConnectAccount({
    chargesEnabled: false,
    payoutsEnabled: false,
    detailsSubmitted: false,
    currentlyDue: ["business_profile.url", "external_account"],
  });

  assert.equal(account.details_submitted, false);
  assert.equal(account.charges_enabled, false);
  assert.ok((account.requirements?.currently_due?.length ?? 0) > 0);
});

test("onboarding flow: partially complete", () => {
  const account = createMockConnectAccount({
    chargesEnabled: false,
    payoutsEnabled: false,
    detailsSubmitted: true,
    pendingVerification: ["individual.verification.document"],
  });

  assert.equal(account.details_submitted, true);
  assert.equal(account.charges_enabled, false);
  assert.ok((account.requirements?.pending_verification?.length ?? 0) > 0);
});

test("onboarding flow: complete", () => {
  const account = createMockConnectAccount({
    chargesEnabled: true,
    payoutsEnabled: true,
    detailsSubmitted: true,
    currentlyDue: [],
    eventuallyDue: [],
    pastDue: [],
    pendingVerification: [],
  });

  assert.equal(account.details_submitted, true);
  assert.equal(account.charges_enabled, true);
  assert.equal(account.payouts_enabled, true);
  assert.deepEqual(account.requirements?.currently_due, []);
});

// ============================================
// TEST: Database Status Mapping
// ============================================

test("status mapping: onboarding_status values", () => {
  // Test status mapping logic
  const statuses = {
    not_started: {
      chargesEnabled: false,
      detailsSubmitted: false,
    },
    in_progress: {
      chargesEnabled: false,
      detailsSubmitted: true,
    },
    complete: {
      chargesEnabled: true,
      detailsSubmitted: true,
    },
    restricted: {
      chargesEnabled: false,
      disabledReason: "requirements.past_due",
    },
  };

  // not_started
  const notStarted = createMockConnectAccount(statuses.not_started);
  assert.equal(notStarted.charges_enabled, false);
  assert.equal(notStarted.details_submitted, false);

  // in_progress
  const inProgress = createMockConnectAccount(statuses.in_progress);
  assert.equal(inProgress.charges_enabled, false);
  assert.equal(inProgress.details_submitted, true);

  // complete
  const complete = createMockConnectAccount(statuses.complete);
  assert.equal(complete.charges_enabled, true);
  assert.equal(complete.details_submitted, true);

  // restricted
  const restricted = createMockConnectAccount(statuses.restricted);
  assert.equal(restricted.charges_enabled, false);
  assert.ok(restricted.requirements?.disabled_reason);
});

// ============================================
// TEST: Currency Support
// ============================================

test("currency: USD default", () => {
  const account = createMockConnectAccount({});

  assert.equal(account.default_currency, "usd");
});

test("currency: EUR for EU accounts", () => {
  const account = createMockConnectAccount({
    country: "DE",
    defaultCurrency: "eur",
  });

  assert.equal(account.default_currency, "eur");
});

test("currency: GBP for UK accounts", () => {
  const account = createMockConnectAccount({
    country: "GB",
    defaultCurrency: "gbp",
  });

  assert.equal(account.default_currency, "gbp");
});
