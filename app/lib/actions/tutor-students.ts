"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import {
  sendAccessApprovedEmail,
  sendAccessDeniedEmail,
} from "@/lib/emails/access-emails";

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

async function approveStudentAccessWithClients(
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
      .eq("tutor_id", user.id); // Ensure tutor owns this student

    if (error) {
      console.error("Failed to suspend student:", error);
      return { error: "Failed to suspend student access" };
    }

    // TODO: Send suspension email
    // await sendAccessSuspendedEmail({ studentId, reason });

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
      .eq("tutor_id", user.id); // Ensure tutor owns this student

    if (error) {
      console.error("Failed to reactivate student:", error);
      return { error: "Failed to reactivate student access" };
    }

    // TODO: Send reactivation email
    // await sendAccessReactivatedEmail({ studentId });

    revalidatePath("/students");
    revalidatePath("/students/access-requests");

    return { success: true };
  } catch (error) {
    console.error("Error reactivating student access:", error);
    return { error: "An unexpected error occurred" };
  }
}

export const __tutorStudentsTesting = {
  approveStudentAccessWithClients,
};
