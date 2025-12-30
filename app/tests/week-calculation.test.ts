import { describe, it } from "node:test";
import assert from "node:assert";

/**
 * Tests for the week calculation logic used in Teaching Activity bar charts.
 * These functions are duplicated in:
 * - components/analytics/premium/UtilizationChart.tsx
 * - components/analytics/engagement-chart.tsx
 */

// Get the Monday-Sunday range for the current week
function getCurrentWeekRange(referenceDate: Date = new Date()) {
  const dayOfWeek = referenceDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
  // Calculate offset to Monday: if Sunday (0), go back 6 days; else go back (day - 1) days
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const monday = new Date(referenceDate);
  monday.setDate(referenceDate.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return { start: monday, end: sunday };
}

// Format date to YYYY-MM-DD in local timezone
function toLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Format date for week range display
function formatWeekRange(start: Date, end: Date): string {
  const startStr = start.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const endStr = end.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${startStr} - ${endStr}`;
}

describe("Week Calculation Logic", () => {
  describe("getCurrentWeekRange", () => {
    it("returns Monday when reference is Monday", () => {
      // Monday, December 30, 2024
      const monday = new Date(2024, 11, 30); // Note: month is 0-indexed
      const { start, end } = getCurrentWeekRange(monday);

      assert.strictEqual(start.getDay(), 1, "Start should be Monday");
      assert.strictEqual(toLocalDateString(start), "2024-12-30");
      assert.strictEqual(end.getDay(), 0, "End should be Sunday");
      assert.strictEqual(toLocalDateString(end), "2025-01-05");
    });

    it("returns correct Monday when reference is Wednesday", () => {
      // Wednesday, January 1, 2025
      const wednesday = new Date(2025, 0, 1);
      const { start, end } = getCurrentWeekRange(wednesday);

      assert.strictEqual(start.getDay(), 1, "Start should be Monday");
      assert.strictEqual(toLocalDateString(start), "2024-12-30");
      assert.strictEqual(toLocalDateString(end), "2025-01-05");
    });

    it("returns correct Monday when reference is Sunday", () => {
      // Sunday, January 5, 2025
      const sunday = new Date(2025, 0, 5);
      const { start, end } = getCurrentWeekRange(sunday);

      assert.strictEqual(start.getDay(), 1, "Start should be Monday");
      assert.strictEqual(toLocalDateString(start), "2024-12-30");
      assert.strictEqual(toLocalDateString(end), "2025-01-05");
    });

    it("returns correct Monday when reference is Saturday", () => {
      // Saturday, January 4, 2025
      const saturday = new Date(2025, 0, 4);
      const { start, end } = getCurrentWeekRange(saturday);

      assert.strictEqual(start.getDay(), 1, "Start should be Monday");
      assert.strictEqual(toLocalDateString(start), "2024-12-30");
      assert.strictEqual(toLocalDateString(end), "2025-01-05");
    });

    it("handles year boundary correctly", () => {
      // Tuesday, December 31, 2024
      const newYearsEve = new Date(2024, 11, 31);
      const { start, end } = getCurrentWeekRange(newYearsEve);

      assert.strictEqual(toLocalDateString(start), "2024-12-30");
      assert.strictEqual(toLocalDateString(end), "2025-01-05");
    });

    it("week span is exactly 7 days", () => {
      const referenceDate = new Date(2025, 0, 15);
      const { start, end } = getCurrentWeekRange(referenceDate);

      const diffMs = end.getTime() - start.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);

      // Should be 6 days + some hours (from midnight Monday to end of Sunday)
      assert.ok(diffDays >= 6 && diffDays < 7, `Expected ~6.99 days, got ${diffDays}`);
    });
  });

  describe("toLocalDateString", () => {
    it("formats date correctly", () => {
      const date = new Date(2025, 0, 15);
      assert.strictEqual(toLocalDateString(date), "2025-01-15");
    });

    it("pads single-digit month and day", () => {
      const date = new Date(2025, 0, 5);
      assert.strictEqual(toLocalDateString(date), "2025-01-05");
    });

    it("handles December correctly", () => {
      const date = new Date(2024, 11, 25);
      assert.strictEqual(toLocalDateString(date), "2024-12-25");
    });
  });

  describe("formatWeekRange", () => {
    it("formats week range correctly", () => {
      const start = new Date(2024, 11, 30);
      const end = new Date(2025, 0, 5);
      const result = formatWeekRange(start, end);

      assert.strictEqual(result, "Dec 30 - Jan 5");
    });

    it("formats same-month range correctly", () => {
      const start = new Date(2025, 0, 6);
      const end = new Date(2025, 0, 12);
      const result = formatWeekRange(start, end);

      assert.strictEqual(result, "Jan 6 - Jan 12");
    });
  });

  describe("Chart data generation", () => {
    it("generates 7 data points for the week", () => {
      const referenceDate = new Date(2025, 0, 15);
      const { start } = getCurrentWeekRange(referenceDate);

      const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      const chartData = daysOfWeek.map((dayName, index) => {
        const targetDate = new Date(start);
        targetDate.setDate(start.getDate() + index);
        return {
          dayName,
          date: toLocalDateString(targetDate),
          lessonCount: 0,
        };
      });

      assert.strictEqual(chartData.length, 7);
      assert.strictEqual(chartData[0].dayName, "Mon");
      assert.strictEqual(chartData[6].dayName, "Sun");
    });

    it("correctly maps engagement data to chart data", () => {
      const referenceDate = new Date(2025, 0, 15); // Wednesday
      const { start } = getCurrentWeekRange(referenceDate);

      // Simulated engagement data from the backend
      const engagementData = [
        { date: "2025-01-13", lessonCount: 3, activeStudentCount: 2 }, // Monday
        { date: "2025-01-15", lessonCount: 5, activeStudentCount: 4 }, // Wednesday
        { date: "2025-01-17", lessonCount: 2, activeStudentCount: 1 }, // Friday
      ];

      const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      const chartData = daysOfWeek.map((dayName, index) => {
        const targetDate = new Date(start);
        targetDate.setDate(start.getDate() + index);
        const dateStr = toLocalDateString(targetDate);

        const dayData = engagementData.find((d) => d.date === dateStr);
        return {
          dayName,
          date: dateStr,
          lessonCount: dayData?.lessonCount ?? 0,
        };
      });

      // Monday (Jan 13) should have 3 lessons
      assert.strictEqual(chartData[0].lessonCount, 3);
      // Tuesday (Jan 14) should have 0 lessons
      assert.strictEqual(chartData[1].lessonCount, 0);
      // Wednesday (Jan 15) should have 5 lessons
      assert.strictEqual(chartData[2].lessonCount, 5);
      // Friday (Jan 17) should have 2 lessons
      assert.strictEqual(chartData[4].lessonCount, 2);
      // Sunday should have 0 lessons
      assert.strictEqual(chartData[6].lessonCount, 0);
    });

    it("calculates total lessons for the week", () => {
      const chartData = [
        { dayName: "Mon", date: "2025-01-13", lessonCount: 3 },
        { dayName: "Tue", date: "2025-01-14", lessonCount: 0 },
        { dayName: "Wed", date: "2025-01-15", lessonCount: 5 },
        { dayName: "Thu", date: "2025-01-16", lessonCount: 0 },
        { dayName: "Fri", date: "2025-01-17", lessonCount: 2 },
        { dayName: "Sat", date: "2025-01-18", lessonCount: 1 },
        { dayName: "Sun", date: "2025-01-19", lessonCount: 0 },
      ];

      const totalLessons = chartData.reduce((sum, d) => sum + d.lessonCount, 0);
      assert.strictEqual(totalLessons, 11);
    });
  });
});
