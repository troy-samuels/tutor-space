"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { sendAccessRequestNotification } from "@/lib/emails/access-emails";

export type AccessStatus = "pending" | "approved" | "denied" | "suspended" | "no_record";

export type StudentAccessInfo = {
  status: AccessStatus;
  student_id?: string;
  tutor_name?: string;
  requested_at?: string;
  has_active_package?: boolean;
};

type StudentAccessRecord = {
  id: string;
  calendar_access_status: AccessStatus | null;
  access_requested_at: string | null;
  tutor_id: string;
  profiles: {
    full_name: string | null;
  } | null;
};

/**
 * Check if a logged-in student has calendar access for a specific tutor
 */
export async function checkStudentAccess(
  tutorId: string
): Promise<StudentAccessInfo> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: "no_record" };
  }

  // Find student record linked to this auth user
  const { data: student, error } = await supabase
    .from("students")
    .select(
      `
      id,
      calendar_access_status,
      access_requested_at,
      tutor_id,
      profiles!students_tutor_id_fkey (
        full_name
      )
    `
    )
    .eq("user_id", user.id)
    .eq("tutor_id", tutorId)
    .single();

  if (error || !student) {
    return { status: "no_record" };
  }

  const studentRecord = student as StudentAccessRecord;

  // Check for active packages (auto-approve if found)
  const { hasActivePackage } = await import("@/lib/actions/packages");
  const packages = await hasActivePackage(studentRecord.id, tutorId);

  if (packages && studentRecord.calendar_access_status !== "approved") {
    // Auto-approve students with active packages
    await autoApproveStudentAccess(studentRecord.id, tutorId);
    return {
      status: "approved",
      student_id: studentRecord.id,
      tutor_name: studentRecord.profiles?.full_name ?? undefined,
      has_active_package: true,
    };
  }

  return {
    status: studentRecord.calendar_access_status ?? "pending",
    student_id: studentRecord.id,
    tutor_name: studentRecord.profiles?.full_name ?? undefined,
    requested_at: studentRecord.access_requested_at || undefined,
    has_active_package: !!packages,
  };
}

/**
 * Create a new student account and request calendar access
 */
export async function signupAndRequestAccess(params: {
  tutorId: string;
  tutorUsername: string;
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  studentMessage?: string;
}) {
  const adminClient = createServiceRoleClient();

  if (!adminClient) {
    return { error: "Service unavailable. Please try again later." };
  }

  try {
    // Check if student email already exists for this tutor
    const { data: existingStudent } = await adminClient
      .from("students")
      .select("id, user_id, email")
      .eq("tutor_id", params.tutorId)
      .eq("email", params.email)
      .single();

    if (existingStudent) {
      if (existingStudent.user_id) {
        return {
          error: "An account with this email already exists. Please log in instead.",
        };
      } else {
        // Student exists but no auth account - we'll link it below
      }
    }

    // Create auth user via client-side Supabase (for proper session)
    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: params.email,
      password: params.password,
      options: {
        data: {
          role: "student",
          full_name: params.fullName,
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/book/${params.tutorUsername}`,
      },
    });

    if (authError || !authData.user) {
      console.error("Auth signup error:", authError);
      return { error: authError?.message || "Failed to create account" };
    }

    // Create or update student record
    let studentId: string;

    if (existingStudent) {
      // Link existing student to auth user
      const { error: updateError } = await adminClient
        .from("students")
        .update({
          user_id: authData.user.id,
          full_name: params.fullName,
          phone: params.phone || null,
          calendar_access_status: "pending",
          access_requested_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingStudent.id);

      if (updateError) {
        console.error("Failed to link student:", updateError);
        return { error: "Failed to link account" };
      }

      studentId = existingStudent.id;
    } else {
      // Create new student record
      const { data: newStudent, error: studentError } = await adminClient
        .from("students")
        .insert({
          tutor_id: params.tutorId,
          user_id: authData.user.id,
          full_name: params.fullName,
          email: params.email,
          phone: params.phone || null,
          calendar_access_status: "pending",
          access_requested_at: new Date().toISOString(),
          source: "access_request",
        })
        .select("id")
        .single();

      if (studentError || !newStudent) {
        console.error("Failed to create student:", studentError);
        return { error: "Failed to create student record" };
      }

      studentId = newStudent.id;
    }

    // Create access request record
    const { error: requestError } = await adminClient
      .from("student_access_requests")
      .insert({
        student_id: studentId,
        tutor_id: params.tutorId,
        status: "pending",
        student_message: params.studentMessage || null,
      });

    if (requestError) {
      console.error("Failed to create access request:", requestError);
      // Non-fatal - student still created
    }

    // Get tutor information for email
    const { data: tutorProfile } = await adminClient
      .from("profiles")
      .select("full_name, email, username")
      .eq("id", params.tutorId)
      .single();

    // Send notification email to tutor
    if (tutorProfile) {
      const reviewUrl = `${process.env.NEXT_PUBLIC_APP_URL}/students/access-requests`;

      await sendAccessRequestNotification({
        tutorName: tutorProfile.full_name || "Tutor",
        tutorEmail: tutorProfile.email,
        studentName: params.fullName,
        studentEmail: params.email,
        studentPhone: params.phone,
        studentMessage: params.studentMessage,
        reviewUrl,
      });
    }

    revalidatePath(`/book/${params.tutorUsername}`);

    return {
      success: true,
      message: "Access request submitted! You'll receive an email when approved.",
    };
  } catch (error) {
    console.error("Error in signupAndRequestAccess:", error);
    return { error: "An unexpected error occurred. Please try again." };
  }
}

/**
 * Auto-approve a student who has an active package
 */
async function autoApproveStudentAccess(studentId: string, tutorId: string) {
  const adminClient = createServiceRoleClient();

  if (!adminClient) {
    return;
  }

  try {
    // Update student status
    await adminClient
      .from("students")
      .update({
        calendar_access_status: "approved",
        access_approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", studentId)
      .eq("tutor_id", tutorId);

    // Update any pending access requests
    await adminClient
      .from("student_access_requests")
      .update({
        status: "approved",
        resolved_at: new Date().toISOString(),
        tutor_notes: "Auto-approved due to active package",
      })
      .eq("student_id", studentId)
      .eq("tutor_id", tutorId)
      .eq("status", "pending");
  } catch (error) {
    console.error("Failed to auto-approve student:", error);
  }
}

/**
 * Student login
 */
export async function studentLogin(params: { email: string; password: string }) {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: params.email,
    password: params.password,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true, user: data.user };
}

/**
 * Student logout
 */
export async function studentLogout() {
  const supabase = await createClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/");
  return { success: true };
}
