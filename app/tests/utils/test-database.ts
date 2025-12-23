/**
 * Test Database Utilities for Enterprise-Grade Testing
 *
 * Provides utilities for:
 * - Creating Supabase test clients
 * - Test data isolation and cleanup
 * - Test data factories for common entities
 * - Transaction-based test isolation
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

// ============================================
// TEST DATA PREFIX
// ============================================

/**
 * Prefix for test data to enable easy cleanup
 */
export const TEST_DATA_PREFIX = "TEST_";

/**
 * Generates a unique test identifier
 */
export function generateTestId(): string {
  return `${TEST_DATA_PREFIX}${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// ============================================
// SUPABASE TEST CLIENT
// ============================================

/**
 * Creates a Supabase admin client for testing
 * Uses service role key to bypass RLS
 */
export function createTestClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing Supabase test environment variables. " +
        "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Checks if Supabase environment is configured for testing
 */
export function isTestEnvironmentConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

// ============================================
// TEST ISOLATION
// ============================================

/**
 * Tracks created test records for cleanup
 */
export class TestIsolation {
  private client: SupabaseClient;
  private createdIds: Map<string, string[]> = new Map();
  private prefix: string;

  constructor(client: SupabaseClient, prefix?: string) {
    this.client = client;
    this.prefix = prefix || generateTestId();
  }

  /**
   * Track a created record for cleanup
   */
  track(table: string, id: string): void {
    const ids = this.createdIds.get(table) || [];
    ids.push(id);
    this.createdIds.set(table, ids);
  }

  /**
   * Get all tracked IDs for a table
   */
  getTrackedIds(table: string): string[] {
    return this.createdIds.get(table) || [];
  }

  /**
   * Get the test prefix
   */
  getPrefix(): string {
    return this.prefix;
  }

  /**
   * Create a record and track it automatically
   */
  async createWithTracking<T extends { id?: string }>(
    table: string,
    data: T
  ): Promise<T & { id: string }> {
    const { data: result, error } = await this.client
      .from(table)
      .insert(data)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create test record in ${table}: ${error.message}`);
    }

    this.track(table, result.id);
    return result;
  }

  /**
   * Clean up all tracked records in the correct order (respecting FK constraints)
   */
  async cleanup(): Promise<void> {
    // Order matters: delete child records before parents
    const deletionOrder = [
      // Lesson analysis
      "processing_logs",
      "lesson_drills",
      "marketing_clips",
      "lesson_recordings",

      // Practice
      "student_practice_messages",
      "grammar_issues",
      "pronunciation_assessments",
      "student_practice_sessions",
      "practice_assignments",
      "practice_usage_periods",
      "practice_scenarios",

      // Homework
      "homework_submissions",
      "homework_assignments",

      // Progress
      "proficiency_assessments",
      "learning_goals",
      "learning_stats",
      "lesson_notes",
      "student_language_profiles",

      // Messaging
      "conversation_messages",
      "conversation_threads",

      // Booking
      "booking_reschedule_history",
      "lesson_subscription_redemptions",
      "session_package_redemptions",
      "bookings",

      // Subscriptions
      "lesson_allowance_periods",
      "lesson_subscriptions",
      "lesson_subscription_templates",
      "session_package_purchases",
      "session_package_templates",

      // Students
      "student_access_requests",
      "student_tutor_connections",
      "students",

      // Services
      "services",

      // Tutors
      "availability",
      "blocked_times",
      "calendar_connections",
      "tutor_sites",
      "profiles",
    ];

    for (const table of deletionOrder) {
      const ids = this.createdIds.get(table);
      if (ids && ids.length > 0) {
        try {
          const { error } = await this.client.from(table).delete().in("id", ids);

          if (error) {
            console.warn(`Warning: Failed to cleanup ${table}: ${error.message}`);
          }
        } catch (e) {
          console.warn(`Warning: Exception during cleanup of ${table}:`, e);
        }
      }
    }

    this.createdIds.clear();
  }

  /**
   * Clean up all test data by prefix (fallback method)
   */
  async cleanupByPrefix(): Promise<void> {
    // Only works for tables with username/email/name fields containing the prefix
    const tables = [
      { table: "profiles", field: "username" },
      { table: "students", field: "email" },
    ];

    for (const { table, field } of tables) {
      try {
        const { error } = await this.client
          .from(table)
          .delete()
          .like(field, `%${this.prefix}%`);

        if (error) {
          console.warn(`Warning: Failed to cleanup ${table} by prefix: ${error.message}`);
        }
      } catch (e) {
        console.warn(`Warning: Exception during prefix cleanup of ${table}:`, e);
      }
    }
  }
}

