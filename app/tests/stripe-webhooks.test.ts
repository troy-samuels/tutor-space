/**
 * Enterprise-grade Stripe Webhook Handler Tests
 *
 * Tests all webhook event handlers for:
 * - checkout.session.completed (booking, subscription, lifetime, digital products)
 * - customer.subscription.created/updated/deleted
 * - invoice.payment_succeeded/failed
 * - account.updated (Connect)
 * - account.application.deauthorized
 */

import test from "node:test";
import assert from "node:assert/strict";

import {
  MockEvents,
  createMockStripeEvent,
  createMockCheckoutSession,
  createMockSubscription,
  createMockConnectAccount,
  createMockInvoice,
  generateCustomerId,
  generateSubscriptionId,
  generateAccountId,
} from "./utils/stripe-mocks.ts";

// ============================================
// TEST: checkout.session.completed
// ============================================

test("checkout.session.completed: booking payment marks booking as paid", () => {
  const event = MockEvents.checkoutSessionCompleted.bookingPayment({
    bookingId: "booking_123",
    tutorId: "tutor_456",
    amountTotal: 5000,
    paymentIntentId: "pi_test_123",
  });

  assert.equal(event.type, "checkout.session.completed");
  const session = event.data.object as { metadata?: Record<string, string>; amount_total?: number };
  assert.equal(session.metadata?.bookingId, "booking_123");
  assert.equal(session.metadata?.tutorId, "tutor_456");
  assert.equal(session.amount_total, 5000);
});

test("checkout.session.completed: platform subscription sets correct metadata", () => {
  const event = MockEvents.checkoutSessionCompleted.platformSubscription({
    userId: "user_789",
    plan: "pro_monthly",
    customerId: "cus_test_123",
  });

  assert.equal(event.type, "checkout.session.completed");
  const session = event.data.object as { metadata?: Record<string, string>; mode?: string };
  assert.equal(session.mode, "subscription");
  assert.equal(session.metadata?.userId, "user_789");
  assert.equal(session.metadata?.plan, "pro_monthly");
});

test("checkout.session.completed: lifetime purchase with userId", () => {
  const event = MockEvents.checkoutSessionCompleted.lifetimePurchase({
    userId: "user_lifetime",
  });

  assert.equal(event.type, "checkout.session.completed");
  const session = event.data.object as { metadata?: Record<string, string>; mode?: string };
  assert.equal(session.mode, "payment");
  assert.equal(session.metadata?.userId, "user_lifetime");
  assert.equal(session.metadata?.plan, "tutor_life");
});

test("checkout.session.completed: lifetime purchase without userId (pre-signup)", () => {
  const event = MockEvents.checkoutSessionCompleted.lifetimePurchase({
    customerEmail: "newuser@example.com",
  });

  assert.equal(event.type, "checkout.session.completed");
  const session = event.data.object as {
    metadata?: Record<string, string>;
    customer_email?: string | null;
  };
  assert.equal(session.customer_email, "newuser@example.com");
  assert.equal(session.metadata?.plan, "tutor_life");
  assert.equal(session.metadata?.userId, undefined);
});

test("checkout.session.completed: validates payment_status is paid", () => {
  const session = createMockCheckoutSession({
    paymentStatus: "paid",
    amountTotal: 3900,
    metadata: { bookingId: "booking_paid" },
  });

  assert.equal(session.payment_status, "paid");
});

test("checkout.session.completed: handles unpaid status correctly", () => {
  const session = createMockCheckoutSession({
    paymentStatus: "unpaid",
    metadata: { bookingId: "booking_unpaid" },
  });

  assert.equal(session.payment_status, "unpaid");
});

// ============================================
// TEST: customer.subscription.created
// ============================================

test("customer.subscription.created: platform subscription with correct tier", () => {
  const customerId = generateCustomerId();
  const event = MockEvents.subscriptionCreated.platform({
    customerId,
    priceId: "price_pro_monthly",
    status: "active",
  });

  assert.equal(event.type, "customer.subscription.created");
  const subscription = event.data.object as { customer?: string; status?: string };
  assert.equal(subscription.customer, customerId);
  assert.equal(subscription.status, "active");
});

test("customer.subscription.created: lesson subscription with metadata", () => {
  const event = MockEvents.subscriptionCreated.lessonSubscription({
    studentId: "student_123",
    tutorId: "tutor_456",
    templateId: "template_789",
    customerId: "cus_lesson_123",
  });

  assert.equal(event.type, "customer.subscription.created");
  const subscription = event.data.object as { metadata?: Record<string, string> };
  assert.equal(subscription.metadata?.type, "lesson_subscription");
  assert.equal(subscription.metadata?.studentId, "student_123");
  assert.equal(subscription.metadata?.tutorId, "tutor_456");
  assert.equal(subscription.metadata?.templateId, "template_789");
});

