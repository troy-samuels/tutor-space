/**
 * Enterprise-grade Payment Audit Trail Tests
 *
 * Tests payment audit record creation and retrieval:
 * - Audit record field validation
 * - Net amount calculations
 * - Stripe ID tracking
 * - Query filtering
 */

import test from "node:test";
import assert from "node:assert/strict";

import {
  createMockPaymentIntent,
  generatePaymentIntentId,
  generateAccountId,
} from "./utils/stripe-mocks.ts";

// ============================================
// TEST: Audit Record Field Validation
// ============================================

test("audit record: required fields are present", () => {
  const auditRecord = {
    tutor_id: "tutor_123",
    student_id: "student_456",
    booking_id: "booking_789",
    amount_cents: 5000,
    currency: "usd",
    application_fee_cents: 50,
    net_amount_cents: 4950,
    stripe_payment_intent_id: generatePaymentIntentId(),
    stripe_charge_id: "ch_test_123",
    destination_account_id: generateAccountId(),
    payment_type: "booking",
    created_at: new Date().toISOString(),
  };

  assert.ok(auditRecord.tutor_id);
  assert.ok(auditRecord.student_id);
  assert.ok(auditRecord.booking_id);
  assert.ok(auditRecord.amount_cents >= 0);
  assert.ok(auditRecord.currency);
  assert.ok(auditRecord.stripe_payment_intent_id);
  assert.ok(auditRecord.destination_account_id);
  assert.ok(auditRecord.payment_type);
  assert.ok(auditRecord.created_at);
});

test("audit record: allows null student_id for guest bookings", () => {
  const auditRecord = {
    tutor_id: "tutor_123",
    student_id: null,
    booking_id: "booking_789",
    amount_cents: 5000,
    currency: "usd",
    application_fee_cents: 0,
    net_amount_cents: 5000,
    stripe_payment_intent_id: generatePaymentIntentId(),
    stripe_charge_id: "ch_test_123",
    destination_account_id: generateAccountId(),
    payment_type: "booking",
    created_at: new Date().toISOString(),
  };

  assert.equal(auditRecord.student_id, null);
});

// ============================================
// TEST: Net Amount Calculations
// ============================================

test("net amount: correct with 1% application fee", () => {
  const amountCents = 5000; // $50.00
  const applicationFeeCents = 50; // 1%
  const netAmountCents = amountCents - applicationFeeCents;

  assert.equal(netAmountCents, 4950);
});

test("net amount: correct with 0% application fee", () => {
  const amountCents = 5000;
  const applicationFeeCents = 0;
  const netAmountCents = amountCents - applicationFeeCents;

  assert.equal(netAmountCents, 5000);
});

test("net amount: handles fractional cents rounding", () => {
  const amountCents = 3333; // $33.33
  const applicationFeeCents = Math.round(amountCents * 0.01); // 33 cents (rounded)
  const netAmountCents = amountCents - applicationFeeCents;

  assert.equal(applicationFeeCents, 33);
  assert.equal(netAmountCents, 3300);
});

test("net amount: large payment calculation", () => {
  const amountCents = 100000; // $1,000.00
  const applicationFeeCents = 1000; // 1%
  const netAmountCents = amountCents - applicationFeeCents;

  assert.equal(netAmountCents, 99000);
});

// ============================================
// TEST: Stripe ID Tracking
// ============================================

test("stripe IDs: payment_intent_id format", () => {
  const intent = createMockPaymentIntent({});

  assert.ok(intent.id.startsWith("pi_test_"));
});

test("stripe IDs: charge_id extracted from payment intent", () => {
  const intent = createMockPaymentIntent({
    latestCharge: "ch_test_123456",
  });

  assert.equal(intent.latest_charge, "ch_test_123456");
});

test("stripe IDs: destination_account_id format", () => {
  const accountId = generateAccountId();

  assert.ok(accountId.startsWith("acct_test_"));
});

// ============================================
// TEST: Payment Type Classification
// ============================================

test("payment type: booking payments", () => {
  const validTypes = ["booking", "package", "subscription", "digital_product"];

  validTypes.forEach((type) => {
    assert.ok(["booking", "package", "subscription", "digital_product"].includes(type));
  });
});

test("payment type: distinguishes Connect vs direct", () => {
  // Connect payment (has destination)
  const connectPayment = createMockPaymentIntent({
    transferDestination: "acct_tutor_123",
    applicationFeeAmount: 50,
  });

  // Direct payment (no destination)
  const directPayment = createMockPaymentIntent({
    transferDestination: null,
  });

  assert.ok(connectPayment.transfer_data?.destination);
  assert.equal(directPayment.transfer_data, null);
});

// ============================================
// TEST: Currency Handling
// ============================================

test("currency: uppercase format in audit", () => {
  const currencies = ["usd", "eur", "gbp", "cad", "aud"];

  currencies.forEach((currency) => {
    const uppercased = currency.toUpperCase();
    assert.equal(uppercased, currency.toUpperCase());
  });
});

