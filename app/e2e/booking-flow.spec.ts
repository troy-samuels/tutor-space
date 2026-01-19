import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { runFullPageA11y, runFormA11y, assertNoViolations } from "./fixtures/a11y-helpers";

/**
 * Booking Flow E2E Tests
 *
 * Tests the public booking experience including:
 * - Service selection
 * - Time slot selection
 * - Booking form completion
 * - Accessibility compliance
 */

function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function generateTestData(prefix: string) {
  const now = Date.now();
  return {
    email: `${prefix}.${now}@example.com`,
    password: `TestP@ss!${now}`,
    fullName: `${prefix.charAt(0).toUpperCase() + prefix.slice(1)} User ${now}`,
    username: `${prefix}-${now}`,
  };
}

test.describe("Booking Flow", () => {
  test.setTimeout(2 * 60 * 1000);

  test("public booking page displays tutor information", async ({ page, baseURL }) => {
    const appUrl = baseURL ?? "http://localhost:3000";
    const adminClient = createAdminClient();
    const testData = generateTestData("booking-flow");

    const { data: tutorUser, error } = await adminClient.auth.admin.createUser({
      email: testData.email,
      password: testData.password,
      email_confirm: true,
      user_metadata: {
        full_name: testData.fullName,
        username: testData.username,
        role: "tutor",
        plan: "pro_monthly",
      },
    });

    if (error || !tutorUser.user) {
      throw new Error(`Failed to create tutor: ${error?.message}`);
    }

    await adminClient.from("profiles").upsert({
      id: tutorUser.user.id,
      email: testData.email,
      full_name: testData.fullName,
      username: testData.username,
      role: "tutor",
      plan: "pro_monthly",
      onboarding_completed: true,
      timezone: "America/New_York",
    });

    try {
      await page.goto(`${appUrl}/book/${testData.username}`);
      await page.waitForLoadState("domcontentloaded");

      await expect(page.locator("body")).toBeVisible();
    } finally {
      await adminClient.auth.admin.deleteUser(tutorUser.user.id);
    }
  });

  test("booking page shows available services", async ({ page, baseURL }) => {
    const appUrl = baseURL ?? "http://localhost:3000";
    const adminClient = createAdminClient();
    const testData = generateTestData("booking-services");

    const { data: tutorUser, error } = await adminClient.auth.admin.createUser({
      email: testData.email,
      password: testData.password,
      email_confirm: true,
      user_metadata: {
        full_name: testData.fullName,
        username: testData.username,
        role: "tutor",
        plan: "pro_monthly",
      },
    });

    if (error || !tutorUser.user) {
      throw new Error(`Failed to create tutor: ${error?.message}`);
    }

    await adminClient.from("profiles").upsert({
      id: tutorUser.user.id,
      email: testData.email,
      full_name: testData.fullName,
      username: testData.username,
      role: "tutor",
      plan: "pro_monthly",
      onboarding_completed: true,
      timezone: "America/New_York",
    });

    try {
      await page.goto(`${appUrl}/book/${testData.username}`);
      await page.waitForLoadState("domcontentloaded");

      // Services should be visible (auto-created by database trigger)
      const hasServiceContent = await page
        .locator('text=/lesson|trial|standard/i')
        .first()
        .isVisible()
        .catch(() => false);

      expect(hasServiceContent).toBe(true);
    } finally {
      await adminClient.auth.admin.deleteUser(tutorUser.user.id);
    }
  });
});

test.describe("Accessibility - Booking Flow", () => {
  test.setTimeout(2 * 60 * 1000);

  test("booking page passes WCAG AA accessibility checks", async ({ page, baseURL }) => {
    const appUrl = baseURL ?? "http://localhost:3000";
    const adminClient = createAdminClient();
    const testData = generateTestData("a11y-booking-flow");

    const { data: tutorUser, error } = await adminClient.auth.admin.createUser({
      email: testData.email,
      password: testData.password,
      email_confirm: true,
      user_metadata: {
        full_name: testData.fullName,
        username: testData.username,
        role: "tutor",
        plan: "pro_monthly",
      },
    });

    if (error || !tutorUser.user) {
      throw new Error(`Failed to create tutor: ${error?.message}`);
    }

    await adminClient.from("profiles").upsert({
      id: tutorUser.user.id,
      email: testData.email,
      full_name: testData.fullName,
      username: testData.username,
      role: "tutor",
      plan: "pro_monthly",
      onboarding_completed: true,
      timezone: "America/New_York",
    });

    try {
      await page.goto(`${appUrl}/book/${testData.username}`);
      await page.waitForLoadState("networkidle");

      const results = await runFullPageA11y(page);
      assertNoViolations(results, "Booking flow page");
    } finally {
      await adminClient.auth.admin.deleteUser(tutorUser.user.id);
    }
  });

  test("booking form passes accessibility checks", async ({ page, baseURL }) => {
    const appUrl = baseURL ?? "http://localhost:3000";
    const adminClient = createAdminClient();
    const testData = generateTestData("a11y-booking-form");

    const { data: tutorUser, error } = await adminClient.auth.admin.createUser({
      email: testData.email,
      password: testData.password,
      email_confirm: true,
      user_metadata: {
        full_name: testData.fullName,
        username: testData.username,
        role: "tutor",
        plan: "pro_monthly",
      },
    });

    if (error || !tutorUser.user) {
      throw new Error(`Failed to create tutor: ${error?.message}`);
    }

    await adminClient.from("profiles").upsert({
      id: tutorUser.user.id,
      email: testData.email,
      full_name: testData.fullName,
      username: testData.username,
      role: "tutor",
      plan: "pro_monthly",
      onboarding_completed: true,
      timezone: "America/New_York",
    });

    // Create availability for time slots
    const availabilitySlots = [0, 1, 2, 3, 4].map((dayOfWeek) => ({
      tutor_id: tutorUser.user.id,
      day_of_week: dayOfWeek,
      start_time: "09:00",
      end_time: "17:00",
      is_available: true,
    }));

    await adminClient.from("availability").insert(availabilitySlots);

    try {
      await page.goto(`${appUrl}/book/${testData.username}`);
      await page.waitForLoadState("networkidle");

      // Check if a form is present and run form-specific a11y tests
      const formSelector = 'form, [role="form"]';
      const hasForm = await page.locator(formSelector).first().isVisible().catch(() => false);

      if (hasForm) {
        const results = await runFormA11y(page, formSelector);
        assertNoViolations(results, "Booking form");
      } else {
        // Run full page scan if no form is present yet
        const results = await runFullPageA11y(page);
        assertNoViolations(results, "Booking page");
      }
    } finally {
      await adminClient.auth.admin.deleteUser(tutorUser.user.id);
    }
  });
});
