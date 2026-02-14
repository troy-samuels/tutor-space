"use server";

import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export type TutorSession = {
  supabase: SupabaseClient;
  user: User | null;
  userId: string | null;
};

export type StudentSession = {
  supabase: SupabaseClient;
  user: User | null;
  userId: string | null;
  student: { id: string; tutor_id: string | null } | null;
};

export async function requireTutor(options?: { strict?: boolean }): Promise<TutorSession> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    if (options?.strict) {
      throw new Error("Unauthorized");
    }

    return { supabase, user: null, userId: null };
  }

  return { supabase, user, userId: user.id };
}

export async function requireStudent(options?: { strict?: boolean }): Promise<StudentSession> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    if (options?.strict) {
      throw new Error("Unauthorized");
    }

    return { supabase, user: null, userId: null, student: null };
  }

  const { data: student, error: studentError } = await supabase
    .from("students")
    .select("id, tutor_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (studentError && studentError.code !== "PGRST116") {
    if (options?.strict) {
      throw new Error("Unauthorized");
    }

    return { supabase, user, userId: user.id, student: null };
  }

  if (!student && options?.strict) {
    throw new Error("Unauthorized");
  }

  return { supabase, user, userId: user.id, student: student ?? null };
}
