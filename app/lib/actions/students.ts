"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { queueWelcomeAutomation } from "@/lib/server/email-automations";

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
  email_opt_out: boolean;
  email_unsubscribe_token: string | null;
  last_reengage_email_at: string | null;
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

  const { data: tutorProfile } = await supabase
    .from("profiles")
    .select("full_name, auto_welcome_enabled")
    .eq("id", user.id)
    .single();

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

  if (data?.email && tutorProfile?.auto_welcome_enabled && data.email_opt_out !== true) {
    queueWelcomeAutomation({
      tutorId: user.id,
      tutorName: tutorProfile.full_name || "Your tutor",
      studentId: data.id,
      studentEmail: data.email,
      studentName: data.full_name,
    }).catch((err) => {
      console.error("[Students] Failed to queue welcome email", err);
    });
  }

  if (data) {
    await ensureConversationThread(supabase, user.id, data.id);
  }

  return { data };
}
async function ensureConversationThread(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tutorId: string,
  studentId: string
) {
  const { error } = await supabase
    .from("conversation_threads")
    .insert({ tutor_id: tutorId, student_id: studentId })
    .select("id")
    .single();

  if (error && error.code !== "23505") {
    console.error("[Students] Failed to create conversation thread", error);
  }
}

const studentImportSchema = z.object({
  rowIndex: z.number().optional(),
  full_name: z.string().min(1, "Full name is required."),
  email: z.string().email("Valid email is required."),
  phone: z
    .string()
    .optional()
    .transform((value) => (value && value.trim().length > 0 ? value.trim() : undefined)),
  status: z
    .string()
    .optional()
    .transform((value) => value?.trim() || undefined),
  proficiency_level: z
    .string()
    .optional()
    .transform((value) => value?.trim() || undefined),
  learning_goals: z
    .string()
    .optional()
    .transform((value) => value?.trim() || undefined),
  native_language: z
    .string()
    .optional()
    .transform((value) => value?.trim() || undefined),
  notes: z
    .string()
    .optional()
    .transform((value) => value?.trim() || undefined),
});

const STUDENT_STATUS_MAP: Record<string, string> = {
  active: "active",
  trial: "trial",
  new: "trial",
  paused: "paused",
  "on hold": "paused",
  alumni: "alumni",
  graduated: "alumni",
};

export type StudentImportPayload = z.infer<typeof studentImportSchema>;
export type StudentImportError = {
  row: number;
  email?: string;
  message: string;
};

export type StudentImportResult = {
  success: boolean;
  imported: number;
  errors: StudentImportError[];
};

export async function importStudentsBatch(
  entries: StudentImportPayload[]
): Promise<StudentImportResult> {
  const { supabase, user } = await requireTutor();
  if (!user) {
    return {
      success: false,
      imported: 0,
      errors: [{ row: 0, message: "You must be signed in." }],
    };
  }

  if (!entries || entries.length === 0) {
    return {
      success: false,
      imported: 0,
      errors: [{ row: 0, message: "No students provided." }],
    };
  }

  const parsed = z.array(studentImportSchema).safeParse(entries);
  if (!parsed.success) {
    return {
      success: false,
      imported: 0,
      errors: parsed.error.issues.map((issue) => {
        const pathHead = issue.path[0];
        const row =
          typeof pathHead === "number" ? pathHead + 1 : (issue.path[1] as number | undefined) ?? 0;
        return {
          row,
          message: issue.message,
        };
      }),
    };
  }

  const seenEmails = new Set<string>();
  const errors: StudentImportError[] = [];
  let importedCount = 0;

  for (let index = 0; index < parsed.data.length; index += 1) {
    const entry = parsed.data[index];
    const rowNumber = entry.rowIndex ?? index + 1;
    const normalizedEmail = entry.email.trim().toLowerCase();

    if (seenEmails.has(normalizedEmail)) {
      errors.push({
        row: rowNumber,
        email: entry.email,
        message: "Duplicate row with the same email detected in this upload.",
      });
      continue;
    }
    seenEmails.add(normalizedEmail);

    const creation = await ensureStudent({
      full_name: entry.full_name.trim(),
      email: normalizedEmail,
      phone: entry.phone,
    });

    if (creation.error || !creation.data) {
      errors.push({
        row: rowNumber,
        email: entry.email,
        message: creation.error ?? "Failed to create student.",
      });
      continue;
    }

    const updates: Record<string, unknown> = {};
    const normalizedStatus = normalizeStatus(entry.status);

    if (normalizedStatus) {
      updates.status = normalizedStatus;
    }
    if (entry.proficiency_level) {
      updates.proficiency_level = entry.proficiency_level;
    }
    if (entry.learning_goals) {
      updates.learning_goals = entry.learning_goals;
    }
    if (entry.native_language) {
      updates.native_language = entry.native_language;
    }
    if (entry.notes) {
      updates.notes = entry.notes;
    }

    if (Object.keys(updates).length > 0) {
      const { error } = await supabase
        .from("students")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", creation.data.id)
        .eq("tutor_id", user.id);

      if (error) {
        errors.push({
          row: rowNumber,
          email: entry.email,
          message: "Saved student but failed to update extra fields.",
        });
        continue;
      }
    }

    importedCount += 1;
  }

  // Revalidate tutor-facing pages so the new students appear immediately.
  await Promise.allSettled([
    revalidatePath("/students"),
    revalidatePath("/students/import"),
    revalidatePath("/dashboard"),
  ]);

  return {
    success: errors.length === 0,
    imported: importedCount,
    errors,
  };
}

function normalizeStatus(status?: string) {
  if (!status) return undefined;
  const normalized = status.trim().toLowerCase();
  return STUDENT_STATUS_MAP[normalized];
}
