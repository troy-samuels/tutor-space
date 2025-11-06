"use server";

import { createClient } from "@/lib/supabase/server";

export type StudentRecord = {
  id: string;
  tutor_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  proficiency_level: string | null;
  learning_goals: string | null;
  native_language: string | null;
  notes: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

async function requireTutor() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { supabase, user: null as null };
  }

  return { supabase, user };
}

export async function listStudents(): Promise<StudentRecord[]> {
  const { supabase, user } = await requireTutor();
  if (!user) {
    return [];
  }

  const { data } = await supabase
    .from("students")
    .select("*")
    .eq("tutor_id", user.id)
    .order("full_name", { ascending: true });

  return (data as StudentRecord[] | null) ?? [];
}

export async function ensureStudent({
  full_name,
  email,
  phone,
}: {
  full_name: string;
  email: string;
  phone?: string;
}) {
  const { supabase, user } = await requireTutor();
  if (!user) {
    return { error: "You need to be signed in to manage students." };
  }

  const normalizedEmail = email.trim().toLowerCase();

  const { data: existing } = await supabase
    .from("students")
    .select("*")
    .eq("tutor_id", user.id)
    .eq("email", normalizedEmail)
    .maybeSingle<StudentRecord>();

  if (existing) {
    return { data: existing };
  }

  const { data, error } = await supabase
    .from("students")
    .insert({
      tutor_id: user.id,
      full_name,
      email: normalizedEmail,
      phone: phone ?? null,
      status: "active",
    })
    .select("*")
    .single<StudentRecord>();

  if (error) {
    return { error: "We couldn't create that student. Please try again." };
  }

  return { data };
}
