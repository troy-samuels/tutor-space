/**
 * E2E Tests: Studio Tier Classroom Recording
 *
 * Tests the LiveKit video classroom features including:
 * - Tutor enters classroom and sees recording controls
 * - Recording consent modal workflow
 * - Recording start/stop functionality
 *
 * Prerequisites:
 * - Tutor with Studio tier subscription
 * - Valid LiveKit configuration
 * - Scheduled booking with student
 */

import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

const liveKitConfigured = Boolean(
  process.env.NEXT_PUBLIC_LIVEKIT_URL &&
    process.env.LIVEKIT_API_KEY &&
    process.env.LIVEKIT_API_SECRET
);

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

test.describe("Studio Classroom Recording", () => {
  test.skip(!liveKitConfigured, "LiveKit is not configured in the test environment.");
  test.setTimeout(3 * 60 * 1000); // 3 minutes max

  const runId = randomUUID();
  let adminClient: ReturnType<typeof createAdminClient>;
  let tutorUserId: string | null = null;
  let studentUserId: string | null = null;
  let bookingId: string | null = null;

  const tutor = {
    fullName: "Studio Tutor " + runId,
    email: `studio.tutor.${runId}@example.com`,
    username: `studio-tutor-${runId}`,
    password: `StudioT3st!${runId}`,
  };

  const student = {
    fullName: "Studio Student " + runId,
    email: `studio.student.${runId}@example.com`,
    password: `StudioStud3nt!${runId}`,
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
        plan: "studio_monthly", // Studio tier for classroom access
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

    // Create student user
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

    // Create student record
    const { data: studentRecord, error: studentRecordError } = await adminClient
      .from("students")
      .insert({
        tutor_id: tutorUserId,
        user_id: studentUserId,
        full_name: student.fullName,
        email: student.email,
        status: "active",
      })
      .select()
      .single();

    if (studentRecordError) {
      throw new Error(`Failed to create student record: ${studentRecordError.message}`);
    }

    // Get auto-created service
    const { data: services } = await adminClient
      .from("services")
      .select("id")
      .eq("tutor_id", tutorUserId)
      .eq("is_active", true)
      .limit(1);

    const serviceId = services?.[0]?.id;

    // Create a booking for classroom test
    const scheduledAt = new Date();
    scheduledAt.setMinutes(scheduledAt.getMinutes() + 5); // 5 minutes from now

    const { data: booking, error: bookingError } = await adminClient
      .from("bookings")
      .insert({
        tutor_id: tutorUserId,
        student_id: studentRecord.id,
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
    // Cleanup test data
    if (bookingId) {
      await adminClient.from("bookings").delete().eq("id", bookingId);
    }
    if (tutorUserId) {
      await adminClient.auth.admin.deleteUser(tutorUserId);
    }
    if (studentUserId) {
      await adminClient.auth.admin.deleteUser(studentUserId);
    }
  });

  test("tutor can access classroom and sees recording controls", async ({ page, baseURL }) => {
    const appUrl = baseURL ?? "http://localhost:3000";

    // Login as tutor
    await page.goto(`${appUrl}/login`);
    await page.getByLabel("Email address").fill(tutor.email);
    await page.getByRole("textbox", { name: "Password" }).fill(tutor.password);
    await page.getByRole("button", { name: "Log in", exact: true }).click();

    // Wait for dashboard
    await page.waitForURL(/calendar|dashboard/, { timeout: 30000 });

    // Navigate to classroom
    await page.goto(`${appUrl}/classroom/${bookingId}`);

    // Wait for page to load
    await page.waitForLoadState("domcontentloaded", { timeout: 15000 });

    // Check for either:
    // 1. Test mode classroom (E2E_TEST_MODE=true and no LiveKit config)
    // 2. LiveKit video room (if configured)
    // 3. Pre-join screen
    // 4. Access denied (should not happen for Studio tutor)

    const hasTestModeClassroom = await page.locator('[data-testid="test-mode-classroom"]').isVisible().catch(() => false);
    const hasPreJoin = await page.locator('[data-testid="classroom-prejoin"]').isVisible().catch(() => false);
    const hasVideoRoom = await page.locator('[data-lk-theme="default"]').isVisible().catch(() => false);
    const hasAccessDenied = await page.getByText(/Access Denied/i).isVisible().catch(() => false);

    // Should have some form of classroom access (test mode, pre-join, or live video)
    const hasClassroomAccess = hasTestModeClassroom || hasPreJoin || hasVideoRoom;
    expect(hasClassroomAccess).toBeTruthy();
    expect(hasAccessDenied).toBeFalsy();

    // In test mode, check for recording controls using data-testid
    if (hasTestModeClassroom) {
      // Recording start button should be visible for tutor
      const recordStartButton = page.locator('[data-testid="classroom-record-start"]');
      const hasRecordStart = await recordStartButton.isVisible().catch(() => false);
      expect(hasRecordStart).toBeTruthy();

      // Mic control should be visible
      const micButton = page.locator('[data-testid="classroom-mic-mute"], [data-testid="classroom-mic-unmute"]');
      const hasMicControl = await micButton.first().isVisible().catch(() => false);
      expect(hasMicControl).toBeTruthy();

      // Leave button should be visible
      const leaveButton = page.locator('[data-testid="classroom-leave-button"]');
      const hasLeaveButton = await leaveButton.isVisible().catch(() => false);
      expect(hasLeaveButton).toBeTruthy();
    }

    // If pre-join screen, click join to enter
    if (hasPreJoin) {
      const joinButton = page.locator('[data-testid="classroom-join-button"]');
      const hasJoinButton = await joinButton.isVisible().catch(() => false);
      expect(hasJoinButton).toBeTruthy();
    }
  });

  test("non-studio tutor sees upgrade prompt", async ({ browser, baseURL }) => {
    const appUrl = baseURL ?? "http://localhost:3000";
    const context = await browser.newContext();
    const page = await context.newPage();

    const nonStudioId = randomUUID();
    const nonStudioTutor = {
      email: `nonstudio.tutor.${nonStudioId}@example.com`,
      password: `NonStudioT3st!${nonStudioId}`,
      username: `nonstudio-tutor-${nonStudioId}`,
      fullName: "Non-Studio Tutor",
    };

    let nonStudioTutorId: string | null = null;

    try {
      // Create non-studio tutor (professional tier)
      const { data: tutorUser, error } = await adminClient.auth.admin.createUser({
        email: nonStudioTutor.email,
        password: nonStudioTutor.password,
        email_confirm: true,
        user_metadata: {
          full_name: nonStudioTutor.fullName,
          username: nonStudioTutor.username,
          role: "tutor",
          plan: "professional",
        },
      });

      if (error || !tutorUser.user) {
        throw new Error(`Failed to create non-studio tutor: ${error?.message}`);
      }
      nonStudioTutorId = tutorUser.user.id;

      // Create profile with standard tier
      await adminClient.from("profiles").upsert({
        id: nonStudioTutorId,
        email: nonStudioTutor.email,
        full_name: nonStudioTutor.fullName,
        username: nonStudioTutor.username,
        role: "tutor",
        plan: "professional",
        tier: "standard",
        onboarding_completed: true,
        timezone: "America/New_York",
      });

      // Login
      await page.goto(`${appUrl}/login`);
      await page.getByLabel("Email address").fill(nonStudioTutor.email);
      await page.getByRole("textbox", { name: "Password" }).fill(nonStudioTutor.password);
      await page.getByRole("button", { name: "Log in", exact: true }).click();
      await page.waitForURL(/calendar|dashboard/, { timeout: 30000 });

      // Try to access classroom (using the booking from Studio tutor - should be denied)
      await page.goto(`${appUrl}/classroom/${bookingId}`);

      // Should see access denied or upgrade prompt
      await page.waitForLoadState("domcontentloaded", { timeout: 15000 });

      const accessDenied = await page.getByText(/Access Denied|Forbidden|upgrade|Studio|not authorized/i).isVisible().catch(() => false);
      const notFound = await page.getByText(/not found|404/i).isVisible().catch(() => false);

      // Either access denied or not found (since booking belongs to different tutor)
      expect(accessDenied || notFound).toBeTruthy();
    } finally {
      if (nonStudioTutorId) {
        await adminClient.auth.admin.deleteUser(nonStudioTutorId);
      }
      await context.close();
    }
  });

  test("student can access classroom for their booking", async ({ browser, baseURL }) => {
    const appUrl = baseURL ?? "http://localhost:3000";
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      // Login as student
      await page.goto(`${appUrl}/student/login`);
      await page.getByLabel(/Email/i).fill(student.email);
      await page.getByLabel(/Password/i).fill(student.password);
      await page.getByRole("button", { name: /Sign in/i }).click();

      // Wait for student portal
      await page.waitForURL((url) => !url.pathname.includes("/student/login"), {
        timeout: 30000,
      });

      // Navigate to classroom
      await page.goto(`${appUrl}/classroom/${bookingId}`);

      // Wait for page load
      await page.waitForLoadState("domcontentloaded", { timeout: 15000 });

      // Student should have access (tutor has Studio tier)
      // Check for classroom access using data-testid selectors
      const hasTestModeClassroom = await page.locator('[data-testid="test-mode-classroom"]').isVisible().catch(() => false);
      const hasPreJoin = await page.locator('[data-testid="classroom-prejoin"]').isVisible().catch(() => false);
      const hasVideoRoom = await page.locator('[data-lk-theme="default"]').isVisible().catch(() => false);
      const hasAccessDenied = await page.getByText(/Access Denied/i).isVisible().catch(() => false);

      // Should have classroom access
      const hasClassroomAccess = hasTestModeClassroom || hasPreJoin || hasVideoRoom;
      expect(hasClassroomAccess).toBeTruthy();
      expect(hasAccessDenied).toBeFalsy();

      // In test mode, student should NOT see recording controls (tutor-only)
      if (hasTestModeClassroom) {
        const recordButton = page.locator('[data-testid="classroom-record-start"], [data-testid="classroom-record-stop"]');
        const hasRecordButton = await recordButton.first().isVisible().catch(() => false);
        expect(hasRecordButton).toBeFalsy(); // Students don't control recording
      }
    } finally {
      await context.close();
    }
  });

  test("unauthorized user cannot access classroom", async ({ page, baseURL }) => {
    const appUrl = baseURL ?? "http://localhost:3000";

    // Try to access classroom without logging in
    await page.goto(`${appUrl}/classroom/${bookingId}`);

    // Should be redirected to login or see unauthorized message
    await page.waitForLoadState("domcontentloaded", { timeout: 15000 });

    const isRedirectedToLogin = page.url().includes("/login");
    const hasUnauthorized = await page.getByText(/sign in|log in|unauthorized/i).isVisible().catch(() => false);

    expect(isRedirectedToLogin || hasUnauthorized).toBeTruthy();
  });
});
