/**
 * Checkout Agent Service
 *
 * Centralized service for all Stripe checkout and plan transition operations.
 * Optimized for speed and robustness with proper proration handling.
 */

import Stripe from "stripe";
import { stripe, getOrCreateStripeCustomer } from "@/lib/stripe";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import type { PlatformBillingPlan } from "@/lib/types/payments";
import { getPlanTier, getPlanDbTier, mapPriceIdToPlan } from "@/lib/payments/subscriptions";

// Extended Subscription type that includes period dates
type SubscriptionWithPeriod = Stripe.Subscription & {
  current_period_start: number;
  current_period_end: number;
};

// ============================================================================
// Types
// ============================================================================

export type TransitionStrategy =
  | "new_subscription"    // Create new checkout session for subscription
  | "update_subscription" // Update existing subscription in-place
  | "one_time_payment"    // Create checkout for lifetime deal
  | "cancel";             // Cancel subscription

export type ProrationBehavior = "create_prorations" | "none" | "always_invoice";

export type EffectiveAt = "immediate" | "period_end";

export interface PlanTransition {
  fromPlan: PlatformBillingPlan;
  toPlan: PlatformBillingPlan;
  strategy: TransitionStrategy;
  proration: ProrationBehavior;
  effectiveAt: EffectiveAt;
}

export interface CheckoutResult {
  action: "checkout" | "updated" | "scheduled" | "portal" | "cancelled" | "error";
  url?: string;
  newPlan?: PlatformBillingPlan;
  effectiveDate?: string;
  message?: string;
  error?: string;
}

export interface CustomerCache {
  customerId: string;
  verifiedAt: Date;
}

// ============================================================================
// Plan Configuration
// ============================================================================

const PRICE_ID_MAP: Record<string, string | undefined> = {
  pro_monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
  pro_annual: process.env.STRIPE_PRO_ANNUAL_PRICE_ID,
  tutor_life: process.env.STRIPE_PRO_LIFETIME_PRICE_ID,
  studio_monthly: process.env.STRIPE_STUDIO_MONTHLY_PRICE_ID,
  studio_annual: process.env.STRIPE_STUDIO_ANNUAL_PRICE_ID,
  studio_life: process.env.STRIPE_STUDIO_LIFETIME_PRICE_ID,
};

const TRIAL_DAYS: Record<string, number> = {
  pro_monthly: 7,
  pro_annual: 14,
  studio_monthly: 7,
  studio_annual: 14,
};

// Lifetime plans that should cancel any existing subscription
const LIFETIME_PLANS: PlatformBillingPlan[] = ["tutor_life", "studio_life", "founder_lifetime"];

// Subscription plans that can be updated
const SUBSCRIPTION_PLANS: PlatformBillingPlan[] = [
  "pro_monthly", "pro_annual", "studio_monthly", "studio_annual"
];

// ============================================================================
// Plan Transition Matrix
// ============================================================================

/**
 * Determines the transition strategy for changing from one plan to another.
 * Returns the optimal strategy, proration behavior, and when changes take effect.
 */
export function getPlanTransition(
  fromPlan: PlatformBillingPlan,
  toPlan: PlatformBillingPlan
): PlanTransition {
  // Same plan - no change needed
  if (fromPlan === toPlan) {
    return {
      fromPlan,
      toPlan,
      strategy: "update_subscription",
      proration: "none",
      effectiveAt: "immediate",
    };
  }

  // To lifetime - always one-time payment
  if (LIFETIME_PLANS.includes(toPlan)) {
    return {
      fromPlan,
      toPlan,
      strategy: "one_time_payment",
      proration: "none",
      effectiveAt: "immediate",
    };
  }

  // To free tier - cancel subscription
  if (toPlan === "professional") {
    return {
      fromPlan,
      toPlan,
      strategy: "cancel",
      proration: "none",
      effectiveAt: "period_end",
    };
  }

  // From free tier - new subscription
  if (fromPlan === "professional") {
    return {
      fromPlan,
      toPlan,
      strategy: "new_subscription",
      proration: "none",
      effectiveAt: "immediate",
    };
  }

  // From lifetime - new subscription (lifetime doesn't have active sub to update)
  if (LIFETIME_PLANS.includes(fromPlan)) {
    return {
      fromPlan,
      toPlan,
      strategy: "new_subscription",
      proration: "none",
      effectiveAt: "immediate",
    };
  }

  // Subscription to subscription changes
  const fromTier = getPlanTier(fromPlan);
  const toTier = getPlanTier(toPlan);
  const isUpgrade = isUpgradePath(fromPlan, toPlan);
  const isBillingCycleChange = isSameTierBillingChange(fromPlan, toPlan);

  // Upgrade: Pro → Studio OR monthly → annual (same tier)
  if (isUpgrade) {
    return {
      fromPlan,
      toPlan,
      strategy: "update_subscription",
      proration: "create_prorations",
      effectiveAt: "immediate",
    };
  }

  // Downgrade: Studio → Pro OR annual → monthly (same tier)
  return {
    fromPlan,
    toPlan,
    strategy: "update_subscription",
    proration: "none",
    effectiveAt: "period_end",
  };
}