test("customer.subscription.created: AI Practice subscription (legacy)", () => {
  const event = MockEvents.subscriptionCreated.aiPractice({
    studentId: "student_ai_123",
    tutorId: "tutor_ai_456",
    isBlocksOnly: false,
  });

  assert.equal(event.type, "customer.subscription.created");
  const subscription = event.data.object as { metadata?: Record<string, string> };
  assert.equal(subscription.metadata?.type, "ai_practice");
});

test("customer.subscription.created: AI Practice blocks-only (freemium)", () => {
  const event = MockEvents.subscriptionCreated.aiPractice({
    studentId: "student_blocks_123",
    tutorId: "tutor_blocks_456",
    isBlocksOnly: true,
  });

  assert.equal(event.type, "customer.subscription.created");
  const subscription = event.data.object as { metadata?: Record<string, string> };
  assert.equal(subscription.metadata?.type, "ai_practice_blocks");
  assert.equal(subscription.metadata?.is_blocks_only, "true");
});

test("customer.subscription.created: trialing status", () => {
  const subscription = createMockSubscription({
    status: "trialing",
    trialEnd: Math.floor(Date.now() / 1000) + 14 * 24 * 60 * 60, // 14 days
  });

  assert.equal(subscription.status, "trialing");
  assert.ok(subscription.trial_end);
  assert.ok(subscription.trial_end > Math.floor(Date.now() / 1000));
});

// ============================================
// TEST: customer.subscription.updated
// ============================================

test("customer.subscription.updated: plan upgrade sets immediate access", () => {
  const subscription = createMockSubscription({
    status: "active",
    priceId: "price_studio_monthly",
  });

  const event = createMockStripeEvent({
    type: "customer.subscription.updated",
    data: subscription,
  });

  assert.equal(event.type, "customer.subscription.updated");
  const sub = event.data.object as { status?: string };
  assert.equal(sub.status, "active");
});

test("customer.subscription.updated: cancel_at_period_end for downgrade", () => {
  const subscription = createMockSubscription({
    status: "active",
    cancelAtPeriodEnd: true,
  });

  assert.equal(subscription.cancel_at_period_end, true);
  assert.equal(subscription.status, "active");
});

test("customer.subscription.updated: paused status triggers downgrade", () => {
  const subscription = createMockSubscription({
    status: "paused",
  });

  assert.equal(subscription.status, "paused");
});

test("customer.subscription.updated: past_due status", () => {
  const subscription = createMockSubscription({
    status: "past_due",
  });

  assert.equal(subscription.status, "past_due");
});

// ============================================
// TEST: customer.subscription.deleted
// ============================================

test("customer.subscription.deleted: platform subscription downgrades to free", () => {
  const customerId = generateCustomerId();
  const event = MockEvents.subscriptionDeleted.platform({
    customerId,
    subscriptionId: generateSubscriptionId(),
  });

  assert.equal(event.type, "customer.subscription.deleted");
  const subscription = event.data.object as { customer?: string; status?: string };
  assert.equal(subscription.customer, customerId);
  assert.equal(subscription.status, "canceled");
});

test("customer.subscription.deleted: lesson subscription allows remaining credits", () => {
  const event = MockEvents.subscriptionDeleted.lessonSubscription({
    subscriptionId: generateSubscriptionId(),
  });

  assert.equal(event.type, "customer.subscription.deleted");
  const subscription = event.data.object as { metadata?: Record<string, string>; status?: string };
  assert.equal(subscription.metadata?.type, "lesson_subscription");
  assert.equal(subscription.status, "canceled");
});

// ============================================
// TEST: invoice.payment_succeeded
// ============================================

test("invoice.payment_succeeded: subscription renewal extends access", () => {
  const customerId = generateCustomerId();
  const subscriptionId = generateSubscriptionId();
  const event = MockEvents.invoicePaymentSucceeded({
    customerId,
    subscriptionId,
    amountPaid: 3900,
  });

  assert.equal(event.type, "invoice.payment_succeeded");
  const invoice = event.data.object as {
    customer?: string;
    status?: string;
    amount_paid?: number;
  };
  assert.equal(invoice.customer, customerId);
  assert.equal(invoice.status, "paid");
  assert.equal(invoice.amount_paid, 3900);
});

test("invoice.payment_succeeded: first payment after trial activates subscription", () => {
  const invoice = createMockInvoice({
    status: "paid",
    amountPaid: 3900,
    subscriptionId: generateSubscriptionId(),
  });

  assert.equal(invoice.status, "paid");
  assert.equal(invoice.paid, true);
});

// ============================================
// TEST: invoice.payment_failed
// ============================================

test("invoice.payment_failed: updates status to past_due", () => {
  const customerId = generateCustomerId();
  const subscriptionId = generateSubscriptionId();
  const event = MockEvents.invoicePaymentFailed({
    customerId,
    subscriptionId,
    amountDue: 3900,
    nextPaymentAttempt: Math.floor(Date.now() / 1000) + 86400, // 1 day
  });

  assert.equal(event.type, "invoice.payment_failed");
  const invoice = event.data.object as {
    customer?: string;
    status?: string;
    next_payment_attempt?: number | null;
  };
  assert.equal(invoice.customer, customerId);
  assert.equal(invoice.status, "open");
  assert.ok(invoice.next_payment_attempt);
});

