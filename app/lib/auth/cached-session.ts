import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { User, SupabaseClient } from "@supabase/supabase-js";

/**
 * Student data returned from the cached session helper.
 * Only includes fields commonly needed by student pages.
 */
export interface StudentSessionData {
  id: string;
  full_name: string | null;
  name: string | null;
  tutor_id: string | null;
  connection_status: string | null;
  user_id: string;
}

/**
 * Session result with user and supabase client.
 * Uses React.cache() to deduplicate auth calls within a single request.
 */
export interface SessionResult {
  user: User | null;
  supabase: SupabaseClient;
}

/**
 * Student session result with user, student data, and supabase client.
 * Consolidates the common pattern of fetching user + student record.
 */
export interface StudentSessionResult {
  user: User | null;
  student: StudentSessionData | null;
  supabase: SupabaseClient;
}

/**
 * Cached session getter - deduplicates supabase.auth.getUser() calls
 * within a single React Server Component request.
 *
 * @example
 * ```ts
 * const { user, supabase } = await getSession();
 * if (!user) redirect("/student/login");
 * ```
 */
export const getSession = cache(async (): Promise<SessionResult> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { user, supabase };
});

/**
 * Cached student session getter - combines auth check with student record lookup.
 * Eliminates the common pattern of:
 * 1. getUser()
 * 2. query students table by cookie token
 * 3. query students table by user_id
 *
 * This replaces 2-3 queries with a single cached call.
 *
 * @example
 * ```ts
 * const { user, student, supabase } = await getStudentSession();
 * if (!user) redirect("/student/login?redirect=/student/homework");
 * const studentId = student?.id ?? null;
 * const studentName = student?.full_name ?? student?.name ?? null;
 * ```
 */
export const getStudentSession = cache(async (): Promise<StudentSessionResult> => {
  const { user, supabase } = await getSession();

  if (!user) {
    return { user: null, student: null, supabase };
  }

  // Single query to get student data - replaces multiple sequential lookups
  const { data: student } = await supabase
    .from("students")
    .select("id, full_name, name, tutor_id, connection_status, user_id")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .maybeSingle();

  return {
    user,
    student: student as StudentSessionData | null,
    supabase,
  };
});

/**
 * Get student display name from session data.
 * Falls back through student.full_name -> student.name -> user metadata -> null
 */
export function getStudentDisplayName(
  student: StudentSessionData | null,
  user: User | null
): string | null {
  if (student?.full_name) return student.full_name;
  if (student?.name) return student.name;
  if (user?.user_metadata?.full_name) return user.user_metadata.full_name as string;
  return null;
}