/**
 * Determines if a plan change is an upgrade (user pays more).
 */
function isUpgradePath(fromPlan: PlatformBillingPlan, toPlan: PlatformBillingPlan): boolean {
  const fromTier = getPlanTier(fromPlan);
  const toTier = getPlanTier(toPlan);

  // Studio is higher tier than Pro
  if (fromTier === "pro" && toTier === "studio") return true;

  // Same tier but going to annual (higher value)
  if (fromTier === toTier) {
    const monthlyPlans = ["pro_monthly", "studio_monthly"];
    const annualPlans = ["pro_annual", "studio_annual"];
    if (monthlyPlans.includes(fromPlan) && annualPlans.includes(toPlan)) {
      return true;
    }
  }

  return false;
}

/**
 * Checks if the change is just a billing cycle change within the same tier.
 */
function isSameTierBillingChange(
  fromPlan: PlatformBillingPlan,
  toPlan: PlatformBillingPlan
): boolean {
  const fromTier = getPlanTier(fromPlan);
  const toTier = getPlanTier(toPlan);
  return fromTier === toTier && fromTier !== "free";
}

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Get or create a Stripe customer with caching optimization.
 * Uses database cache to avoid unnecessary Stripe API calls.
 */
export async function getCachedStripeCustomer(params: {
  userId: string;
  email: string;
  name?: string;
}): Promise<{ customerId: string; fromCache: boolean }> {
  const { userId, email, name } = params;
  const supabase = createServiceRoleClient();

  if (!supabase) {
    // Fallback to direct Stripe call
    const customer = await getOrCreateStripeCustomer({ userId, email, name });
    return { customerId: customer.id, fromCache: false };
  }

  // Check if we have a cached and recently verified customer ID
  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id, stripe_customer_id_verified_at")
    .eq("id", userId)
    .single();

  const now = new Date();
  const verifiedAt = profile?.stripe_customer_id_verified_at
    ? new Date(profile.stripe_customer_id_verified_at)
    : null;
  const cacheValidMs = 24 * 60 * 60 * 1000; // 24 hours

  // Use cache if valid
  if (
    profile?.stripe_customer_id &&
    verifiedAt &&
    now.getTime() - verifiedAt.getTime() < cacheValidMs
  ) {
    return { customerId: profile.stripe_customer_id, fromCache: true };
  }

  // Cache miss or expired - get from Stripe and update cache
  const customer = await getOrCreateStripeCustomer({ userId, email, name });

  // Update cache in background (don't await)
  supabase
    .from("profiles")
    .update({
      stripe_customer_id: customer.id,
      stripe_customer_id_verified_at: now.toISOString(),
    })
    .eq("id", userId)
    .then(() => {});

  return { customerId: customer.id, fromCache: false };
}

/**
 * Creates a subscription checkout session for a new subscriber.
 */
