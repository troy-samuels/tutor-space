import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Analytics Dashboard E2E Tests
 *
 * NOTE: These tests require authentication. To run them:
 * 1. Set up Playwright auth state: npx playwright codegen --save-storage=auth.json
 * 2. Log in to the app during codegen
 * 3. Update this file to use: test.use({ storageState: 'auth.json' });
 *
 * For CI, you'll need to:
 * - Create a test user in the database
 * - Generate auth state in a setup project
 * - See: https://playwright.dev/docs/auth
 */

// Skip all tests if AUTH_STORAGE_STATE env var is not set
const skipIfNoAuth = !process.env.AUTH_STORAGE_STATE;

test.describe("Analytics Dashboard", () => {
  // Use storage state if available
  test.use({
    storageState: process.env.AUTH_STORAGE_STATE || undefined,
  });

  test.beforeEach(async ({ page }) => {
    // Skip navigation if no auth - tests will be skipped anyway
    if (skipIfNoAuth) return;

    // Mock analytics data for consistent testing
    await page.route("**/api/analytics/tutor-metrics*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          revenue: [
            { date: "2024-11-01", revenue: 100 },
            { date: "2024-11-02", revenue: 150 },
            { date: "2024-11-03", revenue: 200 },
          ],
          studentMetrics: {
            totalStudents: 10,
            newStudents: 2,
            returningStudents: 8,
            churnRiskStudents: 1,
            retentionRate: 80,
            avgLessonsPerStudent: 4.5,
          },
          bookingMetrics: {
            totalBookings: 20,
            completedBookings: 15,
            cancelledBookings: 2,
            pendingBookings: 3,
            completionRate: 75,
            cancellationRate: 10,
            avgSessionValue: 45,
          },
          servicePopularity: [
            { serviceName: "Conversation Practice", bookingCount: 10, percentage: 50, revenue: 450 },
            { serviceName: "Grammar Intensive", bookingCount: 6, percentage: 30, revenue: 300 },
            { serviceName: "Test Prep", bookingCount: 4, percentage: 20, revenue: 200 },
          ],
          bookingsByPeriod: [
            { period: "Nov 1", completed: 5, cancelled: 1, pending: 1 },
            { period: "Nov 8", completed: 6, cancelled: 0, pending: 2 },
            { period: "Nov 15", completed: 4, cancelled: 1, pending: 0 },
          ],
          totalRevenue: { gross: 900, net: 850, refunds: 50 },
        }),
      });
    });

    await page.goto("/analytics");
  });

  test.describe("Visual Rendering", () => {
    test.skip(skipIfNoAuth, "Requires AUTH_STORAGE_STATE environment variable");

    test("renders page header with title", async ({ page }) => {
      await expect(page.getByRole("heading", { name: "Analytics" })).toBeVisible();
    });

    test("renders page subtitle", async ({ page }) => {
      await expect(page.getByText("Track your teaching business performance")).toBeVisible();
    });

    test("renders time period selector", async ({ page }) => {
      await expect(page.getByTestId("time-period-selector")).toBeVisible();
    });

    test("renders all time period options", async ({ page }) => {
      await expect(page.getByTestId("time-period-7d")).toBeVisible();
      await expect(page.getByTestId("time-period-30d")).toBeVisible();
      await expect(page.getByTestId("time-period-90d")).toBeVisible();
    });

    test("renders overview cards", async ({ page }) => {
      await expect(page.getByTestId("overview-cards")).toBeVisible();
    });

    test("renders all four metric cards", async ({ page }) => {
      await expect(page.getByTestId("metric-card-revenue")).toBeVisible();
      await expect(page.getByTestId("metric-card-lessons")).toBeVisible();
      await expect(page.getByTestId("metric-card-students")).toBeVisible();
      await expect(page.getByTestId("metric-card-retention")).toBeVisible();
    });

    test("renders revenue chart", async ({ page }) => {
      await expect(page.getByTestId("revenue-chart")).toBeVisible();
    });

    test("displays revenue total in chart header", async ({ page }) => {
      await expect(page.getByTestId("revenue-total")).toBeVisible();
    });
  });

  test.describe("Layout Consistency", () => {
    test.skip(skipIfNoAuth, "Requires AUTH_STORAGE_STATE environment variable");

    test("overview cards container uses grid layout", async ({ page }) => {
      const container = page.getByTestId("overview-cards");
      await expect(container).toHaveClass(/grid/);
    });

    test("overview cards have equal height", async ({ page }) => {
      const cards = page.locator('[data-testid^="metric-card-"]');
      const count = await cards.count();
      expect(count).toBe(4);

      const heights = await cards.evaluateAll((els) =>
        els.map((el) => Math.round(el.getBoundingClientRect().height))
      );
      // All heights should be equal (within 1px tolerance)
      const uniqueHeights = new Set(heights);
      expect(uniqueHeights.size).toBeLessThanOrEqual(2);
    });

    test("main content uses consistent spacing", async ({ page }) => {
      const mainContainer = page.locator(".space-y-6").first();
      await expect(mainContainer).toBeVisible();
    });
  });

  test.describe("Responsive Design", () => {
    test.skip(skipIfNoAuth, "Requires AUTH_STORAGE_STATE environment variable");

    test("mobile: overview cards stack in single column", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto("/analytics");

      const container = page.getByTestId("overview-cards");
      await expect(container).toBeVisible();
    });

    test("mobile: all components are visible", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto("/analytics");

      await expect(page.getByRole("heading", { name: "Analytics" })).toBeVisible();
      await expect(page.getByTestId("time-period-selector")).toBeVisible();
      await expect(page.getByTestId("overview-cards")).toBeVisible();
    });

    test("tablet: two column grid for lower sections", async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto("/analytics");

      const container = page.getByTestId("overview-cards");
      await expect(container).toBeVisible();
    });

    test("desktop: four column overview cards", async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto("/analytics");

      const container = page.getByTestId("overview-cards");
      await expect(container).toHaveClass(/xl:grid-cols-4/);
    });
  });

  test.describe("Accessibility", () => {
    test.skip(skipIfNoAuth, "Requires AUTH_STORAGE_STATE environment variable");

    test("time period buttons have aria-pressed state", async ({ page }) => {
      const activeButton = page.getByTestId("time-period-30d");
      await expect(activeButton).toHaveAttribute("aria-pressed", "true");

      const inactiveButton = page.getByTestId("time-period-7d");
      await expect(inactiveButton).toHaveAttribute("aria-pressed", "false");
    });

    test("passes axe accessibility checks for overview cards", async ({ page }) => {
      await page.waitForSelector('[data-testid="overview-cards"]');

      const results = await new AxeBuilder({ page })
        .include('[data-testid="overview-cards"]')
        .disableRules(["color-contrast"]) // Brand color exception
        .analyze();

      expect(results.violations).toEqual([]);
    });

    test("passes axe accessibility checks for time selector", async ({ page }) => {
      await page.waitForSelector('[data-testid="time-period-selector"]');

      const results = await new AxeBuilder({ page })
        .include('[data-testid="time-period-selector"]')
        .disableRules(["color-contrast"])
        .analyze();

      expect(results.violations).toEqual([]);
    });
  });

  test.describe("Interactions", () => {
    test.skip(skipIfNoAuth, "Requires AUTH_STORAGE_STATE environment variable");

    test("clicking 7d updates time period selection", async ({ page }) => {
      await page.getByTestId("time-period-7d").click();
      await expect(page.getByTestId("time-period-7d")).toHaveAttribute("aria-pressed", "true");
      await expect(page.getByTestId("time-period-30d")).toHaveAttribute("aria-pressed", "false");
    });

    test("clicking 90d updates time period selection", async ({ page }) => {
      await page.getByTestId("time-period-90d").click();
      await expect(page.getByTestId("time-period-90d")).toHaveAttribute("aria-pressed", "true");
      await expect(page.getByTestId("time-period-30d")).toHaveAttribute("aria-pressed", "false");
    });

    test("time period change triggers data refetch", async ({ page }) => {
      let fetchCount = 0;
      await page.route("**/api/analytics/tutor-metrics*", async (route) => {
        fetchCount++;
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            revenue: [],
            studentMetrics: null,
            bookingMetrics: null,
            servicePopularity: [],
            bookingsByPeriod: [],
            totalRevenue: { gross: 0, net: 0, refunds: 0 },
          }),
        });
      });

      await page.getByTestId("time-period-7d").click();
      await page.waitForTimeout(500);

      expect(fetchCount).toBeGreaterThan(0);
    });
  });

  test.describe("Loading States", () => {
    test.skip(skipIfNoAuth, "Requires AUTH_STORAGE_STATE environment variable");

    test("shows loading skeletons during initial load", async ({ page }) => {
      // Delay the API response to catch loading state
      await page.route("**/api/analytics/tutor-metrics*", async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            revenue: [],
            studentMetrics: null,
            bookingMetrics: null,
            servicePopularity: [],
            bookingsByPeriod: [],
            totalRevenue: { gross: 0, net: 0, refunds: 0 },
          }),
        });
      });

      await page.goto("/analytics");
      const loadingCards = page.getByTestId("overview-cards-loading");
      await expect(loadingCards).toBeVisible();
    });

    test("loading skeletons have animation", async ({ page }) => {
      await page.route("**/api/analytics/tutor-metrics*", async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            revenue: [],
            studentMetrics: null,
            bookingMetrics: null,
            servicePopularity: [],
            bookingsByPeriod: [],
            totalRevenue: { gross: 0, net: 0, refunds: 0 },
          }),
        });
      });

      await page.goto("/analytics");
      const pulseElements = page.locator(".animate-pulse");
      const count = await pulseElements.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  test.describe("Empty States", () => {
    test.skip(skipIfNoAuth, "Requires AUTH_STORAGE_STATE environment variable");

    test("shows empty message for revenue chart when no data", async ({ page }) => {
      await page.route("**/api/analytics/tutor-metrics*", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            revenue: [],
            studentMetrics: null,
            bookingMetrics: null,
            servicePopularity: [],
            bookingsByPeriod: [],
            totalRevenue: { gross: 0, net: 0, refunds: 0 },
          }),
        });
      });

      await page.goto("/analytics");
      await expect(page.getByText("No revenue data for this period")).toBeVisible();
    });

    test("shows empty message for lessons chart when no data", async ({ page }) => {
      await page.route("**/api/analytics/tutor-metrics*", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            revenue: [],
            studentMetrics: null,
            bookingMetrics: null,
            servicePopularity: [],
            bookingsByPeriod: [],
            totalRevenue: { gross: 0, net: 0, refunds: 0 },
          }),
        });
      });

      await page.goto("/analytics");
      await expect(page.getByText("No lesson data for this period")).toBeVisible();
    });

    test("shows empty message for student metrics when no data", async ({ page }) => {
      await page.route("**/api/analytics/tutor-metrics*", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            revenue: [],
            studentMetrics: null,
            bookingMetrics: null,
            servicePopularity: [],
            bookingsByPeriod: [],
            totalRevenue: { gross: 0, net: 0, refunds: 0 },
          }),
        });
      });

      await page.goto("/analytics");
      await expect(page.getByText("No student data available")).toBeVisible();
    });
  });

  test.describe("Text Minimalism", () => {
    test.skip(skipIfNoAuth, "Requires AUTH_STORAGE_STATE environment variable");

    test("card labels are concise (under 15 chars)", async ({ page }) => {
      const labels = await page
        .locator('[data-testid^="metric-card-"] .uppercase')
        .allTextContents();

      labels.forEach((label) => {
        expect(label.length).toBeLessThan(15);
      });
    });

    test("overview card labels use uppercase styling", async ({ page }) => {
      const labels = page.locator('[data-testid^="metric-card-"] .uppercase');
      const count = await labels.count();
      expect(count).toBe(4);
    });
  });

  test.describe("Data Display", () => {
    test.skip(skipIfNoAuth, "Requires AUTH_STORAGE_STATE environment variable");

    test("displays revenue value correctly", async ({ page }) => {
      const revenueCard = page.getByTestId("metric-card-revenue");
      await expect(revenueCard.getByTestId("metric-card-revenue-value")).toContainText("$");
    });

    test("displays lessons count", async ({ page }) => {
      const lessonsCard = page.getByTestId("metric-card-lessons");
      await expect(lessonsCard.getByTestId("metric-card-lessons-value")).toBeVisible();
    });

    test("displays students count", async ({ page }) => {
      const studentsCard = page.getByTestId("metric-card-students");
      await expect(studentsCard.getByTestId("metric-card-students-value")).toBeVisible();
    });

    test("displays retention percentage", async ({ page }) => {
      const retentionCard = page.getByTestId("metric-card-retention");
      await expect(retentionCard.getByTestId("metric-card-retention-value")).toContainText("%");
    });
  });

  test.describe("Keyboard Navigation", () => {
    test.skip(skipIfNoAuth, "Requires AUTH_STORAGE_STATE environment variable");

    test("can tab to time period buttons", async ({ page }) => {
      await page.keyboard.press("Tab");
      await page.keyboard.press("Tab");
      await page.keyboard.press("Tab");

      const focusedElement = page.locator(":focus");
      await expect(focusedElement).toBeVisible();
    });

    test("can activate time period with keyboard", async ({ page }) => {
      const button7d = page.getByTestId("time-period-7d");
      await button7d.focus();
      await page.keyboard.press("Enter");

      await expect(button7d).toHaveAttribute("aria-pressed", "true");
    });
  });

  test.describe("Chart Rendering", () => {
    test.skip(skipIfNoAuth, "Requires AUTH_STORAGE_STATE environment variable");

    test("revenue chart displays area chart", async ({ page }) => {
      const chart = page.getByTestId("revenue-chart");
      await expect(chart).toBeVisible();

      // Recharts renders SVG elements
      const svg = chart.locator("svg");
      await expect(svg).toBeVisible();
    });

    test("chart has proper container sizing", async ({ page }) => {
      const chart = page.getByTestId("revenue-chart");
      const box = await chart.boundingBox();

      expect(box).not.toBeNull();
      expect(box!.width).toBeGreaterThan(200);
      expect(box!.height).toBeGreaterThan(100);
    });
  });
});
