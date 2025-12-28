import type Stripe from "stripe";
import type { User } from "@supabase/supabase-js";
import { stripe, getOrCreateStripeCustomer } from "@/lib/stripe";
import { recordSystemEvent, recordSystemMetric } from "@/lib/monitoring";
import type { ServiceRoleClient } from "@/lib/supabase/admin";
import type { PlatformBillingPlan } from "@/lib/types/payments";

export const SIGNUP_CHECKOUT_FLOW = "tutor_signup";

export const SIGNUP_CHECKOUT_STATUSES = ["open", "complete", "expired", "canceled"] as const;
export type SignupCheckoutStatus = typeof SIGNUP_CHECKOUT_STATUSES[number];

type SignupCheckoutProfile = {
  stripe_subscription_id?: string | null;
  subscription_status?: string | null;
  signup_checkout_session_id?: string | null;
  signup_checkout_status?: SignupCheckoutStatus | null;
  signup_checkout_expires_at?: string | null;
  signup_checkout_completed_at?: string | null;
};

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["active", "trialing"]);

export function resolveSignupPriceId(plan: PlatformBillingPlan): string | null {
  if (plan === "pro_monthly") {
    return process.env.STRIPE_PRO_MONTHLY_PRICE_ID?.trim() ?? null;
  }
  if (plan === "pro_annual") {
    return process.env.STRIPE_PRO_ANNUAL_PRICE_ID?.trim() ?? null;
  }
  if (plan === "studio_monthly") {
    return process.env.STRIPE_STUDIO_MONTHLY_PRICE_ID?.trim() ?? null;
  }
  if (plan === "studio_annual") {
    return process.env.STRIPE_STUDIO_ANNUAL_PRICE_ID?.trim() ?? null;
  }
  return null;
}

export function normalizeSignupCheckoutStatus(
  status: Stripe.Checkout.Session.Status | null | undefined
): SignupCheckoutStatus {
  switch (status) {
    case "open":
      return "open";
    case "complete":
      return "complete";
    case "expired":
      return "expired";
    default:
      return "canceled";
  }
}

// Buffer time before actual expiration to avoid race conditions
// If a session expires within this window, treat it as expired to avoid
// redirecting users to Stripe only to see "session expired" error
const EXPIRATION_BUFFER_MS = 5 * 60 * 1000; // 5 minutes

export function isSignupCheckoutExpired(expiresAt: string | null | undefined, now = new Date()): boolean {
  if (!expiresAt) return false;
  const parsed = new Date(expiresAt);
  if (Number.isNaN(parsed.getTime())) return false;
  // Add buffer - treat as expired if within 5 minutes of expiration
  return parsed.getTime() <= now.getTime() + EXPIRATION_BUFFER_MS;
}

function hasActiveSubscription(profile: SignupCheckoutProfile | null): boolean {
  if (!profile) return false;
  if (profile.stripe_subscription_id) return true;
  if (profile.subscription_status && ACTIVE_SUBSCRIPTION_STATUSES.has(profile.subscription_status)) {
    return true;
  }
  return false;
}

async function updateSignupCheckoutProfile(params: {
  adminClient: ServiceRoleClient;
  userId: string;
  updates: Partial<{
    stripe_customer_id: string | null;
    signup_checkout_session_id: string | null;
    signup_checkout_status: SignupCheckoutStatus | null;
    signup_checkout_plan: PlatformBillingPlan | null;
    signup_checkout_started_at: string | null;
    signup_checkout_expires_at: string | null;
    signup_checkout_completed_at: string | null;
  }>;
}) {
  const { adminClient, userId, updates } = params;

  const { error } = await adminClient
    .from("profiles")
    .update({ ...updates })
    .eq("id", userId);

  if (error) {
    console.error("[Signup Checkout] Failed to update profile checkout state", error);
    void recordSystemEvent({
      source: "signup_checkout",
      level: "warn",
      message: "Failed to update signup checkout profile state",
      meta: { userId, error: error.message },
      sampleRate: 0.25,
    });
  }
}