export async function createSubscriptionCheckout(params: {
  userId: string;
  email: string;
  name?: string;
  plan: PlatformBillingPlan;
  successUrl: string;
  cancelUrl: string;
}): Promise<CheckoutResult> {
  const { userId, email, name, plan, successUrl, cancelUrl } = params;

  const priceId = PRICE_ID_MAP[plan];
  if (!priceId) {
    return {
      action: "error",
      error: `No price ID configured for plan: ${plan}`,
    };
  }

  try {
    // Get customer (with caching)
    const { customerId } = await getCachedStripeCustomer({ userId, email, name });

    // Check for existing active subscription
    const existingSubs = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    if (existingSubs.data.length > 0) {
      // User already has a subscription - redirect to plan change flow
      return await changePlan({ userId, email, customerId, newPlan: plan, successUrl, cancelUrl });
    }

    // Create new subscription checkout
    const trialDays = TRIAL_DAYS[plan] || 0;

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_collection: "always",
      allow_promotion_codes: true,
      success_url: successUrl,
      cancel_url: cancelUrl,
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: trialDays > 0 ? { trial_period_days: trialDays } : undefined,
      metadata: {
        userId,
        plan,
        type: "new_subscription",
      },
    });

    return {
      action: "checkout",
      url: session.url || undefined,
    };
  } catch (error) {
    console.error("[CheckoutAgent] createSubscriptionCheckout error:", error);
    return {
      action: "error",
      error: error instanceof Error ? error.message : "Failed to create checkout session",
    };
  }
}

/**
 * Handles plan changes for existing subscribers.
 * Uses the transition matrix to determine the appropriate action.
 */
export async function changePlan(params: {
  userId: string;
  email: string;
  customerId?: string;
  newPlan: PlatformBillingPlan;
  successUrl: string;
  cancelUrl: string;
}): Promise<CheckoutResult> {
  const { userId, email, newPlan, successUrl, cancelUrl } = params;

  try {
    // Get customer ID if not provided
    let customerId = params.customerId;
    if (!customerId) {
      const cached = await getCachedStripeCustomer({ userId, email });
      customerId = cached.customerId;
    }

    // Get current subscription and plan
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    const supabase = createServiceRoleClient();
    const { data: profile } = await supabase
      ?.from("profiles")
      .select("plan")
      .eq("id", userId)
      .single() ?? { data: null };

    const currentPlan = (profile?.plan as PlatformBillingPlan) || "professional";
    // Cast to SubscriptionWithPeriod since Stripe API includes these fields
    const currentSub = subscriptions.data[0] as SubscriptionWithPeriod | undefined;

    // Determine transition strategy
    const transition = getPlanTransition(currentPlan, newPlan);

    switch (transition.strategy) {
      case "new_subscription":
        return await handleNewSubscription({
          customerId,
          userId,
          plan: newPlan,
          successUrl,
          cancelUrl,
        });

      case "update_subscription":
        if (!currentSub) {
          // No active subscription - create new one
          return await handleNewSubscription({
            customerId,
            userId,
            plan: newPlan,
            successUrl,
            cancelUrl,
          });
        }
        return await handleSubscriptionUpdate({
          subscription: currentSub,
          userId,
          newPlan,
          transition,
        });

      case "one_time_payment":
        return await handleLifetimePurchase({
          customerId,
          userId,
          plan: newPlan,
          successUrl,
          cancelUrl,
          currentSubscriptionId: currentSub?.id,
        });

      case "cancel":
        if (!currentSub) {
          return { action: "cancelled", message: "No active subscription to cancel" };
        }
        return await handleCancellation({
          subscription: currentSub,
          userId,
        });

      default:
        return {
          action: "error",
          error: `Unknown transition strategy: ${transition.strategy}`,
        };
    }
  } catch (error) {
    console.error("[CheckoutAgent] changePlan error:", error);
    return {
      action: "error",
      error: error instanceof Error ? error.message : "Failed to change plan",
    };
  }
}

/**
 * Creates a new subscription checkout session.
 */
async function handleNewSubscription(params: {
  customerId: string;
  userId: string;
  plan: PlatformBillingPlan;
  successUrl: string;
  cancelUrl: string;
}): Promise<CheckoutResult> {
  const { customerId, userId, plan, successUrl, cancelUrl } = params;

  const priceId = PRICE_ID_MAP[plan];
  if (!priceId) {
    return { action: "error", error: `No price ID for plan: ${plan}` };
  }

  const trialDays = TRIAL_DAYS[plan] || 0;

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_collection: "always",
    allow_promotion_codes: true,
    success_url: successUrl,
    cancel_url: cancelUrl,
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: trialDays > 0 ? { trial_period_days: trialDays } : undefined,
    metadata: {
      userId,
      plan,
      type: "new_subscription",
    },
  });

  return {
    action: "checkout",
    url: session.url || undefined,
  };
}

/**
 * Updates an existing subscription in-place.
 */
