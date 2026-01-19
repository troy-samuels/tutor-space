import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { runFullPageA11y, runFormA11y, assertNoViolations } from "./fixtures/a11y-helpers";

/**
 * Settings E2E Tests
 *
 * Tests the settings pages:
 * - Profile settings
 * - Calendar settings
 * - Billing settings
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

test.describe("Settings Pages", () => {
  test.setTimeout(2 * 60 * 1000);

  test("profile settings page loads", async ({ page, baseURL }) => {
    const appUrl = baseURL ?? "http://localhost:3000";
    const adminClient = createAdminClient();
    const testData = generateTestData("settings-profile");

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

      // Navigate to profile settings
      await page.goto(`${appUrl}/settings/profile`);
      await page.waitForLoadState("domcontentloaded");

      await expect(page.locator("body")).toBeVisible();
    } finally {
      await adminClient.auth.admin.deleteUser(tutorUser.user.id);
    }
  });

  test("calendar settings page loads", async ({ page, baseURL }) => {
    const appUrl = baseURL ?? "http://localhost:3000";
    const adminClient = createAdminClient();
    const testData = generateTestData("settings-calendar");

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

      // Navigate to calendar settings
      await page.goto(`${appUrl}/settings/calendar`);
      await page.waitForLoadState("domcontentloaded");

      await expect(page.locator("body")).toBeVisible();
    } finally {
      await adminClient.auth.admin.deleteUser(tutorUser.user.id);
    }
  });
});

test.describe("Accessibility - Settings", () => {
  test.setTimeout(2 * 60 * 1000);

  test("profile settings page passes WCAG AA accessibility checks", async ({ page, baseURL }) => {
    const appUrl = baseURL ?? "http://localhost:3000";
    const adminClient = createAdminClient();
    const testData = generateTestData("a11y-profile");

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

      // Navigate to profile settings
      await page.goto(`${appUrl}/settings/profile`);
      await page.waitForLoadState("networkidle");

      const results = await runFullPageA11y(page, { include: "main" });
      assertNoViolations(results, "Profile settings page");
    } finally {
      await adminClient.auth.admin.deleteUser(tutorUser.user.id);
    }
  });

  test("calendar settings page passes WCAG AA accessibility checks", async ({ page, baseURL }) => {
    const appUrl = baseURL ?? "http://localhost:3000";
    const adminClient = createAdminClient();
    const testData = generateTestData("a11y-calendar");

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

      // Navigate to calendar settings
      await page.goto(`${appUrl}/settings/calendar`);
      await page.waitForLoadState("networkidle");

      const results = await runFullPageA11y(page, { include: "main" });
      assertNoViolations(results, "Calendar settings page");
    } finally {
      await adminClient.auth.admin.deleteUser(tutorUser.user.id);
    }
  });

  test("profile form passes form-specific accessibility checks", async ({ page, baseURL }) => {
    const appUrl = baseURL ?? "http://localhost:3000";
    const adminClient = createAdminClient();
    const testData = generateTestData("a11y-profile-form");

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

      // Navigate to profile settings
      await page.goto(`${appUrl}/settings/profile`);
      await page.waitForLoadState("networkidle");

      // Run form-specific a11y checks
      const formSelector = 'form, [role="form"]';
      const hasForm = await page.locator(formSelector).first().isVisible().catch(() => false);

      if (hasForm) {
        const results = await runFormA11y(page, formSelector);
        assertNoViolations(results, "Profile settings form");
      } else {
        const results = await runFullPageA11y(page);
        assertNoViolations(results, "Profile settings page");
      }
    } finally {
      await adminClient.auth.admin.deleteUser(tutorUser.user.id);
    }
  });
});
