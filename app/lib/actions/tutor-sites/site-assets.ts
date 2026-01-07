"use server";

import { Buffer } from "node:buffer";
import { createClient } from "@/lib/supabase/server";

const HERO_IMAGE_BUCKET = "site-assets";

/**
 * Upload hero image to Supabase Storage
 */
export async function uploadHeroImage(file: File) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  try {
    // Convert file to array buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Create unique file path
    const fileExtension = file.name.split(".").pop() || "jpg";
    const path = `${user.id}/hero/${Date.now()}.${fileExtension}`;

    // Upload to storage
    const { error } = await supabase.storage.from(HERO_IMAGE_BUCKET).upload(path, buffer, {
      contentType: file.type || "image/jpeg",
      upsert: true,
    });

    if (error) {
      console.error("[TutorSites] Upload error:", error);
      return { error: "Failed to upload image" };
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage.from(HERO_IMAGE_BUCKET).getPublicUrl(path);

    return { success: true, url: publicUrlData.publicUrl };
  } catch (error) {
    console.error("[TutorSites] Upload exception:", error);
    return { error: "Failed to upload image" };
  }
}