async function handleSubscriptionUpdate(params: {
  subscription: SubscriptionWithPeriod;
  userId: string;
  newPlan: PlatformBillingPlan;
  transition: PlanTransition;
}): Promise<CheckoutResult> {
  const { subscription, userId, newPlan, transition } = params;

  const priceId = PRICE_ID_MAP[newPlan];
  if (!priceId) {
    return { action: "error", error: `No price ID for plan: ${newPlan}` };
  }

  const currentItem = subscription.items.data[0];
  if (!currentItem) {
    return { action: "error", error: "No subscription item found" };
  }

  // Determine proration behavior
  let prorationBehavior: Stripe.SubscriptionUpdateParams.ProrationBehavior;
  if (transition.proration === "create_prorations") {
    prorationBehavior = "create_prorations";
  } else if (transition.proration === "always_invoice") {
    prorationBehavior = "always_invoice";
  } else {
    prorationBehavior = "none";
  }

  // For downgrades that take effect at period end, use billing_cycle_anchor
  const updateParams: Stripe.SubscriptionUpdateParams = {
    items: [{ id: currentItem.id, price: priceId }],
    proration_behavior: prorationBehavior,
    metadata: {
      ...subscription.metadata,
      previousPlan: mapPriceIdToPlan(currentItem.price.id),
      newPlan,
      changedAt: new Date().toISOString(),
    },
  };

  // For period-end changes (downgrades), schedule the change
  if (transition.effectiveAt === "period_end") {
    // Use subscription schedules for deferred changes
    const schedule = await stripe.subscriptionSchedules.create({
      from_subscription: subscription.id,
    });

    // Update the schedule to change at next period
    await stripe.subscriptionSchedules.update(schedule.id, {
      phases: [
        {
          items: [{ price: currentItem.price.id, quantity: 1 }],
          start_date: schedule.phases[0].start_date,
          end_date: subscription.current_period_end,
        },
        {
          items: [{ price: priceId, quantity: 1 }],
          start_date: subscription.current_period_end,
        },
      ],
    });

    // Record the plan change
    await recordPlanChange({
      userId,
      previousPlan: transition.fromPlan,
      newPlan,
      changeType: "subscription",
      prorationBehavior: transition.proration,
    });

    return {
      action: "scheduled",
      newPlan,
      effectiveDate: new Date(subscription.current_period_end * 1000).toISOString(),
      message: `Your plan will change to ${newPlan} at the end of your current billing period.`,
    };
  }

  // Immediate update
  const updatedSub = await stripe.subscriptions.update(subscription.id, updateParams);

  // Update database
  const supabase = createServiceRoleClient();
  if (supabase) {
    await supabase
      .from("profiles")
      .update({
        plan: newPlan,
        tier: getPlanDbTier(newPlan),
      })
      .eq("id", userId);

    await recordPlanChange({
      userId,
      previousPlan: transition.fromPlan,
      newPlan,
      changeType: "subscription",
      prorationBehavior: transition.proration,
    });
  }

  return {
    action: "updated",
    newPlan,
    message: `Your plan has been updated to ${newPlan}.`,
  };
}

/**
 * Handles lifetime plan purchases.
 */
async function handleLifetimePurchase(params: {
  customerId: string;
  userId: string;
  plan: PlatformBillingPlan;
  successUrl: string;
  cancelUrl: string;
  currentSubscriptionId?: string;
}): Promise<CheckoutResult> {
  const { customerId, userId, plan, successUrl, cancelUrl, currentSubscriptionId } = params;

  const priceId = PRICE_ID_MAP[plan];
  if (!priceId) {
    return { action: "error", error: `No price ID for lifetime plan: ${plan}` };
  }

  // Create one-time payment checkout for lifetime
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "payment",
    payment_method_types: ["card"],
    allow_promotion_codes: true,
    success_url: successUrl,
    cancel_url: cancelUrl,
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: {
      userId,
      plan,
      type: "lifetime_purchase",
      cancelSubscriptionId: currentSubscriptionId || "",
    },
  });

  return {
    action: "checkout",
    url: session.url || undefined,
  };
}

/**
 * Handles subscription cancellation (downgrade to free).
 */
