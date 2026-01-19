import Stripe from "stripe";
import type { ServiceRoleClient } from "../utils/types";
import { LIFETIME_PLANS } from "../utils/types";
import { getPlanDbTier } from "@/lib/payments/subscriptions";
import { SIGNUP_CHECKOUT_FLOW } from "@/lib/services/signup-checkout";

/**
 * Handles lifetime plan purchases.
 * Returns true if the session was a lifetime purchase and was handled.
 */
export async function handleLifetimePurchase(
  session: Stripe.Checkout.Session,
  supabase: ServiceRoleClient
): Promise<boolean> {
  const sessionPlan = session.metadata?.plan;
  const isLifetime =
    sessionPlan && LIFETIME_PLANS.includes(sessionPlan as (typeof LIFETIME_PLANS)[number]);

  if (!isLifetime) return false;

  const planToApply = sessionPlan as string;
  const profileIdFromMetadata = session.metadata?.userId;
  if (profileIdFromMetadata) {
    await applyLifetimePlanToProfile(session, supabase, profileIdFromMetadata, planToApply);
    return true;
  }

  await applyLifetimePlanByEmail(session, supabase, planToApply);
  return true;
}

async function applyLifetimePlanToProfile(
  session: Stripe.Checkout.Session,
  supabase: ServiceRoleClient,
  profileId: string,
  planToApply: string
): Promise<void> {
  const tierToApply = getPlanDbTier(planToApply as any);

  const { error } = await supabase
    .from("profiles")
    .update({
      plan: planToApply,
      tier: tierToApply,
      subscription_status: "lifetime",
      updated_at: new Date().toISOString(),
    })
    .eq("id", profileId);

  if (error) {
    console.error("Failed to apply lifetime purchase:", error);
    throw error;
  }

  if (session.metadata?.flow === SIGNUP_CHECKOUT_FLOW) {
    const { error: signupCheckoutError } = await supabase
      .from("profiles")
      .update({
        signup_checkout_session_id: session.id,
        signup_checkout_status: "complete",
        signup_checkout_plan: planToApply,
        signup_checkout_completed_at: new Date().toISOString(),
        signup_checkout_expires_at: session.expires_at
          ? new Date(session.expires_at * 1000).toISOString()
          : null,
      })
      .eq("id", profileId);

    if (signupCheckoutError) {
      console.error("Failed to update lifetime signup checkout status:", signupCheckoutError);
    }
  }

  console.log(`✅ Lifetime purchased for profile ${profileId} (${planToApply})`);
}

async function applyLifetimePlanByEmail(
  session: Stripe.Checkout.Session,
  supabase: ServiceRoleClient,
  planToApply: string
): Promise<void> {
  const customerEmail = session.customer_email || session.metadata?.customer_email;
  if (!customerEmail) return;

  const acquisitionSource = session.metadata?.source || "unknown";
  const normalizedEmail = customerEmail.toLowerCase();

  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id, plan")
    .eq("email", normalizedEmail)
    .single();

  if (existingProfile) {
    const tierToApply = getPlanDbTier(planToApply as any);
    const previousPlan = existingProfile.plan || "professional";

    const { error } = await supabase
      .from("profiles")
      .update({
        plan: planToApply,
        tier: tierToApply,
        subscription_status: "lifetime",
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingProfile.id);

    if (error) {
      console.error("Failed to update lifetime purchase for existing profile:", error);
      throw error;
    }

    await supabase.from("plan_change_history").insert({
      tutor_id: existingProfile.id,
      previous_plan: previousPlan,
      new_plan: planToApply,
      change_type: "lifetime_purchase",
      checkout_session_id: session.id,
    });

    console.log(
      `✅ Lifetime purchased for existing profile ${existingProfile.id} (${planToApply}) (source: ${acquisitionSource})`
    );
    return;
  }

  const { error } = await supabase
    .from("lifetime_purchases")
    .upsert(
      {
        email: normalizedEmail,
        stripe_session_id: session.id,
        stripe_customer_id: session.customer as string,
        amount_paid: session.amount_total,
        currency: session.currency,
        plan: planToApply,
        source: acquisitionSource,
        purchased_at: new Date().toISOString(),
        claimed: false,
      },
      {
        onConflict: "email",
      }
    );

  if (error) {
    console.error("Failed to store lifetime purchase:", error);
  }
  console.log(
    `✅ Lifetime purchase stored for ${normalizedEmail} (${planToApply}) (source: ${acquisitionSource})`
  );
}
