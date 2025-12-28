import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

// Create Supabase admin client for test setup
function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Test the new manual booking flow with payment options
 * This tests the enterprise-grade manual booking feature
 */
test.describe("Manual Booking Flow", () => {
  test.setTimeout(3 * 60 * 1000); // 3 minutes max

  test("should display redesigned New Lesson modal with correct terminology", async ({ browser, baseURL }) => {
    const appUrl = baseURL ?? "http://localhost:3000";
    const now = Date.now();

    // Create test tutor
    const tutor = {
      fullName: "Booking Test Tutor " + now,
      email: `booking.test.${now}@example.com`,
      username: `booking-test-${now}`,
      password: `BookT3st!${now}`,
    };

    const adminClient = createAdminClient();

    // Create tutor user
    const { data: tutorUser, error: tutorError } = await adminClient.auth.admin.createUser({
      email: tutor.email,
      password: tutor.password,
      email_confirm: true,
      user_metadata: {
        full_name: tutor.fullName,
        username: tutor.username,
        role: "tutor",
        plan: "professional",
      },
    });

    if (tutorError || !tutorUser.user) {
      throw new Error(`Failed to create tutor: ${tutorError?.message}`);
    }

    const tutorId = tutorUser.user.id;

    try {
      // Create tutor profile
      await adminClient.from("profiles").upsert({
        id: tutorId,
        email: tutor.email,
        full_name: tutor.fullName,
        username: tutor.username,
        role: "tutor",
        plan: "professional",
        onboarding_completed: true,
        timezone: "America/New_York",
      });

      // Create test student
      const { data: student } = await adminClient.from("students").insert({
        tutor_id: tutorId,
        full_name: "Test Student",
        email: `test.student.${now}@example.com`,
        timezone: "America/New_York",
        calendar_access_status: "approved",
      }).select().single();

      // Create availability (9 AM - 5 PM every day)
      const availabilitySlots = [];
      for (let day = 0; day <= 6; day++) {
        availabilitySlots.push({
          tutor_id: tutorId,
          day_of_week: day,
          start_time: "09:00",
          end_time: "17:00",
          is_available: true,
        });
      }
      await adminClient.from("availability").insert(availabilitySlots);

      // Login and navigate to bookings
      const context = await browser.newContext();
      const page = await context.newPage();

      await page.goto(`${appUrl}/login`);
      await page.fill('input[name="email"]', tutor.email);
      await page.fill('input[name="password"]', tutor.password);
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/(dashboard|calendar|bookings)/, { timeout: 15000 });

      await page.goto(`${appUrl}/bookings`);
      await page.waitForLoadState("networkidle");

      // Test 1: Verify "New Lesson" button exists (renamed from "Add Booking")
      const newLessonButton = page.locator('button:has-text("New Lesson")');
      await expect(newLessonButton).toBeVisible({ timeout: 10000 });
      await newLessonButton.click();

      // Test 2: Verify modal title is "New Lesson"
      const modalTitle = page.locator('[role="dialog"] h2');
      await expect(modalTitle).toContainText("New Lesson");

      // Test 3: Verify description text
      await expect(page.locator('text=Schedule a lesson and send your student the details')).toBeVisible();

      // Test 4: Verify step labels use new terminology ("Lesson", "Student", "Review & Send")
      // Use more specific selectors for step labels in the flow progress component
      const stepLabels = page.locator('[role="dialog"]').locator('p.text-sm.font-semibold');
      const labels = await stepLabels.allTextContents();
      expect(labels.some(l => l.includes("Lesson"))).toBe(true);
      expect(labels.some(l => l.includes("Student"))).toBe(true);
      expect(labels.some(l => l.includes("Review"))).toBe(true);

      // Test 5: Navigate through steps and verify payment options
      // Step 1: Select service and time
      const serviceSelect = page.locator('[role="dialog"] select').first();
      await serviceSelect.waitFor({ state: "visible" });

      // Get available options
      const serviceOptions = await serviceSelect.locator('option').all();
      if (serviceOptions.length > 1) {
        await serviceSelect.selectOption({ index: 1 });
      }

      // Select date
      const dateSelect = page.locator('[role="dialog"] select').nth(1);
      await dateSelect.waitFor({ state: "visible" });
      const dateOptions = await dateSelect.locator('option').allTextContents();
      if (dateOptions.length > 1 && !dateOptions[0].includes("No available")) {
        await dateSelect.selectOption({ index: 1 });
      }

      // Wait for time options and select
      await page.waitForTimeout(500);
      const timeSelect = page.locator('[role="dialog"] select').nth(2);
      const timeOptions = await timeSelect.locator('option').allTextContents();
      if (timeOptions.length > 1) {
        await timeSelect.selectOption({ index: 1 });
      }

      // Click Continue
      await page.click('[role="dialog"] button:has-text("Continue")');
      await page.waitForTimeout(500);

      // Step 2: Select student
      if (student) {
        const studentSelect = page.locator('[role="dialog"] select').first();
        await studentSelect.waitFor({ state: "visible" });
        const studentOptions = await studentSelect.locator('option').allTextContents();
        const testStudentIndex = studentOptions.findIndex(opt => opt.includes("Test Student"));
        if (testStudentIndex >= 0) {
          await studentSelect.selectOption({ index: testStudentIndex });
        }
      }

      // Click Continue
      await page.click('[role="dialog"] button:has-text("Continue")');
      await page.waitForTimeout(500);

      // Step 3: Verify payment options are visible
      await expect(page.locator('[role="dialog"]').locator('text=Send payment link')).toBeVisible();
      await expect(page.locator('[role="dialog"]').locator('text=Already paid')).toBeVisible();
      await expect(page.locator('[role="dialog"]').locator('text=Free / trial lesson')).toBeVisible();

      // Verify radio buttons exist
      const sendLinkRadio = page.locator('[role="dialog"] input[value="send_link"]');
      const alreadyPaidRadio = page.locator('[role="dialog"] input[value="already_paid"]');
      const freeRadio = page.locator('[role="dialog"] input[value="free"]');

      await expect(sendLinkRadio).toBeVisible();
      await expect(alreadyPaidRadio).toBeVisible();
      await expect(freeRadio).toBeVisible();

      // Test selecting different payment options
      await alreadyPaidRadio.check();
      await expect(alreadyPaidRadio).toBeChecked();

      await freeRadio.check();
      await expect(freeRadio).toBeChecked();

      // Verify "Schedule Lesson" button exists
      await expect(page.locator('[role="dialog"] button:has-text("Schedule Lesson")')).toBeVisible();

      // Verify lesson summary card shows Price
      await expect(page.locator('[role="dialog"]').locator('text=Price').first()).toBeVisible();

      await context.close();
    } finally {
      // Cleanup: Delete test data
      await adminClient.from("availability").delete().eq("tutor_id", tutorId);
      await adminClient.from("students").delete().eq("tutor_id", tutorId);
      await adminClient.from("services").delete().eq("tutor_id", tutorId);
      await adminClient.from("profiles").delete().eq("id", tutorId);
      await adminClient.auth.admin.deleteUser(tutorId);
    }
  });
});