async function handleCancellation(params: {
  subscription: SubscriptionWithPeriod;
  userId: string;
}): Promise<CheckoutResult> {
  const { subscription, userId } = params;

  const currentPriceId = subscription.items.data[0]?.price.id;
  const currentPlan = mapPriceIdToPlan(currentPriceId);

  // Cancel at period end (not immediately)
  await stripe.subscriptions.update(subscription.id, {
    cancel_at_period_end: true,
  });

  // Record the cancellation
  await recordPlanChange({
    userId,
    previousPlan: currentPlan,
    newPlan: "professional",
    changeType: "cancellation",
  });

  return {
    action: "scheduled",
    newPlan: "professional",
    effectiveDate: new Date(subscription.current_period_end * 1000).toISOString(),
    message: "Your subscription will be cancelled at the end of your current billing period.",
  };
}

/**
 * Gets a billing portal URL for self-service management.
 */
export async function getBillingPortalUrl(params: {
  userId: string;
  email: string;
  returnUrl: string;
  flowType?: "payment_method_update" | "subscription_update" | "subscription_cancel";
}): Promise<CheckoutResult> {
  const { userId, email, returnUrl, flowType } = params;

  try {
    const { customerId } = await getCachedStripeCustomer({ userId, email });

    // Get current subscription if flow type requires it
    let subscriptionId: string | undefined;
    if (flowType === "subscription_update" || flowType === "subscription_cancel") {
      const subs = await stripe.subscriptions.list({
        customer: customerId,
        status: "active",
        limit: 1,
      });
      subscriptionId = subs.data[0]?.id;
    }

    const sessionParams: Stripe.BillingPortal.SessionCreateParams = {
      customer: customerId,
      return_url: returnUrl,
    };

    // Add flow_data for specific actions
    if (flowType && subscriptionId) {
      if (flowType === "subscription_update") {
        sessionParams.flow_data = {
          type: "subscription_update",
          subscription_update: {
            subscription: subscriptionId,
          },
        };
      } else if (flowType === "subscription_cancel") {
        sessionParams.flow_data = {
          type: "subscription_cancel",
          subscription_cancel: {
            subscription: subscriptionId,
          },
        };
      }
    } else if (flowType === "payment_method_update") {
      sessionParams.flow_data = {
        type: "payment_method_update",
      };
    }

    const session = await stripe.billingPortal.sessions.create(sessionParams);

    return {
      action: "portal",
      url: session.url,
    };
  } catch (error) {
    console.error("[CheckoutAgent] getBillingPortalUrl error:", error);
    return {
      action: "error",
      error: error instanceof Error ? error.message : "Failed to create portal session",
    };
  }
}

/**
 * Records a plan change in the database for audit purposes.
 */
async function recordPlanChange(params: {
  userId: string;
  previousPlan: PlatformBillingPlan;
  newPlan: PlatformBillingPlan;
  changeType: string;
  stripeEventId?: string;
  prorationBehavior?: string;
  checkoutSessionId?: string;
}): Promise<void> {
  const supabase = createServiceRoleClient();
  if (!supabase) return;

  const { error } = await supabase.from("plan_change_history").insert({
    tutor_id: params.userId,
    previous_plan: params.previousPlan,
    new_plan: params.newPlan,
    change_type: params.changeType,
    stripe_event_id: params.stripeEventId,
    proration_behavior: params.prorationBehavior,
    checkout_session_id: params.checkoutSessionId,
  });

  if (error) {
    console.error("[CheckoutAgent] Failed to record plan change:", error);
  }
}

/**
 * Cancels subscription when a lifetime plan is purchased.
 * Called from webhook after successful lifetime payment.
 */
export async function cancelSubscriptionForLifetime(params: {
  userId: string;
  subscriptionId: string;
  lifetimePlan: PlatformBillingPlan;
}): Promise<void> {
  const { userId, subscriptionId, lifetimePlan } = params;

  try {
    // Cancel immediately (lifetime takes over)
    await stripe.subscriptions.cancel(subscriptionId);

    // Update database
    const supabase = createServiceRoleClient();
    if (supabase) {
      await supabase
        .from("profiles")
        .update({
          plan: lifetimePlan,
          tier: getPlanDbTier(lifetimePlan),
          subscription_status: "lifetime",
        })
        .eq("id", userId);

      console.log(`[CheckoutAgent] Cancelled subscription ${subscriptionId} for lifetime plan ${lifetimePlan}`);
    }
  } catch (error) {
    console.error("[CheckoutAgent] Failed to cancel subscription for lifetime:", error);
    throw error;
  }
}
