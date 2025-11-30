"use server";

import { Buffer } from "node:buffer";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { profileSchema, type ProfileFormValues } from "@/lib/validators/profile";

export type ProfileActionState = {
  error?: string;
  success?: string;
  fields?: Partial<ProfileFormValues>;
};

export async function updateProfile(
  _prevState: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You need to be signed in to update your profile." };
  }

  const existingAvatarUrl = ((formData.get("existing_avatar_url") as string) ?? "").trim();
  const avatarFile = formData.get("avatar");
  let avatarUrl = existingAvatarUrl;

  if (avatarFile instanceof File && avatarFile.size > 0) {
    const arrayBuffer = await avatarFile.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);
    const extension = avatarFile.name.split(".").pop() ?? "png";
    const path = `avatars/${user.id}-${Date.now()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, fileBuffer, {
        contentType: avatarFile.type,
        upsert: true,
      });

    if (uploadError) {
      return { error: "We couldn’t upload your image. Try a smaller file or another format." };
    }

    const { data: publicUrlData } = supabase.storage.from("avatars").getPublicUrl(path);
    avatarUrl = publicUrlData.publicUrl;
  }

  const bufferMinutesRaw = (formData.get("buffer_time_minutes") as string) ?? "0";
  const bufferMinutes = Number.parseInt(bufferMinutesRaw, 10);

  const languagesRaw = (formData.get("languages_taught") as string) ?? "";

  const fields: ProfileFormValues = {
    full_name: (formData.get("full_name") as string) ?? "",
    username: (formData.get("username") as string) ?? "",
    tagline: (formData.get("tagline") as string) ?? "",
    bio: (formData.get("bio") as string) ?? "",
    languages_taught: languagesRaw,
    timezone: (formData.get("timezone") as string) ?? "",
    website_url: (formData.get("website_url") as string) ?? "",
    avatar_url: avatarUrl,
    instagram_handle: (formData.get("instagram_handle") as string) ?? "",
    tiktok_handle: (formData.get("tiktok_handle") as string) ?? "",
    facebook_handle: (formData.get("facebook_handle") as string) ?? "",
    x_handle: (formData.get("x_handle") as string) ?? "",
    email: (formData.get("email") as string) ?? "",
    booking_enabled: formData.get("booking_enabled") === "on",
    auto_accept_bookings: formData.get("auto_accept_bookings") === "on",
    buffer_time_minutes: Number.isNaN(bufferMinutes) ? 0 : bufferMinutes,
  };

  const parsed = profileSchema.safeParse(fields);

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid profile data";
    return { error: message, fields };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.full_name,
      username: parsed.data.username,
      tagline: parsed.data.tagline,
      bio: parsed.data.bio,
      languages_taught: parsed.data.languages_taught
        .split(",")
        .map((language) => language.trim())
        .filter(Boolean),
      timezone: parsed.data.timezone,
      website_url: parsed.data.website_url || null,
      avatar_url: parsed.data.avatar_url || null,
      instagram_handle: parsed.data.instagram_handle || null,
      tiktok_handle: parsed.data.tiktok_handle || null,
      facebook_handle: parsed.data.facebook_handle || null,
      x_handle: parsed.data.x_handle || null,
      booking_enabled: parsed.data.booking_enabled,
      auto_accept_bookings: parsed.data.auto_accept_bookings,
      buffer_time_minutes: parsed.data.buffer_time_minutes,
    })
    .eq("id", user.id);

  if (error) {
    if (error.code === "23505") {
      return { error: "That username is already in use.", fields };
    }

    return { error: "We couldn’t save your profile. Try again.", fields };
  }

  revalidatePath("/settings/profile");
  revalidatePath("/dashboard");

  return { success: "Profile updated successfully." };
}

/**
 * Update payment settings for tutor
 */
export async function updatePaymentSettings(data: {
  payment_instructions: string;
  venmo_handle: string;
  paypal_email: string;
  zelle_phone: string;
  stripe_payment_link: string;
  custom_payment_url: string;
  booking_currency: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You need to be signed in to update payment settings." };
  }

  // Validate URLs if provided
  if (data.stripe_payment_link && !isValidUrl(data.stripe_payment_link)) {
    return { error: "Stripe payment link must be a valid URL" };
  }

  if (data.custom_payment_url && !isValidUrl(data.custom_payment_url)) {
    return { error: "Custom payment URL must be a valid URL" };
  }

  const allowedCurrencies = ["USD", "EUR", "GBP", "CAD", "AUD"];
  const bookingCurrency = data.booking_currency?.toUpperCase() || "USD";
  if (!allowedCurrencies.includes(bookingCurrency)) {
    return { error: "Select a valid currency" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      payment_instructions: data.payment_instructions || null,
      venmo_handle: data.venmo_handle || null,
      paypal_email: data.paypal_email || null,
      zelle_phone: data.zelle_phone || null,
      stripe_payment_link: data.stripe_payment_link || null,
      custom_payment_url: data.custom_payment_url || null,
      booking_currency: bookingCurrency,
    })
    .eq("id", user.id);

  if (error) {
    console.error("Error updating payment settings:", error);
    return { error: "Failed to update payment settings. Please try again." };
  }

  revalidatePath("/settings/payments");
  revalidatePath("/dashboard");
  revalidatePath("/book/[username]", "page");

  return { success: true };
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Update video conferencing settings for tutor
 */
export async function updateVideoSettings(data: {
  video_provider: string;
  zoom_personal_link: string;
  google_meet_link: string;
  calendly_link: string;
  custom_video_url: string;
  custom_video_name: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You need to be signed in to update video settings." };
  }

  // Validate URLs based on provider
  if (data.video_provider === "zoom_personal" && data.zoom_personal_link) {
    if (!isValidUrl(data.zoom_personal_link)) {
      return { error: "Zoom link must be a valid URL" };
    }
    if (!data.zoom_personal_link.includes("zoom.us")) {
      return { error: "Please enter a valid Zoom meeting URL" };
    }
  }

  if (data.video_provider === "google_meet" && data.google_meet_link) {
    if (!isValidUrl(data.google_meet_link)) {
      return { error: "Google Meet link must be a valid URL" };
    }
    if (!data.google_meet_link.includes("meet.google.com")) {
      return { error: "Please enter a valid Google Meet URL" };
    }
  }

  if (data.video_provider === "calendly" && data.calendly_link) {
    if (!isValidUrl(data.calendly_link)) {
      return { error: "Calendly link must be a valid URL" };
    }
  }

  if (data.video_provider === "custom" && data.custom_video_url) {
    if (!isValidUrl(data.custom_video_url)) {
      return { error: "Custom video URL must be a valid URL" };
    }
    if (!data.custom_video_name.trim()) {
      return { error: "Please provide a name for your custom video platform" };
    }
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      video_provider: data.video_provider,
      zoom_personal_link: data.zoom_personal_link || null,
      google_meet_link: data.google_meet_link || null,
      calendly_link: data.calendly_link || null,
      custom_video_url: data.custom_video_url || null,
      custom_video_name: data.custom_video_name || null,
    })
    .eq("id", user.id);

  if (error) {
    console.error("Error updating video settings:", error);
    return { error: "Failed to update video settings. Please try again." };
  }

  revalidatePath("/settings/video");
  revalidatePath("/bookings");

  return { success: true };
}