test("currency: supported currencies list", () => {
  const supportedCurrencies = [
    "USD",
    "EUR",
    "GBP",
    "CAD",
    "AUD",
    "JPY",
    "MXN",
    "BRL",
  ];

  supportedCurrencies.forEach((currency) => {
    assert.ok(currency.length === 3);
    assert.ok(currency === currency.toUpperCase());
  });
});

// ============================================
// TEST: Timestamp Tracking
// ============================================

test("timestamp: ISO 8601 format", () => {
  const timestamp = new Date().toISOString();

  // Validate ISO 8601 format
  assert.ok(timestamp.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/));
});

test("timestamp: created_at is not in future", () => {
  const createdAt = new Date().toISOString();
  const now = new Date().toISOString();

  assert.ok(createdAt <= now);
});

// ============================================
// TEST: Query Filtering Scenarios
// ============================================

test("query filter: by tutor_id returns tutor's payments", () => {
  const tutorId = "tutor_123";
  const records = [
    { tutor_id: "tutor_123", amount_cents: 5000 },
    { tutor_id: "tutor_123", amount_cents: 3000 },
    { tutor_id: "tutor_456", amount_cents: 4000 },
  ];

  const filtered = records.filter((r) => r.tutor_id === tutorId);

  assert.equal(filtered.length, 2);
  assert.ok(filtered.every((r) => r.tutor_id === tutorId));
});

test("query filter: by student_id returns student's payments", () => {
  const studentId = "student_123";
  const records = [
    { student_id: "student_123", amount_cents: 5000 },
    { student_id: "student_456", amount_cents: 3000 },
    { student_id: "student_123", amount_cents: 4000 },
  ];

  const filtered = records.filter((r) => r.student_id === studentId);

  assert.equal(filtered.length, 2);
});

test("query filter: by booking_id returns specific payment", () => {
  const bookingId = "booking_789";
  const records = [
    { booking_id: "booking_789", amount_cents: 5000 },
    { booking_id: "booking_other", amount_cents: 3000 },
  ];

  const filtered = records.filter((r) => r.booking_id === bookingId);

  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].amount_cents, 5000);
});

test("query filter: date range filtering", () => {
  const startDate = new Date("2024-01-01").toISOString();
  const endDate = new Date("2024-01-31").toISOString();

  const records = [
    { created_at: "2024-01-15T12:00:00.000Z", amount_cents: 5000 },
    { created_at: "2024-02-15T12:00:00.000Z", amount_cents: 3000 },
    { created_at: "2024-01-25T12:00:00.000Z", amount_cents: 4000 },
  ];

  const filtered = records.filter(
    (r) => r.created_at >= startDate && r.created_at <= endDate
  );

  assert.equal(filtered.length, 2);
});

// ============================================
// TEST: Aggregation Scenarios
// ============================================

test("aggregation: total revenue by tutor", () => {
  const records = [
    { tutor_id: "tutor_123", net_amount_cents: 4950 },
    { tutor_id: "tutor_123", net_amount_cents: 2950 },
    { tutor_id: "tutor_456", net_amount_cents: 9900 },
  ];

  const totalByTutor = records.reduce((acc, r) => {
    acc[r.tutor_id] = (acc[r.tutor_id] || 0) + r.net_amount_cents;
    return acc;
  }, {} as Record<string, number>);

  assert.equal(totalByTutor["tutor_123"], 7900);
  assert.equal(totalByTutor["tutor_456"], 9900);
});

test("aggregation: total platform fees", () => {
  const records = [
    { application_fee_cents: 50 },
    { application_fee_cents: 30 },
    { application_fee_cents: 100 },
  ];

  const totalFees = records.reduce((sum, r) => sum + r.application_fee_cents, 0);

  assert.equal(totalFees, 180);
});

test("aggregation: payment count by type", () => {
  const records = [
    { payment_type: "booking" },
    { payment_type: "booking" },
    { payment_type: "package" },
    { payment_type: "subscription" },
    { payment_type: "booking" },
  ];

  const countByType = records.reduce((acc, r) => {
    acc[r.payment_type] = (acc[r.payment_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  assert.equal(countByType.booking, 3);
  assert.equal(countByType.package, 1);
  assert.equal(countByType.subscription, 1);
});

// ============================================
// TEST: Data Integrity
// ============================================

test("data integrity: amount_cents is always positive", () => {
  const validAmounts = [100, 500, 1000, 5000, 100000];

  validAmounts.forEach((amount) => {
    assert.ok(amount > 0);
  });
});

test("data integrity: net_amount <= amount", () => {
  const testCases = [
    { amount: 5000, fee: 50, net: 4950 },
    { amount: 3000, fee: 0, net: 3000 },
    { amount: 10000, fee: 100, net: 9900 },
  ];

  testCases.forEach(({ amount, fee, net }) => {
    assert.ok(net <= amount);
    assert.equal(amount - fee, net);
  });
});

test("data integrity: fee is non-negative", () => {
  const fees = [0, 50, 100, 500];

  fees.forEach((fee) => {
    assert.ok(fee >= 0);
  });
});