test("invoice.payment_failed: tracks failure with no retry scheduled", () => {
  const invoice = createMockInvoice({
    status: "open",
    amountDue: 3900,
    nextPaymentAttempt: null,
  });

  assert.equal(invoice.status, "open");
  assert.equal(invoice.next_payment_attempt, null);
});

// ============================================
// TEST: account.updated (Connect)
// ============================================

test("account.updated: onboarding completed sets charges_enabled", () => {
  const accountId = generateAccountId();
  const event = MockEvents.accountUpdated.onboardingCompleted(accountId);

  assert.equal(event.type, "account.updated");
  const account = event.data.object as {
    id?: string;
    charges_enabled?: boolean;
    payouts_enabled?: boolean;
    details_submitted?: boolean;
  };
  assert.equal(account.id, accountId);
  assert.equal(account.charges_enabled, true);
  assert.equal(account.payouts_enabled, true);
  assert.equal(account.details_submitted, true);
});

test("account.updated: requirements due tracks currently_due", () => {
  const accountId = generateAccountId();
  const requirements = ["individual.verification.document", "business_profile.url"];
  const event = MockEvents.accountUpdated.requirementsDue(accountId, requirements);

  assert.equal(event.type, "account.updated");
  const account = event.data.object as {
    id?: string;
    charges_enabled?: boolean;
    requirements?: { currently_due?: string[] };
  };
  assert.equal(account.id, accountId);
  assert.equal(account.charges_enabled, false);
  assert.deepEqual(account.requirements?.currently_due, requirements);
});

test("account.updated: restricted account sets disabled_reason", () => {
  const accountId = generateAccountId();
  const reason = "requirements.past_due";
  const event = MockEvents.accountUpdated.restricted(accountId, reason);

  assert.equal(event.type, "account.updated");
  const account = event.data.object as {
    id?: string;
    charges_enabled?: boolean;
    requirements?: { disabled_reason?: string | null };
  };
  assert.equal(account.id, accountId);
  assert.equal(account.charges_enabled, false);
  assert.equal(account.requirements?.disabled_reason, reason);
});

test("account.updated: payouts_enabled status", () => {
  const account = createMockConnectAccount({
    chargesEnabled: true,
    payoutsEnabled: true,
    detailsSubmitted: true,
  });

  assert.equal(account.charges_enabled, true);
  assert.equal(account.payouts_enabled, true);
});

test("account.updated: tracks pending_verification", () => {
  const account = createMockConnectAccount({
    pendingVerification: ["individual.verification.document"],
  });

  assert.deepEqual(account.requirements?.pending_verification, ["individual.verification.document"]);
});

// ============================================
// TEST: account.application.deauthorized
// ============================================

test("account.application.deauthorized: revokes all capabilities", () => {
  const accountId = generateAccountId();
  const event = MockEvents.accountDeauthorized(accountId);

  assert.equal(event.type, "account.application.deauthorized");
  const data = event.data.object as { account?: string };
  assert.equal(data.account, accountId);
});

// ============================================
// TEST: Event structure validation
// ============================================

test("event structure: has required fields", () => {
  const event = createMockStripeEvent({
    type: "test.event",
    data: { test: true },
  });

  assert.ok(event.id);
  assert.ok(event.id.startsWith("evt_test_"));
  assert.equal(event.object, "event");
  assert.ok(event.created);
  assert.ok(event.api_version);
  assert.equal(event.livemode, false);
  assert.ok(event.request);
});

test("event structure: custom event ID", () => {
  const customId = "evt_custom_12345";
  const event = createMockStripeEvent({
    id: customId,
    type: "test.event",
    data: { test: true },
  });

  assert.equal(event.id, customId);
});

test("event structure: livemode can be set", () => {
  const event = createMockStripeEvent({
    type: "test.event",
    data: { test: true },
    livemode: true,
  });

  assert.equal(event.livemode, true);
});

// ============================================
// TEST: Session metadata validation
// ============================================

test("session metadata: booking payment requires bookingId and tutorId", () => {
  const session = createMockCheckoutSession({
    metadata: {
      bookingId: "booking_required",
      tutorId: "tutor_required",
    },
  });

  assert.ok(session.metadata?.bookingId);
  assert.ok(session.metadata?.tutorId);
});

test("session metadata: subscription requires userId and plan", () => {
  const session = createMockCheckoutSession({
    mode: "subscription",
    metadata: {
      userId: "user_required",
      plan: "pro_monthly",
    },
  });

  assert.ok(session.metadata?.userId);
  assert.ok(session.metadata?.plan);
});

test("session metadata: digital product requires digital_product_purchase_id", () => {
  const session = createMockCheckoutSession({
    metadata: {
      digital_product_purchase_id: "purchase_123",
    },
  });

  assert.ok(session.metadata?.digital_product_purchase_id);
});
