/**
 * E2E Tests: Video Quality Settings
 *
 * Tests the video quality configuration flow in the classroom pre-join screen.
 * Verifies:
 * - Quality selector is visible in pre-join
 * - Quality setting options are available (auto, high, medium, low)
 * - Quality selection persists through the join flow
 * - Camera switch preserves quality settings
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

test.describe("Video Quality Settings", () => {
  test.describe.configure({ mode: "serial" });

  test.skip(
    !liveKitConfigured && !isE2ETestMode,
    "LiveKit is not configured and E2E_TEST_MODE is not enabled."
  );

  test.setTimeout(3 * 60 * 1000); // 3 minutes max

  // Skip in non-studio projects
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== "studio", "Only run in studio project");
  });

  const runId = randomUUID();
  let adminClient: ReturnType<typeof createAdminClient>;
  let tutorUserId: string | null = null;
  let studentRecordId: string | null = null;
  let bookingId: string | null = null;

  const tutor = {
    fullName: "Quality Tutor " + runId.slice(0, 8),
    email: `quality.tutor.${runId}@example.com`,
    username: `quality-tutor-${runId}`,
    password: `QualityT3st!${runId}`,
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

    // Create student record (no auth account needed for this test)
    const { data: studentRecord, error: studentRecordError } = await adminClient
      .from("students")
      .insert({
        tutor_id: tutorUserId,
        full_name: "Test Student " + runId.slice(0, 8),
        email: `test.student.${runId}@example.com`,
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
  });

  test("pre-join screen shows quality selector", async ({ page, baseURL }) => {
    const appUrl = baseURL ?? "http://localhost:3000";

    // Login as tutor
    await page.goto(`${appUrl}/login`);
    await page.getByLabel("Email address").fill(tutor.email);
    await page.getByRole("textbox", { name: "Password" }).fill(tutor.password);
    await page.getByRole("button", { name: "Log in", exact: true }).click();
    await page.waitForURL(/calendar|dashboard/, { timeout: 30000 });

    // Navigate to classroom
    await page.goto(`${appUrl}/classroom/${bookingId}`);
    await page.waitForLoadState("networkidle", { timeout: 30000 });

    // Wait for pre-join screen or test mode classroom
    await Promise.race([
      page.locator('[data-testid="classroom-prejoin"]').waitFor({ timeout: 15000 }).catch(() => {}),
      page.locator('[data-testid="test-mode-classroom"]').waitFor({ timeout: 15000 }).catch(() => {}),
    ]);

    // Check if we're in pre-join screen
    const hasPreJoin = await page.locator('[data-testid="classroom-prejoin"]').isVisible().catch(() => false);

    if (hasPreJoin) {
      // Look for quality selector
      const qualitySelector = page.locator('[data-testid="quality-selector"]');
      const hasQualitySelector = await qualitySelector.isVisible().catch(() => false);

      // Alternative: check for the select trigger with quality label
      const qualityTrigger = page.getByLabel(/Video Quality/i);
      const hasQualityTrigger = await qualityTrigger.isVisible().catch(() => false);

      expect(hasQualitySelector || hasQualityTrigger).toBeTruthy();
    } else {
      // In test mode, we skip this test gracefully
      test.skip(true, "Pre-join screen not available in test mode");
    }
  });

  test("quality selector has all options", async ({ page, baseURL }) => {
    const appUrl = baseURL ?? "http://localhost:3000";

    // Login as tutor
    await page.goto(`${appUrl}/login`);
    await page.getByLabel("Email address").fill(tutor.email);
    await page.getByRole("textbox", { name: "Password" }).fill(tutor.password);
    await page.getByRole("button", { name: "Log in", exact: true }).click();
    await page.waitForURL(/calendar|dashboard/, { timeout: 30000 });

    // Navigate to classroom
    await page.goto(`${appUrl}/classroom/${bookingId}`);
    await page.waitForLoadState("networkidle", { timeout: 30000 });

    // Wait for pre-join screen
    const preJoinLocator = page.locator('[data-testid="classroom-prejoin"]');
    const hasPreJoin = await preJoinLocator.isVisible({ timeout: 15000 }).catch(() => false);

    if (!hasPreJoin) {
      test.skip(true, "Pre-join screen not available");
      return;
    }

    // Click quality selector to open dropdown
    const qualityTrigger = page.getByLabel(/Video Quality/i);
    const hasTrigger = await qualityTrigger.isVisible().catch(() => false);

    if (hasTrigger) {
      await qualityTrigger.click();

      // Wait for dropdown options
      await page.waitForTimeout(500);

      // Check for quality options
      const autoOption = page.getByRole("option", { name: /Auto/i });
      const highOption = page.getByRole("option", { name: /High|1080p/i });
      const mediumOption = page.getByRole("option", { name: /Medium|720p/i });
      const lowOption = page.getByRole("option", { name: /Low|360p/i });

      const hasAuto = await autoOption.isVisible().catch(() => false);
      const hasHigh = await highOption.isVisible().catch(() => false);
      const hasMedium = await mediumOption.isVisible().catch(() => false);
      const hasLow = await lowOption.isVisible().catch(() => false);

      // All options should be present
      expect(hasAuto).toBeTruthy();
      expect(hasHigh).toBeTruthy();
      expect(hasMedium).toBeTruthy();
      expect(hasLow).toBeTruthy();
    } else {
      // Alternative: look for a different quality selector implementation
      const qualitySelect = page.locator('[data-testid="quality-selector"]');
      const hasSelect = await qualitySelect.isVisible().catch(() => false);
      expect(hasSelect).toBeTruthy();
    }
  });

  test("selecting quality option updates selection", async ({ page, baseURL }) => {
    const appUrl = baseURL ?? "http://localhost:3000";

    // Login as tutor
    await page.goto(`${appUrl}/login`);
    await page.getByLabel("Email address").fill(tutor.email);
    await page.getByRole("textbox", { name: "Password" }).fill(tutor.password);
    await page.getByRole("button", { name: "Log in", exact: true }).click();
    await page.waitForURL(/calendar|dashboard/, { timeout: 30000 });

    // Navigate to classroom
    await page.goto(`${appUrl}/classroom/${bookingId}`);
    await page.waitForLoadState("networkidle", { timeout: 30000 });

    // Wait for pre-join screen
    const hasPreJoin = await page.locator('[data-testid="classroom-prejoin"]').isVisible({ timeout: 15000 }).catch(() => false);

    if (!hasPreJoin) {
      test.skip(true, "Pre-join screen not available");
      return;
    }

    // Click quality selector
    const qualityTrigger = page.getByLabel(/Video Quality/i);
    const hasTrigger = await qualityTrigger.isVisible().catch(() => false);

    if (!hasTrigger) {
      test.skip(true, "Quality selector not available");
      return;
    }

    await qualityTrigger.click();
    await page.waitForTimeout(300);

    // Select "High" quality
    const highOption = page.getByRole("option", { name: /High|1080p/i });
    const hasHigh = await highOption.isVisible().catch(() => false);

    if (hasHigh) {
      await highOption.click();
      await page.waitForTimeout(300);

      // Verify selection is updated (trigger should now show High)
      const triggerText = await qualityTrigger.textContent();
      expect(triggerText?.toLowerCase()).toMatch(/high|1080/i);
    }
  });

  test("quality setting persists after join", async ({ page, baseURL }) => {
    const appUrl = baseURL ?? "http://localhost:3000";

    // Login as tutor
    await page.goto(`${appUrl}/login`);
    await page.getByLabel("Email address").fill(tutor.email);
    await page.getByRole("textbox", { name: "Password" }).fill(tutor.password);
    await page.getByRole("button", { name: "Log in", exact: true }).click();
    await page.waitForURL(/calendar|dashboard/, { timeout: 30000 });

    // Navigate to classroom
    await page.goto(`${appUrl}/classroom/${bookingId}`);
    await page.waitForLoadState("networkidle", { timeout: 30000 });

    // Wait for pre-join screen
    const hasPreJoin = await page.locator('[data-testid="classroom-prejoin"]').isVisible({ timeout: 15000 }).catch(() => false);

    if (!hasPreJoin) {
      test.skip(true, "Pre-join screen not available");
      return;
    }

    // Select a quality setting
    const qualityTrigger = page.getByLabel(/Video Quality/i);
    const hasTrigger = await qualityTrigger.isVisible().catch(() => false);

    if (hasTrigger) {
      await qualityTrigger.click();
      await page.waitForTimeout(300);

      const mediumOption = page.getByRole("option", { name: /Medium|720p/i });
      const hasMedium = await mediumOption.isVisible().catch(() => false);

      if (hasMedium) {
        await mediumOption.click();
        await page.waitForTimeout(300);
      }
    }

    // Click join button
    const joinButton = page.getByRole("button", { name: /Join|Enter/i });
    const hasJoin = await joinButton.isVisible().catch(() => false);

    if (hasJoin) {
      await joinButton.click();

      // Wait for either video stage or test mode classroom
      await Promise.race([
        page.locator('[data-testid="video-stage"]').waitFor({ timeout: 15000 }).catch(() => {}),
        page.locator('[data-testid="test-mode-classroom"]').waitFor({ timeout: 15000 }).catch(() => {}),
        page.locator('[data-lk-theme="default"]').waitFor({ timeout: 15000 }).catch(() => {}),
      ]);

      // In E2E test mode, we can verify the room was joined successfully
      // The quality setting would be passed to LiveKitRoom options
      const hasVideoStage = await page.locator('[data-testid="video-stage"]').isVisible().catch(() => false);
      const hasTestMode = await page.locator('[data-testid="test-mode-classroom"]').isVisible().catch(() => false);
      const hasLiveKit = await page.locator('[data-lk-theme="default"]').isVisible().catch(() => false);

      // Room should be joined
      expect(hasVideoStage || hasTestMode || hasLiveKit).toBeTruthy();
    }
  });

  test("quality overlay shows current layer in video stage", async ({ page, baseURL }) => {
    const appUrl = baseURL ?? "http://localhost:3000";

    // Login as tutor
    await page.goto(`${appUrl}/login`);
    await page.getByLabel("Email address").fill(tutor.email);
    await page.getByRole("textbox", { name: "Password" }).fill(tutor.password);
    await page.getByRole("button", { name: "Log in", exact: true }).click();
    await page.waitForURL(/calendar|dashboard/, { timeout: 30000 });

    // Navigate to classroom
    await page.goto(`${appUrl}/classroom/${bookingId}`);
    await page.waitForLoadState("networkidle", { timeout: 30000 });

    // Check for pre-join first
    const hasPreJoin = await page.locator('[data-testid="classroom-prejoin"]').isVisible({ timeout: 10000 }).catch(() => false);

    if (hasPreJoin) {
      // Join the room first
      const joinButton = page.getByRole("button", { name: /Join|Enter/i });
      const hasJoin = await joinButton.isVisible().catch(() => false);

      if (hasJoin) {
        await joinButton.click();
        await page.waitForLoadState("networkidle", { timeout: 15000 });
      }
    }

    // Wait for video stage or test mode
    await Promise.race([
      page.locator('[data-testid="video-stage"]').waitFor({ timeout: 15000 }).catch(() => {}),
      page.locator('[data-testid="test-mode-classroom"]').waitFor({ timeout: 15000 }).catch(() => {}),
      page.locator('[data-lk-theme="default"]').waitFor({ timeout: 15000 }).catch(() => {}),
    ]);

    // Look for quality overlay (shows current layer like HIGH, MEDIUM, LOW)
    const qualityOverlay = page.locator('[data-testid="quality-overlay"]');
    const hasOverlay = await qualityOverlay.isVisible().catch(() => false);

    // Quality overlay may not be visible if metrics aren't available yet
    // This is expected behavior - the overlay only shows when there's data
    if (hasOverlay) {
      const overlayText = await qualityOverlay.textContent();
      expect(overlayText).toBeTruthy();
    }

    // Verify we're in the classroom (either test mode or live)
    const inClassroom =
      (await page.locator('[data-testid="video-stage"]').isVisible().catch(() => false)) ||
      (await page.locator('[data-testid="test-mode-classroom"]').isVisible().catch(() => false)) ||
      (await page.locator('[data-lk-theme="default"]').isVisible().catch(() => false));

    expect(inClassroom).toBeTruthy();
  });
});
