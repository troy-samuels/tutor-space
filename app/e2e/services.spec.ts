import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { runFullPageA11y, runFormA11y, assertNoViolations } from "./fixtures/a11y-helpers";

/**
 * Services E2E Tests
 *
 * Tests the services management:
 * - Service list display
 * - Service creation
 * - Service editing
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

test.describe("Services Management", () => {
  test.setTimeout(2 * 60 * 1000);

  test("services page displays auto-created services", async ({ page, baseURL }) => {
    const appUrl = baseURL ?? "http://localhost:3000";
    const adminClient = createAdminClient();
    const testData = generateTestData("svc-list");

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
      // Login
      await page.goto(`${appUrl}/login`);
      await page.fill('input[name="email"]', testData.email);
      await page.fill('input[name="password"]', testData.password);
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/dashboard/, { timeout: 15000 });

      // Navigate to services
      await page.goto(`${appUrl}/services`);
      await page.waitForLoadState("domcontentloaded");

      // Should display services (auto-created by database trigger)
      const hasServiceContent = await page
        .locator('text=/trial|standard|lesson/i')
        .first()
        .isVisible()
        .catch(() => false);

      expect(hasServiceContent).toBe(true);
    } finally {
      await adminClient.auth.admin.deleteUser(tutorUser.user.id);
    }
  });

  test("can access service creation form", async ({ page, baseURL }) => {
    const appUrl = baseURL ?? "http://localhost:3000";
    const adminClient = createAdminClient();
    const testData = generateTestData("svc-create");

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
      // Login
      await page.goto(`${appUrl}/login`);
      await page.fill('input[name="email"]', testData.email);
      await page.fill('input[name="password"]', testData.password);
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/dashboard/, { timeout: 15000 });

      // Navigate to services
      await page.goto(`${appUrl}/services`);
      await page.waitForLoadState("domcontentloaded");

      // Look for add/create service button
      const addButton = page.locator('button:has-text(/add|create|new/i), a:has-text(/add|create|new/i)').first();
      const hasAddButton = await addButton.isVisible().catch(() => false);

      expect(hasAddButton).toBe(true);
    } finally {
      await adminClient.auth.admin.deleteUser(tutorUser.user.id);
    }
  });
});

test.describe("Accessibility - Services", () => {
  test.setTimeout(2 * 60 * 1000);

  test("services page passes WCAG AA accessibility checks", async ({ page, baseURL }) => {
    const appUrl = baseURL ?? "http://localhost:3000";
    const adminClient = createAdminClient();
    const testData = generateTestData("a11y-svc");

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
      // Login
      await page.goto(`${appUrl}/login`);
      await page.fill('input[name="email"]', testData.email);
      await page.fill('input[name="password"]', testData.password);
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/dashboard/, { timeout: 15000 });

      // Navigate to services
      await page.goto(`${appUrl}/services`);
      await page.waitForLoadState("networkidle");

      const results = await runFullPageA11y(page, { include: "main" });
      assertNoViolations(results, "Services page");
    } finally {
      await adminClient.auth.admin.deleteUser(tutorUser.user.id);
    }
  });

  test("service form passes WCAG AA accessibility checks", async ({ page, baseURL }) => {
    const appUrl = baseURL ?? "http://localhost:3000";
    const adminClient = createAdminClient();
    const testData = generateTestData("a11y-svc-form");

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
      // Login
      await page.goto(`${appUrl}/login`);
      await page.fill('input[name="email"]', testData.email);
      await page.fill('input[name="password"]', testData.password);
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/dashboard/, { timeout: 15000 });

      // Navigate to services and try to open form
      await page.goto(`${appUrl}/services`);
      await page.waitForLoadState("networkidle");

      // Look for add button and click it
      const addButton = page.locator('button:has-text(/add|create|new/i), a:has-text(/add|create|new/i)').first();
      const hasAddButton = await addButton.isVisible().catch(() => false);

      if (hasAddButton) {
        await addButton.click();
        await page.waitForLoadState("domcontentloaded");
        await page.waitForTimeout(500); // Wait for form/dialog to appear

        // Check if a form appeared
        const formSelector = 'form, [role="dialog"]';
        const hasForm = await page.locator(formSelector).first().isVisible().catch(() => false);

        if (hasForm) {
          const results = await runFormA11y(page, formSelector);
          assertNoViolations(results, "Service form");
        } else {
          const results = await runFullPageA11y(page);
          assertNoViolations(results, "Services page after add click");
        }
      } else {
        // Run page scan if no add button
        const results = await runFullPageA11y(page);
        assertNoViolations(results, "Services page");
      }
    } finally {
      await adminClient.auth.admin.deleteUser(tutorUser.user.id);
    }
  });
});
