/**
 * K6 Load Test: Calendar Rendering Performance
 *
 * Tests calendar view performance including:
 * - Month view data loading
 * - Week view data loading
 * - Day view data loading
 * - Event aggregation
 *
 * Run: k6 run k6/scripts/calendar-rendering.js
 * With auth: k6 run -e AUTH_TOKEN=your_token k6/scripts/calendar-rendering.js
 */

import { sleep, group } from "k6";
import { Trend, Counter, Rate } from "k6/metrics";
import { CALENDAR_OPTIONS, ENV } from "./common/config.js";
import { authGet, checkApiResponse, buildUrl } from "./common/helpers.js";
import http from "k6/http";

// Custom metrics
const monthViewDuration = new Trend("calendar_month_duration", true);
const weekViewDuration = new Trend("calendar_week_duration", true);
const dayViewDuration = new Trend("calendar_day_duration", true);
const eventLoadDuration = new Trend("calendar_event_load_duration", true);
const calendarSuccessRate = new Rate("calendar_success_rate");
const calendarErrors = new Counter("calendar_errors");

export const options = CALENDAR_OPTIONS;

// Get date helpers
function getMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

function getWeekRange() {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const start = new Date(now);
  start.setDate(now.getDate() - dayOfWeek);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

function getDayRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(start);
  end.setDate(start.getDate() + 1);
  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

export default function () {
  // Check if we have auth token
  const hasAuth = !!ENV.AUTH_TOKEN;

  // Group 1: Month View Data
  group("Calendar Month View", () => {
    const { start, end } = getMonthRange();
    const response = authGet(
      `/api/calendar/events?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}&view=month`,
      { tags: { name: "calendar_month" } }
    );

    monthViewDuration.add(response.timings.duration);

    // Accept 401 if no auth token
    const isValid =
      (response.status >= 200 && response.status < 300) ||
      (!hasAuth && response.status === 401);

    calendarSuccessRate.add(isValid);
    if (!isValid) {
      calendarErrors.add(1);
      console.warn(`Month view failed: ${response.status}`);
    }
  });

  sleep(0.5);

  // Group 2: Week View Data
  group("Calendar Week View", () => {
    const { start, end } = getWeekRange();
    const response = authGet(
      `/api/calendar/events?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}&view=week`,
      { tags: { name: "calendar_week" } }
    );

    weekViewDuration.add(response.timings.duration);

    const isValid =
      (response.status >= 200 && response.status < 300) ||
      (!hasAuth && response.status === 401);

    calendarSuccessRate.add(isValid);
    if (!isValid) {
      calendarErrors.add(1);
    }
  });

  sleep(0.5);

  // Group 3: Day View Data
  group("Calendar Day View", () => {
    const { start, end } = getDayRange();
    const response = authGet(
      `/api/calendar/events?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}&view=day`,
      { tags: { name: "calendar_day" } }
    );

    dayViewDuration.add(response.timings.duration);

    const isValid =
      (response.status >= 200 && response.status < 300) ||
      (!hasAuth && response.status === 401);

    calendarSuccessRate.add(isValid);
    if (!isValid) {
      calendarErrors.add(1);
    }
  });

  sleep(0.5);

  // Group 4: Daily Lessons Sidebar
  group("Daily Lessons Load", () => {
    const today = new Date().toISOString().split("T")[0];
    const response = authGet(`/api/calendar/daily-lessons?date=${today}`, {
      tags: { name: "daily_lessons" },
    });

    eventLoadDuration.add(response.timings.duration);

    const isValid =
      (response.status >= 200 && response.status < 300) ||
      (!hasAuth && response.status === 401) ||
      response.status === 404; // Endpoint might not exist

    calendarSuccessRate.add(isValid);
  });

  sleep(1);

  // Group 5: Concurrent Calendar Requests (simulating view switch)
  group("View Switch Simulation", () => {
    const { start: monthStart, end: monthEnd } = getMonthRange();
    const { start: weekStart, end: weekEnd } = getWeekRange();

    // Batch requests to simulate quick view switching
    const responses = http.batch([
      [
        "GET",
        buildUrl(
          `/api/calendar/events?start=${encodeURIComponent(monthStart)}&end=${encodeURIComponent(monthEnd)}&view=month`
        ),
        null,
        { tags: { name: "batch_month" } },
      ],
      [
        "GET",
        buildUrl(
          `/api/calendar/events?start=${encodeURIComponent(weekStart)}&end=${encodeURIComponent(weekEnd)}&view=week`
        ),
        null,
        { tags: { name: "batch_week" } },
      ],
    ]);

    // Check batch results
    let batchSuccess = true;
    for (const response of responses) {
      const isValid =
        (response.status >= 200 && response.status < 300) ||
        (!hasAuth && response.status === 401);
      if (!isValid) {
        batchSuccess = false;
      }
    }

    calendarSuccessRate.add(batchSuccess);
  });

  sleep(2);
}

export function handleSummary(data) {
  return {
    "k6/results/calendar-rendering-summary.json": JSON.stringify(data, null, 2),
    stdout: generateTextSummary(data),
  };
}

function generateTextSummary(data) {
  const metrics = data.metrics;

  let summary = `
╔══════════════════════════════════════════════════════════════════╗
║            CALENDAR RENDERING LOAD TEST SUMMARY                   ║
╠══════════════════════════════════════════════════════════════════╣
║ Environment: ${ENV.BASE_URL.padEnd(50)}║
║ Authenticated: ${(!!ENV.AUTH_TOKEN).toString().padEnd(47)}║
╠══════════════════════════════════════════════════════════════════╣

📊 RESPONSE TIMES BY VIEW
─────────────────────────────────────────────────────────────────────
`;

  if (metrics.calendar_month_duration) {
    const p95 = metrics.calendar_month_duration.values["p(95)"] || 0;
    const status = p95 < 600 ? "✅ PASS" : "❌ FAIL";
    summary += `Month View p95:    ${p95.toFixed(0)}ms (target: <600ms) ${status}\n`;
  }

  if (metrics.calendar_week_duration) {
    const p95 = metrics.calendar_week_duration.values["p(95)"] || 0;
    const status = p95 < 500 ? "✅ PASS" : "❌ FAIL";
    summary += `Week View p95:     ${p95.toFixed(0)}ms (target: <500ms) ${status}\n`;
  }

  if (metrics.calendar_day_duration) {
    const p95 = metrics.calendar_day_duration.values["p(95)"] || 0;
    const status = p95 < 400 ? "✅ PASS" : "❌ FAIL";
    summary += `Day View p95:      ${p95.toFixed(0)}ms (target: <400ms) ${status}\n`;
  }

  if (metrics.calendar_event_load_duration) {
    const p95 = metrics.calendar_event_load_duration.values["p(95)"] || 0;
    summary += `Event Load p95:    ${p95.toFixed(0)}ms\n`;
  }

  summary += `
📈 RELIABILITY
─────────────────────────────────────────────────────────────────────
`;

  if (metrics.http_req_failed) {
    const errorRate = (metrics.http_req_failed.values.rate * 100).toFixed(2);
    const status = parseFloat(errorRate) < 1 ? "✅ PASS" : "❌ FAIL";
    summary += `HTTP Request Failures: ${errorRate}% (target: <1%) ${status}\n`;
  }

  if (metrics.calendar_success_rate) {
    const successRate = (metrics.calendar_success_rate.values.rate * 100).toFixed(2);
    summary += `Calendar Success Rate: ${successRate}%\n`;
  }

  summary += `
📝 REQUEST COUNTS
─────────────────────────────────────────────────────────────────────
`;

  if (metrics.http_reqs) {
    summary += `Total Requests:    ${metrics.http_reqs.values.count}\n`;
    summary += `Requests/second:   ${metrics.http_reqs.values.rate.toFixed(2)}\n`;
  }

  summary += `
╚══════════════════════════════════════════════════════════════════╝
`;

  return summary;
}
