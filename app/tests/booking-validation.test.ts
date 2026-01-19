import test from "node:test";
import assert from "node:assert/strict";

import { validateServicePricing } from "../lib/utils/booking-validation.ts";

test("validateServicePricing accepts matching payload", () => {
  const result = validateServicePricing({
    servicePriceCents: 5000,
    serviceCurrency: "usd",
    serviceDurationMinutes: 60,
    requestedAmount: 5000,
    requestedCurrency: "USD",
    requestedDuration: 60,
  });

  assert.deepStrictEqual(result, {
    success: true,
    priceCents: 5000,
    currency: "USD",
  });
});

test("validateServicePricing rejects mismatched amount", () => {
  const result = validateServicePricing({
    servicePriceCents: 5000,
    serviceCurrency: "usd",
    serviceDurationMinutes: 60,
    requestedAmount: 4500,
  });

  assert.deepStrictEqual(result, {
    success: false,
    error: "Invalid price for this service",
  });
});

test("validateServicePricing rejects mismatched currency", () => {
  const result = validateServicePricing({
    servicePriceCents: 5000,
    serviceCurrency: "usd",
    serviceDurationMinutes: 60,
    requestedCurrency: "EUR",
  });

  assert.deepStrictEqual(result, {
    success: false,
    error: "Invalid currency for this service",
  });
});

test("validateServicePricing rejects mismatched duration", () => {
  const result = validateServicePricing({
    servicePriceCents: 5000,
    serviceCurrency: "usd",
    serviceDurationMinutes: 60,
    requestedDuration: 30,
  });

  assert.deepStrictEqual(result, {
    success: false,
    error: "Selected duration does not match service settings",
  });
});

test("validateServicePricing allows free services", () => {
  const result = validateServicePricing({
    servicePriceCents: 0,
    serviceCurrency: "usd",
    serviceDurationMinutes: 30,
    requestedAmount: 0,
    requestedCurrency: "USD",
    requestedDuration: 30,
  });

  assert.deepStrictEqual(result, {
    success: true,
    priceCents: 0,
    currency: "USD",
  });
});

test("validateServicePricing rejects missing price", () => {
  const result = validateServicePricing({
    servicePriceCents: null,
    serviceCurrency: "usd",
    serviceDurationMinutes: 30,
  });

  assert.deepStrictEqual(result, {
    success: false,
    error: "Service price is not configured",
  });
});
