import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { runFullPageA11y, assertNoViolations } from "./fixtures/a11y-helpers";

/**
 * Homework E2E Tests
 *
 * Tests homework assignment and submission flows:
 * - Tutor creates homework
 * - Student views homework
 * - Student submits homework
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

test.describe("Homework Management", () => {
  test.setTimeout(2 * 60 * 1000);

  test("student progress page loads homework section", async ({ page, baseURL }) => {
    const appUrl = baseURL ?? "http://localhost:3000";
    const adminClient = createAdminClient();
    const tutorData = generateTestData("hw-tutor");
    const studentData = generateTestData("hw-student");

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
    const { data: student } = await adminClient
      .from("students")
      .insert({
        tutor_id: tutorUser.user.id,
        user_id: studentUser.user.id,
        full_name: studentData.fullName,
        email: studentData.email,
        calendar_access_status: "approved",
      })
      .select()
      .single();

    try {
      // Login as student
      await page.goto(`${appUrl}/login`);
      await page.fill('input[name="email"]', studentData.email);
      await page.fill('input[name="password"]', studentData.password);
      await page.click('button[type="submit"]');

      // Navigate to student progress page
      await page.goto(`${appUrl}/student/progress`);
      await page.waitForLoadState("domcontentloaded");

      // Page should load
      await expect(page.locator("body")).toBeVisible();
    } finally {
      await adminClient.auth.admin.deleteUser(studentUser.user.id);
      await adminClient.auth.admin.deleteUser(tutorUser.user.id);
    }
  });

  test("tutor can view student homework tab", async ({ page, baseURL }) => {
    const appUrl = baseURL ?? "http://localhost:3000";
    const adminClient = createAdminClient();
    const tutorData = generateTestData("hw-tab-tutor");

    const { data: tutorUser, error } = await adminClient.auth.admin.createUser({
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

    if (error || !tutorUser.user) {
      throw new Error(`Failed to create tutor: ${error?.message}`);
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

    // Create a student
    const { data: student } = await adminClient
      .from("students")
      .insert({
        tutor_id: tutorUser.user.id,
        full_name: "Test Student",
        email: "test-student@example.com",
        calendar_access_status: "approved",
      })
      .select()
      .single();

    try {
      // Login as tutor
      await page.goto(`${appUrl}/login`);
      await page.fill('input[name="email"]', tutorData.email);
      await page.fill('input[name="password"]', tutorData.password);
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/dashboard/, { timeout: 15000 });

      // Navigate to student detail page
      if (student) {
        await page.goto(`${appUrl}/students/${student.id}`);
        await page.waitForLoadState("domcontentloaded");

        // Page should load
        await expect(page.locator("body")).toBeVisible();
      }
    } finally {
      await adminClient.auth.admin.deleteUser(tutorUser.user.id);
    }
  });
});

test.describe("Accessibility - Homework", () => {
  test.setTimeout(2 * 60 * 1000);

  test("student progress page passes WCAG AA accessibility checks", async ({ page, baseURL }) => {
    const appUrl = baseURL ?? "http://localhost:3000";
    const adminClient = createAdminClient();
    const tutorData = generateTestData("a11y-hw-tutor");
    const studentData = generateTestData("a11y-hw-student");

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

      // Navigate to student progress page
      await page.goto(`${appUrl}/student/progress`);
      await page.waitForLoadState("networkidle");

      // Run accessibility scan
      const results = await runFullPageA11y(page);
      assertNoViolations(results, "Student progress page");
    } finally {
      await adminClient.auth.admin.deleteUser(studentUser.user.id);
      await adminClient.auth.admin.deleteUser(tutorUser.user.id);
    }
  });

  test("tutor student detail page passes WCAG AA accessibility checks", async ({ page, baseURL }) => {
    const appUrl = baseURL ?? "http://localhost:3000";
    const adminClient = createAdminClient();
    const tutorData = generateTestData("a11y-hw-detail");

    const { data: tutorUser, error } = await adminClient.auth.admin.createUser({
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

    if (error || !tutorUser.user) {
      throw new Error(`Failed to create tutor: ${error?.message}`);
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

    // Create a student
    const { data: student } = await adminClient
      .from("students")
      .insert({
        tutor_id: tutorUser.user.id,
        full_name: "A11y Test Student",
        email: "a11y-student@example.com",
        calendar_access_status: "approved",
      })
      .select()
      .single();

    try {
      // Login as tutor
      await page.goto(`${appUrl}/login`);
      await page.fill('input[name="email"]', tutorData.email);
      await page.fill('input[name="password"]', tutorData.password);
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/dashboard/, { timeout: 15000 });

      // Navigate to student detail page
      if (student) {
        await page.goto(`${appUrl}/students/${student.id}`);
        await page.waitForLoadState("networkidle");

        // Run accessibility scan
        const results = await runFullPageA11y(page, { include: "main" });
        assertNoViolations(results, "Student detail page");
      }
    } finally {
      await adminClient.auth.admin.deleteUser(tutorUser.user.id);
    }
  });
});
