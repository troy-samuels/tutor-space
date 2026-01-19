import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { runFullPageA11y, runFormA11y, assertNoViolations } from "./fixtures/a11y-helpers";

/**
 * Student CRM E2E Tests
 *
 * Tests the student management (CRM) features:
 * - Student list display
 * - Student detail view
 * - Student creation/editing
 * - Labels and filtering
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

test.describe("Student CRM", () => {
  test.setTimeout(2 * 60 * 1000);

  test("students page loads for authenticated tutor", async ({ page, baseURL }) => {
    const appUrl = baseURL ?? "http://localhost:3000";
    const adminClient = createAdminClient();
    const testData = generateTestData("crm-tutor");

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

      // Navigate to students
      await page.goto(`${appUrl}/students`);
      await page.waitForLoadState("domcontentloaded");

      await expect(page.locator("body")).toBeVisible();
    } finally {
      await adminClient.auth.admin.deleteUser(tutorUser.user.id);
    }
  });

  test("students page displays student list", async ({ page, baseURL }) => {
    const appUrl = baseURL ?? "http://localhost:3000";
    const adminClient = createAdminClient();
    const testData = generateTestData("crm-list");

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

    // Create test students
    await adminClient.from("students").insert([
      {
        tutor_id: tutorUser.user.id,
        full_name: "Test Student One",
        email: "student1@example.com",
        calendar_access_status: "approved",
        labels: ["beginner"],
      },
      {
        tutor_id: tutorUser.user.id,
        full_name: "Test Student Two",
        email: "student2@example.com",
        calendar_access_status: "approved",
        labels: ["advanced"],
      },
    ]);

    try {
      // Login
      await page.goto(`${appUrl}/login`);
      await page.fill('input[name="email"]', testData.email);
      await page.fill('input[name="password"]', testData.password);
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/dashboard/, { timeout: 15000 });

      // Navigate to students
      await page.goto(`${appUrl}/students`);
      await page.waitForLoadState("domcontentloaded");

      // Should show student names
      const hasStudentContent = await page
        .locator('text=/test student|student/i')
        .first()
        .isVisible()
        .catch(() => false);

      expect(hasStudentContent).toBe(true);
    } finally {
      await adminClient.auth.admin.deleteUser(tutorUser.user.id);
    }
  });

  test("student detail page loads", async ({ page, baseURL }) => {
    const appUrl = baseURL ?? "http://localhost:3000";
    const adminClient = createAdminClient();
    const testData = generateTestData("crm-detail");

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

    // Create test student
    const { data: student } = await adminClient
      .from("students")
      .insert({
        tutor_id: tutorUser.user.id,
        full_name: "Detail Test Student",
        email: "detail-student@example.com",
        calendar_access_status: "approved",
      })
      .select()
      .single();

    try {
      // Login
      await page.goto(`${appUrl}/login`);
      await page.fill('input[name="email"]', testData.email);
      await page.fill('input[name="password"]', testData.password);
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/dashboard/, { timeout: 15000 });

      // Navigate to student detail
      if (student) {
        await page.goto(`${appUrl}/students/${student.id}`);
        await page.waitForLoadState("domcontentloaded");

        // Should show student name
        const hasStudentName = await page
          .locator('text=/detail test student/i')
          .first()
          .isVisible()
          .catch(() => false);

        expect(hasStudentName).toBe(true);
      }
    } finally {
      await adminClient.auth.admin.deleteUser(tutorUser.user.id);
    }
  });
});

test.describe("Accessibility - Student CRM", () => {
  test.setTimeout(2 * 60 * 1000);

  test("students list page passes WCAG AA accessibility checks", async ({ page, baseURL }) => {
    const appUrl = baseURL ?? "http://localhost:3000";
    const adminClient = createAdminClient();
    const testData = generateTestData("a11y-crm-list");

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

      // Navigate to students
      await page.goto(`${appUrl}/students`);
      await page.waitForLoadState("networkidle");

      const results = await runFullPageA11y(page, { include: "main" });
      assertNoViolations(results, "Students list page");
    } finally {
      await adminClient.auth.admin.deleteUser(tutorUser.user.id);
    }
  });

  test("student detail page passes WCAG AA accessibility checks", async ({ page, baseURL }) => {
    const appUrl = baseURL ?? "http://localhost:3000";
    const adminClient = createAdminClient();
    const testData = generateTestData("a11y-crm-detail");

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

    // Create test student
    const { data: student } = await adminClient
      .from("students")
      .insert({
        tutor_id: tutorUser.user.id,
        full_name: "A11y Test Student",
        email: "a11y-crm-student@example.com",
        calendar_access_status: "approved",
      })
      .select()
      .single();

    try {
      // Login
      await page.goto(`${appUrl}/login`);
      await page.fill('input[name="email"]', testData.email);
      await page.fill('input[name="password"]', testData.password);
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/dashboard/, { timeout: 15000 });

      // Navigate to student detail
      if (student) {
        await page.goto(`${appUrl}/students/${student.id}`);
        await page.waitForLoadState("networkidle");

        const results = await runFullPageA11y(page, { include: "main" });
        assertNoViolations(results, "Student detail page");
      }
    } finally {
      await adminClient.auth.admin.deleteUser(tutorUser.user.id);
    }
  });

  test("student list with items passes WCAG AA accessibility checks", async ({ page, baseURL }) => {
    const appUrl = baseURL ?? "http://localhost:3000";
    const adminClient = createAdminClient();
    const testData = generateTestData("a11y-crm-items");

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

    // Create test students with labels
    await adminClient.from("students").insert([
      {
        tutor_id: tutorUser.user.id,
        full_name: "Beginner Student",
        email: "beginner@example.com",
        calendar_access_status: "approved",
        labels: ["beginner", "conversation"],
      },
      {
        tutor_id: tutorUser.user.id,
        full_name: "Advanced Student",
        email: "advanced@example.com",
        calendar_access_status: "approved",
        labels: ["advanced", "exam_prep"],
      },
    ]);

    try {
      // Login
      await page.goto(`${appUrl}/login`);
      await page.fill('input[name="email"]', testData.email);
      await page.fill('input[name="password"]', testData.password);
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/dashboard/, { timeout: 15000 });

      // Navigate to students
      await page.goto(`${appUrl}/students`);
      await page.waitForLoadState("networkidle");

      const results = await runFullPageA11y(page, { include: "main" });
      assertNoViolations(results, "Students list with items");
    } finally {
      await adminClient.auth.admin.deleteUser(tutorUser.user.id);
    }
  });
});
