/**
 * Unified Plan Change API
 *
 * Single endpoint for all plan transitions:
 * - New subscriptions
 * - Upgrades (with proration)
 * - Downgrades (at period end)
 * - Lifetime purchases
 * - Cancellations
 */

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { enforceCheckoutRateLimit } from "@/lib/payments/checkout-rate-limit";
import {
  changePlan,
  createSubscriptionCheckout,
  getBillingPortalUrl,
  getPlanTransition,
} from "@/lib/services/checkout-agent";
import type { PlatformBillingPlan } from "@/lib/types/payments";

const VALID_PLANS: PlatformBillingPlan[] = [
  "professional",
  "pro_monthly",
  "pro_annual",
  "tutor_life",
  "studio_monthly",
  "studio_annual",
  "studio_life",
];

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    let targetPlan: PlatformBillingPlan;
    try {
      const body = await request.json();
      targetPlan = body.targetPlan;

      if (!targetPlan || !VALID_PLANS.includes(targetPlan)) {
        return NextResponse.json(
          { error: "Invalid target plan", validPlans: VALID_PLANS },
          { status: 400 }
        );
      }
    } catch {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    // Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limiting
    const supabaseAdmin = createServiceRoleClient();
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Service unavailable" },
        { status: 503 }
      );
    }

    const rateLimitResult = await enforceCheckoutRateLimit({
      supabaseAdmin,
      userId: user.id,
      req: request,
      keyPrefix: "checkout:plan_change",
      limit: 5,
      windowSeconds: 60,
    });

    if (!rateLimitResult.ok) {
      return NextResponse.json(
        { error: rateLimitResult.error || "Too many requests" },
        { status: rateLimitResult.status ?? 429 }
      );
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, email, full_name, plan, stripe_customer_id")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      console.error("[PlanChange] Failed to load profile:", profileError);
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    const currentPlan = (profile.plan as PlatformBillingPlan) || "professional";

    // Check if this is a no-op (same plan)
    if (currentPlan === targetPlan) {
      return NextResponse.json({
        action: "no_change",
        currentPlan,
        message: "You are already on this plan",
      });
    }

    // Get transition details
    const transition = getPlanTransition(currentPlan, targetPlan);

    // Build URLs
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tutorlingua.co";
    const baseUrl = appUrl.replace(/\/$/, "");
    const successUrl = `${baseUrl}/settings/billing?checkout=success&plan=${targetPlan}`;
    const cancelUrl = `${baseUrl}/settings/billing?checkout=cancelled`;

    // Execute the plan change
    const result = await changePlan({
      userId: user.id,
      email: user.email || profile.email,
      customerId: profile.stripe_customer_id || undefined,
      newPlan: targetPlan,
      successUrl,
      cancelUrl,
    });

    // Return appropriate response based on result
    if (result.action === "error") {
      console.error("[PlanChange] Error:", result.error);
      return NextResponse.json(
        { error: result.error || "Failed to process plan change" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ...result,
      transition: {
        from: currentPlan,
        to: targetPlan,
        strategy: transition.strategy,
        proration: transition.proration,
        effectiveAt: transition.effectiveAt,
      },
    });
  } catch (error) {
    console.error("[PlanChange] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET - Get current plan info and available transitions
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("plan, subscription_status, tier")
      .eq("id", user.id)
      .single();

    const currentPlan = (profile?.plan as PlatformBillingPlan) || "professional";

    // Build available transitions
    const availableTransitions = VALID_PLANS.filter(p => p !== currentPlan).map(targetPlan => {
      const transition = getPlanTransition(currentPlan, targetPlan);
      return {
        targetPlan,
        strategy: transition.strategy,
        proration: transition.proration,
        effectiveAt: transition.effectiveAt,
        isUpgrade: transition.proration === "create_prorations",
      };
    });

    return NextResponse.json({
      currentPlan,
      subscriptionStatus: profile?.subscription_status,
      tier: profile?.tier,
      availableTransitions,
    });
  } catch (error) {
    console.error("[PlanChange] GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
