/**
 * K6 Load Test: Booking Endpoints
 *
 * Tests the booking flow performance including:
 * - Public booking page load
 * - Service listing
 * - Availability checking
 * - Checkout session creation
 *
 * Run: k6 run k6/scripts/booking-endpoints.js
 * With env: k6 run -e BASE_URL=https://staging.tutorlingua.co k6/scripts/booking-endpoints.js
 */

import { sleep, group } from "k6";
import { Trend, Counter, Rate } from "k6/metrics";
import { BOOKING_OPTIONS, ENV } from "./common/config.js";
import {
  publicGet,
  publicPost,
  checkSuccess,
  checkApiResponse,
  randomEmail,
  randomPhone,
  getFutureDate,
} from "./common/helpers.js";

// Custom metrics
const bookingPageDuration = new Trend("booking_page_duration", true);
const availabilityCheckDuration = new Trend("availability_check_duration", true);
const checkoutCreationDuration = new Trend("checkout_creation_duration", true);
const bookingSuccessRate = new Rate("booking_success_rate");
const bookingErrors = new Counter("booking_errors");

export const options = BOOKING_OPTIONS;

// Test configuration
const TEST_USERNAME = ENV.TEST_USERNAME;

export default function () {
  // Group 1: Load booking page
  group("Booking Page Load", () => {
    const response = publicGet(`/book/${TEST_USERNAME}`, {
      tags: { name: "booking_page" },
    });

    bookingPageDuration.add(response.timings.duration);

    const success = checkSuccess(response, "booking_page");
    bookingSuccessRate.add(success);
    if (!success) {
      bookingErrors.add(1);
    }
  });

  sleep(1);

  // Group 2: Check availability
  group("Availability Check", () => {
    const nextWeek = getFutureDate(7);
    const response = publicGet(
      `/api/availability?username=${TEST_USERNAME}&date=${encodeURIComponent(nextWeek)}`,
      { tags: { name: "availability_check" } }
    );

    availabilityCheckDuration.add(response.timings.duration);

    const success = checkApiResponse(response, "availability_check", 500);
    bookingSuccessRate.add(success);
    if (!success) {
      bookingErrors.add(1);
    }
  });

  sleep(0.5);

  // Group 3: Service listing (if API exists)
  group("Service Listing", () => {
    const response = publicGet(`/api/services?username=${TEST_USERNAME}`, {
      tags: { name: "service_listing" },
    });

    // Service listing might return 404 if not implemented as API
    if (response.status !== 404) {
      checkApiResponse(response, "service_listing", 400);
    }
  });

  sleep(0.5);

  // Group 4: Simulated checkout creation (POST to booking endpoint)
  // Note: This creates a booking intent without completing payment
  group("Checkout Creation Simulation", () => {
    const bookingData = {
      tutorUsername: TEST_USERNAME,
      studentEmail: randomEmail(),
      studentName: "Load Test User",
      studentPhone: randomPhone(),
      scheduledAt: getFutureDate(7),
      timezone: "America/New_York",
      serviceId: "test-service-id", // Will likely fail but tests endpoint performance
      notes: "K6 load test booking",
    };

    const response = publicPost("/api/booking/validate", bookingData, {
      tags: { name: "checkout_creation" },
    });

    checkoutCreationDuration.add(response.timings.duration);

    // Accept 400/404 as valid since we're using fake data
    // We're testing response time, not business logic
    const isAcceptable = response.status >= 200 && response.status < 500;
    bookingSuccessRate.add(isAcceptable);
    if (!isAcceptable) {
      bookingErrors.add(1);
    }
  });

  sleep(2);
}

export function handleSummary(data) {
  return {
    "k6/results/booking-endpoints-summary.json": JSON.stringify(data, null, 2),
    stdout: generateTextSummary(data),
  };
}

function generateTextSummary(data) {
  const metrics = data.metrics;

  let summary = `
╔══════════════════════════════════════════════════════════════════╗
║              BOOKING ENDPOINTS LOAD TEST SUMMARY                  ║
╠══════════════════════════════════════════════════════════════════╣
║ Environment: ${ENV.BASE_URL.padEnd(50)}║
╠══════════════════════════════════════════════════════════════════╣

📊 RESPONSE TIMES
─────────────────────────────────────────────────────────────────────
`;

  if (metrics.booking_page_duration) {
    const p95 = metrics.booking_page_duration.values["p(95)"] || 0;
    const status = p95 < 500 ? "✅ PASS" : "❌ FAIL";
    summary += `Booking Page p95:      ${p95.toFixed(0)}ms (target: <500ms) ${status}\n`;
  }

  if (metrics.availability_check_duration) {
    const p95 = metrics.availability_check_duration.values["p(95)"] || 0;
    const status = p95 < 500 ? "✅ PASS" : "❌ FAIL";
    summary += `Availability Check p95: ${p95.toFixed(0)}ms (target: <500ms) ${status}\n`;
  }

  if (metrics.checkout_creation_duration) {
    const p95 = metrics.checkout_creation_duration.values["p(95)"] || 0;
    const status = p95 < 1000 ? "✅ PASS" : "❌ FAIL";
    summary += `Checkout Creation p95:  ${p95.toFixed(0)}ms (target: <1000ms) ${status}\n`;
  }

  summary += `
📈 ERROR RATES
─────────────────────────────────────────────────────────────────────
`;

  if (metrics.http_req_failed) {
    const errorRate = (metrics.http_req_failed.values.rate * 100).toFixed(2);
    const status = parseFloat(errorRate) < 1 ? "✅ PASS" : "❌ FAIL";
    summary += `HTTP Request Failures: ${errorRate}% (target: <1%) ${status}\n`;
  }

  if (metrics.booking_success_rate) {
    const successRate = (metrics.booking_success_rate.values.rate * 100).toFixed(2);
    summary += `Booking Success Rate:  ${successRate}%\n`;
  }

  summary += `
╚══════════════════════════════════════════════════════════════════╝
`;

  return summary;
}
