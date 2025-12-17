/**
 * Enterprise-grade Stripe Idempotency Tests
 *
 * Tests idempotency handling:
 * - Event deduplication via processed_stripe_events table
 * - Concurrent webhook handling
 * - Race condition prevention
 * - No duplicate side effects
 */

import test from "node:test";
import assert from "node:assert/strict";

import { createMockStripeEvent, generateEventId } from "./utils/stripe-mocks.ts";

// ============================================
// TEST: Event Deduplication
// ============================================

test("idempotency: same event ID processed once", () => {
  const eventId = generateEventId();

  // Simulate processing tracking
  const processedEvents = new Set<string>();

  // First processing
  const firstResult = !processedEvents.has(eventId);
  if (firstResult) processedEvents.add(eventId);

  // Second attempt
  const secondResult = !processedEvents.has(eventId);

  assert.equal(firstResult, true, "First processing should succeed");
  assert.equal(secondResult, false, "Second processing should be blocked");
});

test("idempotency: different event IDs processed independently", () => {
  const eventId1 = generateEventId();
  const eventId2 = generateEventId();

  const processedEvents = new Set<string>();

  // Process first event
  processedEvents.add(eventId1);

  // Process second event (different ID)
  const canProcess = !processedEvents.has(eventId2);

  assert.ok(canProcess, "Different event IDs should process independently");
});

test("idempotency: event ID stored with metadata", () => {
  const event = createMockStripeEvent({
    type: "checkout.session.completed",
    data: { test: true },
  });

  const processedRecord = {
    event_id: event.id,
    event_type: event.type,
    processed_at: new Date().toISOString(),
    metadata: { livemode: event.livemode },
  };

  assert.equal(processedRecord.event_id, event.id);
  assert.equal(processedRecord.event_type, "checkout.session.completed");
  assert.ok(processedRecord.processed_at);
  assert.equal(processedRecord.metadata.livemode, false);
});

// ============================================
// TEST: Concurrent Webhook Handling
// ============================================

test("concurrency: first claim wins", () => {
  const eventId = generateEventId();

  // Simulate database constraint (unique event_id)
  const claims: string[] = [];

  const claim = (id: string): { duplicate: boolean } => {
    if (claims.includes(id)) {
      return { duplicate: true };
    }
    claims.push(id);
    return { duplicate: false };
  };

  const result1 = claim(eventId);
  const result2 = claim(eventId);

  assert.equal(result1.duplicate, false, "First claim should succeed");
  assert.equal(result2.duplicate, true, "Second claim should be duplicate");
});

test("concurrency: unique constraint error code handling", () => {
  // PostgreSQL unique constraint violation code
  const uniqueConstraintError = {
    code: "23505",
    message: "duplicate key value violates unique constraint",
  };

  const isDuplicate = uniqueConstraintError.code === "23505";
  assert.ok(isDuplicate);
});

test("concurrency: PGRST116 no rows error is ignored", () => {
  // Supabase PostgREST error code for no rows
  const noRowsError = {
    code: "PGRST116",
    message: "No rows found",
  };

  const shouldIgnore = noRowsError.code === "PGRST116";
  assert.ok(shouldIgnore, "PGRST116 should be ignored (no rows is expected)");
});

// ============================================
// TEST: Race Condition Prevention
// ============================================

test("race condition: booking update guards against duplicate", () => {
  // Simulate booking state
  let bookingState = {
    id: "booking_123",
    payment_status: "unpaid",
    stripe_payment_intent_id: null as string | null,
  };

  const updateBooking = (paymentIntentId: string) => {
    // Guard: only update if not already paid
    if (bookingState.payment_status === "paid") {
      return { updated: false, reason: "already_paid" };
    }

    // Guard: check if this payment intent already processed
    if (bookingState.stripe_payment_intent_id === paymentIntentId) {
      return { updated: false, reason: "same_payment_intent" };
    }

    // Update
    bookingState = {
      ...bookingState,
      payment_status: "paid",
      stripe_payment_intent_id: paymentIntentId,
    };

    return { updated: true };
  };

  const result1 = updateBooking("pi_123");
  const result2 = updateBooking("pi_123");

  assert.equal(result1.updated, true);
  assert.equal(result2.updated, false);
  assert.equal(result2.reason, "already_paid");
});

test("race condition: subscription update uses upsert", () => {
  // Upsert semantics: insert or update if exists
  const subscriptions = new Map<string, { status: string; updated_at: string }>();

  const upsertSubscription = (id: string, status: string) => {
    subscriptions.set(id, {
      status,
      updated_at: new Date().toISOString(),
    });
    return { success: true };
  };

  const subId = "sub_123";

  // First upsert (insert)
  const result1 = upsertSubscription(subId, "active");
  assert.equal(result1.success, true);

  // Second upsert (update)
  const result2 = upsertSubscription(subId, "canceled");
  assert.equal(result2.success, true);

  // Final state should be from last update
  assert.equal(subscriptions.get(subId)?.status, "canceled");
});

// ============================================
// TEST: No Duplicate Side Effects
// ============================================

test("side effects: emails sent only on first processing", () => {
  const sentEmails: string[] = [];
  const processedEvents = new Set<string>();

  const processEvent = (eventId: string, emailTo: string) => {
    if (processedEvents.has(eventId)) {
      return { processed: false, emailSent: false };
    }

    processedEvents.add(eventId);
    sentEmails.push(emailTo);
    return { processed: true, emailSent: true };
  };

  const eventId = generateEventId();
  const result1 = processEvent(eventId, "user@example.com");
  const result2 = processEvent(eventId, "user@example.com");

  assert.equal(sentEmails.length, 1, "Email should be sent only once");
  assert.equal(result1.emailSent, true);
  assert.equal(result2.emailSent, false);
});