// ============================================
// TEST DATA FACTORIES
// ============================================

export const TestDataFactories = {
  /**
   * Create a test tutor profile
   */
  createTestTutor: async (
    client: SupabaseClient,
    options: {
      tier?: "standard" | "studio";
      email?: string;
      username?: string;
      fullName?: string;
      stripeAccountId?: string;
      stripeChargesEnabled?: boolean;
      onboardingCompleted?: boolean;
    } = {}
  ): Promise<{ id: string; email: string; username: string; [key: string]: any }> => {
    const testId = generateTestId();
    const email = options.email || `tutor_${testId}@test.tutorlingua.co`;
    const username = options.username || `tutor_${testId}`;

    // First create auth user
    const { data: authUser, error: authError } = await client.auth.admin.createUser({
      email,
      password: `Test123!${testId}`,
      email_confirm: true,
      user_metadata: {
        full_name: options.fullName || `Test Tutor ${testId}`,
      },
    });

    if (authError) {
      throw new Error(`Failed to create test auth user: ${authError.message}`);
    }

    // Update profile (created by trigger)
    const { data: profile, error: profileError } = await client
      .from("profiles")
      .update({
        username,
        full_name: options.fullName || `Test Tutor ${testId}`,
        tier: options.tier || "studio",
        stripe_account_id: options.stripeAccountId,
        stripe_charges_enabled: options.stripeChargesEnabled ?? false,
        onboarding_completed: options.onboardingCompleted ?? true,
        timezone: "America/New_York",
        tagline: "Test tutor for automated testing",
      })
      .eq("id", authUser.user.id)
      .select()
      .single();

    if (profileError) {
      throw new Error(`Failed to update test profile: ${profileError.message}`);
    }

    return { ...profile, email };
  },

  /**
   * Create a test student
   */
  createTestStudent: async (
    client: SupabaseClient,
    tutorId: string,
    options: {
      email?: string;
      fullName?: string;
      userId?: string;
      nativeLanguage?: string;
      targetLanguage?: string;
      calendarAccessStatus?: "pending" | "approved" | "denied" | "suspended";
      labels?: string[];
    } = {}
  ): Promise<{ id: string; email: string; [key: string]: any }> => {
    const testId = generateTestId();
    const email = options.email || `student_${testId}@test.example.com`;

    const { data: student, error } = await client
      .from("students")
      .insert({
        tutor_id: tutorId,
        email,
        full_name: options.fullName || `Test Student ${testId}`,
        user_id: options.userId,
        native_language: options.nativeLanguage || "es",
        target_language: options.targetLanguage || "en",
        calendar_access_status: options.calendarAccessStatus || "approved",
        labels: options.labels || [],
        timezone: "America/Los_Angeles",
        source: "test",
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create test student: ${error.message}`);
    }

    return student;
  },

  /**
   * Create a test service
   */
  createTestService: async (
    client: SupabaseClient,
    tutorId: string,
    options: {
      name?: string;
      duration?: number;
      priceAmount?: number;
      currency?: string;
    } = {}
  ): Promise<{ id: string; [key: string]: any }> => {
    const testId = generateTestId();

    const { data: service, error } = await client
      .from("services")
      .insert({
        tutor_id: tutorId,
        name: options.name || `Test Service ${testId}`,
        description: "A test service for automated testing",
        duration_minutes: options.duration || 60,
        price_amount: options.priceAmount || 5000,
        currency: options.currency || "usd",
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create test service: ${error.message}`);
    }

    return service;
  },

  /**
   * Create a test booking
   */
  createTestBooking: async (
    client: SupabaseClient,
    options: {
      tutorId: string;
      studentId: string;
      serviceId: string;
      scheduledAt?: Date;
      status?: "pending" | "confirmed" | "cancelled" | "completed";
      paymentStatus?: "paid" | "unpaid";
      durationMinutes?: number;
    }
  ): Promise<{ id: string; [key: string]: any }> => {
    const scheduledAt = options.scheduledAt || new Date(Date.now() + 24 * 60 * 60 * 1000);

    const { data: booking, error } = await client
      .from("bookings")
      .insert({
        tutor_id: options.tutorId,
        student_id: options.studentId,
        service_id: options.serviceId,
        scheduled_at: scheduledAt.toISOString(),
        status: options.status || "confirmed",
        payment_status: options.paymentStatus || "paid",
        duration_minutes: options.durationMinutes || 60,
        amount: 5000,
        currency: "usd",
        student_timezone: "America/Los_Angeles",
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create test booking: ${error.message}`);
    }

    return booking;
  },

  /**
   * Create a test lesson recording
   */
  createTestRecording: async (
    client: SupabaseClient,
    options: {
      bookingId: string;
      tutorId: string;
      studentId: string;
      status?: "pending" | "transcribing" | "analyzing" | "completed" | "failed";
      transcriptJson?: unknown;
      durationSeconds?: number;
      storagePath?: string;
      egressId?: string;
    }
  ): Promise<{ id: string; [key: string]: any }> => {
    const testId = generateTestId();

    const { data: recording, error } = await client
      .from("lesson_recordings")
      .insert({
        booking_id: options.bookingId,
        tutor_id: options.tutorId,
        student_id: options.studentId,
        status: options.status || "pending",
        transcript_json: options.transcriptJson,
        duration_seconds: options.durationSeconds || 1800,
        storage_path: options.storagePath || `recordings/test/${testId}.mp4`,
        egress_id: options.egressId || `EG_${testId}`,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create test recording: ${error.message}`);
    }

    return recording;
  },

  /**
   * Create a test homework assignment
   */
  createTestHomework: async (
    client: SupabaseClient,
    options: {
      tutorId: string;
      studentId: string;
      bookingId?: string;
      title?: string;
      instructions?: string;
      status?: "assigned" | "in_progress" | "submitted" | "completed" | "cancelled";
      dueDate?: Date;
    }
  ): Promise<{ id: string; [key: string]: any }> => {
    const testId = generateTestId();

    const { data: homework, error } = await client
      .from("homework_assignments")
      .insert({
        tutor_id: options.tutorId,
        student_id: options.studentId,
        booking_id: options.bookingId,
        title: options.title || `Test Homework ${testId}`,
        instructions: options.instructions || "Complete this test assignment.",
        status: options.status || "assigned",
        due_date: options.dueDate?.toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create test homework: ${error.message}`);
    }

    return homework;
  },

  /**
   * Create a test homework submission
   */
  createTestHomeworkSubmission: async (
    client: SupabaseClient,
    options: {
      homeworkId: string;
      studentId: string;
      textResponse?: string;
      audioUrl?: string;
      reviewStatus?: "pending" | "reviewed" | "needs_revision";
    }
  ): Promise<{ id: string; [key: string]: any }> => {
    const { data: submission, error } = await client
      .from("homework_submissions")
      .insert({
        homework_id: options.homeworkId,
        student_id: options.studentId,
        text_response: options.textResponse || "This is my test submission.",
        audio_url: options.audioUrl,
        review_status: options.reviewStatus || "pending",
        submitted_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create test submission: ${error.message}`);
    }

    return submission;
  },

  /**
   * Create a test practice scenario
   */
  createTestPracticeScenario: async (
    client: SupabaseClient,
    options: {
      tutorId: string;
      title?: string;
      language?: string;
      level?: string;
      topic?: string;
    }
  ): Promise<{ id: string; [key: string]: any }> => {
    const testId = generateTestId();

    const { data: scenario, error } = await client
      .from("practice_scenarios")
      .insert({
        tutor_id: options.tutorId,
        title: options.title || `Test Scenario ${testId}`,
        description: "A test practice scenario for automated testing.",
        language: options.language || "en",
        level: options.level || "intermediate",
        topic: options.topic || "General Conversation",
        system_prompt: "You are a helpful language tutor.",
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create test scenario: ${error.message}`);
    }

    return scenario;
  },

  /**
   * Create a test practice assignment
   */
  createTestPracticeAssignment: async (
    client: SupabaseClient,
    options: {
      studentId: string;
      tutorId: string;
      scenarioId: string;
      status?: "assigned" | "in_progress" | "completed";
    }
  ): Promise<{ id: string; [key: string]: any }> => {
    const { data: assignment, error } = await client
      .from("practice_assignments")
      .insert({
        student_id: options.studentId,
        tutor_id: options.tutorId,
        scenario_id: options.scenarioId,
        status: options.status || "assigned",
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create test practice assignment: ${error.message}`);
    }

    return assignment;
  },

  /**
   * Create a test practice session
   */
  createTestPracticeSession: async (
    client: SupabaseClient,
    options: {
      studentId: string;
      tutorId: string;
      scenarioId?: string;
      assignmentId?: string;
      language?: string;
      level?: string;
      topic?: string;
      messageCount?: number;
    }
  ): Promise<{ id: string; [key: string]: any }> => {
    const { data: session, error } = await client
      .from("student_practice_sessions")
      .insert({
        student_id: options.studentId,
        tutor_id: options.tutorId,
        scenario_id: options.scenarioId,
        assignment_id: options.assignmentId,
        language: options.language || "en",
        level: options.level || "intermediate",
        topic: options.topic || "General Conversation",
        message_count: options.messageCount || 0,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create test practice session: ${error.message}`);
    }

    return session;
  },

  /**
   * Create a test student language profile
   */
  createTestLanguageProfile: async (
    client: SupabaseClient,
    options: {
      studentId: string;
      nativeLanguage?: string;
      targetLanguage?: string;
      dialectVariant?: string;
      proficiencyLevel?: string;
      l1InterferencePatterns?: Array<{ pattern: string; count: number }>;
    }
  ): Promise<{ id: string; [key: string]: any }> => {
    const { data: profile, error } = await client
      .from("student_language_profiles")
      .insert({
        student_id: options.studentId,
        native_language: options.nativeLanguage || "ja",
        target_language: options.targetLanguage || "en",
        dialect_variant: options.dialectVariant,
        proficiency_level: options.proficiencyLevel || "intermediate",
        l1_interference_patterns: options.l1InterferencePatterns || [],
        lessons_analyzed: 0,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create test language profile: ${error.message}`);
    }

    return profile;
  },

  /**
   * Create a test lesson drill
   */
  createTestDrill: async (
    client: SupabaseClient,
    options: {
      recordingId?: string;
      studentId: string;
      tutorId: string;
      bookingId?: string;
      drillType?: "match" | "gap_fill" | "scramble" | "pronunciation";
      content?: object;
      status?: "pending" | "assigned" | "in_progress" | "completed";
    }
  ): Promise<{ id: string; [key: string]: any }> => {
    const defaultContent = {
      type: options.drillType || "match",
      instructions: "Test drill instructions",
      data: [],
    };

    const { data: drill, error } = await client
      .from("lesson_drills")
      .insert({
        recording_id: options.recordingId,
        student_id: options.studentId,
        tutor_id: options.tutorId,
        booking_id: options.bookingId,
        drill_type: options.drillType || "match",
        content: options.content || defaultContent,
        status: options.status || "pending",
        visible_to_student: true,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create test drill: ${error.message}`);
    }

    return drill;
  },

  /**
   * Clean up a test tutor and all related data
   */
  cleanupTestTutor: async (client: SupabaseClient, tutorId: string): Promise<void> => {
    // Delete in order respecting foreign keys
    const deletionSteps = [
      () => client.from("lesson_drills").delete().eq("tutor_id", tutorId),
      () => client.from("lesson_recordings").delete().eq("tutor_id", tutorId),
      () => client.from("homework_submissions").delete().in(
        "homework_id",
        client
          .from("homework_assignments")
          .select("id")
          .eq("tutor_id", tutorId)
          .then((r) => r.data?.map((h) => h.id) || [])
      ),
      () => client.from("homework_assignments").delete().eq("tutor_id", tutorId),
      () => client.from("student_practice_sessions").delete().eq("tutor_id", tutorId),
      () => client.from("practice_assignments").delete().eq("tutor_id", tutorId),
      () => client.from("practice_scenarios").delete().eq("tutor_id", tutorId),
      () => client.from("bookings").delete().eq("tutor_id", tutorId),
      () => client.from("services").delete().eq("tutor_id", tutorId),
      () => client.from("students").delete().eq("tutor_id", tutorId),
      () => client.from("availability").delete().eq("tutor_id", tutorId),
      () => client.from("profiles").delete().eq("id", tutorId),
      () => client.auth.admin.deleteUser(tutorId),
    ];

    for (const step of deletionSteps) {
      try {
        await step();
      } catch (e) {
        console.warn("Cleanup step failed:", e);
      }
    }
  },
};

// ============================================
// TEST HELPER FUNCTIONS
// ============================================

/**
 * Wait for a condition to be true (polling)
 */
export async function waitForCondition(
  condition: () => Promise<boolean>,
  options: {
    timeout?: number;
    interval?: number;
    description?: string;
  } = {}
): Promise<void> {
  const { timeout = 10000, interval = 500, description = "condition" } = options;
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  throw new Error(`Timeout waiting for ${description} after ${timeout}ms`);
}

/**
 * Retry an operation with exponential backoff
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
  } = {}
): Promise<T> {
  const { maxRetries = 3, initialDelay = 100, maxDelay = 5000 } = options;
  let lastError: Error | undefined;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay = Math.min(delay * 2, maxDelay);
      }
    }
  }

  throw lastError;
}

/**
 * Generate a unique email for testing
 */
export function generateTestEmail(prefix?: string): string {
  const testId = generateTestId();
  return `${prefix || "test"}_${testId}@test.tutorlingua.co`;
}

/**
 * Generate a unique username for testing
 */
export function generateTestUsername(prefix?: string): string {
  const testId = generateTestId();
  return `${prefix || "test"}_${testId}`;
}
