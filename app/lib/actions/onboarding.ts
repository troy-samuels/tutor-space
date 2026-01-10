"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { normalizeAndValidateUsernameSlug } from "@/lib/utils/username-slug";
import { getOrCreateStripeCustomer, stripe } from "@/lib/stripe";
import { createLocalTrial } from "./local-trial";
import { isStripeConfigured, getTrialDays } from "@/lib/utils/stripe-config";
import { hasProAccess } from "@/lib/payments/subscriptions";
import type { PlatformBillingPlan } from "@/lib/types/payments";
import {
  isSignupCheckoutComplete,
  isSignupLifetimePlan,
  requiresSignupCheckout,
} from "@/lib/services/signup-checkout";

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
  video_provider?: "zoom_personal" | "google_meet" | "microsoft_teams" | "custom" | "none";
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

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

async function requiresSignupCheckoutGate(
  userId: string,
  supabase: SupabaseServerClient
): Promise<boolean> {
  const adminClient = createServiceRoleClient();
  const profileClient = adminClient ?? supabase;

  const { data: profile, error } = await profileClient
    .from("profiles")
    .select(
      "plan, signup_checkout_plan, signup_checkout_status, signup_checkout_completed_at, stripe_subscription_id, subscription_status"
    )
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("[Onboarding] Failed to load signup checkout state", error);
    return false;
  }

  if (!profile) return false;

  const plan = (profile.plan as PlatformBillingPlan | null) ?? "professional";
  const signupPlan = (profile.signup_checkout_plan as PlatformBillingPlan | null) ?? null;
  const stripeSecretConfigured = Boolean(process.env.STRIPE_SECRET_KEY?.trim());

  if (stripeSecretConfigured && isSignupLifetimePlan(signupPlan) && !isSignupCheckoutComplete(profile)) {
    return true;
  }

  if (stripeSecretConfigured && requiresSignupCheckout(plan, profile)) {
    return true;
  }

  return false;
}

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

    if (await requiresSignupCheckoutGate(user.id, supabase)) {
      return {
        success: false,
        error: "Please complete Stripe checkout before continuing onboarding.",
      };
    }

    // Handle different steps
    switch (step) {
      case 1: {
        // Profile basics
        let normalizedUsername: string | undefined;
        if (typeof data.username === "string" && data.username.trim().length > 0) {
          const result = normalizeAndValidateUsernameSlug(data.username);
          if (!result.valid) {
            return { success: false, error: result.error || "Invalid username" };
          }
          normalizedUsername = result.normalized;
        }

        const { error } = await supabase
          .from("profiles")
          .update({
            full_name: data.full_name,
            username: normalizedUsername ?? data.username,
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
        // Languages and currency - services are now managed separately by the UI
        // Check if we have service data (for backwards compatibility)
        if (data.service?.name) {
          // Legacy flow: use atomic RPC function
          const rpcParams = {
            p_user_id: user.id,
            p_languages_taught: data.languages_taught || [],
            p_booking_currency: data.currency?.toUpperCase() || "USD",
            p_service_name: data.service.name,
            p_service_duration: data.service.duration_minutes || null,
            p_service_price: Math.round(data.service.price * 100),
            p_service_currency: data.service.currency?.toUpperCase() || null,
            p_offer_type: data.service.offer_type ?? "one_off",
          };

          const { data: result, error: rpcError } = await supabase.rpc("save_onboarding_step_3", rpcParams);

          if (rpcError) {
            console.error("[Onboarding Step 3] RPC error:", rpcError);
            throw rpcError;
          }

          if (result === null || result === undefined) {
            console.error("[Onboarding Step 3] RPC returned null/undefined result");
            return { success: false, error: "Failed to save - please try again" };
          }

          if (result.success === false) {
            console.error("[Onboarding Step 3] RPC returned failure:", result.error);
            return { success: false, error: result.error || "Failed to save languages and service" };
          }
        } else {
          // New flow: services managed separately, just update profile
          const { error } = await supabase
            .from("profiles")
            .update({
              languages_taught: data.languages_taught || [],
              booking_currency: data.currency?.toUpperCase() || "USD",
              onboarding_step: 3,
            })
            .eq("id", user.id);

          if (error) throw error;
        }
        break;
      }

      case 4: {
        // Availability - use atomic RPC function
        // Convert day names to numbers for the RPC payload
        const availabilityPayload = data.availability?.map((slot) => ({
          day_of_week: DAY_NAME_TO_NUMBER[slot.day_of_week.toLowerCase()] ?? 1,
          start_time: slot.start_time,
          end_time: slot.end_time,
        })) || [];

        const { data: result, error: rpcError } = await supabase.rpc("save_onboarding_step_4", {
          p_user_id: user.id,
          p_availability: availabilityPayload,
        });

        if (rpcError) throw rpcError;
        if (result && !result.success) {
          return { success: false, error: result.error || "Failed to save availability" };
        }
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
        } else if (data.video_provider === "microsoft_teams" && data.video_url) {
          videoUpdateData.microsoft_teams_link = data.video_url;
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

    // Note: revalidatePath removed - onboarding is linear, client manages state
    // Revalidation only needed in completeOnboarding()
    return { success: true };
  } catch (error) {
    console.error(`Error saving onboarding step ${step}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An error occurred",
    };
  }
}

/**
 * Get checkout URL for paid plans after onboarding completion.
 * Returns null if:
 * - User is on free plan
 * - User has lifetime plan
 * - Stripe is not configured (creates local trial instead)
 */
async function getPostOnboardingCheckoutUrl(userId: string, userEmail: string, fullName?: string): Promise<string | null> {
  const supabase = await createClient();
  const adminClient = createServiceRoleClient();

  // Get user's selected plan from auth metadata
  const { data: { user } } = await supabase.auth.getUser();
  const plan = user?.user_metadata?.plan as PlatformBillingPlan | undefined;

  if (!plan) return null;

  // Skip checkout for free or lifetime plans
  const skipCheckoutPlans: PlatformBillingPlan[] = [
    "professional",
    "tutor_life",
    "studio_life",
    "founder_lifetime",
    "all_access",
  ];

  if (skipCheckoutPlans.includes(plan)) {
    return null;
  }

  // Check if Stripe is configured
  if (!isStripeConfigured()) {
    // Create local trial instead
    await createLocalTrial(userId, plan);
    return null;
  }

  // Map plan to Stripe price ID
  const priceId =
    plan === "pro_monthly"
      ? process.env.STRIPE_PRO_MONTHLY_PRICE_ID
      : plan === "pro_annual"
        ? process.env.STRIPE_PRO_ANNUAL_PRICE_ID
        : plan === "studio_monthly"
          ? process.env.STRIPE_STUDIO_MONTHLY_PRICE_ID
          : plan === "studio_annual"
            ? process.env.STRIPE_STUDIO_ANNUAL_PRICE_ID
            : null;

  if (!priceId) {
    console.warn("[Onboarding] Missing Stripe price ID for plan", plan);
    await createLocalTrial(userId, plan);
    return null;
  }

  const trialPeriodDays = getTrialDays(plan);
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://tutorlingua.co").replace(/\/$/, "");
  const successUrl = `${appUrl}/onboarding?subscription=success`;
  const cancelUrl = `${appUrl}/onboarding?subscription=cancel`;

  try {
    const customer = await getOrCreateStripeCustomer({
      userId,
      email: userEmail,
      name: fullName,
      metadata: { profileId: userId },
    });

    // Store customer ID on profile
    if (adminClient) {
      await adminClient
        .from("profiles")
        .update({ stripe_customer_id: customer.id })
        .eq("id", userId);
    }

    const idempotencyKey = `onboarding-checkout:${userId}:${plan}`;
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      mode: "subscription",
      allow_promotion_codes: true,
      success_url: successUrl,
      cancel_url: cancelUrl,
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: trialPeriodDays,
      },
      metadata: {
        userId,
        plan,
        source: "post_onboarding",
      },
    }, { idempotencyKey });

    return session.url ?? null;
  } catch (error) {
    console.error("[Onboarding] Failed to create checkout session", error);
    // Fall back to local trial
    await createLocalTrial(userId, plan);
    return null;
  }
}

export async function completeOnboarding(): Promise<{
  success: boolean;
  error?: string;
  redirectTo?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    if (await requiresSignupCheckoutGate(user.id, supabase)) {
      return {
        success: false,
        error: "Please complete Stripe checkout before finishing onboarding.",
      };
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

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error completing onboarding:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An error occurred",
    };
  }
}

export async function finalizeOnboardingAfterCheckout(): Promise<{
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

    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("id", user.id)
      .single();

    const plan =
      (profile?.plan as PlatformBillingPlan | null) ?? "professional";

    if (!hasProAccess(plan)) {
      return { success: false, error: "Subscription not active yet" };
    }

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
    console.error("Error finalizing onboarding:", error);
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
