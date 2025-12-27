/**
 * E2E Test Fixtures
 *
 * Provides stable, predictable test users and data for E2E tests.
 * Uses fresh data per test run with global setup/teardown.
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

// ============================================
// E2E TEST USER DEFINITIONS
// ============================================

export const E2E_TUTOR = {
  email: "e2e.tutor@tutorlingua.test",
  username: "e2e-test-tutor",
  fullName: "E2E Test Tutor",
  password: process.env.E2E_TEST_USER_PASSWORD || "E2eTestPass123!",
  tier: "studio" as const,
  plan: "studio_monthly" as const,
  timezone: "America/New_York",
  languagesTaught: ["Spanish", "French"],
};

export const E2E_STUDENT = {
  email: "e2e.student@tutorlingua.test",
  fullName: "E2E Test Student",
  password: process.env.E2E_TEST_USER_PASSWORD || "E2eStud3nt!",
  nativeLanguage: "en",
  targetLanguage: "es",
  timezone: "America/Los_Angeles",
};

// ============================================
// SUPABASE ADMIN CLIENT
// ============================================

export function createE2EAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for E2E tests"
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// ============================================
// TEST DATA STATE
// ============================================

export interface E2ETestState {
  tutorUserId: string | null;
  studentUserId: string | null;
  studentRecordId: string | null;
  serviceId: string | null;
  bookingId: string | null;
  homeworkId: string | null;
}

let testState: E2ETestState = {
  tutorUserId: null,
  studentUserId: null,
  studentRecordId: null,
  serviceId: null,
  bookingId: null,
  homeworkId: null,
};

export function getTestState(): E2ETestState {
  return { ...testState };
}

async function findAuthUserByEmail(
  adminClient: SupabaseClient,
  email: string
): Promise<{ id: string } | null> {
  const perPage = 1000;
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const { data: userList, error } = await adminClient.auth.admin.listUsers({
      page,
      perPage,
    });
    if (error) {
      break;
    }
    const match = userList?.users?.find((user) => user.email === email);

    if (match) {
      return { id: match.id };
    }

    if (!userList?.users?.length || userList.users.length < perPage) {
      hasMore = false;
    } else {
      page += 1;
    }
  }

  const { data: profile } = await adminClient
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (profile?.id) {
    return { id: profile.id };
  }

  const { data: student } = await adminClient
    .from("students")
    .select("user_id")
    .eq("email", email)
    .maybeSingle();

  return student?.user_id ? { id: student.user_id } : null;
}

// ============================================
// SETUP FUNCTIONS
// ============================================

export async function setupTestEnvironment(
  adminClient: SupabaseClient
): Promise<E2ETestState> {
  console.log("[E2E Setup] Starting test environment setup...");

  // Clean up any existing test data first
  await cleanupExistingTestData(adminClient);

  // Create tutor user
  const tutorUserId = await createTestTutor(adminClient);
  testState.tutorUserId = tutorUserId;

  // Create student user
  const { studentUserId, studentRecordId } = await createTestStudent(
    adminClient,
    tutorUserId
  );
  testState.studentUserId = studentUserId;
  testState.studentRecordId = studentRecordId;

  // Get or create service (trigger auto-creates 3 default services)
  const serviceId = await getOrCreateTestService(adminClient, tutorUserId);
  testState.serviceId = serviceId;

  // Create sample booking
  const bookingId = await createTestBooking(
    adminClient,
    tutorUserId,
    studentRecordId,
    serviceId
  );
  testState.bookingId = bookingId;

  // Create sample homework
  const homeworkId = await createTestHomework(
    adminClient,
    tutorUserId,
    studentRecordId
  );
  testState.homeworkId = homeworkId;

  console.log("[E2E Setup] Test environment setup complete:", testState);
  return testState;
}

async function cleanupExistingTestData(adminClient: SupabaseClient): Promise<void> {
  console.log("[E2E Setup] Cleaning up existing test data...");

  // Find existing test users by email
  const { data: existingTutor } = await adminClient
    .from("profiles")
    .select("id")
    .eq("email", E2E_TUTOR.email)
    .maybeSingle();

  const existingTutorAuth = await findAuthUserByEmail(
    adminClient,
    E2E_TUTOR.email
  );
  const tutorId = existingTutor?.id ?? existingTutorAuth?.id ?? null;

  if (tutorId) {
    // Delete in order respecting FK constraints
    await adminClient.from("homework_submissions").delete().eq("tutor_id", tutorId);
    await adminClient.from("homework_assignments").delete().eq("tutor_id", tutorId);
    await adminClient.from("bookings").delete().eq("tutor_id", tutorId);
    await adminClient.from("students").delete().eq("tutor_id", tutorId);
    await adminClient.from("services").delete().eq("tutor_id", tutorId);
    await adminClient.from("availability").delete().eq("tutor_id", tutorId);
    await adminClient.from("profiles").delete().eq("id", tutorId);

    // Delete auth user
    await adminClient.auth.admin.deleteUser(tutorId);
  }

  // Find existing student user
  const existingStudent = await findAuthUserByEmail(
    adminClient,
    E2E_STUDENT.email
  );
  if (existingStudent) {
    await adminClient.auth.admin.deleteUser(existingStudent.id);
  }
  await adminClient.from("students").delete().eq("email", E2E_STUDENT.email);

  console.log("[E2E Setup] Existing test data cleaned up");
}

async function createTestTutor(adminClient: SupabaseClient): Promise<string> {
  console.log("[E2E Setup] Creating test tutor...");

  // Create auth user
  const { data: tutorUser, error: tutorError } = await adminClient.auth.admin.createUser({
    email: E2E_TUTOR.email,
    password: E2E_TUTOR.password,
    email_confirm: true,
    user_metadata: {
      full_name: E2E_TUTOR.fullName,
      username: E2E_TUTOR.username,
      role: "tutor",
      plan: E2E_TUTOR.plan,
    },
  });

  if (tutorError || !tutorUser.user) {
    throw new Error(`Failed to create E2E tutor: ${tutorError?.message}`);
  }

  // Update profile (trigger auto-creates it)
  const { error: profileError } = await adminClient.from("profiles").upsert({
    id: tutorUser.user.id,
    email: E2E_TUTOR.email,
    full_name: E2E_TUTOR.fullName,
    username: E2E_TUTOR.username,
    role: "tutor",
    plan: E2E_TUTOR.plan,
    tier: E2E_TUTOR.tier,
    onboarding_completed: true,
    timezone: E2E_TUTOR.timezone,
    languages_taught: E2E_TUTOR.languagesTaught,
    booking_currency: "USD",
    tagline: "E2E Test Tutor - Professional Spanish & French lessons",
    bio: "Experienced language tutor for automated E2E testing.",
  });

  if (profileError) {
    throw new Error(`Failed to update E2E tutor profile: ${profileError.message}`);
  }

  console.log("[E2E Setup] Test tutor created:", tutorUser.user.id);

  // Create availability for all days (9 AM - 5 PM in tutor's timezone)
  const availabilitySlots = [];
  for (let day = 0; day <= 6; day++) {
    availabilitySlots.push({
      tutor_id: tutorUser.user.id,
      day_of_week: day,
      start_time: "09:00",
      end_time: "17:00",
      is_available: true,
    });
  }

  const { error: availError } = await adminClient
    .from("availability")
    .insert(availabilitySlots);

  if (availError) {
    console.error("[E2E Setup] Failed to create availability:", availError);
  } else {
    console.log("[E2E Setup] Created availability for all days 9 AM - 5 PM");
  }

  return tutorUser.user.id;
}

async function createTestStudent(
  adminClient: SupabaseClient,
  tutorId: string
): Promise<{ studentUserId: string; studentRecordId: string }> {
  console.log("[E2E Setup] Creating test student...");

  // Create auth user for student
  const { data: studentUser, error: studentError } = await adminClient.auth.admin.createUser({
    email: E2E_STUDENT.email,
    password: E2E_STUDENT.password,
    email_confirm: true,
    user_metadata: {
      full_name: E2E_STUDENT.fullName,
      role: "student",
    },
  });

  let studentUserId: string | null = null;

  if (studentError) {
    if (studentError.message?.includes("already been registered")) {
      const existingStudent = await findAuthUserByEmail(
        adminClient,
        E2E_STUDENT.email
      );
      if (!existingStudent) {
        throw new Error(`Failed to locate existing E2E student user: ${studentError.message}`);
      }
      studentUserId = existingStudent.id;
      await adminClient.auth.admin.updateUserById(studentUserId, {
        password: E2E_STUDENT.password,
        user_metadata: {
          full_name: E2E_STUDENT.fullName,
          role: "student",
        },
      });
    } else {
      throw new Error(`Failed to create E2E student user: ${studentError.message}`);
    }
  } else if (studentUser.user) {
    studentUserId = studentUser.user.id;
  }

  if (!studentUserId) {
    throw new Error("Failed to resolve E2E student user ID");
  }

  // Create student record linked to tutor
  const studentPayload = {
    tutor_id: tutorId,
    user_id: studentUserId,
    email: E2E_STUDENT.email,
    full_name: E2E_STUDENT.fullName,
    native_language: E2E_STUDENT.nativeLanguage,
    proficiency_level: "intermediate",
    timezone: E2E_STUDENT.timezone,
    calendar_access_status: "approved",
    status: "active",
    source: "e2e_test",
    ai_practice_enabled: true,
    ai_practice_free_tier_enabled: true,
  };

  const { data: studentRecord, error: recordError } = await adminClient
    .from("students")
    .insert(studentPayload)
    .select()
    .single();

  let studentRecordId = studentRecord?.id ?? null;
  if (recordError) {
    const message = recordError.message?.toLowerCase() ?? "";
    const isDuplicate =
      message.includes("duplicate") ||
      message.includes("already exists") ||
      message.includes("unique");
    if (isDuplicate) {
      const { data: existingRecord } = await adminClient
        .from("students")
        .select("id")
        .or(`user_id.eq.${studentUserId},email.eq.${E2E_STUDENT.email}`)
        .maybeSingle();

      if (existingRecord?.id) {
        const { data: updatedRecord, error: updateError } = await adminClient
          .from("students")
          .update(studentPayload)
          .eq("id", existingRecord.id)
          .select()
          .single();

        if (updateError) {
          throw new Error(`Failed to update E2E student record: ${updateError.message}`);
        }
        studentRecordId = updatedRecord?.id ?? existingRecord.id;
      } else {
        throw new Error(
          `Failed to locate existing E2E student record after duplicate: ${recordError.message}`
        );
      }
    } else {
      throw new Error(`Failed to create E2E student record: ${recordError.message}`);
    }
  }

  if (!studentRecordId) {
    throw new Error("Failed to resolve E2E student record ID");
  }

  const { error: languageProfileError } = await adminClient
    .from("student_language_profiles")
    .upsert(
      {
        student_id: studentRecordId,
        target_language: E2E_STUDENT.targetLanguage,
        native_language: E2E_STUDENT.nativeLanguage,
      },
      { onConflict: "student_id,target_language" }
    );

  if (languageProfileError) {
    const message = languageProfileError.message.toLowerCase();
    const isMissingTable =
      message.includes("relation") ||
      message.includes("schema cache") ||
      message.includes("does not exist");
    if (!isMissingTable) {
      throw new Error(
        `Failed to create student language profile: ${languageProfileError.message}`
      );
    }
  }

  console.log("[E2E Setup] Test student created:", studentRecordId);
  return {
    studentUserId,
    studentRecordId,
  };
}

async function getOrCreateTestService(
  adminClient: SupabaseClient,
  tutorId: string
): Promise<string> {
  console.log("[E2E Setup] Getting or creating test service...");

  // Trigger auto-creates default services, check for existing
  const { data: existingServices } = await adminClient
    .from("services")
    .select("id, name")
    .eq("tutor_id", tutorId)
    .eq("is_active", true)
    .limit(1);

  if (existingServices && existingServices.length > 0) {
    console.log("[E2E Setup] Using existing service:", existingServices[0].id);
    return existingServices[0].id;
  }

  // Create service if none exist
  const { data: service, error } = await adminClient
    .from("services")
    .insert({
      tutor_id: tutorId,
      name: "E2E Spanish Lesson",
      description: "60-minute Spanish conversation practice for E2E testing",
      duration_minutes: 60,
      price_amount: 5000,
      price_currency: "USD",
      price: 5000,
      currency: "USD",
      is_active: true,
    })
    .select()
    .single();

  if (error || !service) {
    throw new Error(`Failed to create E2E service: ${error?.message}`);
  }

  console.log("[E2E Setup] Test service created:", service.id);
  return service.id;
}

async function createTestBooking(
  adminClient: SupabaseClient,
  tutorId: string,
  studentId: string,
  serviceId: string
): Promise<string> {
  console.log("[E2E Setup] Creating test booking...");

  // Schedule booking for tomorrow at 2 PM tutor's time
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(14, 0, 0, 0);

  const { data: booking, error } = await adminClient
    .from("bookings")
    .insert({
      tutor_id: tutorId,
      student_id: studentId,
      service_id: serviceId,
      scheduled_at: tomorrow.toISOString(),
      duration_minutes: 60,
      timezone: E2E_TUTOR.timezone,
      status: "confirmed",
      payment_status: "paid",
      payment_amount: 5000,
      currency: "USD",
      student_notes: "E2E test booking - please ignore",
    })
    .select()
    .single();

  if (error || !booking) {
    throw new Error(`Failed to create E2E booking: ${error?.message}`);
  }

  console.log("[E2E Setup] Test booking created:", booking.id);
  return booking.id;
}

async function createTestHomework(
  adminClient: SupabaseClient,
  tutorId: string,
  studentId: string
): Promise<string> {
  console.log("[E2E Setup] Creating test homework...");

  // Due date in 7 days
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 7);

  const { data: homework, error } = await adminClient
    .from("homework_assignments")
    .insert({
      tutor_id: tutorId,
      student_id: studentId,
      title: "E2E Verb Conjugation Practice",
      instructions: "Complete the verb conjugation exercises in chapter 5. Focus on irregular verbs.",
      due_date: dueDate.toISOString(),
      status: "assigned",
      attachments: [
        {
          type: "link",
          title: "Spanish Verb Conjugation Guide",
          url: "https://example.com/spanish-verbs",
        },
      ],
    })
    .select()
    .single();

  if (error || !homework) {
    throw new Error(`Failed to create E2E homework: ${error?.message}`);
  }

  console.log("[E2E Setup] Test homework created:", homework.id);
  return homework.id;
}

// ============================================
// TEARDOWN FUNCTIONS
// ============================================

export async function teardownTestEnvironment(
  adminClient: SupabaseClient
): Promise<void> {
  console.log("[E2E Teardown] Starting test environment cleanup...");

  const state = getTestState();

  // Delete in order respecting FK constraints
  if (state.homeworkId) {
    await adminClient.from("homework_submissions").delete().eq("homework_id", state.homeworkId);
    await adminClient.from("homework_assignments").delete().eq("id", state.homeworkId);
  }

  if (state.bookingId) {
    await adminClient.from("bookings").delete().eq("id", state.bookingId);
  }

  if (state.studentRecordId) {
    await adminClient.from("students").delete().eq("id", state.studentRecordId);
  }

  if (state.serviceId) {
    // Don't delete services if they were auto-created
  }

  if (state.tutorUserId) {
    // Delete all tutor data
    await adminClient.from("services").delete().eq("tutor_id", state.tutorUserId);
    await adminClient.from("availability").delete().eq("tutor_id", state.tutorUserId);
    await adminClient.from("profiles").delete().eq("id", state.tutorUserId);
    await adminClient.auth.admin.deleteUser(state.tutorUserId);
  }

  if (state.studentUserId) {
    await adminClient.auth.admin.deleteUser(state.studentUserId);
  }

  // Reset state
  testState = {
    tutorUserId: null,
    studentUserId: null,
    studentRecordId: null,
    serviceId: null,
    bookingId: null,
    homeworkId: null,
  };

  console.log("[E2E Teardown] Test environment cleanup complete");
}
