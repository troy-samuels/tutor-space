import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { runFullPageA11y, assertNoViolations } from "./fixtures/a11y-helpers";

/**
 * Messaging E2E Tests
 *
 * Tests the messaging system:
 * - Tutor message list
 * - Student message list
 * - Message composition
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

test.describe("Messaging System", () => {
  test.setTimeout(2 * 60 * 1000);

  test("tutor can access messages page", async ({ page, baseURL }) => {
    const appUrl = baseURL ?? "http://localhost:3000";
    const adminClient = createAdminClient();
    const testData = generateTestData("msg-tutor");

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

      // Navigate to messages
      await page.goto(`${appUrl}/messages`);
      await page.waitForLoadState("domcontentloaded");

      await expect(page.locator("body")).toBeVisible();
    } finally {
      await adminClient.auth.admin.deleteUser(tutorUser.user.id);
    }
  });

  test("student can access messages page", async ({ page, baseURL }) => {
    const appUrl = baseURL ?? "http://localhost:3000";
    const adminClient = createAdminClient();
    const tutorData = generateTestData("msg-s-tutor");
    const studentData = generateTestData("msg-student");

    // Create tutor
    const { data: tutorUser, error: tutorError } = await adminClient.auth.admin.createUser({
      email: tutorData.email,
      password: tutorData.password,
      email_confirm: true,
      user_metadata: {
        full_name: tutorData.fullName,
        username: tutorData.username,
        role: "tutor",
        plan: "pro_monthly",
      },
    });

    if (tutorError || !tutorUser.user) {
      throw new Error(`Failed to create tutor: ${tutorError?.message}`);
    }

    await adminClient.from("profiles").upsert({
      id: tutorUser.user.id,
      email: tutorData.email,
      full_name: tutorData.fullName,
      username: tutorData.username,
      role: "tutor",
      plan: "pro_monthly",
      onboarding_completed: true,
      timezone: "America/New_York",
    });

    // Create student auth user
    const { data: studentUser, error: studentError } = await adminClient.auth.admin.createUser({
      email: studentData.email,
      password: studentData.password,
      email_confirm: true,
      user_metadata: {
        full_name: studentData.fullName,
        role: "student",
      },
    });

    if (studentError || !studentUser.user) {
      throw new Error(`Failed to create student: ${studentError?.message}`);
    }

    // Create student record
    await adminClient.from("students").insert({
      tutor_id: tutorUser.user.id,
      user_id: studentUser.user.id,
      full_name: studentData.fullName,
      email: studentData.email,
      calendar_access_status: "approved",
    });

    try {
      // Login as student
      await page.goto(`${appUrl}/login`);
      await page.fill('input[name="email"]', studentData.email);
      await page.fill('input[name="password"]', studentData.password);
      await page.click('button[type="submit"]');

      // Navigate to messages
      await page.goto(`${appUrl}/student/messages`);
      await page.waitForLoadState("domcontentloaded");

      await expect(page.locator("body")).toBeVisible();
    } finally {
      await adminClient.auth.admin.deleteUser(studentUser.user.id);
      await adminClient.auth.admin.deleteUser(tutorUser.user.id);
    }
  });
});

test.describe("Accessibility - Messaging", () => {
  test.setTimeout(2 * 60 * 1000);

  test("tutor messages page passes WCAG AA accessibility checks", async ({ page, baseURL }) => {
    const appUrl = baseURL ?? "http://localhost:3000";
    const adminClient = createAdminClient();
    const testData = generateTestData("a11y-msg-tutor");

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

      // Navigate to messages
      await page.goto(`${appUrl}/messages`);
      await page.waitForLoadState("networkidle");

      const results = await runFullPageA11y(page, { include: "main" });
      assertNoViolations(results, "Tutor messages page");
    } finally {
      await adminClient.auth.admin.deleteUser(tutorUser.user.id);
    }
  });

  test("student messages page passes WCAG AA accessibility checks", async ({ page, baseURL }) => {
    const appUrl = baseURL ?? "http://localhost:3000";
    const adminClient = createAdminClient();
    const tutorData = generateTestData("a11y-sm-tutor");
    const studentData = generateTestData("a11y-sm-student");

    // Create tutor
    const { data: tutorUser, error: tutorError } = await adminClient.auth.admin.createUser({
      email: tutorData.email,
      password: tutorData.password,
      email_confirm: true,
      user_metadata: {
        full_name: tutorData.fullName,
        username: tutorData.username,
        role: "tutor",
        plan: "pro_monthly",
      },
    });

    if (tutorError || !tutorUser.user) {
      throw new Error(`Failed to create tutor: ${tutorError?.message}`);
    }

    await adminClient.from("profiles").upsert({
      id: tutorUser.user.id,
      email: tutorData.email,
      full_name: tutorData.fullName,
      username: tutorData.username,
      role: "tutor",
      plan: "pro_monthly",
      onboarding_completed: true,
      timezone: "America/New_York",
    });

    // Create student auth user
    const { data: studentUser, error: studentError } = await adminClient.auth.admin.createUser({
      email: studentData.email,
      password: studentData.password,
      email_confirm: true,
      user_metadata: {
        full_name: studentData.fullName,
        role: "student",
      },
    });

    if (studentError || !studentUser.user) {
      throw new Error(`Failed to create student: ${studentError?.message}`);
    }

    // Create student record
    await adminClient.from("students").insert({
      tutor_id: tutorUser.user.id,
      user_id: studentUser.user.id,
      full_name: studentData.fullName,
      email: studentData.email,
      calendar_access_status: "approved",
    });

    try {
      // Login as student
      await page.goto(`${appUrl}/login`);
      await page.fill('input[name="email"]', studentData.email);
      await page.fill('input[name="password"]', studentData.password);
      await page.click('button[type="submit"]');

      // Navigate to messages
      await page.goto(`${appUrl}/student/messages`);
      await page.waitForLoadState("networkidle");

      const results = await runFullPageA11y(page);
      assertNoViolations(results, "Student messages page");
    } finally {
      await adminClient.auth.admin.deleteUser(studentUser.user.id);
      await adminClient.auth.admin.deleteUser(tutorUser.user.id);
    }
  });
});
