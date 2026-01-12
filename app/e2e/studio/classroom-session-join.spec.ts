/**
 * E2E Tests: LiveKit Session - Tutor and Student Join
 *
 * Tests that both a tutor and student can successfully enter a LiveKit
 * classroom session together. Verifies:
 * - Both participants receive valid tokens for the same room
 * - Token has correct role flags (isTutor: true/false)
 * - Both can access the classroom UI
 *
 * Prerequisites:
 * - Tutor with Studio tier subscription
 * - Student with user_id (auth account)
 * - Confirmed booking between them
 */

import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

const liveKitConfigured = Boolean(
  process.env.NEXT_PUBLIC_LIVEKIT_URL &&
    process.env.LIVEKIT_API_KEY &&
    process.env.LIVEKIT_API_SECRET
);

const isE2ETestMode = process.env.E2E_TEST_MODE === "true";

function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

test.describe("LiveKit Session - Tutor and Student Join", () => {
  // Run tests sequentially to avoid race conditions with shared test data
  test.describe.configure({ mode: "serial" });

  test.skip(
    !liveKitConfigured && !isE2ETestMode,
    "LiveKit is not configured and E2E_TEST_MODE is not enabled."
  );

  test.setTimeout(3 * 60 * 1000); // 3 minutes max

  // Skip in non-studio projects to avoid running twice (see playwright.config.ts projects)
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== "studio", "Only run in studio project");
  });

  const runId = randomUUID();
  let adminClient: ReturnType<typeof createAdminClient>;
  let tutorUserId: string | null = null;
  let studentUserId: string | null = null;
  let studentRecordId: string | null = null;
  let bookingId: string | null = null;

  const tutor = {
    fullName: "Session Tutor " + runId.slice(0, 8),
    email: `session.tutor.${runId}@example.com`,
    username: `session-tutor-${runId}`,
    password: `SessionT3st!${runId}`,
  };

  const student = {
    fullName: "Session Student " + runId.slice(0, 8),
    email: `session.student.${runId}@example.com`,
    password: `SessionStud3nt!${runId}`,
  };

  test.beforeAll(async () => {
    adminClient = createAdminClient();

    // Create tutor with Studio tier
    const { data: tutorUser, error: tutorError } = await adminClient.auth.admin.createUser({
      email: tutor.email,
      password: tutor.password,
      email_confirm: true,
      user_metadata: {
        full_name: tutor.fullName,
        username: tutor.username,
        role: "tutor",
        plan: "studio_monthly",
      },
    });

    if (tutorError || !tutorUser.user) {
      throw new Error(`Failed to create tutor: ${tutorError?.message}`);
    }
    tutorUserId = tutorUser.user.id;

    // Create tutor profile with Studio tier
    await adminClient.from("profiles").upsert({
      id: tutorUserId,
      email: tutor.email,
      full_name: tutor.fullName,
      username: tutor.username,
      role: "tutor",
      plan: "studio_monthly",
      tier: "studio",
      onboarding_completed: true,
      timezone: "America/New_York",
      languages_taught: ["English"],
      booking_currency: "USD",
    });

    // Create student user with auth account
    const { data: studentUser, error: studentError } = await adminClient.auth.admin.createUser({
      email: student.email,
      password: student.password,
      email_confirm: true,
      user_metadata: { full_name: student.fullName, role: "student" },
    });

    if (studentError || !studentUser.user) {
      throw new Error(`Failed to create student: ${studentError?.message}`);
    }
    studentUserId = studentUser.user.id;

    // Create student record linked to auth account
    const { data: studentRecord, error: studentRecordError } = await adminClient
      .from("students")
      .insert({
        tutor_id: tutorUserId,
        user_id: studentUserId, // Critical: links student to auth account
        full_name: student.fullName,
        email: student.email,
        status: "active",
      })
      .select()
      .single();

    if (studentRecordError) {
      throw new Error(`Failed to create student record: ${studentRecordError.message}`);
    }
    studentRecordId = studentRecord.id;

    // Get auto-created service
    const { data: services } = await adminClient
      .from("services")
      .select("id")
      .eq("tutor_id", tutorUserId)
      .eq("is_active", true)
      .limit(1);

    const serviceId = services?.[0]?.id;

    // Create a confirmed booking scheduled for 5 minutes from now
    const scheduledAt = new Date();
    scheduledAt.setMinutes(scheduledAt.getMinutes() + 5);

    const { data: booking, error: bookingError } = await adminClient
      .from("bookings")
      .insert({
        tutor_id: tutorUserId,
        student_id: studentRecordId,
        service_id: serviceId,
        scheduled_at: scheduledAt.toISOString(),
        duration_minutes: 30,
        status: "confirmed",
        timezone: "America/New_York",
      })
      .select()
      .single();

    if (bookingError) {
      throw new Error(`Failed to create booking: ${bookingError.message}`);
    }
    bookingId = booking.id;
  });

  test.afterAll(async () => {
    // Cleanup test data in order of dependencies
    if (bookingId) {
      await adminClient.from("bookings").delete().eq("id", bookingId);
    }
    if (studentRecordId) {
      await adminClient.from("students").delete().eq("id", studentRecordId);
    }
    if (tutorUserId) {
      await adminClient.auth.admin.deleteUser(tutorUserId);
    }
    if (studentUserId) {
      await adminClient.auth.admin.deleteUser(studentUserId);
    }
  });

  test("both participants receive valid tokens for same room", async ({ browser, baseURL }) => {
    const appUrl = baseURL ?? "http://localhost:3000";

    // Create separate browser contexts for tutor and student
    const tutorContext = await browser.newContext();
    const studentContext = await browser.newContext();

    try {
      const tutorPage = await tutorContext.newPage();
      const studentPage = await studentContext.newPage();

      // Login as tutor
      await tutorPage.goto(`${appUrl}/login`);
      await tutorPage.getByLabel("Email address").fill(tutor.email);
      await tutorPage.getByRole("textbox", { name: "Password" }).fill(tutor.password);
      await tutorPage.getByRole("button", { name: "Log in", exact: true }).click();
      await tutorPage.waitForURL(/calendar|dashboard/, { timeout: 30000 });
      await tutorPage.waitForLoadState("networkidle", { timeout: 15000 });

      // Login as student
      await studentPage.goto(`${appUrl}/student/login`);
      await studentPage.getByLabel(/Email/i).fill(student.email);
      await studentPage.getByLabel(/Password/i).fill(student.password);
      await studentPage.getByRole("button", { name: /Sign in/i }).click();
      await studentPage.waitForURL((url) => !url.pathname.includes("/student/login"), {
        timeout: 30000,
      });
      await studentPage.waitForLoadState("networkidle", { timeout: 15000 });

      // Fetch token as tutor
      const tutorTokenResponse = await tutorPage.evaluate(async (bid) => {
        const response = await fetch(`/api/livekit/token?booking_id=${bid}`);
        return { status: response.status, data: await response.json() };
      }, bookingId);

      // Fetch token as student
      const studentTokenResponse = await studentPage.evaluate(async (bid) => {
        const response = await fetch(`/api/livekit/token?booking_id=${bid}`);
        return { status: response.status, data: await response.json() };
      }, bookingId);

      // Verify tutor token
      expect(tutorTokenResponse.status).toBe(200);
      expect(tutorTokenResponse.data.token).toBeTruthy();
      expect(tutorTokenResponse.data.isTutor).toBe(true);
      expect(tutorTokenResponse.data.roomName).toBe(bookingId);

      // Verify student token - log error for debugging if not 200
      if (studentTokenResponse.status !== 200) {
        console.log("Student token error:", studentTokenResponse.data);
        console.log("Booking ID used:", bookingId);
      }
      expect(studentTokenResponse.status).toBe(200);
      expect(studentTokenResponse.data.token).toBeTruthy();
      expect(studentTokenResponse.data.isTutor).toBe(false);
      expect(studentTokenResponse.data.roomName).toBe(bookingId);

      // Both tokens should reference the same room (booking ID)
      expect(tutorTokenResponse.data.roomName).toBe(studentTokenResponse.data.roomName);
    } finally {
      await tutorContext.close();
      await studentContext.close();
    }
  });

  test("tutor can access classroom", async ({ page, baseURL }) => {
    const appUrl = baseURL ?? "http://localhost:3000";

    // Login as tutor
    await page.goto(`${appUrl}/login`);
    await page.getByLabel("Email address").fill(tutor.email);
    await page.getByRole("textbox", { name: "Password" }).fill(tutor.password);
    await page.getByRole("button", { name: "Log in", exact: true }).click();
    await page.waitForURL(/calendar|dashboard/, { timeout: 30000 });

    // Navigate to classroom
    await page.goto(`${appUrl}/classroom/${bookingId}`);

    // Wait for classroom to fully load (not just "Joining...")
    await page.waitForLoadState("networkidle", { timeout: 30000 });

    // Wait for either test-mode classroom, pre-join, video room, or access denied
    await Promise.race([
      page.locator('[data-testid="test-mode-classroom"]').waitFor({ timeout: 15000 }).catch(() => {}),
      page.locator('[data-testid="classroom-prejoin"]').waitFor({ timeout: 15000 }).catch(() => {}),
      page.locator('[data-lk-theme="default"]').waitFor({ timeout: 15000 }).catch(() => {}),
      page.getByText(/Access Denied/i).waitFor({ timeout: 15000 }).catch(() => {}),
    ]);

    // Check for classroom access (test mode, pre-join, or live video)
    const hasTestModeClassroom = await page
      .locator('[data-testid="test-mode-classroom"]')
      .isVisible()
      .catch(() => false);
    const hasPreJoin = await page
      .locator('[data-testid="classroom-prejoin"]')
      .isVisible()
      .catch(() => false);
    const hasVideoRoom = await page
      .locator('[data-lk-theme="default"]')
      .isVisible()
      .catch(() => false);
    const hasAccessDenied = await page
      .getByText(/Access Denied/i)
      .isVisible()
      .catch(() => false);

    // Should have classroom access
    const hasClassroomAccess = hasTestModeClassroom || hasPreJoin || hasVideoRoom;
    expect(hasClassroomAccess).toBeTruthy();
    expect(hasAccessDenied).toBeFalsy();

    // In test mode, verify tutor has controls
    if (hasTestModeClassroom) {
      // Mic control should be visible
      const micButton = page.locator(
        '[data-testid="classroom-mic-mute"], [data-testid="classroom-mic-unmute"]'
      );
      const hasMicControl = await micButton.first().isVisible().catch(() => false);
      expect(hasMicControl).toBeTruthy();

      // Leave button should be visible
      const leaveButton = page.locator('[data-testid="classroom-leave-button"]');
      const hasLeaveButton = await leaveButton.isVisible().catch(() => false);
      expect(hasLeaveButton).toBeTruthy();
    }
  });

  test("student can access classroom", async ({ browser, baseURL }) => {
    const appUrl = baseURL ?? "http://localhost:3000";
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      // Login as student
      await page.goto(`${appUrl}/student/login`);
      await page.getByLabel(/Email/i).fill(student.email);
      await page.getByLabel(/Password/i).fill(student.password);
      await page.getByRole("button", { name: /Sign in/i }).click();
      await page.waitForURL((url) => !url.pathname.includes("/student/login"), {
        timeout: 30000,
      });

      // Navigate to classroom
      await page.goto(`${appUrl}/classroom/${bookingId}`);

      // Wait for classroom to fully load (not just "Joining...")
      await page.waitForLoadState("networkidle", { timeout: 30000 });

      // Wait for either test-mode classroom, pre-join, video room, or access denied
      await Promise.race([
        page.locator('[data-testid="test-mode-classroom"]').waitFor({ timeout: 15000 }).catch(() => {}),
        page.locator('[data-testid="classroom-prejoin"]').waitFor({ timeout: 15000 }).catch(() => {}),
        page.locator('[data-lk-theme="default"]').waitFor({ timeout: 15000 }).catch(() => {}),
        page.getByText(/Access Denied/i).waitFor({ timeout: 15000 }).catch(() => {}),
      ]);

      // Check for classroom access
      const hasTestModeClassroom = await page
        .locator('[data-testid="test-mode-classroom"]')
        .isVisible()
        .catch(() => false);
      const hasPreJoin = await page
        .locator('[data-testid="classroom-prejoin"]')
        .isVisible()
        .catch(() => false);
      const hasVideoRoom = await page
        .locator('[data-lk-theme="default"]')
        .isVisible()
        .catch(() => false);
      const hasAccessDenied = await page
        .getByText(/Access Denied/i)
        .isVisible()
        .catch(() => false);

      // Should have classroom access (tutor has Studio tier)
      const hasClassroomAccess = hasTestModeClassroom || hasPreJoin || hasVideoRoom;
      expect(hasClassroomAccess).toBeTruthy();
      expect(hasAccessDenied).toBeFalsy();

      // In test mode, student should see basic controls but NOT recording controls
      if (hasTestModeClassroom) {
        // Mic control should be visible for student too
        const micButton = page.locator(
          '[data-testid="classroom-mic-mute"], [data-testid="classroom-mic-unmute"]'
        );
        const hasMicControl = await micButton.first().isVisible().catch(() => false);
        expect(hasMicControl).toBeTruthy();

        // Leave button should be visible
        const leaveButton = page.locator('[data-testid="classroom-leave-button"]');
        const hasLeaveButton = await leaveButton.isVisible().catch(() => false);
        expect(hasLeaveButton).toBeTruthy();

        // Recording controls should NOT be visible for student (tutor-only)
        const recordButton = page.locator(
          '[data-testid="classroom-record-start"], [data-testid="classroom-record-stop"]'
        );
        const hasRecordButton = await recordButton.first().isVisible().catch(() => false);
        expect(hasRecordButton).toBeFalsy();
      }
    } finally {
      await context.close();
    }
  });

  test("both tutor and student can access classroom concurrently", async ({ browser, baseURL }) => {
    const appUrl = baseURL ?? "http://localhost:3000";

    // Create separate browser contexts for concurrent access
    const tutorContext = await browser.newContext();
    const studentContext = await browser.newContext();

    try {
      const tutorPage = await tutorContext.newPage();
      const studentPage = await studentContext.newPage();

      // Login as tutor
      await tutorPage.goto(`${appUrl}/login`);
      await tutorPage.waitForLoadState("networkidle", { timeout: 15000 });
      await tutorPage.getByLabel("Email address").fill(tutor.email);
      await tutorPage.getByRole("textbox", { name: "Password" }).fill(tutor.password);
      await tutorPage.getByRole("button", { name: "Log in", exact: true }).click();
      await tutorPage.waitForURL(/calendar|dashboard/, { timeout: 45000 });
      await tutorPage.waitForLoadState("networkidle", { timeout: 15000 });

      // Login as student (after tutor is fully logged in)
      await studentPage.goto(`${appUrl}/student/login`);
      await studentPage.waitForLoadState("networkidle", { timeout: 15000 });
      await studentPage.getByLabel(/Email/i).fill(student.email);
      await studentPage.getByLabel(/Password/i).fill(student.password);
      await studentPage.getByRole("button", { name: /Sign in/i }).click();
      await studentPage.waitForURL((url) => !url.pathname.includes("/student/login"), {
        timeout: 45000,
      });
      await studentPage.waitForLoadState("networkidle", { timeout: 15000 });

      // Navigate both to classroom concurrently
      await Promise.all([
        tutorPage.goto(`${appUrl}/classroom/${bookingId}`),
        studentPage.goto(`${appUrl}/classroom/${bookingId}`),
      ]);

      // Wait for both to fully load (not just "Joining...")
      await Promise.all([
        tutorPage.waitForLoadState("networkidle", { timeout: 30000 }),
        studentPage.waitForLoadState("networkidle", { timeout: 30000 }),
      ]);

      // Wait for classroom elements to appear
      await Promise.all([
        Promise.race([
          tutorPage.locator('[data-testid="test-mode-classroom"]').waitFor({ timeout: 15000 }).catch(() => {}),
          tutorPage.locator('[data-testid="classroom-prejoin"]').waitFor({ timeout: 15000 }).catch(() => {}),
          tutorPage.locator('[data-lk-theme="default"]').waitFor({ timeout: 15000 }).catch(() => {}),
          tutorPage.getByText(/Access Denied/i).waitFor({ timeout: 15000 }).catch(() => {}),
        ]),
        Promise.race([
          studentPage.locator('[data-testid="test-mode-classroom"]').waitFor({ timeout: 15000 }).catch(() => {}),
          studentPage.locator('[data-testid="classroom-prejoin"]').waitFor({ timeout: 15000 }).catch(() => {}),
          studentPage.locator('[data-lk-theme="default"]').waitFor({ timeout: 15000 }).catch(() => {}),
          studentPage.getByText(/Access Denied/i).waitFor({ timeout: 15000 }).catch(() => {}),
        ]),
      ]);

      // Verify tutor has access
      const tutorHasAccess =
        (await tutorPage.locator('[data-testid="test-mode-classroom"]').isVisible().catch(() => false)) ||
        (await tutorPage.locator('[data-testid="classroom-prejoin"]').isVisible().catch(() => false)) ||
        (await tutorPage.locator('[data-lk-theme="default"]').isVisible().catch(() => false));

      // Verify student has access
      const studentHasAccess =
        (await studentPage.locator('[data-testid="test-mode-classroom"]').isVisible().catch(() => false)) ||
        (await studentPage.locator('[data-testid="classroom-prejoin"]').isVisible().catch(() => false)) ||
        (await studentPage.locator('[data-lk-theme="default"]').isVisible().catch(() => false));

      // Both should have access
      expect(tutorHasAccess).toBeTruthy();
      expect(studentHasAccess).toBeTruthy();

      // Neither should see access denied
      const tutorDenied = await tutorPage.getByText(/Access Denied/i).isVisible().catch(() => false);
      const studentDenied = await studentPage.getByText(/Access Denied/i).isVisible().catch(() => false);

      expect(tutorDenied).toBeFalsy();
      expect(studentDenied).toBeFalsy();
    } finally {
      await tutorContext.close();
      await studentContext.close();
    }
  });
});
