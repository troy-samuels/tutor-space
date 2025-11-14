"use server";

import { Buffer } from "node:buffer";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { WizardState } from "@/lib/contexts/profile-wizard-context";

export type WizardSaveResult = {
  success: boolean;
  error?: string;
  avatarUrl?: string;
};

/**
 * Update profile with partial data from wizard
 * Unlike updateProfile, this doesn't require all fields and validates only what's provided
 */
export async function saveWizardProgress(
  wizardState: WizardState
): Promise<WizardSaveResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "You need to be signed in to update your profile." };
  }

  let avatarUrl: string | undefined;

  // Handle avatar upload if there's a file
  if (wizardState.avatarFile) {
    const result = await uploadAvatar(wizardState.avatarFile, user.id);
    if (result.error) {
      return { success: false, error: result.error };
    }
    avatarUrl = result.url;
  }

  // Build update object only with fields that have been filled
  const updateData: Record<string, any> = {};

  // Step 1 fields
  if (wizardState.step1.full_name) {
    updateData.full_name = wizardState.step1.full_name.trim();
  }
  if (wizardState.step1.username) {
    updateData.username = wizardState.step1.username.toLowerCase().trim();
  }
  if (wizardState.step1.timezone) {
    updateData.timezone = wizardState.step1.timezone;
  }

  // Step 1 primary_language maps to languages_taught initially
  // Will be overwritten by Step 2 if languages_taught is provided
  if (wizardState.step1.primary_language) {
    updateData.languages_taught = [wizardState.step1.primary_language.trim()];
  }

  // Step 2 fields
  if (wizardState.step2.bio) {
    updateData.bio = wizardState.step2.bio.trim();
  }
  if (wizardState.step2.tagline) {
    updateData.tagline = wizardState.step2.tagline.trim();
  }
  if (wizardState.step2.languages_taught) {
    // Override step 1's primary_language if step 2 has languages_taught
    updateData.languages_taught = wizardState.step2.languages_taught
      .split(",")
      .map((lang) => lang.trim())
      .filter(Boolean);
  }
  if (avatarUrl) {
    updateData.avatar_url = avatarUrl;
  } else if (wizardState.step2.avatar_url) {
    updateData.avatar_url = wizardState.step2.avatar_url;
  }

  // Step 3 fields (booking preferences)
  if (wizardState.step3.booking_enabled !== undefined) {
    updateData.booking_enabled = wizardState.step3.booking_enabled;
  }
  if (wizardState.step3.auto_accept_bookings !== undefined) {
    updateData.auto_accept_bookings = wizardState.step3.auto_accept_bookings;
  }
  if (wizardState.step3.buffer_time_minutes !== undefined) {
    updateData.buffer_time_minutes = wizardState.step3.buffer_time_minutes;
  }

  // Step 4 fields (social proof)
  if (wizardState.step4.website_url) {
    updateData.website_url = wizardState.step4.website_url.trim() || null;
  }
  if (wizardState.step4.instagram_handle !== undefined) {
    updateData.instagram_handle = wizardState.step4.instagram_handle.trim() || null;
  }

  // Perform the update
  const { error } = await supabase
    .from("profiles")
    .update(updateData)
    .eq("id", user.id);

  if (error) {
    // Username conflict
    if (error.code === "23505") {
      return { success: false, error: "That username is already in use." };
    }

    console.error("Profile wizard save error:", error);
    return { success: false, error: "We couldn't save your profile. Try again." };
  }

  // Revalidate relevant paths
  revalidatePath("/settings/profile");
  revalidatePath("/settings/profile-wizard-test");
  revalidatePath("/dashboard");

  return { success: true, avatarUrl };
}

/**
 * Upload avatar to Supabase Storage
 */
async function uploadAvatar(
  file: File,
  userId: string
): Promise<{ url?: string; error?: string }> {
  try {
    const supabase = await createClient();

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return { error: "Image must be smaller than 5MB" };
    }

    // Validate file type
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      return { error: "Image must be PNG, JPEG, or WebP" };
    }

    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);
    const extension = file.name.split(".").pop() ?? "png";
    const path = `avatars/${userId}-${Date.now()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, fileBuffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error("Avatar upload error:", uploadError);
      return { error: "We couldn't upload your image. Try a smaller file or another format." };
    }

    const { data: publicUrlData } = supabase.storage.from("avatars").getPublicUrl(path);
    return { url: publicUrlData.publicUrl };
  } catch (error) {
    console.error("Avatar upload exception:", error);
    return { error: "Failed to upload avatar" };
  }
}
