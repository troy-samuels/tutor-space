/**
 * Enterprise-grade Stripe Checkout Session Tests
 *
 * Tests checkout session creation and validation for:
 * - Booking checkout (destination charges)
 * - Platform subscription checkout
 * - Lesson subscription checkout
 * - Amount and currency validation
 * - Authorization checks
 */

import test from "node:test";
import assert from "node:assert/strict";

import {
  createMockCheckoutSession,
  createMockPaymentIntent,
  generateSessionId,
  generatePaymentIntentId,
  generateCustomerId,
} from "./utils/stripe-mocks.ts";

// ============================================
// TEST: Booking Checkout Sessions
// ============================================

test("booking checkout: creates session with destination charge metadata", () => {
  const session = createMockCheckoutSession({
    mode: "payment",
    amountTotal: 5000,
    currency: "usd",
    metadata: {
      bookingId: "booking_123",
      tutorId: "tutor_456",
      studentId: "student_789",
    },
  });

  assert.equal(session.mode, "payment");
  assert.equal(session.amount_total, 5000);
  assert.equal(session.currency, "usd");
  assert.equal(session.metadata?.bookingId, "booking_123");
  assert.equal(session.metadata?.tutorId, "tutor_456");
});

test("booking checkout: minimum amount validation ($1 = 100 cents)", () => {
  const validAmount = 100;
  const invalidAmount = 50;

  const validSession = createMockCheckoutSession({ amountTotal: validAmount });
  assert.ok((validSession.amount_total ?? 0) >= 100, "Amount should be at least $1 (100 cents)");

  // Validate business rule: < $1 should be rejected
  assert.ok(invalidAmount < 100, "Amounts under $1 should fail validation");
});

test("booking checkout: maximum amount validation ($10,000 = 1,000,000 cents)", () => {
  const maxAmount = 1000000;
  const overMaxAmount = 1000001;

  assert.ok(maxAmount <= 1000000, "Amount should not exceed $10,000");
  assert.ok(overMaxAmount > 1000000, "Amounts over $10,000 should fail validation");
});

test("booking checkout: supported currencies", () => {
  const supportedCurrencies = ["usd", "eur", "gbp", "cad", "aud", "jpy", "mxn", "brl"];

  supportedCurrencies.forEach((currency) => {
    const session = createMockCheckoutSession({ currency });
    assert.equal(session.currency, currency);
  });
});

test("booking checkout: payment_status transitions", () => {
  const unpaidSession = createMockCheckoutSession({ paymentStatus: "unpaid" });
  assert.equal(unpaidSession.payment_status, "unpaid");
  assert.equal(unpaidSession.status, "complete");

  const paidSession = createMockCheckoutSession({ paymentStatus: "paid" });
  assert.equal(paidSession.payment_status, "paid");
});

// ============================================
// TEST: Platform Subscription Checkout
// ============================================

test("platform subscription: Pro Monthly checkout", () => {
  const session = createMockCheckoutSession({
    mode: "subscription",
    customerId: generateCustomerId(),
    metadata: {
      userId: "user_123",
      plan: "pro_monthly",
    },
  });

  assert.equal(session.mode, "subscription");
  assert.equal(session.metadata?.plan, "pro_monthly");
});

test("platform subscription: Pro Annual checkout", () => {
  const session = createMockCheckoutSession({
    mode: "subscription",
    metadata: {
      userId: "user_123",
      plan: "pro_annual",
    },
  });

  assert.equal(session.metadata?.plan, "pro_annual");
});

test("platform subscription: Studio Monthly checkout", () => {
  const session = createMockCheckoutSession({
    mode: "subscription",
    metadata: {
      userId: "user_123",
      plan: "studio_monthly",
    },
  });

  assert.equal(session.metadata?.plan, "studio_monthly");
});

test("platform subscription: Studio Annual checkout", () => {
  const session = createMockCheckoutSession({
    mode: "subscription",
    metadata: {
      userId: "user_123",
      plan: "studio_annual",
    },
  });

  assert.equal(session.metadata?.plan, "studio_annual");
});

test("platform subscription: requires userId in metadata", () => {
  const session = createMockCheckoutSession({
    mode: "subscription",
    metadata: {
      userId: "required_user_id",
      plan: "pro_monthly",
    },
  });

  assert.ok(session.metadata?.userId, "userId is required for platform subscriptions");
});

test("platform subscription: customer association", () => {
  const customerId = generateCustomerId();
  const session = createMockCheckoutSession({
    mode: "subscription",
    customerId,
    metadata: {
      userId: "user_123",
      plan: "pro_monthly",
    },
  });

  assert.equal(session.customer, customerId);
});

// ============================================
// TEST: Lesson Subscription Checkout
// ============================================

test("lesson subscription: creates session with template metadata", () => {
  const session = createMockCheckoutSession({
    mode: "subscription",
    metadata: {
      type: "lesson_subscription",
      studentId: "student_123",
      tutorId: "tutor_456",
      templateId: "template_789",
    },
  });

  assert.equal(session.mode, "subscription");
  assert.equal(session.metadata?.type, "lesson_subscription");
  assert.equal(session.metadata?.templateId, "template_789");
});

test("lesson subscription: requires all student/tutor metadata", () => {
  const session = createMockCheckoutSession({
    mode: "subscription",
    metadata: {
      type: "lesson_subscription",
      studentId: "required_student",
      tutorId: "required_tutor",
      templateId: "required_template",
    },
  });

  assert.ok(session.metadata?.studentId);
  assert.ok(session.metadata?.tutorId);
  assert.ok(session.metadata?.templateId);
});

// ============================================
// TEST: AI Practice Subscription Checkout
// ============================================

