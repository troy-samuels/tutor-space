/**
 * E2E Tests: AI Practice Session (Tier Model)
 *
 * Validates that students can access AI practice with a Pro tutor plan
 * (Studio is no longer required for access).
 */

import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

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

async function insertStudentRecord(
  adminClient: ReturnType<typeof createAdminClient>,
  payload: Record<string, unknown>,
  fallbackPayload: Record<string, unknown>
) {
  let result = await adminClient.from("students").insert(payload).select().single();

  if (result.error?.message?.match(/ai_practice_(enabled|free_tier_enabled)/i)) {
    result = await adminClient.from("students").insert(fallbackPayload).select().single();
  }

  if (result.error) {
    throw new Error(`Failed to create student record: ${result.error.message}`);
  }

  return result.data;
}

test.describe("AI Practice Session", () => {
  test.setTimeout(3 * 60 * 1000);

  const runId = randomUUID();
  let adminClient: ReturnType<typeof createAdminClient>;
  let tutorUserId: string | null = null;
  let studentUserId: string | null = null;
  let studentRecordId: string | null = null;
  let practiceAssignmentId: string | null = null;
  let practiceSchemaAvailable = true;

  const tutor = {
    fullName: `Practice Tutor ${runId}`,
    email: `practice.tutor.${runId}@example.com`,
    username: `practice-tutor-${runId}`,
    password: `PracticeT3st!${runId}`,
  };

  const student = {
    fullName: `Practice Student ${runId}`,
    email: `practice.student.${runId}@example.com`,
    password: `PracticeStud3nt!${runId}`,
  };

  test.beforeAll(async () => {
    adminClient = createAdminClient();
    const { error: practiceSchemaError } = await adminClient
      .from("practice_scenarios")
      .select("id")
      .limit(1);

    if (practiceSchemaError) {
      if (practiceSchemaError.message?.includes("practice_scenarios")) {
        practiceSchemaAvailable = false;
        return;
      }
      throw new Error(`Failed to verify practice schema: ${practiceSchemaError.message}`);
    }

    // Pro tutor (Studio no longer required)
    const { data: tutorUser, error: tutorError } = await adminClient.auth.admin.createUser({
      email: tutor.email,
      password: tutor.password,
      email_confirm: true,
      user_metadata: {
        full_name: tutor.fullName,
        username: tutor.username,
        role: "tutor",
        plan: "pro_monthly",
      },
    });

    if (tutorError || !tutorUser.user) {
      throw new Error(`Failed to create tutor: ${tutorError?.message}`);
    }
    tutorUserId = tutorUser.user.id;

    await adminClient.from("profiles").upsert({
      id: tutorUserId,
      email: tutor.email,
      full_name: tutor.fullName,
      username: tutor.username,
      role: "tutor",
      plan: "pro_monthly",
      tier: "standard",
      onboarding_completed: true,
      timezone: "America/New_York",
      languages_taught: ["Spanish"],
      booking_currency: "USD",
    });

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

    const studentRecord = await insertStudentRecord(
      adminClient,
      {
        tutor_id: tutorUserId,
        user_id: studentUserId,
        full_name: student.fullName,
        email: student.email,
        status: "active",
        ai_practice_enabled: true,
        ai_practice_free_tier_enabled: true,
      },
      {
        tutor_id: tutorUserId,
        user_id: studentUserId,
        full_name: student.fullName,
        email: student.email,
        status: "active",
      }
    );
    studentRecordId = studentRecord.id;

    const { data: scenario, error: scenarioError } = await adminClient
      .from("practice_scenarios")
      .insert({
        tutor_id: tutorUserId,
        title: "Restaurant Conversation",
        description: "Practice ordering food at a restaurant",
        language: "Spanish",
        level: "intermediate",
        topic: "restaurant",
        vocabulary_focus: ["menu", "camarero", "cuenta"],
        grammar_focus: ["conditional tense"],
        max_messages: 20,
        is_active: true,
        system_prompt: "You are a helpful Spanish language tutor helping a student practice restaurant vocabulary.",
      })
      .select()
      .single();

    if (scenarioError) {
      throw new Error(`Failed to create scenario: ${scenarioError.message}`);
    }

    const { data: assignment, error: assignmentError } = await adminClient
      .from("practice_assignments")
      .insert({
        tutor_id: tutorUserId,
        student_id: studentRecordId,
        scenario_id: scenario.id,
        title: "Restaurant Practice",
        instructions: "Practice ordering food in Spanish",
        status: "assigned",
      })
      .select()
      .single();

    if (assignmentError) {
      throw new Error(`Failed to create assignment: ${assignmentError.message}`);
    }
    practiceAssignmentId = assignment.id;
  });

  test.afterAll(async () => {
    if (!practiceSchemaAvailable) return;

    if (practiceAssignmentId) {
      await adminClient.from("student_practice_sessions").delete().eq("assignment_id", practiceAssignmentId);
      await adminClient.from("practice_assignments").delete().eq("id", practiceAssignmentId);
    }
    if (studentUserId) {
      await adminClient.from("students").delete().eq("id", studentRecordId);
      await adminClient.auth.admin.deleteUser(studentUserId);
    }
    if (tutorUserId) {
      await adminClient.from("practice_scenarios").delete().eq("tutor_id", tutorUserId);
      await adminClient.auth.admin.deleteUser(tutorUserId);
    }
  });

  test("student can access AI practice page with Pro tutor plan", async ({ browser, baseURL }) => {
    test.skip(!practiceSchemaAvailable, "Practice schema missing in Supabase.");
    const appUrl = baseURL ?? "http://localhost:3000";
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      await page.goto(`${appUrl}/student/login`);
      await page.getByLabel(/Email/i).fill(student.email);
      await page.getByLabel(/Password/i).fill(student.password);
      await page.getByRole("button", { name: /Sign in/i }).click();
      await page.waitForURL((url) => !url.pathname.includes("/student/login"), { timeout: 30000 });

      await page.goto(`${appUrl}/student/practice`);
      await page.waitForLoadState("domcontentloaded", { timeout: 15000 });

      const practiceHeading = page.getByRole("heading", { name: /practice|ai|conversation/i });
      const hasPracticeHeading = await practiceHeading.first().isVisible({ timeout: 10000 }).catch(() => false);
      const assignmentCard = page.getByText(/restaurant/i);
      const hasAssignment = await assignmentCard.isVisible({ timeout: 5000 }).catch(() => false);

      expect(hasPracticeHeading || hasAssignment).toBeTruthy();
    } finally {
      await context.close();
    }
  });

  test("student can create a practice session without Studio gate", async ({ browser, baseURL }) => {
    test.skip(!practiceSchemaAvailable, "Practice schema missing in Supabase.");
    const appUrl = baseURL ?? "http://localhost:3000";
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      await page.goto(`${appUrl}/student/login`);
      await page.getByLabel(/Email/i).fill(student.email);
      await page.getByLabel(/Password/i).fill(student.password);
      await page.getByRole("button", { name: /Sign in/i }).click();
      await page.waitForURL((url) => !url.pathname.includes("/student/login"), { timeout: 30000 });

      const apiResult = await page.evaluate(async ({ assignmentId }) => {
        const response = await fetch("/api/practice/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ assignmentId, mode: "text" }),
        });
        const payload = await response.json().catch(() => ({}));
        return { status: response.status, payload };
      }, { assignmentId: practiceAssignmentId });

      expect(apiResult.status).toBe(200);
      expect(Boolean(apiResult.payload?.session?.id)).toBeTruthy();
    } finally {
      await context.close();
    }
  });
});
