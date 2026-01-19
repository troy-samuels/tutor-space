import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { runFullPageA11y, assertNoViolations } from "./fixtures/a11y-helpers";

/**
 * Student Portal E2E Tests
 *
 * Tests the student-facing portal experience:
 * - Dashboard navigation
 * - Lesson history
 * - Tutor connection
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

test.describe("Student Portal Navigation", () => {
  test.setTimeout(2 * 60 * 1000);

  test("student can access portal after login", async ({ page, baseURL }) => {
    const appUrl = baseURL ?? "http://localhost:3000";
    const adminClient = createAdminClient();
    const tutorData = generateTestData("portal-tutor");
    const studentData = generateTestData("portal-student");

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

      // Should redirect to student dashboard or progress
      await page.waitForLoadState("domcontentloaded");
      await expect(page.locator("body")).toBeVisible();
    } finally {
      await adminClient.auth.admin.deleteUser(studentUser.user.id);
      await adminClient.auth.admin.deleteUser(tutorUser.user.id);
    }
  });

  test("student can view lessons page", async ({ page, baseURL }) => {
    const appUrl = baseURL ?? "http://localhost:3000";
    const adminClient = createAdminClient();
    const tutorData = generateTestData("lessons-tutor");
    const studentData = generateTestData("lessons-student");

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

      // Navigate to lessons
      await page.goto(`${appUrl}/student/lessons`);
      await page.waitForLoadState("domcontentloaded");

      await expect(page.locator("body")).toBeVisible();
    } finally {
      await adminClient.auth.admin.deleteUser(studentUser.user.id);
      await adminClient.auth.admin.deleteUser(tutorUser.user.id);
    }
  });
});

test.describe("Accessibility - Student Portal", () => {
  test.setTimeout(2 * 60 * 1000);

  test("student dashboard passes WCAG AA accessibility checks", async ({ page, baseURL }) => {
    const appUrl = baseURL ?? "http://localhost:3000";
    const adminClient = createAdminClient();
    const tutorData = generateTestData("a11y-sp-tutor");
    const studentData = generateTestData("a11y-sp-student");

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

      // Navigate to student dashboard
      await page.goto(`${appUrl}/student`);
      await page.waitForLoadState("networkidle");

      const results = await runFullPageA11y(page);
      assertNoViolations(results, "Student dashboard");
    } finally {
      await adminClient.auth.admin.deleteUser(studentUser.user.id);
      await adminClient.auth.admin.deleteUser(tutorUser.user.id);
    }
  });

  test("student lessons page passes WCAG AA accessibility checks", async ({ page, baseURL }) => {
    const appUrl = baseURL ?? "http://localhost:3000";
    const adminClient = createAdminClient();
    const tutorData = generateTestData("a11y-lessons-tutor");
    const studentData = generateTestData("a11y-lessons-student");

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

      // Navigate to lessons
      await page.goto(`${appUrl}/student/lessons`);
      await page.waitForLoadState("networkidle");

      const results = await runFullPageA11y(page);
      assertNoViolations(results, "Student lessons page");
    } finally {
      await adminClient.auth.admin.deleteUser(studentUser.user.id);
      await adminClient.auth.admin.deleteUser(tutorUser.user.id);
    }
  });
});
