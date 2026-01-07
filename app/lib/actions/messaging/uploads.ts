"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Upload audio for a message to Supabase Storage
 * Returns the public URL for the audio file
 */
export async function uploadMessageAudio(
  formData: FormData
): Promise<{ url: string | null; error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { url: null, error: "You must be signed in" };
  }

  const file = formData.get("file") as File;
  if (!file) {
    return { url: null, error: "No audio file provided" };
  }

  // Validate file size (max 20MB - plenty for 2 minutes of audio)
  if (file.size > 20 * 1024 * 1024) {
    return { url: null, error: "Audio file must be under 20MB" };
  }

  // Generate unique filename
  const timestamp = Date.now();
  const extension = file.type === "audio/webm" ? "webm" : file.type === "audio/mp4" ? "mp4" : "audio";
  const filePath = `${user.id}/${timestamp}_voice_message.${extension}`;

  const { data, error } = await supabase.storage
    .from("message-attachments")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    console.error("[Messaging] Failed to upload audio:", error);
    return { url: null, error: "Failed to upload audio" };
  }

  // Get public URL
  const { data: urlData } = supabase.storage.from("message-attachments").getPublicUrl(data.path);

  return { url: urlData.publicUrl, error: null };
}
