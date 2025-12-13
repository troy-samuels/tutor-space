"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import {
  sendAccessApprovedEmail,
  sendAccessDeniedEmail,
} from "@/lib/emails/access-emails";
import { sendStudentInviteEmail } from "@/lib/emails/student-invite";

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
  timezone: string | null;
  email_opt_out: boolean;
  email_unsubscribe_token: string | null;
  last_reengage_email_at: string | null;
  labels: string[];
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

/**
 * Update student labels for organization
 */
export async function updateStudentLabels(
  studentId: string,
  labels: string[]
): Promise<{ error?: string }> {
  const { supabase, user } = await requireTutor();
  if (!user) {
    return { error: "Not authenticated" };
  }

  // Validate and sanitize labels
  const sanitizedLabels = labels
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && l.length <= 50)
    .slice(0, 20); // Max 20 labels

  const { error } = await supabase
    .from("students")
    .update({
      labels: sanitizedLabels,
      updated_at: new Date().toISOString(),
    })
    .eq("id", studentId)
    .eq("tutor_id", user.id);

  if (error) {
    console.error("[updateStudentLabels] Failed:", error);
    return { error: "Failed to update labels" };
  }

  revalidatePath(`/students/${studentId}`);
  return {};
}

export async function ensureStudent({
  full_name,
  email,
  phone,
  timezone,
}: {
  full_name: string;
  email: string;
  phone?: string;
  timezone?: string;
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
    .select("full_name, auto_welcome_enabled, username, email")
    .eq("id", user.id)
    .single();

  const { data, error } = await supabase
    .from("students")
    .insert({
      tutor_id: user.id,
      full_name,
      email: normalizedEmail,
      phone: phone ?? null,
      timezone: timezone ?? "UTC",
      status: "active",
    })
    .select("*")
    .single<StudentRecord>();

  if (error) {
    console.error("[ensureStudent] Failed to create student:", error);
    // Handle specific error codes
    if (error.code === "23505") {
      return { error: "A student with this email already exists." };
    }
    if (error.code === "42501") {
      return { error: "Authorization failed. Please try signing out and back in." };
    }
    return { error: `We couldn't create that student: ${error.message}` };
  }

  if (data?.email && tutorProfile?.auto_welcome_enabled && data.email_opt_out !== true) {
    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "");
    const bookingUrl =
      baseUrl && tutorProfile?.username
        ? `${baseUrl}/book/${tutorProfile.username}`
        : `${baseUrl || "https://tutorlingua.co"}/student/login`;

    const nameParam = data.full_name ? `&name=${encodeURIComponent(data.full_name)}` : "";
    const requestAccessUrl =
      baseUrl && tutorProfile?.username
        ? `${baseUrl}/student/request-access?tutor=${encodeURIComponent(
            tutorProfile.username
          )}&tutor_id=${user.id}&email=${encodeURIComponent(normalizedEmail)}${nameParam}`
        : `${baseUrl || "https://tutorlingua.co"}/student/signup`;

    sendStudentInviteEmail({
      studentEmail: data.email,
      studentName: data.full_name,
      tutorName: tutorProfile?.full_name || "Your tutor",
      tutorEmail: tutorProfile?.email,
      requestAccessUrl,
      bookingUrl,
    }).catch((err) => {
      console.error("[Students] Failed to send student invite", err);
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

// Strict email regex that validates common email formats properly
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

// Import limits to prevent abuse and memory issues
const MAX_IMPORT_ROWS = 500;

const studentImportSchema = z.object({
  rowIndex: z.number().optional(),
  full_name: z.string().min(1, "Full name is required."),
  email: z
    .string()
    .min(1, "Email is required.")
    .refine((email) => EMAIL_REGEX.test(email.trim()), {
      message: "Invalid email format. Please check the email address.",
    }),
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
  inactive: "inactive",
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

  // Enforce row limit to prevent memory issues and abuse
  if (entries.length > MAX_IMPORT_ROWS) {
    return {
      success: false,
      imported: 0,
      errors: [
        {
          row: 0,
          message: `Too many rows. Maximum allowed is ${MAX_IMPORT_ROWS} students per import. You provided ${entries.length} rows. Please split your file into smaller batches.`,
        },
      ],
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
        const fields = Object.keys(updates).join(", ");
        console.error(`[importStudentsBatch] Failed to update fields [${fields}]:`, error);
        errors.push({
          row: rowNumber,
          email: entry.email,
          message: `Saved student but failed to update ${fields}: ${error.message}`,
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

// ==========================================
// Student Access Control Functions
// Consolidated from tutor-students.ts
// ==========================================

type SupabaseAuthClient = Awaited<ReturnType<typeof createClient>>;
type ServiceRoleClient = NonNullable<ReturnType<typeof createServiceRoleClient>>;

/**
 * Approve a student's calendar access request
 */
export async function approveStudentAccess(params: {
  requestId: string;
  studentId: string;
  notes?: string;
}) {
  const supabase = await createClient();
  const adminClient = createServiceRoleClient();

  if (!adminClient) {
    return { error: "Service unavailable" };
  }

  return approveStudentAccessWithClients(supabase, adminClient, params);
}

export async function approveStudentAccessWithClients(
  supabase: SupabaseAuthClient,
  adminClient: ServiceRoleClient,
  params: { requestId: string; studentId: string; notes?: string },
  options: { sendApprovedEmail?: typeof sendAccessApprovedEmail } = {}
) {
  const sendApprovedEmail = options.sendApprovedEmail ?? sendAccessApprovedEmail;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in to approve requests" };
  }

  try {
    const { data: studentRecord } = await adminClient
      .from("students")
      .select(
        `
          id,
          tutor_id,
          full_name,
          email,
          profiles!students_tutor_id_fkey (
            full_name,
            email,
            username,
            instagram_handle,
            website_url
          )
        `
      )
      .eq("id", params.studentId)
      .eq("tutor_id", user.id)
      .single();

    if (!studentRecord) {
      return { error: "Student not found or access denied" };
    }

    const { data: requestRecord } = await adminClient
      .from("student_access_requests")
      .select("id")
      .eq("id", params.requestId)
      .eq("tutor_id", user.id)
      .single();

    if (!requestRecord) {
      return { error: "Access request not found" };
    }

    const { error: studentError } = await adminClient
      .from("students")
      .update({
        calendar_access_status: "approved",
        access_approved_at: new Date().toISOString(),
        access_approved_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.studentId)
      .eq("tutor_id", user.id);

    if (studentError) {
      console.error("Failed to update student:", studentError);
      return { error: "Failed to approve student access" };
    }

    const { error: requestError } = await adminClient
      .from("student_access_requests")
      .update({
        status: "approved",
        resolved_at: new Date().toISOString(),
        resolved_by: user.id,
        tutor_notes: params.notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.requestId)
      .eq("tutor_id", user.id);

    if (requestError) {
      console.error("Failed to update request:", requestError);
    }

    const { data: tutorProfile } = await adminClient
      .from("profiles")
      .select(
        "payment_venmo_handle, payment_paypal_email, payment_zelle_phone, payment_stripe_link, payment_custom_url, payment_general_instructions"
      )
      .eq("id", user.id)
      .single();

    if (studentRecord.profiles) {
      const tutor =
        Array.isArray(studentRecord.profiles) ? studentRecord.profiles[0] : studentRecord.profiles;
      const bookingUrl = `${process.env.NEXT_PUBLIC_APP_URL}/book/${tutor.username}`;

      await sendApprovedEmail({
        studentName: studentRecord.full_name || "Student",
        studentEmail: studentRecord.email,
        tutorName: tutor.full_name || "Tutor",
        tutorEmail: tutor.email,
        tutorNotes: params.notes,
        bookingUrl,
        paymentInstructions: tutorProfile
          ? {
              general: tutorProfile.payment_general_instructions || undefined,
              venmoHandle: tutorProfile.payment_venmo_handle || undefined,
              paypalEmail: tutorProfile.payment_paypal_email || undefined,
              zellePhone: tutorProfile.payment_zelle_phone || undefined,
              stripePaymentLink: tutorProfile.payment_stripe_link || undefined,
              customPaymentUrl: tutorProfile.payment_custom_url || undefined,
            }
          : undefined,
      });
    }

    revalidatePath("/students/access-requests");

    return { success: true };
  } catch (error) {
    console.error("Error approving student access:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Deny a student's calendar access request
 */
export async function denyStudentAccess(params: {
  requestId: string;
  studentId: string;
  reason: string;
}) {
  const supabase = await createClient();
  const adminClient = createServiceRoleClient();

  if (!adminClient) {
    return { error: "Service unavailable" };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in to deny requests" };
  }

  try {
    const { data: studentRecord } = await adminClient
      .from("students")
      .select(
        `
          id,
          tutor_id,
          full_name,
          email,
          profiles!students_tutor_id_fkey (
            full_name,
            email,
            instagram_handle,
            website_url
          )
        `
      )
      .eq("id", params.studentId)
      .eq("tutor_id", user.id)
      .single();

    if (!studentRecord) {
      return { error: "Student not found or access denied" };
    }

    const { data: requestRecord } = await adminClient
      .from("student_access_requests")
      .select("id")
      .eq("id", params.requestId)
      .eq("tutor_id", user.id)
      .single();

    if (!requestRecord) {
      return { error: "Access request not found" };
    }

    const { error: studentError } = await adminClient
      .from("students")
      .update({
        calendar_access_status: "denied",
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.studentId)
      .eq("tutor_id", user.id);

    if (studentError) {
      console.error("Failed to update student:", studentError);
      return { error: "Failed to deny student access" };
    }

    const { error: requestError } = await adminClient
      .from("student_access_requests")
      .update({
        status: "denied",
        resolved_at: new Date().toISOString(),
        resolved_by: user.id,
        tutor_notes: params.reason,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.requestId)
      .eq("tutor_id", user.id);

    if (requestError) {
      console.error("Failed to update request:", requestError);
    }

    if (studentRecord.profiles) {
      const tutor =
        Array.isArray(studentRecord.profiles) ? studentRecord.profiles[0] : studentRecord.profiles;

      await sendAccessDeniedEmail({
        studentName: studentRecord.full_name || "Student",
        studentEmail: studentRecord.email,
        tutorName: tutor.full_name || "Tutor",
        tutorEmail: tutor.email,
        tutorNotes: params.reason,
        instagramHandle: tutor.instagram_handle || undefined,
        websiteUrl: tutor.website_url || undefined,
      });
    }

    revalidatePath("/students/access-requests");

    return { success: true };
  } catch (error) {
    console.error("Error denying student access:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Get pending access requests count for dashboard widget
 */
export async function getPendingAccessRequestsCount(): Promise<number> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return 0;
  }

  const { count, error } = await supabase
    .from("student_access_requests")
    .select("*", { count: "exact", head: true })
    .eq("tutor_id", user.id)
    .eq("status", "pending");

  if (error) {
    console.error("Failed to count pending requests:", error);
    return 0;
  }

  return count || 0;
}

/**
 * Suspend a student's calendar access
 */
export async function suspendStudentAccess(studentId: string) {
  const supabase = await createClient();
  const adminClient = createServiceRoleClient();

  if (!adminClient) {
    return { error: "Service unavailable" };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in" };
  }

  try {
    const { error } = await adminClient
      .from("students")
      .update({
        calendar_access_status: "suspended",
        updated_at: new Date().toISOString(),
      })
      .eq("id", studentId)
      .eq("tutor_id", user.id);

    if (error) {
      console.error("Failed to suspend student:", error);
      return { error: "Failed to suspend student access" };
    }

    revalidatePath("/students");
    revalidatePath("/students/access-requests");

    return { success: true };
  } catch (error) {
    console.error("Error suspending student access:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Reactivate a suspended student
 */
export async function reactivateStudentAccess(studentId: string) {
  const supabase = await createClient();
  const adminClient = createServiceRoleClient();

  if (!adminClient) {
    return { error: "Service unavailable" };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in" };
  }

  try {
    const { error } = await adminClient
      .from("students")
      .update({
        calendar_access_status: "approved",
        updated_at: new Date().toISOString(),
      })
      .eq("id", studentId)
      .eq("tutor_id", user.id);

    if (error) {
      console.error("Failed to reactivate student:", error);
      return { error: "Failed to reactivate student access" };
    }

    revalidatePath("/students");
    revalidatePath("/students/access-requests");

    return { success: true };
  } catch (error) {
    console.error("Error reactivating student access:", error);
    return { error: "An unexpected error occurred" };
  }
}