export async function ensureSignupCheckoutSession(params: {
  user: User;
  plan: PlatformBillingPlan;
  priceId: string;
  trialPeriodDays: number;
  successUrl: string;
  cancelUrl: string;
  fullName?: string | null;
  adminClient: ServiceRoleClient | null;
  context?: string;
}): Promise<string | null> {
  const {
    user,
    plan,
    priceId,
    trialPeriodDays,
    successUrl,
    cancelUrl,
    fullName,
    adminClient,
    context,
  } = params;

  const now = new Date();
  let profile: SignupCheckoutProfile | null = null;

  if (adminClient) {
    const { data } = await adminClient
      .from("profiles")
      .select(
        "stripe_subscription_id, subscription_status, signup_checkout_session_id, signup_checkout_status, signup_checkout_expires_at, signup_checkout_completed_at"
      )
      .eq("id", user.id)
      .maybeSingle();

    profile = data as SignupCheckoutProfile | null;
  }

  if (hasActiveSubscription(profile)) {
    return null;
  }

  if (profile?.signup_checkout_status === "complete" || profile?.signup_checkout_completed_at) {
    return null;
  }

  if (
    adminClient &&
    profile?.signup_checkout_session_id &&
    profile.signup_checkout_status === "open"
  ) {
    if (isSignupCheckoutExpired(profile.signup_checkout_expires_at, now)) {
      await updateSignupCheckoutProfile({
        adminClient,
        userId: user.id,
        updates: {
          signup_checkout_status: "expired",
        },
      });
    } else {
      try {
        const existingSession = await stripe.checkout.sessions.retrieve(
          profile.signup_checkout_session_id
        );
        const status = normalizeSignupCheckoutStatus(existingSession.status);
        const expiresAt = existingSession.expires_at
          ? new Date(existingSession.expires_at * 1000).toISOString()
          : profile.signup_checkout_expires_at ?? null;

        await updateSignupCheckoutProfile({
          adminClient,
          userId: user.id,
          updates: {
            signup_checkout_status: status,
            signup_checkout_expires_at: expiresAt,
            signup_checkout_completed_at:
              status === "complete" ? now.toISOString() : profile.signup_checkout_completed_at ?? null,
          },
        });

        if (status === "open" && existingSession.url) {
          void recordSystemMetric({
            metric: "signup_checkout:reused",
            value: 1,
            sampleRate: 0.25,
          });
          return existingSession.url;
        }

        if (status === "complete") {
          return null;
        }
      } catch (error) {
        console.error("[Signup Checkout] Failed to retrieve existing session", error);
        void recordSystemEvent({
          source: "signup_checkout",
          level: "warn",
          message: "Failed to retrieve existing signup checkout session",
          meta: { userId: user.id, sessionId: profile.signup_checkout_session_id, context },
          sampleRate: 0.25,
        });
      }
    }
  }

  const customer = await getOrCreateStripeCustomer({
    userId: user.id,
    email: user.email ?? "",
    name: fullName ?? (user.user_metadata?.full_name as string | undefined),
    metadata: { profileId: user.id },
  });

  const session = await stripe.checkout.sessions.create({
    customer: customer.id,
    mode: "subscription",
    payment_method_collection: "always",
    allow_promotion_codes: true,
    success_url: successUrl,
    cancel_url: cancelUrl,
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: {
      trial_period_days: trialPeriodDays,
    },
    metadata: {
      userId: user.id,
      plan,
      flow: SIGNUP_CHECKOUT_FLOW,
    },
  });

  if (adminClient) {
    await updateSignupCheckoutProfile({
      adminClient,
      userId: user.id,
      updates: {
        stripe_customer_id: customer.id,
        signup_checkout_session_id: session.id,
        signup_checkout_status: normalizeSignupCheckoutStatus(session.status),
        signup_checkout_plan: plan,
        signup_checkout_started_at: now.toISOString(),
        signup_checkout_expires_at: session.expires_at
          ? new Date(session.expires_at * 1000).toISOString()
          : null,
      },
    });
  } else {
    void recordSystemEvent({
      source: "signup_checkout",
      level: "warn",
      message: "Signup checkout session created without admin client",
      meta: { userId: user.id, context },
      sampleRate: 0.25,
    });
  }

  void recordSystemMetric({
    metric: "signup_checkout:created",
    value: 1,
    sampleRate: 0.25,
  });

  return session.url ?? null;
}