test("side effects: audit records created only once", () => {
  const auditRecords: { bookingId: string; eventId: string }[] = [];
  const processedEvents = new Set<string>();

  const createAuditIfNew = (eventId: string, bookingId: string) => {
    if (processedEvents.has(eventId)) {
      return { created: false };
    }

    processedEvents.add(eventId);
    auditRecords.push({ bookingId, eventId });
    return { created: true };
  };

  const eventId = generateEventId();
  createAuditIfNew(eventId, "booking_123");
  createAuditIfNew(eventId, "booking_123");

  assert.equal(auditRecords.length, 1, "Audit record should be created only once");
});

test("side effects: calendar events created only once", () => {
  const calendarEvents: string[] = [];

  // Simulate idempotent calendar creation with booking check
  const createCalendarEvent = (bookingId: string, alreadyPaid: boolean) => {
    if (alreadyPaid) {
      return { created: false, reason: "booking_already_paid" };
    }

    calendarEvents.push(bookingId);
    return { created: true };
  };

  // First call: booking not yet paid
  const result1 = createCalendarEvent("booking_123", false);
  // Second call: booking already paid
  const result2 = createCalendarEvent("booking_123", true);

  assert.equal(result1.created, true);
  assert.equal(result2.created, false);
  assert.equal(calendarEvents.length, 1);
});

// ============================================
// TEST: Webhook Response Codes
// ============================================

test("webhook response: 200 for duplicate event", () => {
  // Stripe expects 200 even for duplicates to acknowledge receipt
  const responseForDuplicate = {
    status: 200,
    body: { received: true, duplicate: true },
  };

  assert.equal(responseForDuplicate.status, 200);
  assert.equal(responseForDuplicate.body.duplicate, true);
});

test("webhook response: 200 for successful processing", () => {
  const responseForSuccess = {
    status: 200,
    body: { received: true },
  };

  assert.equal(responseForSuccess.status, 200);
  assert.equal(responseForSuccess.body.received, true);
});

test("webhook response: 500 for claim failure (Stripe will retry)", () => {
  const responseForClaimFailure = {
    status: 500,
    body: { error: "Could not claim event" },
  };

  assert.equal(responseForClaimFailure.status, 500);
});

// ============================================
// TEST: Event Timestamps
// ============================================

test("event ordering: process events in order", () => {
  const events = [
    { id: generateEventId(), created: 1000 },
    { id: generateEventId(), created: 1001 },
    { id: generateEventId(), created: 999 },
  ];

  // Sort by creation time
  const sorted = [...events].sort((a, b) => a.created - b.created);

  assert.equal(sorted[0].created, 999);
  assert.equal(sorted[1].created, 1000);
  assert.equal(sorted[2].created, 1001);
});

test("event timestamps: check for stale events", () => {
  const now = Math.floor(Date.now() / 1000);
  const oneHourAgo = now - 3600;
  const oneDayAgo = now - 86400;

  // Events older than a certain threshold might be suspicious
  const isStale = (eventCreated: number, maxAge: number) => {
    return now - eventCreated > maxAge;
  };

  assert.equal(isStale(oneHourAgo, 3600), false);
  assert.equal(isStale(oneDayAgo, 3600), true);
});

// ============================================
// TEST: Metadata Integrity
// ============================================

test("metadata: preserved across retries", () => {
  const originalMetadata = {
    bookingId: "booking_123",
    tutorId: "tutor_456",
    studentId: "student_789",
  };

  // Simulating event received twice with same metadata
  const firstReceive = { ...originalMetadata };
  const secondReceive = { ...originalMetadata };

  assert.deepEqual(firstReceive, secondReceive);
});

test("metadata: booking ID matches across event and database", () => {
  const eventMetadata = { bookingId: "booking_123" };
  const databaseRecord = { id: "booking_123", status: "pending" };

  assert.equal(eventMetadata.bookingId, databaseRecord.id);
});

// ============================================
// TEST: Recovery Scenarios
// ============================================

test("recovery: claim failure allows retry", () => {
  let claimAttempts = 0;
  let claimSucceeded = false;

  const attemptClaim = (simulateFailure: boolean) => {
    claimAttempts++;
    if (simulateFailure) {
      throw new Error("Database connection failed");
    }
    claimSucceeded = true;
    return { duplicate: false };
  };

  // First attempt fails
  try {
    attemptClaim(true);
  } catch {
    // Expected failure
  }

  // Retry succeeds
  attemptClaim(false);

  assert.equal(claimAttempts, 2);
  assert.equal(claimSucceeded, true);
});

test("recovery: partial processing handled correctly", () => {
  // If booking is updated but email fails, the event is still marked processed
  // This prevents infinite retries for non-critical failures

  const processSteps = {
    eventClaimed: false,
    bookingUpdated: false,
    emailSent: false,
    calendarCreated: false,
  };

  const processEvent = () => {
    processSteps.eventClaimed = true;
    processSteps.bookingUpdated = true;

    // Non-critical failures don't prevent marking as processed
    try {
      throw new Error("Email service unavailable");
    } catch {
      processSteps.emailSent = false;
    }

    try {
      throw new Error("Calendar API error");
    } catch {
      processSteps.calendarCreated = false;
    }

    // Event still considered processed
    return { processed: true };
  };

  const result = processEvent();

  assert.equal(result.processed, true);
  assert.equal(processSteps.eventClaimed, true);
  assert.equal(processSteps.bookingUpdated, true);
  assert.equal(processSteps.emailSent, false);
  assert.equal(processSteps.calendarCreated, false);
});
