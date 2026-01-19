/**
 * K6 Load Testing Helpers
 *
 * Shared utilities for authentication, setup, and common operations.
 */

import http from "k6/http";
import { check, fail } from "k6";
import { ENV } from "./config.js";

/**
 * Get default headers for authenticated requests
 */
export function getAuthHeaders() {
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  if (ENV.AUTH_TOKEN) {
    headers["Authorization"] = `Bearer ${ENV.AUTH_TOKEN}`;
  }

  return headers;
}

/**
 * Get headers for public (unauthenticated) requests
 */
export function getPublicHeaders() {
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

/**
 * Build full URL from path
 */
export function buildUrl(path) {
  const base = ENV.BASE_URL.replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}

/**
 * Check if response is successful (2xx status code)
 */
export function checkSuccess(response, name = "request") {
  const passed = check(response, {
    [`${name} status is 2xx`]: (r) => r.status >= 200 && r.status < 300,
    [`${name} response time < 2s`]: (r) => r.timings.duration < 2000,
  });

  if (!passed) {
    console.warn(`${name} failed: status=${response.status}, body=${response.body?.substring(0, 200)}`);
  }

  return passed;
}

/**
 * Check API response with custom thresholds
 */
export function checkApiResponse(response, name, maxDurationMs = 800) {
  return check(response, {
    [`${name} status is 2xx`]: (r) => r.status >= 200 && r.status < 300,
    [`${name} response time < ${maxDurationMs}ms`]: (r) =>
      r.timings.duration < maxDurationMs,
    [`${name} has valid JSON`]: (r) => {
      try {
        JSON.parse(r.body);
        return true;
      } catch {
        return false;
      }
    },
  });
}

/**
 * Make authenticated GET request
 */
export function authGet(path, params = {}) {
  const url = buildUrl(path);
  const response = http.get(url, {
    headers: getAuthHeaders(),
    tags: params.tags || {},
    ...params,
  });
  return response;
}

/**
 * Make authenticated POST request
 */
export function authPost(path, body = {}, params = {}) {
  const url = buildUrl(path);
  const response = http.post(url, JSON.stringify(body), {
    headers: getAuthHeaders(),
    tags: params.tags || {},
    ...params,
  });
  return response;
}

/**
 * Make public GET request (no auth)
 */
export function publicGet(path, params = {}) {
  const url = buildUrl(path);
  const response = http.get(url, {
    headers: getPublicHeaders(),
    tags: params.tags || {},
    ...params,
  });
  return response;
}

/**
 * Make public POST request (no auth)
 */
export function publicPost(path, body = {}, params = {}) {
  const url = buildUrl(path);
  const response = http.post(url, JSON.stringify(body), {
    headers: getPublicHeaders(),
    tags: params.tags || {},
    ...params,
  });
  return response;
}

/**
 * Random sleep between min and max milliseconds
 */
export function randomSleep(minMs, maxMs) {
  const sleepTime = Math.random() * (maxMs - minMs) + minMs;
  return new Promise((resolve) => setTimeout(resolve, sleepTime));
}

/**
 * Generate a random email for testing
 */
export function randomEmail() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  return `test-${timestamp}-${random}@example.com`;
}

/**
 * Generate random phone number
 */
export function randomPhone() {
  return `+1${Math.floor(1000000000 + Math.random() * 9000000000)}`;
}

/**
 * Get a future date ISO string
 */
export function getFutureDate(daysFromNow = 7) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  date.setHours(10, 0, 0, 0);
  return date.toISOString();
}
