import Stripe from "stripe";
import type { ServiceRoleClient } from "../utils/types";
import { SIGNUP_CHECKOUT_FLOW } from "@/lib/services/signup-checkout";
import { recordSystemMetric } from "@/lib/monitoring";

/**
 * Handles signup checkout sessions.
 * Returns true if the session was a signup checkout and was handled.
 */
export async function handleSignupCheckout(
  session: Stripe.Checkout.Session,
  supabase: ServiceRoleClient
): Promise<boolean> {
  const signupFlow = session.metadata?.flow === SIGNUP_CHECKOUT_FLOW;
  const signupUserId = session.metadata?.userId;
  if (!signupFlow || !signupUserId) return false;

  const updatePayload: Record<string, any> = {
    signup_checkout_session_id: session.id,
    signup_checkout_status: "complete",
    signup_checkout_plan: session.metadata?.plan ?? null,
    signup_checkout_completed_at: new Date().toISOString(),
    signup_checkout_expires_at: session.expires_at
      ? new Date(session.expires_at * 1000).toISOString()
      : null,
  };

  if (typeof session.customer === "string") {
    updatePayload.stripe_customer_id = session.customer;
  }

  const { error } = await supabase
    .from("profiles")
    .update(updatePayload)
    .eq("id", signupUserId);

  if (error) {
    console.error("Failed to update signup checkout status:", error);
  } else {
    void recordSystemMetric({
      metric: "signup_checkout:completed",
      value: 1,
      sampleRate: 0.25,
    });
  }

  return true;
}

/**
 * Handles expired checkout sessions.
 * Updates signup checkout status when a session expires without completion.
 */
export async function handleCheckoutSessionExpired(
  session: Stripe.Checkout.Session,
  supabase: ServiceRoleClient
): Promise<void> {
  const signupFlow = session.metadata?.flow === SIGNUP_CHECKOUT_FLOW;
  const signupUserId = session.metadata?.userId;

  if (!signupFlow || !signupUserId) {
    // Not a signup checkout session, ignore
    return;
  }

  // Update the profile to mark the checkout as expired
  const { error } = await supabase
    .from("profiles")
    .update({
      signup_checkout_status: "expired",
      signup_checkout_expires_at: new Date().toISOString(),
    })
    .eq("id", signupUserId)
    .eq("signup_checkout_session_id", session.id); // Only update if this is their current session

  if (error) {
    console.error("Failed to mark signup checkout as expired:", error);
    // Don't throw - this is non-critical
    return;
  }

  void recordSystemMetric({
    metric: "signup_checkout:expired",
    value: 1,
    sampleRate: 0.25,
  });

  console.log(`✅ Signup checkout session ${session.id} marked as expired for user ${signupUserId}`);
}
