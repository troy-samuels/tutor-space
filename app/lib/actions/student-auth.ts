"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { upsertThread } from "@/lib/repositories/messaging";
import { buildAuthCallbackUrl, sanitizeRedirectPath } from "@/lib/auth/redirects";
import { sendAccessRequestNotification } from "@/lib/emails/access-emails";
import type { AccessStatus, StudentAccessInfo } from "@/lib/actions/types";

type StudentAccessRecord = {
  id: string;
  status: string | null; // "active", "trial", "paused", "alumni", etc.
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
  // Note: Query only columns that exist in current schema
  // (calendar_access_status may not exist in all environments)
  const { data: student, error } = await supabase
    .from("students")
    .select(
      `
      id,
      status,
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

  const studentRecord: StudentAccessRecord = {
    ...student,
    profiles: Array.isArray(student.profiles)
      ? student.profiles[0]
      : student.profiles,
  };

  // Check for active packages (auto-approve if found)
  const { hasActivePackage } = await import("@/lib/actions/session-packages");
  const packages = await hasActivePackage(studentRecord.id, tutorId);

  // Derive access status from student record status
  // "active" and "trial" students are approved to book
  // "paused", "alumni", "pending" need tutor approval
  const isApproved = studentRecord.status === "active" || studentRecord.status === "trial" || !!packages;

  if (packages && !isApproved) {
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
    status: isApproved ? "approved" : "pending",
    student_id: studentRecord.id,
    tutor_name: studentRecord.profiles?.full_name ?? undefined,
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

    const supabase = await createClient();
    const bookPath = `/book/${params.tutorUsername}`;
    let authUserId: string | null = null;

    const { data: adminCreated, error: adminCreateError } = await adminClient.auth.admin.createUser({
      email: params.email,
      password: params.password,
      email_confirm: true,
      user_metadata: {
        role: "student",
        full_name: params.fullName,
      },
    });

    if (adminCreateError) {
      const message = adminCreateError.message?.toLowerCase() ?? "";
      if (message.includes("already registered")) {
        return {
          error: "An account with this email already exists. Please log in instead.",
        };
      }

      console.error("Auth signup error:", adminCreateError);
      return { error: "Failed to create account" };
    }

    authUserId = adminCreated?.user?.id ?? null;

    if (!authUserId) {
      return { error: "Failed to create account" };
    }

    let { error: signInError } = await supabase.auth.signInWithPassword({
      email: params.email,
      password: params.password,
    });

    if (signInError) {
      const message = signInError.message?.toLowerCase() ?? "";
      if (message.includes("email not confirmed")) {
        await adminClient.auth.admin.updateUserById(authUserId, {
          email_confirm: true,
        });

        const retry = await supabase.auth.signInWithPassword({
          email: params.email,
          password: params.password,
        });

        signInError = retry.error ?? null;
      }
    }

    if (signInError) {
      console.error("Auth sign-in error:", signInError);
      return {
        error: "Account created but we couldn't sign you in yet. Please log in.",
      };
    }

    // Create or update student record
    let studentId: string;

    if (existingStudent) {
      // Link existing student to auth user
      const { error: updateError } = await adminClient
        .from("students")
        .update({
          user_id: authUserId,
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
          user_id: authUserId,
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

    revalidatePath(bookPath);

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
export async function studentLogin(params: {
  email: string;
  password: string;
}): Promise<{ success?: boolean; error?: string; redirectTo?: string }> {
  const supabase = await createClient();
  const adminClient = createServiceRoleClient();
  const email = params.email?.trim().toLowerCase();

  let { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: params.password,
  });

  if (error) {
    const message = error.message ?? "";
    if (message.toLowerCase().includes("email not confirmed") && adminClient) {
      const { data: userList, error: listError } = await adminClient.auth.admin.listUsers({
        perPage: 200,
      });

      if (!listError) {
        const existing = userList?.users?.find(
          user => user.email?.toLowerCase() === email
        );

        if (existing?.id) {
          await adminClient.auth.admin.updateUserById(existing.id, {
            email_confirm: true,
          });

          const retry = await supabase.auth.signInWithPassword({
            email,
            password: params.password,
          });

          data = retry.data;
          error = retry.error ?? null;
        }
      }
    }

    if (error) {
      return { error: error.message ?? "Unable to sign you in right now." };
    }
  }

  return { success: true };
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

/**
 * Simple student signup (no tutor required)
 * Student can later search and connect with tutors
 */
export async function studentSignup(params: {
  email: string;
  password: string;
  fullName: string;
  timezone?: string;
  redirectTo?: string;
}): Promise<{ success?: boolean; error?: string; redirectTo?: string }> {
  const supabase = await createClient();
  const email = params.email?.trim().toLowerCase();
  const fullName = params.fullName?.trim();
  const timezone = params.timezone || "UTC";

  // Validate inputs
  if (!email || !params.password || !fullName) {
    return { error: "All fields are required" };
  }

  if (params.password.length < 8) {
    return { error: "Password must be at least 8 characters" };
  }

  const adminClient = createServiceRoleClient();
  const nextPath = sanitizeRedirectPath(params.redirectTo) ?? "/student/search";
  let createdUserId: string | null = null;
  let hasSession = false;

  if (adminClient) {
    const { data: adminCreated, error: adminCreateError } = await adminClient.auth.admin.createUser({
      email,
      password: params.password,
      email_confirm: true,
      user_metadata: {
        role: "student",
        full_name: fullName,
        timezone,
      },
    });

    if (adminCreateError) {
      const message = adminCreateError.message ?? "";
      const normalizedMessage = message.toLowerCase();

      if (normalizedMessage.includes("already registered")) {
        return { error: "An account with this email already exists. Please log in instead." };
      }

      console.error("Student signup admin create error:", adminCreateError);
    } else {
      createdUserId = adminCreated?.user?.id ?? null;
    }
  }

  if (!createdUserId) {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password: params.password,
      options: {
        data: {
          role: "student",
          full_name: fullName,
          timezone,
        },
        emailRedirectTo: buildAuthCallbackUrl(nextPath),
      },
    });

    if (authError || !authData.user) {
      const message = authError?.message || "";
      const normalizedMessage = message.toLowerCase();

      if (normalizedMessage.includes("already registered")) {
        return { error: "An account with this email already exists. Please log in instead." };
      }

      console.error("Student signup error:", authError);
      return { error: message || "Failed to create account" };
    }

    createdUserId = authData.user.id;
    hasSession = Boolean(authData.session);
  }

  if (!createdUserId) {
    return { error: "Failed to create account. Please try again." };
  }

  if (!hasSession) {
    let { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: params.password,
    });

    if (signInError && adminClient) {
      const message = signInError.message?.toLowerCase() ?? "";
      if (message.includes("email not confirmed")) {
        await adminClient.auth.admin.updateUserById(createdUserId, {
          email_confirm: true,
          user_metadata: {
            role: "student",
            full_name: fullName,
            timezone,
          },
        });

        const retry = await supabase.auth.signInWithPassword({
          email,
          password: params.password,
        });

        signInError = retry.error ?? null;
      }
    }

    if (signInError) {
      console.error("Student signup sign-in error:", signInError);
      return {
        error: "Account created but we couldn't sign you in. Please log in.",
      };
    }
  }

  return { success: true };
}

async function getStudentForTutor(tutorId: string) {
  const supabase = await createClient();
  const adminClient = createServiceRoleClient();

  if (!adminClient) {
    return { error: "Service unavailable. Please try again later." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You need to be signed in to manage this request." };
  }

  const { data: student, error } = await adminClient
    .from("students")
    .select("id, full_name, email, phone, tutor_id")
    .eq("user_id", user.id)
    .eq("tutor_id", tutorId)
    .single();

  if (error || !student) {
    return { error: "No access request found for this tutor." };
  }

  return { student, adminClient };
}

export async function cancelAccessRequest(tutorId: string) {
  const result = await getStudentForTutor(tutorId);
  if ("error" in result) return result;
  const { student, adminClient } = result;

  await adminClient
    .from("student_access_requests")
    .delete()
    .eq("student_id", student.id)
    .eq("tutor_id", tutorId)
    .eq("status", "pending");

  await adminClient
    .from("students")
    .update({
      calendar_access_status: null,
      access_requested_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", student.id)
    .eq("tutor_id", tutorId);

  revalidatePath("/book");
  return { success: true };
}

export async function resendAccessRequest(tutorId: string) {
  const result = await getStudentForTutor(tutorId);
  if ("error" in result) return result;
  const { student, adminClient } = result;

  const now = new Date().toISOString();

  await adminClient
    .from("students")
    .update({
      calendar_access_status: "pending",
      access_requested_at: now,
      updated_at: now,
    })
    .eq("id", student.id)
    .eq("tutor_id", tutorId);

  await adminClient
    .from("student_access_requests")
    .delete()
    .eq("student_id", student.id)
    .eq("tutor_id", tutorId)
    .eq("status", "pending");

  await adminClient.from("student_access_requests").insert({
    student_id: student.id,
    tutor_id: tutorId,
    status: "pending",
    student_message: null,
  });

  const { data: tutorProfile } = await adminClient
    .from("profiles")
    .select("full_name, email, username")
    .eq("id", tutorId)
    .single();

  if (tutorProfile) {
    const reviewUrl = `${process.env.NEXT_PUBLIC_APP_URL}/students/access-requests`;
      await sendAccessRequestNotification({
        tutorName: tutorProfile.full_name || "Tutor",
        tutorEmail: tutorProfile.email,
        studentName: student.full_name || "Student",
        studentEmail: student.email,
        studentPhone: student.phone ?? undefined,
        studentMessage: undefined,
        reviewUrl,
      });
    }

  revalidatePath("/book");
  return { success: true };
}

/**
 * Sign up a student via an invite link (auto-approved, bypasses access request)
 */
export async function signupWithInviteLink(params: {
  inviteToken: string;
  email: string;
  password: string;
  fullName: string;
  phone?: string;
}): Promise<{
  success?: boolean;
  error?: string;
  tutorUsername?: string;
  serviceIds?: string[];
  redirectTo?: string;
}> {
  const adminClient = createServiceRoleClient();

  if (!adminClient) {
    return { error: "Service unavailable. Please try again later." };
  }

  try {
    // Validate the invite token
    const { data: tokenData, error: tokenError } = await adminClient.rpc(
      "validate_invite_token",
      { p_token: params.inviteToken }
    );

    if (tokenError || !tokenData || tokenData.length === 0) {
      return { error: "Invalid invite link" };
    }

    const inviteLink = tokenData[0];

    if (!inviteLink.is_valid) {
      return { error: "This invite link has expired or been deactivated" };
    }

    const tutorId = inviteLink.tutor_id;
    const tutorUsername = inviteLink.tutor_username;
    const serviceIds = inviteLink.service_ids ?? [];

    // Check if student email already exists for this tutor
    const { data: existingStudent } = await adminClient
      .from("students")
      .select("id, user_id, email")
      .eq("tutor_id", tutorId)
      .eq("email", params.email)
      .single();

    if (existingStudent?.user_id) {
      return {
        error: "An account with this email already exists. Please log in instead.",
      };
    }

    const supabase = await createClient();
    const bookPath =
      serviceIds.length > 0
        ? `/book/${tutorUsername}?services=${serviceIds.join(",")}`
        : `/book/${tutorUsername}`;
    const { data: adminCreated, error: adminCreateError } = await adminClient.auth.admin.createUser({
      email: params.email,
      password: params.password,
      email_confirm: true,
      user_metadata: {
        role: "student",
        full_name: params.fullName,
      },
    });

    if (adminCreateError) {
      const message = adminCreateError.message?.toLowerCase() ?? "";
      if (message.includes("already registered")) {
        return {
          error: "An account with this email already exists. Please log in instead.",
        };
      }

      console.error("Auth signup error:", adminCreateError);
      return { error: "Failed to create account" };
    }

    const authUserId = adminCreated?.user?.id ?? null;

    if (!authUserId) {
      return { error: "Failed to create account" };
    }

    let { error: signInError } = await supabase.auth.signInWithPassword({
      email: params.email,
      password: params.password,
    });

    if (signInError) {
      const message = signInError.message?.toLowerCase() ?? "";
      if (message.includes("email not confirmed")) {
        await adminClient.auth.admin.updateUserById(authUserId, {
          email_confirm: true,
        });

        const retry = await supabase.auth.signInWithPassword({
          email: params.email,
          password: params.password,
        });

        signInError = retry.error ?? null;
      }
    }

    if (signInError) {
      console.error("Auth sign-in error:", signInError);
      return {
        error: "Account created but we couldn't sign you in yet. Please log in.",
      };
    }

    // Create or update student record - AUTO APPROVED via invite link
    let studentId: string;

    if (existingStudent) {
      // Link existing student to auth user and auto-approve
      const { error: updateError } = await adminClient
        .from("students")
        .update({
          user_id: authUserId,
          full_name: params.fullName,
          phone: params.phone || null,
          status: "active", // Auto-approved
          calendar_access_status: "approved", // Auto-approved
          access_approved_at: new Date().toISOString(),
          source: "invite_link",
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingStudent.id);

      if (updateError) {
        console.error("Failed to link student:", updateError);
        return { error: "Failed to link account" };
      }

      studentId = existingStudent.id;
    } else {
      // Create new student record - AUTO APPROVED
      const { data: newStudent, error: studentError } = await adminClient
        .from("students")
        .insert({
          tutor_id: tutorId,
          user_id: authUserId,
          full_name: params.fullName,
          email: params.email,
          phone: params.phone || null,
          status: "active", // Auto-approved
          calendar_access_status: "approved", // Auto-approved
          access_approved_at: new Date().toISOString(),
          source: "invite_link",
        })
        .select("id")
        .single();

      if (studentError || !newStudent) {
        console.error("Failed to create student:", studentError);
        return { error: "Failed to create student record" };
      }

      studentId = newStudent.id;
    }

    // Record invite link usage
    await adminClient.rpc("increment_invite_link_usage", {
      p_link_id: inviteLink.id,
      p_student_id: studentId,
    });

    // Create conversation thread for messaging (auto-create like approval flow)
    await upsertThread(
      adminClient,
      {
        tutorId,
        studentId,
      },
      { ignoreDuplicates: true }
    );

    revalidatePath(bookPath);

    return {
      success: true,
      tutorUsername,
      serviceIds,
    };
  } catch (error) {
    console.error("Error in signupWithInviteLink:", error);
    return { error: "An unexpected error occurred. Please try again." };
  }
}
