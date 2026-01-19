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

  test("should open calendar booking modal via deep link", async ({ browser, baseURL }) => {
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
      if (!student) {
        throw new Error("Failed to create test student");
      }

      // Ensure at least one active service exists
      const { data: existingServices } = await adminClient
        .from("services")
        .select("id")
        .eq("tutor_id", tutorId)
        .eq("is_active", true)
        .limit(1);

      if (!existingServices || existingServices.length === 0) {
        const { error: serviceError } = await adminClient
          .from("services")
          .insert({
            tutor_id: tutorId,
            name: "E2E Lesson",
            description: "Manual booking flow test service",
            duration_minutes: 60,
            price_amount: 5000,
            price_currency: "USD",
            price: 5000,
            currency: "USD",
            is_active: true,
            requires_approval: false,
            max_students_per_session: 1,
            offer_type: "one_off",
          });

        if (serviceError) {
          throw new Error(`Failed to create test service: ${serviceError.message}`);
        }
      }

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

      // Open booking modal via calendar deep link
      const bookViaCalendarLink = page.getByRole("link", { name: "Book via Calendar" });
      await expect(bookViaCalendarLink).toBeVisible({ timeout: 10000 });
      await bookViaCalendarLink.click();
      await page.waitForURL(/\/calendar/);

      const modalHeading = page.getByRole("heading", { name: "Create Booking" });
      await expect(modalHeading).toBeVisible();
      const modal = modalHeading.locator("..").locator("..");

      await expect(modal.locator('text=Quick mode')).toBeVisible();

      const serviceSelect = modal.locator("select").first();
      await serviceSelect.waitFor({ state: "visible" });

      // Get available options
      const serviceOptions = await serviceSelect.locator('option').all();
      if (serviceOptions.length > 1) {
        await serviceSelect.selectOption({ index: 1 });
      }

      const studentSelect = modal.locator("select").nth(1);
      await studentSelect.waitFor({ state: "visible" });
      await studentSelect.selectOption({ label: `Test Student (${student.email})` });

      await expect(modal.locator('input[type="date"]')).toBeVisible();
      await expect(modal.locator('input[type="time"]')).toBeVisible();
      await expect(modal.locator('textarea')).toBeVisible();

      await expect(modal.locator('button:has-text("Unpaid")')).toBeVisible();
      await expect(modal.locator('button:has-text("Paid")')).toBeVisible();

      await expect(modal.locator('button:has-text("Create Booking")')).toBeVisible();

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
