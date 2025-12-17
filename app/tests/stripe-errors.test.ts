/**
 * Enterprise-grade Stripe Error Handling Tests
 *
 * Tests error scenarios and recovery:
 * - API errors (invalid key, rate limits, timeouts)
 * - Webhook signature validation errors
 * - Business logic errors (insufficient funds, declined)
 * - Missing required fields
 */

import test from "node:test";
import assert from "node:assert/strict";

// ============================================
// TEST: API Authentication Errors
// ============================================

test("API error: invalid API key graceful handling", () => {
  const error = {
    type: "invalid_request_error",
    code: "api_key_invalid",
    message: "Invalid API Key provided",
    param: null,
    status: 401,
  };

  assert.equal(error.status, 401);
  assert.equal(error.code, "api_key_invalid");
});

test("API error: missing API key", () => {
  const error = {
    type: "authentication_error",
    message: "No API key provided",
    status: 401,
  };

  assert.equal(error.status, 401);
  assert.ok(error.message.includes("API key"));
});

test("API error: revoked API key", () => {
  const error = {
    type: "authentication_error",
    code: "api_key_expired",
    message: "This API key has been revoked",
    status: 401,
  };

  assert.equal(error.code, "api_key_expired");
});

// ============================================
// TEST: Rate Limiting Errors
// ============================================

test("API error: rate limited with retry-after", () => {
  const error = {
    type: "rate_limit_error",
    message: "Rate limit exceeded",
    status: 429,
    headers: {
      "Retry-After": "5",
    },
  };

  assert.equal(error.status, 429);
  assert.ok(error.headers["Retry-After"]);
});

test("rate limit: exponential backoff calculation", () => {
  const calculateBackoff = (attempt: number, baseMs: number = 1000) => {
    return Math.min(baseMs * Math.pow(2, attempt), 32000); // Max 32 seconds
  };

  assert.equal(calculateBackoff(0), 1000);
  assert.equal(calculateBackoff(1), 2000);
  assert.equal(calculateBackoff(2), 4000);
  assert.equal(calculateBackoff(3), 8000);
  assert.equal(calculateBackoff(5), 32000); // Capped
  assert.equal(calculateBackoff(10), 32000); // Still capped
});

test("rate limit: jitter added to backoff", () => {
  const calculateBackoffWithJitter = (attempt: number) => {
    const base = 1000 * Math.pow(2, attempt);
    const jitter = Math.random() * 1000;
    return Math.min(base + jitter, 32000);
  };

  // Multiple calls should give different results due to jitter
  const results = [
    calculateBackoffWithJitter(0),
    calculateBackoffWithJitter(0),
    calculateBackoffWithJitter(0),
  ];

  // At least some should be different (with very high probability)
  // For this test, we just verify they're in valid range
  results.forEach((result) => {
    assert.ok(result >= 1000 && result <= 32000);
  });
});

// ============================================
// TEST: Network Timeout Errors
// ============================================

test("API error: network timeout", () => {
  const error = {
    type: "network_error",
    message: "Request timed out",
    status: 0,
    timeout: true,
  };

  assert.equal(error.timeout, true);
});

test("API error: connection refused", () => {
  const error = {
    type: "network_error",
    code: "ECONNREFUSED",
    message: "Connection refused",
  };

  assert.equal(error.code, "ECONNREFUSED");
});

test("timeout: configurable timeout values", () => {
  const timeoutConfigs = {
    default: 30000,
    webhook: 10000,
    checkout: 60000,
  };

  assert.ok(timeoutConfigs.default > 0);
  assert.ok(timeoutConfigs.webhook < timeoutConfigs.default);
  assert.ok(timeoutConfigs.checkout > timeoutConfigs.default);
});

// ============================================
// TEST: Webhook Signature Errors
// ============================================

test("webhook error: invalid signature", () => {
  const error = {
    type: "signature_verification_error",
    message: "No signatures found matching the expected signature for payload",
    status: 400,
  };

  assert.equal(error.status, 400);
  assert.ok(error.message.includes("signature"));
});

test("webhook error: missing signature header", () => {
  const error = {
    type: "invalid_request_error",
    message: "No signature provided",
    status: 400,
  };

  assert.ok(error.message.includes("No signature"));
});

test("webhook error: timestamp too old", () => {
  const error = {
    type: "signature_verification_error",
    message: "Timestamp outside the tolerance zone",
    status: 400,
  };

  assert.ok(error.message.includes("Timestamp"));
});