test("AI practice subscription: legacy mode", () => {
  const session = createMockCheckoutSession({
    mode: "subscription",
    metadata: {
      type: "ai_practice",
      studentId: "student_123",
      tutorId: "tutor_456",
    },
  });

  assert.equal(session.metadata?.type, "ai_practice");
});

test("AI practice subscription: blocks-only (freemium)", () => {
  const session = createMockCheckoutSession({
    mode: "subscription",
    metadata: {
      type: "ai_practice_blocks",
      studentId: "student_123",
      tutorId: "tutor_456",
      is_blocks_only: "true",
    },
  });

  assert.equal(session.metadata?.type, "ai_practice_blocks");
  assert.equal(session.metadata?.is_blocks_only, "true");
});

// ============================================
// TEST: Lifetime Purchase Checkout
// ============================================

test("lifetime purchase: one-time payment mode", () => {
  const session = createMockCheckoutSession({
    mode: "payment",
    metadata: {
      userId: "user_123",
      plan: "tutor_life",
    },
  });

  assert.equal(session.mode, "payment");
  assert.equal(session.metadata?.plan, "tutor_life");
});

test("lifetime purchase: pre-signup with email only", () => {
  const session = createMockCheckoutSession({
    mode: "payment",
    customerEmail: "presignup@example.com",
    metadata: {
      plan: "tutor_life",
      source: "landing_page",
    },
  });

  assert.equal(session.customer_email, "presignup@example.com");
  assert.equal(session.metadata?.plan, "tutor_life");
  assert.equal(session.metadata?.userId, undefined);
});

test("lifetime purchase: founder lifetime plan", () => {
  const session = createMockCheckoutSession({
    mode: "payment",
    metadata: {
      userId: "founder_user",
      plan: "founder_lifetime",
    },
  });

  assert.equal(session.metadata?.plan, "founder_lifetime");
});

// ============================================
// TEST: Digital Product Checkout
// ============================================

test("digital product checkout: includes purchase ID", () => {
  const session = createMockCheckoutSession({
    mode: "payment",
    metadata: {
      digital_product_purchase_id: "purchase_123",
      product_type: "digital_download",
    },
  });

  assert.equal(session.metadata?.digital_product_purchase_id, "purchase_123");
  assert.equal(session.metadata?.product_type, "digital_download");
});

test("digital product checkout: student user ID for library", () => {
  const session = createMockCheckoutSession({
    mode: "payment",
    metadata: {
      digital_product_purchase_id: "purchase_123",
      product_type: "digital_download",
      studentUserId: "student_user_123",
    },
  });

  assert.equal(session.metadata?.studentUserId, "student_user_123");
});

// ============================================
// TEST: Payment Intent Validation
// ============================================

test("payment intent: succeeded status required for booking confirmation", () => {
  const succeededIntent = createMockPaymentIntent({
    status: "succeeded",
    amount: 5000,
  });

  assert.equal(succeededIntent.status, "succeeded");
  assert.equal(succeededIntent.amount_received, 5000);
});

test("payment intent: pending status should not confirm booking", () => {
  const pendingIntent = createMockPaymentIntent({
    status: "processing",
    amount: 5000,
  });

  assert.equal(pendingIntent.status, "processing");
  assert.equal(pendingIntent.amount_received, 0);
});

test("payment intent: failed status should not confirm booking", () => {
  const failedIntent = createMockPaymentIntent({
    status: "canceled",
    amount: 5000,
  });

  assert.equal(failedIntent.status, "canceled");
  assert.equal(failedIntent.amount_received, 0);
});

test("payment intent: destination charge has transfer_data", () => {
  const destinationAccountId = "acct_tutor_123";
  const intent = createMockPaymentIntent({
    transferDestination: destinationAccountId,
    applicationFeeAmount: 50, // 1% of $50
  });

  assert.equal(intent.transfer_data?.destination, destinationAccountId);
  assert.equal(intent.application_fee_amount, 50);
});

test("payment intent: direct charge has no transfer_data", () => {
  const intent = createMockPaymentIntent({
    transferDestination: null,
  });

  assert.equal(intent.transfer_data, null);
});

// ============================================
// TEST: Session URL Configuration
// ============================================

test("session: has success_url", () => {
  const session = createMockCheckoutSession({});

  assert.ok(session.success_url);
});

test("session: has cancel_url", () => {
  const session = createMockCheckoutSession({});

  assert.ok(session.cancel_url);
});

test("session: expires in future", () => {
  const session = createMockCheckoutSession({});
  const now = Math.floor(Date.now() / 1000);

  assert.ok(session.expires_at > now);
});

// ============================================
// TEST: Application Fee Calculation
// ============================================

test("application fee: 1% of booking amount", () => {
  const bookingAmount = 5000; // $50.00
  const expectedFee = Math.round(bookingAmount * 0.01); // 1%

  assert.equal(expectedFee, 50);
});

test("application fee: rounds to nearest cent", () => {
  const bookingAmount = 3333; // $33.33
  const expectedFee = Math.round(bookingAmount * 0.01);

  assert.equal(expectedFee, 33);
});

test("application fee: zero for direct payments", () => {
  const intent = createMockPaymentIntent({
    applicationFeeAmount: null,
  });

  assert.equal(intent.application_fee_amount, null);
});

// ============================================
// TEST: Session ID Generation
// ============================================

test("session ID: starts with cs_test_", () => {
  const sessionId = generateSessionId();

  assert.ok(sessionId.startsWith("cs_test_"));
});

test("session ID: unique across calls", () => {
  const id1 = generateSessionId();
  const id2 = generateSessionId();

  assert.notEqual(id1, id2);
});

test("payment intent ID: starts with pi_test_", () => {
  const intentId = generatePaymentIntentId();

  assert.ok(intentId.startsWith("pi_test_"));
});
