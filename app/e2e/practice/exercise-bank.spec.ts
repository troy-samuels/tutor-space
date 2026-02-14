import { expect, test } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function createAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

test.describe("Exercise Bank Schema", () => {
  test.skip(
    !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY,
    "Supabase environment variables are required for schema checks."
  );

  let adminClient: SupabaseClient;

  test.beforeAll(async () => {
    adminClient = createAdminClient();
  });

  test("exercise_banks table exists and can be queried", async () => {
    const { data, error } = await adminClient
      .from("exercise_banks")
      .select("id, language, level, topic, exercise_count")
      .limit(1);

    expect(error).toBeNull();
    expect(Array.isArray(data)).toBeTruthy();
  });

  test("student_practice_sessions has session_plan column", async () => {
    const { data, error } = await adminClient
      .from("student_practice_sessions")
      .select("id, session_plan")
      .limit(1);

    expect(error).toBeNull();
    expect(Array.isArray(data)).toBeTruthy();
  });

  test("student_practice_messages has exercise columns", async () => {
    const { data, error } = await adminClient
      .from("student_practice_messages")
      .select("id, exercise_id, exercise_score")
      .limit(1);

    expect(error).toBeNull();
    expect(Array.isArray(data)).toBeTruthy();
  });
});
