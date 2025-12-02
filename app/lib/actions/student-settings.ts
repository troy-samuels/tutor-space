"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const preferencesSchema = z.object({
  timezone: z.string().min(1),
  preferred_language: z.string().min(2).max(5),
  notification_sound: z.boolean(),
  theme: z.enum(["light", "dark", "system"]),
});

const emailPreferencesSchema = z.object({
  email_booking_reminders: z.boolean(),
  email_lesson_updates: z.boolean(),
  email_marketing: z.boolean(),
});

const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export interface StudentPreferences {
  id: string;
  user_id: string;
  timezone: string;
  preferred_language: string;
  notification_sound: boolean;
  theme: "light" | "dark" | "system";
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface StudentEmailPreferences {
  email_booking_reminders: boolean;
  email_lesson_updates: boolean;
  email_marketing: boolean;
}

/**
 * Get the current student's preferences
 */
export async function getStudentPreferences(): Promise<StudentPreferences | null> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const serviceClient = createServiceRoleClient();
  if (!serviceClient) return null;

  // Get or create preferences
  const { data: prefs, error } = await serviceClient
    .from("student_preferences")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error && error.code === "PGRST116") {
    // No preferences exist, create default ones
    const { data: newPrefs, error: insertError } = await serviceClient
      .from("student_preferences")
      .insert({ user_id: user.id })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating student preferences:", insertError);
      return null;
    }

    return newPrefs as StudentPreferences;
  }

  if (error) {
    console.error("Error fetching student preferences:", error);
    return null;
  }

  return prefs as StudentPreferences;
}

/**
 * Get email preferences for a student (from students table)
 */
export async function getStudentEmailPreferences(): Promise<StudentEmailPreferences | null> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const serviceClient = createServiceRoleClient();
  if (!serviceClient) return null;

  // Get the first student record for this user (they might have multiple with different tutors)
  const { data: student, error } = await serviceClient
    .from("students")
    .select("email_booking_reminders, email_lesson_updates, email_marketing")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (error) {
    // Return defaults if no student record exists
    return {
      email_booking_reminders: true,
      email_lesson_updates: true,
      email_marketing: false,
    };
  }

  return {
    email_booking_reminders: student.email_booking_reminders ?? true,
    email_lesson_updates: student.email_lesson_updates ?? true,
    email_marketing: student.email_marketing ?? false,
  };
}

/**
 * Update student preferences
 */
export async function updateStudentPreferences(
  data: z.infer<typeof preferencesSchema>
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Validate input
  const result = preferencesSchema.safeParse(data);
  if (!result.success) {
    return { success: false, error: result.error.issues[0].message };
  }

  const serviceClient = createServiceRoleClient();
  if (!serviceClient) {
    return { success: false, error: "Database connection failed" };
  }

  // Upsert preferences
  const { error } = await serviceClient
    .from("student_preferences")
    .upsert({
      user_id: user.id,
      ...result.data,
    }, { onConflict: "user_id" });

  if (error) {
    console.error("Error updating student preferences:", error);
    return { success: false, error: "Failed to update preferences" };
  }

  revalidatePath("/student-auth/settings");
  return { success: true };
}

/**
 * Update student email preferences
 */
export async function updateStudentEmailPreferences(
  data: z.infer<typeof emailPreferencesSchema>
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Validate input
  const result = emailPreferencesSchema.safeParse(data);
  if (!result.success) {
    return { success: false, error: result.error.issues[0].message };
  }

  const serviceClient = createServiceRoleClient();
  if (!serviceClient) {
    return { success: false, error: "Database connection failed" };
  }

  // Update all student records for this user
  const { error } = await serviceClient
    .from("students")
    .update(result.data)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error updating email preferences:", error);
    return { success: false, error: "Failed to update email preferences" };
  }

  revalidatePath("/student-auth/settings");
  return { success: true };
}

/**
 * Change student password
 */
export async function changeStudentPassword(
  data: { currentPassword: string; newPassword: string; confirmPassword: string }
): Promise<{ success: boolean; error?: string }> {
  // Validate input
  const result = passwordChangeSchema.safeParse(data);
  if (!result.success) {
    return { success: false, error: result.error.issues[0].message };
  }

  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !user.email) {
    return { success: false, error: "Not authenticated" };
  }

  // Verify current password by attempting to sign in
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: data.currentPassword,
  });

  if (signInError) {
    return { success: false, error: "Current password is incorrect" };
  }

  // Update the password
  const { error: updateError } = await supabase.auth.updateUser({
    password: data.newPassword,
  });

  if (updateError) {
    console.error("Error updating password:", updateError);
    return { success: false, error: "Failed to update password" };
  }

  return { success: true };
}

/**
 * Get student account information
 */
export async function getStudentAccountInfo(): Promise<{
  email: string;
  created_at: string;
  connected_tutors: number;
} | null> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const serviceClient = createServiceRoleClient();
  if (!serviceClient) return null;

  // Count connected tutors
  const { count } = await serviceClient
    .from("student_tutor_connections")
    .select("*", { count: "exact", head: true })
    .eq("student_user_id", user.id)
    .eq("status", "approved");

  return {
    email: user.email || "",
    created_at: user.created_at,
    connected_tutors: count || 0,
  };
}

// Common timezones for the dropdown
export const COMMON_TIMEZONES = [
  { value: "America/New_York", label: "Eastern Time (US & Canada)" },
  { value: "America/Chicago", label: "Central Time (US & Canada)" },
  { value: "America/Denver", label: "Mountain Time (US & Canada)" },
  { value: "America/Los_Angeles", label: "Pacific Time (US & Canada)" },
  { value: "America/Toronto", label: "Eastern Time (Canada)" },
  { value: "America/Vancouver", label: "Pacific Time (Canada)" },
  { value: "America/Mexico_City", label: "Mexico City" },
  { value: "America/Sao_Paulo", label: "São Paulo" },
  { value: "America/Buenos_Aires", label: "Buenos Aires" },
  { value: "Europe/London", label: "London" },
  { value: "Europe/Paris", label: "Paris" },
  { value: "Europe/Berlin", label: "Berlin" },
  { value: "Europe/Madrid", label: "Madrid" },
  { value: "Europe/Rome", label: "Rome" },
  { value: "Europe/Amsterdam", label: "Amsterdam" },
  { value: "Europe/Moscow", label: "Moscow" },
  { value: "Asia/Dubai", label: "Dubai" },
  { value: "Asia/Kolkata", label: "India Standard Time" },
  { value: "Asia/Singapore", label: "Singapore" },
  { value: "Asia/Hong_Kong", label: "Hong Kong" },
  { value: "Asia/Tokyo", label: "Tokyo" },
  { value: "Asia/Seoul", label: "Seoul" },
  { value: "Asia/Shanghai", label: "Shanghai" },
  { value: "Australia/Sydney", label: "Sydney" },
  { value: "Australia/Melbourne", label: "Melbourne" },
  { value: "Pacific/Auckland", label: "Auckland" },
  { value: "UTC", label: "UTC" },
];

export const SUPPORTED_LANGUAGES = [
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
  { value: "fr", label: "Français" },
  { value: "de", label: "Deutsch" },
  { value: "pt", label: "Português" },
  { value: "it", label: "Italiano" },
  { value: "zh", label: "中文" },
  { value: "ja", label: "日本語" },
  { value: "ko", label: "한국어" },
];
