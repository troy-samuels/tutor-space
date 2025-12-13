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

test("routeStudentPayment reports no method when connect not ready (Stripe Connect required)", () => {
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
  assert.equal(decision.route, "no_payment_method");
  assert.equal(decision.reason, "no_payment_method_available");
});

test("routeStudentPayment reports no method when connect not ready and no account", () => {
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
  assert.equal(decision.route, "no_payment_method");
  assert.equal(decision.reason, "no_payment_method_available");
});