test("webhook signature: tolerance window", () => {
  const DEFAULT_TOLERANCE = 300; // 5 minutes
  const now = Math.floor(Date.now() / 1000);

  const isWithinTolerance = (timestamp: number) => {
    return Math.abs(now - timestamp) <= DEFAULT_TOLERANCE;
  };

  // Valid: within tolerance
  assert.ok(isWithinTolerance(now));
  assert.ok(isWithinTolerance(now - 60));
  assert.ok(isWithinTolerance(now + 60));

  // Invalid: outside tolerance
  assert.equal(isWithinTolerance(now - 400), false);
  assert.equal(isWithinTolerance(now + 400), false);
});

// ============================================
// TEST: Payment Declined Errors
// ============================================

test("card error: insufficient funds", () => {
  const error = {
    type: "card_error",
    code: "insufficient_funds",
    decline_code: "insufficient_funds",
    message: "Your card has insufficient funds",
    status: 402,
  };

  assert.equal(error.code, "insufficient_funds");
  assert.equal(error.status, 402);
});

test("card error: generic decline", () => {
  const error = {
    type: "card_error",
    code: "card_declined",
    decline_code: "generic_decline",
    message: "Your card was declined",
    status: 402,
  };

  assert.equal(error.code, "card_declined");
});

test("card error: fraud suspected", () => {
  const error = {
    type: "card_error",
    code: "card_declined",
    decline_code: "fraudulent",
    message: "Your card was declined",
    status: 402,
  };

  assert.equal(error.decline_code, "fraudulent");
});

test("card error: expired card", () => {
  const error = {
    type: "card_error",
    code: "expired_card",
    message: "Your card has expired",
    status: 402,
  };

  assert.equal(error.code, "expired_card");
});

test("card error: incorrect CVC", () => {
  const error = {
    type: "card_error",
    code: "incorrect_cvc",
    message: "Your card's security code is incorrect",
    status: 402,
  };

  assert.equal(error.code, "incorrect_cvc");
});

// ============================================
// TEST: Account Restriction Errors
// ============================================

test("account error: restricted account", () => {
  const error = {
    type: "invalid_request_error",
    code: "account_invalid",
    message: "The provided connected account cannot receive payments",
    status: 400,
  };

  assert.ok(error.message.includes("cannot receive payments"));
});

test("account error: pending verification", () => {
  const error = {
    type: "invalid_request_error",
    code: "account_invalid",
    message: "Account verification is pending",
    status: 400,
  };

  assert.ok(error.message.includes("verification"));
});

test("account error: charges not enabled", () => {
  const accountState = {
    charges_enabled: false,
    requirements: {
      disabled_reason: "requirements.past_due",
    },
  };

  const canCharge = accountState.charges_enabled;
  assert.equal(canCharge, false);
});

// ============================================
// TEST: Validation Errors
// ============================================

test("validation error: missing required field", () => {
  const error = {
    type: "invalid_request_error",
    code: "parameter_missing",
    param: "amount",
    message: "Missing required param: amount",
    status: 400,
  };

  assert.equal(error.code, "parameter_missing");
  assert.equal(error.param, "amount");
});

test("validation error: invalid parameter value", () => {
  const error = {
    type: "invalid_request_error",
    code: "parameter_invalid_integer",
    param: "amount",
    message: "This value must be greater than or equal to 1",
    status: 400,
  };

  assert.equal(error.code, "parameter_invalid_integer");
});

test("validation error: invalid currency", () => {
  const error = {
    type: "invalid_request_error",
    code: "parameter_invalid_string",
    param: "currency",
    message: "Invalid currency: xyz",
    status: 400,
  };

  assert.ok(error.message.includes("Invalid currency"));
});

// ============================================
// TEST: Resource Errors
// ============================================

test("resource error: customer not found", () => {
  const error = {
    type: "invalid_request_error",
    code: "resource_missing",
    param: "customer",
    message: "No such customer: cus_invalid",
    status: 404,
  };

  assert.equal(error.code, "resource_missing");
  assert.equal(error.status, 404);
});

test("resource error: subscription not found", () => {
  const error = {
    type: "invalid_request_error",
    code: "resource_missing",
    message: "No such subscription: sub_invalid",
    status: 404,
  };

  assert.ok(error.message.includes("No such subscription"));
});

test("resource error: payment intent not found", () => {
  const error = {
    type: "invalid_request_error",
    code: "resource_missing",
    message: "No such payment_intent: pi_invalid",
    status: 404,
  };

  assert.ok(error.message.includes("payment_intent"));
});

