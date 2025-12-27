import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

// Create Supabase admin client for test setup
function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables");
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Full-funnel smoke: tutor signs up, student requests access and books,
// booking appears in tutor dashboard. Runs serially because steps depend on shared state.
test.describe("Smoke | Tutor golden path", () => {
  test.setTimeout(5 * 60 * 1000); // 5 minutes max
  test.describe.configure({ mode: "serial" });

  test("Tutor dashboard to booked lesson visible", async ({ browser, baseURL }) => {
    const appUrl = baseURL ?? "http://localhost:3000";
    const now = Date.now();
    const tutor = {
      fullName: "Smoke Tutor " + now,
      email: `smoke.tutor.${now}@example.com`,
      username: `smoke-tutor-${now}`,
      password: `SmokeT3st!${now}`,
    } as const;
    // Note: The database trigger `handle_new_user` automatically creates 3 default services
    // when a user is created: "Language Trial Lesson with {firstName}",
    // "Language Lesson with {firstName}" (25min), "Language Lesson with {firstName}" (55min).
    // The booking interface defaults to the first service alphabetically, which is
    // "Language Lesson with {firstName}" (not Trial).
    const firstName = tutor.fullName.split(" ")[0];
    const serviceName = `Language Lesson with ${firstName}`;
    const student = {
      fullName: "Smoke Student " + now,
      email: `smoke.student.${now}@example.com`,
      password: `SmokeStud3nt!${now}`,
    } as const;

    const adminClient = createAdminClient();

    // Create tutor user via Admin API (pre-confirmed, bypasses email)
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
      throw new Error(`Failed to create tutor user: ${tutorError?.message}`);
    }

    // Create tutor profile with onboarding COMPLETED (skip the buggy onboarding flow)
    const { error: profileError } = await adminClient.from("profiles").upsert({
      id: tutorUser.user.id,
      email: tutor.email,
      full_name: tutor.fullName,
      username: tutor.username,
      role: "tutor",
      plan: "professional",
      onboarding_completed: true, // Skip onboarding
      timezone: "America/New_York",
      tagline: "Helping busy learners stay fluent every week",
      bio: "I specialize in practical conversation drills, cultural notes, and confidence building.",
      languages_taught: ["English"],
      booking_currency: "USD",
    });

    if (profileError) {
      throw new Error(`Failed to create tutor profile: ${profileError.message}`);
    }

    // Verify the profile is accessible via public_profiles view
    const { data: publicProfile, error: publicProfileError } = await adminClient
      .from("public_profiles")
      .select("id, username, full_name, role")
      .eq("username", tutor.username)
      .single();

    if (publicProfileError || !publicProfile) {
      throw new Error(`Tutor profile not visible in public_profiles view: ${publicProfileError?.message || "not found"}`);
    }


    // Services are auto-created by the database trigger handle_new_user() when user is created.
    // Verify they exist.
    const { data: autoCreatedServices, error: serviceError } = await adminClient
      .from("services")
      .select("id, name, tutor_id, is_active")
      .eq("tutor_id", tutorUser.user.id)
      .eq("is_active", true);

    if (serviceError || !autoCreatedServices || autoCreatedServices.length === 0) {
      throw new Error(`Auto-created services not found: ${serviceError?.message || "No services"}`);
    }

    // Create availability for the tutor (Sun-Thu 9am-5pm)
    // Note: 0=Sunday, 1=Monday, etc. in JavaScript Date.getDay()
    const availabilitySlots = [0, 1, 2, 3, 4].map((dayOfWeek) => ({
      tutor_id: tutorUser.user.id,
      day_of_week: dayOfWeek,
      start_time: "09:00",
      end_time: "17:00",
      is_available: true,
    }));

    const { error: availError } = await adminClient.from("availability").insert(availabilitySlots);
    if (availError) {
      throw new Error(`Failed to create availability: ${availError.message}`);
    }

    // Create student user via Admin API (pre-confirmed, bypasses email)
    const { data: studentUser, error: studentError } = await adminClient.auth.admin.createUser({
      email: student.email,
      password: student.password,
      email_confirm: true,
      user_metadata: {
        full_name: student.fullName,
        role: "student",
      },
    });

    if (studentError || !studentUser.user) {
      throw new Error(`Failed to create student user: ${studentError?.message}`);
    }

    // First, check what columns exist in students table
    const { data: existingStudents } = await adminClient
      .from("students")
      .select("*")
      .limit(1);

    const studentColumns = existingStudents?.[0] ? Object.keys(existingStudents[0]) : [];

    // Create student record linked to tutor
    // Conditionally include calendar_access_status only if column exists
    const studentInsertData: Record<string, unknown> = {
      tutor_id: tutorUser.user.id,
      user_id: studentUser.user.id,
      full_name: student.fullName,
      email: student.email,
      status: "active",
    };

    if (studentColumns.includes("calendar_access_status")) {
      studentInsertData.calendar_access_status = "approved";
    }

    const { error: studentRecordError } = await adminClient.from("students").insert(studentInsertData);

    if (studentRecordError) {
      throw new Error(`Failed to create student record: ${studentRecordError.message}`);
    }

    const tutorContext = await browser.newContext();
    const studentContext = await browser.newContext();
    const tutorPage = await tutorContext.newPage();
    const studentPage = await studentContext.newPage();

    const goto = (page: typeof tutorPage, path: string) => page.goto(`${appUrl}${path}`);

    try {
      // Tutor logs in (user already created via Admin API with completed onboarding)
      await goto(tutorPage, "/login");
      await tutorPage.getByLabel("Email address").fill(tutor.email);
      await tutorPage.getByRole("textbox", { name: "Password" }).fill(tutor.password);
      await tutorPage.getByRole("button", { name: "Log in", exact: true }).click();

      // Wait for navigation to dashboard/calendar
      try {
        await tutorPage.waitForURL(/calendar|dashboard/, { timeout: 60000 });
      } catch {
        // Take screenshot for debugging
        await tutorPage.screenshot({ path: "test-results/login-error.png" });
        const bodyText = await tutorPage.locator("body").innerText();
        throw new Error(`Tutor login timeout. Page URL: ${tutorPage.url()}\nVisible text: ${bodyText.substring(0, 1500)}`);
      }

      // Verify tutor is on the dashboard/calendar
      await expect(tutorPage.getByRole("link", { name: "Calendar" })).toBeVisible({ timeout: 10000 });

      // Verify the booking page is accessible (should show public landing for unauthenticated users)
      const testPage = await studentContext.newPage();
      const bookingPageResponse = await testPage.goto(`${appUrl}/book/${tutor.username}`);
      if (bookingPageResponse?.status() === 404) {
        throw new Error(`Booking page returns 404 for username ${tutor.username}`);
      }
      await testPage.close();

      // Student logs in directly (already approved via Admin API)
      await goto(studentPage, `/student/login?tutor=${tutor.username}&redirect=${encodeURIComponent(`/book/${tutor.username}`)}`);
      await studentPage.getByLabel(/Email/).fill(student.email);
      await studentPage.getByLabel(/Password/).fill(student.password);
      await Promise.all([
        studentPage.waitForURL(/book\//, { timeout: 30000 }),
        studentPage.getByRole("button", { name: /Sign in/i }).click(),
      ]);
      // Wait for the booking page to load
      try {
        await expect(studentPage.getByRole("heading", { name: new RegExp(`Book a lesson with ${tutor.fullName}`, "i") })).toBeVisible({ timeout: 30000 });
      } catch {
        await studentPage.screenshot({ path: "test-results/booking-page-error.png" });
        const bodyText = await studentPage.locator("body").innerText();
        throw new Error(`Booking page heading not found. Page URL: ${studentPage.url()}\nVisible text: ${bodyText.substring(0, 2000)}`);
      }

      // Pick the first available slot and confirm booking.
      const timeSlotButton = studentPage.getByRole("button", { name: /\d{1,2}:\d{2}\s?(AM|PM)/ }).first();
      await expect(timeSlotButton).toBeVisible({ timeout: 15000 });
      await timeSlotButton.click();

      // Fill the booking form
      const fullNameField = studentPage.getByLabel("Full Name *");
      if (await fullNameField.isVisible()) {
        await fullNameField.fill(student.fullName);
      }

      const emailField = studentPage.getByLabel("Email Address *");
      if (await emailField.isVisible()) {
        await emailField.fill(student.email);
      }

      // Take screenshot before clicking confirm
      await studentPage.screenshot({ path: "test-results/before-confirm-booking.png" });

      const confirmButton = studentPage.getByRole("button", { name: "Confirm Booking" });
      await expect(confirmButton).toBeVisible({ timeout: 10000 });
      await confirmButton.click();

      // Wait for success with better error handling
      try {
        await studentPage.waitForURL(/book\/success/, { timeout: 30000 });
      } catch {
        await studentPage.screenshot({ path: "test-results/booking-submit-error.png" });
        const bodyText = await studentPage.locator("body").innerText();
        throw new Error(`Booking submission failed or didn't redirect. Page URL: ${studentPage.url()}\nVisible text: ${bodyText.substring(0, 2000)}`);
      }

      // Tutor sees the booking in the dashboard list.
      await goto(tutorPage, "/bookings");
      const bookingRow = tutorPage.locator("li", { hasText: student.fullName }).filter({ hasText: serviceName }).first();
      await expect(bookingRow).toBeVisible({ timeout: 30000 });
    } finally {
      // Cleanup: Delete test users
      try {
        await adminClient.auth.admin.deleteUser(tutorUser.user.id);
      } catch {
        // Ignore cleanup errors
      }

      try {
        await adminClient.auth.admin.deleteUser(studentUser.user.id);
      } catch {
        // Ignore cleanup errors
      }

      await tutorContext.close();
      await studentContext.close();
    }
  });
});
