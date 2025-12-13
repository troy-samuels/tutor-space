"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Upload a student avatar
 */
export async function uploadStudentAvatar(
  formData: FormData
): Promise<{ success: boolean; avatarUrl?: string; error?: string }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const file = formData.get("avatar") as File | null;
  if (!file) {
    return { success: false, error: "No file provided" };
  }

  // Validate file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { success: false, error: "Invalid file type. Please upload a JPEG, PNG, WebP, or GIF image." };
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return { success: false, error: "File too large. Maximum size is 5MB." };
  }

  const serviceClient = createServiceRoleClient();
  if (!serviceClient) {
    return { success: false, error: "Database connection failed" };
  }

  // Generate unique filename
  const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const fileName = `student-${user.id}-${Date.now()}.${fileExt}`;
  const filePath = `student-avatars/${fileName}`;

  // Get current avatar to delete if exists
  const { data: currentPrefs } = await serviceClient
    .from("student_preferences")
    .select("avatar_url")
    .eq("user_id", user.id)
    .single();

  // Delete old avatar if exists
  if (currentPrefs?.avatar_url) {
    const oldPath = extractPathFromUrl(currentPrefs.avatar_url);
    if (oldPath) {
      await serviceClient.storage.from("avatars").remove([oldPath]);
    }
  }

  // Convert File to ArrayBuffer then to Uint8Array for upload
  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);

  // Upload new avatar
  const { error: uploadError } = await serviceClient.storage
    .from("avatars")
    .upload(filePath, uint8Array, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    console.error("Error uploading avatar:", uploadError);
    return { success: false, error: "Failed to upload avatar" };
  }

  // Get public URL
  const { data: { publicUrl } } = serviceClient.storage
    .from("avatars")
    .getPublicUrl(filePath);

  // Update preferences with new avatar URL
  const { error: updateError } = await serviceClient
    .from("student_preferences")
    .upsert({
      user_id: user.id,
      avatar_url: publicUrl,
    }, { onConflict: "user_id" });

  if (updateError) {
    console.error("Error updating avatar URL:", updateError);
    return { success: false, error: "Failed to save avatar" };
  }

  revalidatePath("/student/settings");
  return { success: true, avatarUrl: publicUrl };
}

/**
 * Delete student avatar
 */
export async function deleteStudentAvatar(): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const serviceClient = createServiceRoleClient();
  if (!serviceClient) {
    return { success: false, error: "Database connection failed" };
  }

  // Get current avatar
  const { data: currentPrefs } = await serviceClient
    .from("student_preferences")
    .select("avatar_url")
    .eq("user_id", user.id)
    .single();

  if (!currentPrefs?.avatar_url) {
    return { success: true }; // No avatar to delete
  }

  // Delete from storage
  const path = extractPathFromUrl(currentPrefs.avatar_url);
  if (path) {
    await serviceClient.storage.from("avatars").remove([path]);
  }

  // Clear avatar URL in preferences
  const { error: updateError } = await serviceClient
    .from("student_preferences")
    .update({ avatar_url: null })
    .eq("user_id", user.id);

  if (updateError) {
    console.error("Error clearing avatar URL:", updateError);
    return { success: false, error: "Failed to remove avatar" };
  }

  revalidatePath("/student/settings");
  return { success: true };
}

/**
 * Get student avatar URL
 */
export async function getStudentAvatarUrl(): Promise<string | null> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const serviceClient = createServiceRoleClient();
  if (!serviceClient) return null;

  const { data } = await serviceClient
    .from("student_preferences")
    .select("avatar_url")
    .eq("user_id", user.id)
    .single();

  return data?.avatar_url || null;
}

/**
 * Extract file path from public URL
 */
function extractPathFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split("/storage/v1/object/public/avatars/");
    return pathParts.length > 1 ? pathParts[1] : null;
  } catch {
    return null;
  }
}
