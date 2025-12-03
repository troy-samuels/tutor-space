import test from "node:test";
import assert from "node:assert/strict";

import type {
  RouteStudentPaymentInput,
  RouteStudentPaymentDecision,
  TutorStripeStatus,
} from "../lib/types/payments.ts";

// To be implemented in domain phase
import { routeStudentPayment } from "../lib/payments/routing.ts";

test("routeStudentPayment chooses connect_destination when charges enabled", () => {
  const tutorStripe: TutorStripeStatus = {
    accountId: "acct_123",
    chargesEnabled: true,
    payoutsEnabled: true,
    onboardingStatus: "completed",
    defaultCurrency: "usd",
    country: "US",
    lastCapabilityCheckAt: new Date().toISOString(),
    disabledReason: null,
    currentlyDue: null,
    eventuallyDue: null,
    pastDue: null,
    pendingVerification: null,
    detailsSubmitted: true,
  };
  const input: RouteStudentPaymentInput = {
    tutorStripe,
    hasPaymentLink: true,
  };

  const decision: RouteStudentPaymentDecision = routeStudentPayment(input);
  assert.equal(decision.route, "connect_destination");
  assert.equal(decision.reason, "connect_ready");
});

test("routeStudentPayment chooses payment_link when connect not ready but link present", () => {
  const tutorStripe: TutorStripeStatus = {
    accountId: "acct_123",
    chargesEnabled: false,
    payoutsEnabled: false,
    onboardingStatus: "pending",
    defaultCurrency: null,
    country: null,
    lastCapabilityCheckAt: null,
    disabledReason: null,
    currentlyDue: null,
    eventuallyDue: null,
    pastDue: null,
    pendingVerification: null,
    detailsSubmitted: false,
  };
  const input: RouteStudentPaymentInput = {
    tutorStripe,
    hasPaymentLink: true,
  };

  const decision: RouteStudentPaymentDecision = routeStudentPayment(input);
  assert.equal(decision.route, "payment_link");
  assert.equal(decision.reason, "use_payment_link");
});

test("routeStudentPayment reports no method when connect not ready and no link", () => {
  const tutorStripe: TutorStripeStatus = {
    accountId: null,
    chargesEnabled: false,
    payoutsEnabled: false,
    onboardingStatus: "pending",
    defaultCurrency: null,
    country: null,
    lastCapabilityCheckAt: null,
    disabledReason: null,
    currentlyDue: null,
    eventuallyDue: null,
    pastDue: null,
    pendingVerification: null,
    detailsSubmitted: false,
  };
  const input: RouteStudentPaymentInput = {
    tutorStripe,
    hasPaymentLink: false,
  };

  const decision: RouteStudentPaymentDecision = routeStudentPayment(input);
  assert.equal(decision.route, "platform_fallback");
  assert.equal(decision.reason, "connect_not_ready_fallback");
});
