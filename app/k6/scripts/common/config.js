/**
 * K6 Load Testing Configuration
 *
 * Shared thresholds and configuration for load tests.
 */

export const THRESHOLDS = {
  // Booking endpoints
  booking_page_p95: 500, // p95 booking page < 500ms
  checkout_creation_p95: 1000, // p95 checkout creation < 1000ms

  // General API
  api_response_p95: 800, // p95 API response < 800ms
  api_response_p99: 1500, // p99 API response < 1500ms

  // Error rates
  error_rate_max: 0.01, // Error rate < 1%

  // Concurrent users baseline
  concurrent_users: 50,
};

export const DEFAULT_OPTIONS = {
  thresholds: {
    http_req_duration: [
      `p(95)<${THRESHOLDS.api_response_p95}`,
      `p(99)<${THRESHOLDS.api_response_p99}`,
    ],
    http_req_failed: [`rate<${THRESHOLDS.error_rate_max}`],
  },
  scenarios: {
    baseline: {
      executor: "constant-vus",
      vus: THRESHOLDS.concurrent_users,
      duration: "30s",
    },
  },
};

export const BOOKING_OPTIONS = {
  thresholds: {
    http_req_duration: [`p(95)<${THRESHOLDS.booking_page_p95}`],
    http_req_failed: [`rate<${THRESHOLDS.error_rate_max}`],
    "http_req_duration{name:booking_page}": [
      `p(95)<${THRESHOLDS.booking_page_p95}`,
    ],
    "http_req_duration{name:checkout_creation}": [
      `p(95)<${THRESHOLDS.checkout_creation_p95}`,
    ],
  },
  scenarios: {
    booking_flow: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "10s", target: 10 },
        { duration: "30s", target: THRESHOLDS.concurrent_users },
        { duration: "20s", target: THRESHOLDS.concurrent_users },
        { duration: "10s", target: 0 },
      ],
    },
  },
};

export const CALENDAR_OPTIONS = {
  thresholds: {
    http_req_duration: [`p(95)<${THRESHOLDS.api_response_p95}`],
    http_req_failed: [`rate<${THRESHOLDS.error_rate_max}`],
    "http_req_duration{name:calendar_month}": [`p(95)<600`],
    "http_req_duration{name:calendar_week}": [`p(95)<500`],
    "http_req_duration{name:calendar_day}": [`p(95)<400`],
  },
  scenarios: {
    calendar_views: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "10s", target: 20 },
        { duration: "30s", target: THRESHOLDS.concurrent_users },
        { duration: "20s", target: THRESHOLDS.concurrent_users },
        { duration: "10s", target: 0 },
      ],
    },
  },
};

export const ENV = {
  BASE_URL: __ENV.BASE_URL || "http://localhost:3000",
  AUTH_TOKEN: __ENV.AUTH_TOKEN || "",
  TEST_USERNAME: __ENV.TEST_USERNAME || "demo-tutor",
};