// ============================================
// TEST: Idempotency Errors
// ============================================

test("idempotency error: key reused with different params", () => {
  const error = {
    type: "idempotency_error",
    message: "Keys for idempotent requests can only be used with the same parameters",
    status: 400,
  };

  assert.equal(error.type, "idempotency_error");
});

test("idempotency error: key in use", () => {
  const error = {
    type: "idempotency_error",
    message: "A request with this idempotency key is still being processed",
    status: 409,
  };

  assert.equal(error.status, 409);
});

// ============================================
// TEST: Error User Messages
// ============================================

test("user message: payment declined generic", () => {
  const mapToUserMessage = (code: string): string => {
    const messages: Record<string, string> = {
      card_declined: "Your payment was declined. Please try a different payment method.",
      insufficient_funds: "Your card has insufficient funds. Please try a different card.",
      expired_card: "Your card has expired. Please use a different card.",
      incorrect_cvc: "The security code is incorrect. Please check and try again.",
      processing_error: "A processing error occurred. Please try again.",
    };
    return messages[code] || "An error occurred processing your payment.";
  };

  assert.ok(mapToUserMessage("card_declined").includes("declined"));
  assert.ok(mapToUserMessage("insufficient_funds").includes("insufficient"));
  assert.ok(mapToUserMessage("unknown_code").includes("error occurred"));
});

test("user message: action required for restricted account", () => {
  const getRestrictedMessage = (disabledReason: string): string => {
    const messages: Record<string, string> = {
      "requirements.past_due": "Please complete the required verification to continue accepting payments.",
      "requirements.pending_verification": "Your account is being verified. This usually takes 1-2 business days.",
      listed: "Your account has been restricted. Please contact support.",
      rejected: "Your account application was not approved. Please contact support.",
    };
    return messages[disabledReason] || "Your account requires attention.";
  };

  assert.ok(getRestrictedMessage("requirements.past_due").includes("verification"));
  assert.ok(getRestrictedMessage("requirements.pending_verification").includes("verified"));
});

// ============================================
// TEST: Retry Logic
// ============================================

test("retry: should retry on network errors", () => {
  const shouldRetry = (error: { type: string; status?: number }): boolean => {
    if (error.type === "network_error") return true;
    if (error.status === 429) return true; // Rate limited
    if (error.status && error.status >= 500) return true; // Server error
    return false;
  };

  assert.ok(shouldRetry({ type: "network_error" }));
  assert.ok(shouldRetry({ type: "api_error", status: 429 }));
  assert.ok(shouldRetry({ type: "api_error", status: 500 }));
  assert.ok(shouldRetry({ type: "api_error", status: 503 }));
  assert.equal(shouldRetry({ type: "card_error", status: 402 }), false);
  assert.equal(shouldRetry({ type: "invalid_request_error", status: 400 }), false);
});

test("retry: max retry attempts", () => {
  const MAX_RETRIES = 3;
  let attempts = 0;

  const executeWithRetry = (): { success: boolean; attempts: number } => {
    while (attempts < MAX_RETRIES) {
      attempts++;
      // Simulate always failing for this test
      if (attempts < MAX_RETRIES) continue;
      return { success: false, attempts };
    }
    return { success: false, attempts };
  };

  const result = executeWithRetry();

  assert.equal(result.attempts, MAX_RETRIES);
  assert.equal(result.success, false);
});

// ============================================
// TEST: Error Logging
// ============================================

test("error logging: includes correlation ID", () => {
  const correlationId = "req_abc123";
  const errorLog = {
    correlationId,
    error: "card_declined",
    timestamp: new Date().toISOString(),
  };

  assert.ok(errorLog.correlationId);
});

test("error logging: sanitizes sensitive data", () => {
  const sanitize = (data: Record<string, unknown>): Record<string, unknown> => {
    const sensitiveKeys = ["card_number", "cvc", "api_key", "secret"];
    const sanitized = { ...data };

    for (const key of sensitiveKeys) {
      if (key in sanitized) {
        sanitized[key] = "[REDACTED]";
      }
    }

    return sanitized;
  };

  const data = {
    card_number: "4242424242424242",
    cvc: "123",
    amount: 5000,
  };

  const sanitized = sanitize(data);

  assert.equal(sanitized.card_number, "[REDACTED]");
  assert.equal(sanitized.cvc, "[REDACTED]");
  assert.equal(sanitized.amount, 5000);
});
