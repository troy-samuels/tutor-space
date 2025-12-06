"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type StepData = {
  // Step 1
  full_name?: string;
  username?: string;
  timezone?: string;
  avatar_url?: string | null;
  // Step 2
  tagline?: string;
  bio?: string;
  website_url?: string | null;
  // Step 3
  primary_language?: string;
  languages_taught?: string[];
  currency?: string;
  service?: {
    name: string;
    duration_minutes: number;
    price: number;
    currency?: string;
    offer_type?: ServiceOfferType;
  };
  // Step 4
  availability?: Array<{
    day_of_week: string;
    start_time: string;
    end_time: string;
  }>;
  // Step 5
  calendar_provider?: "google" | "outlook" | null;
  // Step 6 - Video Conferencing
  video_provider?: "zoom_personal" | "google_meet" | "custom" | "none";
  video_url?: string;
  custom_video_name?: string;
  // Step 7 - Payments
  payment_method?: "stripe" | "custom";
  custom_payment_url?: string | null;
};

// Map day names to numbers (0 = Sunday, 1 = Monday, etc.)
const DAY_NAME_TO_NUMBER: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

export async function saveOnboardingStep(
  step: number,
  data: StepData
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Handle different steps
    switch (step) {
      case 1: {
        // Profile basics
        const { error } = await supabase
          .from("profiles")
          .update({
            full_name: data.full_name,
            username: data.username,
            timezone: data.timezone,
            avatar_url: data.avatar_url,
            onboarding_step: 1,
          })
          .eq("id", user.id);

        if (error) {
          if (error.code === "23505") {
            return { success: false, error: "Username is already taken" };
          }
          throw error;
        }
        break;
      }

      case 2: {
        // Professional info
        const { error } = await supabase
          .from("profiles")
          .update({
            tagline: data.tagline,
            bio: data.bio,
            website_url: data.website_url,
            onboarding_step: 2,
          })
          .eq("id", user.id);

        if (error) throw error;
        break;
      }

      case 3: {
        // Languages and services
        // Update profile with languages and currency
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            languages_taught: data.languages_taught,
            booking_currency: data.currency?.toUpperCase() || "USD",
            onboarding_step: 3,
          })
          .eq("id", user.id);

        if (profileError) throw profileError;

        // Create the service
        if (data.service) {
          const { error: serviceError } = await supabase
            .from("services")
            .insert({
              tutor_id: user.id,
              name: data.service.name,
              duration_minutes: data.service.duration_minutes,
              price_amount: Math.round(data.service.price * 100), // cents
              price: Math.round(data.service.price * 100), // keep legacy column in sync
              price_currency: data.service.currency?.toUpperCase() || "USD",
              currency: data.service.currency?.toUpperCase() || "USD",
              is_active: true,
              offer_type: data.service.offer_type ?? "one_off",
            });

          if (serviceError) throw serviceError;
        }
        break;
      }

      case 4: {
        // Availability
        if (data.availability && data.availability.length > 0) {
          // First, delete existing availability for this user
          await supabase
            .from("availability")
            .delete()
            .eq("tutor_id", user.id);

          // Insert new availability slots (convert day names to numbers)
          const availabilityRecords = data.availability.map((slot) => ({
            tutor_id: user.id,
            day_of_week: DAY_NAME_TO_NUMBER[slot.day_of_week.toLowerCase()] ?? 1,
            start_time: slot.start_time,
            end_time: slot.end_time,
          }));

          const { error } = await supabase
            .from("availability")
            .insert(availabilityRecords);

          if (error) throw error;
        }

        // Update onboarding step
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ onboarding_step: 4 })
          .eq("id", user.id);

        if (profileError) throw profileError;
        break;
      }

      case 5: {
        // Calendar Sync
        const profileUpdate: Record<string, unknown> = {
          onboarding_step: 5,
        };

        // Persist the selected provider so it can be surfaced in settings or telemetry
        if (typeof data.calendar_provider !== "undefined") {
          profileUpdate.calendar_provider = data.calendar_provider;
        }

        const { error } = await supabase
          .from("profiles")
          .update(profileUpdate)
          .eq("id", user.id);

        if (error) throw error;
        break;
      }

      case 6: {
        // Video Conferencing
        const videoUpdateData: Record<string, unknown> = {
          onboarding_step: 6,
          video_provider: data.video_provider || "none",
        };

        // Set the appropriate URL field based on provider
        if (data.video_provider === "zoom_personal" && data.video_url) {
          videoUpdateData.zoom_personal_link = data.video_url;
        } else if (data.video_provider === "google_meet" && data.video_url) {
          videoUpdateData.google_meet_link = data.video_url;
        } else if (data.video_provider === "custom" && data.video_url) {
          videoUpdateData.custom_video_url = data.video_url;
          if (data.custom_video_name) {
            videoUpdateData.custom_video_name = data.custom_video_name;
          }
        }

        const { error: videoError } = await supabase
          .from("profiles")
          .update(videoUpdateData)
          .eq("id", user.id);

        if (videoError) throw videoError;
        break;
      }

      case 7: {
        // Payments
        const updateData: Record<string, unknown> = {
          onboarding_step: 7,
        };

        if (data.payment_method === "custom" && data.custom_payment_url) {
          updateData.custom_payment_url = data.custom_payment_url;
        }

        const { error } = await supabase
          .from("profiles")
          .update(updateData)
          .eq("id", user.id);

        if (error) throw error;
        break;
      }

      default:
        return { success: false, error: "Invalid step" };
    }

    revalidatePath("/onboarding");
    return { success: true };
  } catch (error) {
    console.error(`Error saving onboarding step ${step}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An error occurred",
    };
  }
}

export async function completeOnboarding(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Mark onboarding as complete
    const { error } = await supabase
      .from("profiles")
      .update({
        onboarding_completed: true,
        onboarding_step: 7,
      })
      .eq("id", user.id);

    if (error) throw error;

    revalidatePath("/dashboard");
    revalidatePath("/onboarding");

    return { success: true };
  } catch (error) {
    console.error("Error completing onboarding:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An error occurred",
    };
  }
}

export async function checkOnboardingStatus(): Promise<{
  completed: boolean;
  step: number;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { completed: false, step: 0 };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed, onboarding_step")
      .eq("id", user.id)
      .single();

    return {
      completed: profile?.onboarding_completed ?? false,
      step: profile?.onboarding_step ?? 0,
    };
  } catch (error) {
    console.error("Error checking onboarding status:", error);
    return { completed: false, step: 0 };
  }
}
import type { ServiceOfferType } from "@/lib/validators/service";
