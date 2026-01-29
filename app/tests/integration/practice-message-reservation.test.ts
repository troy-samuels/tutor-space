/**
 * Practice message reservation RPC tests.
 *
 * Validates atomic message slot reservations and limit enforcement.
 *
 * Run with: npm run test:integration -- tests/integration/practice-message-reservation.test.ts
 */

import { describe, it, before, after } from "node:test";
import assert from "node:assert";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const skipTests = !SUPABASE_URL || !SERVICE_ROLE_KEY;

if (skipTests) {
  console.warn(
    "⚠️  Skipping practice message reservation tests: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set"
  );
}

function getAdminClient() {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    throw new Error("Missing Supabase credentials");
  }

  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

const testData: {
  sessionId?: string;
  studentId?: string;
  tutorId?: string;
} = {};

describe("Practice message reservation RPC", { skip: skipTests }, () => {
  before(async () => {
    if (skipTests) return;

    const adminClient = getAdminClient();
    const { data: student } = await adminClient
      .from("students")
      .select("id, tutor_id")
      .not("tutor_id", "is", null)
      .limit(1)
      .maybeSingle();

    if (!student || !student.tutor_id) {
      console.warn("⚠️  No student with tutor found; skipping reservation tests.");
      return;
    }

    testData.studentId = student.id;
    testData.tutorId = student.tutor_id;

    const { data: session, error } = await adminClient
      .from("student_practice_sessions")
      .insert({
        student_id: student.id,
        tutor_id: student.tutor_id,
        language: "English",
        level: "beginner",
        topic: "Test session",
      })
      .select("id, message_count")
      .single();

    if (error) {
      throw new Error(`Failed to create practice session: ${error.message}`);
    }

    testData.sessionId = session?.id;
  });

  after(async () => {
    if (skipTests || !testData.sessionId) return;

    const adminClient = getAdminClient();
    await adminClient
      .from("student_practice_sessions")
      .delete()
      .eq("id", testData.sessionId);
  });

  it("reserves message slots atomically", async () => {
    if (!testData.sessionId) {
      console.log("⏭️  Skipping: No session created");
      return;
    }

    const adminClient = getAdminClient();
    const { data, error } = await adminClient.rpc(
      "reserve_practice_message_slots",
      { p_session_id: testData.sessionId, p_increment: 2 }
    );

    assert.ok(!error, `RPC should succeed: ${error?.message}`);
    assert.ok(data?.success, "Reservation should succeed");
    assert.strictEqual(data?.message_count, 2, "Message count should increment by 2");
  });

  it("rejects reservations beyond the session limit", async () => {
    if (!testData.sessionId) {
      console.log("⏭️  Skipping: No session created");
      return;
    }

    const adminClient = getAdminClient();

    await adminClient
      .from("student_practice_sessions")
      .update({ message_count: 20 })
      .eq("id", testData.sessionId);

    const { data, error } = await adminClient.rpc(
      "reserve_practice_message_slots",
      { p_session_id: testData.sessionId, p_increment: 2 }
    );

    assert.ok(!error, `RPC should not throw: ${error?.message}`);
    assert.strictEqual(data?.success, false, "Reservation should fail at limit");
    assert.strictEqual(data?.error, "MESSAGE_LIMIT_REACHED");
  });

  it("rejects reservations for ended sessions", async () => {
    if (!testData.sessionId) {
      console.log("⏭️  Skipping: No session created");
      return;
    }

    const adminClient = getAdminClient();

    await adminClient
      .from("student_practice_sessions")
      .update({ ended_at: new Date().toISOString() })
      .eq("id", testData.sessionId);

    const { data, error } = await adminClient.rpc(
      "reserve_practice_message_slots",
      { p_session_id: testData.sessionId, p_increment: 2 }
    );

    assert.ok(!error, `RPC should not throw: ${error?.message}`);
    assert.strictEqual(data?.success, false, "Reservation should fail for ended session");
    assert.strictEqual(data?.error, "SESSION_ENDED");
  });
});
