import { NextResponse, type NextRequest } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type FlowType = "payment_method_update" | "subscription_update" | "subscription_cancel";

export async function POST(request: NextRequest) {
  try {
    // Parse optional flow type from body
    let flowType: FlowType | undefined;
    try {
      const body = await request.json();
      if (body.flowType && ["payment_method_update", "subscription_update", "subscription_cancel"].includes(body.flowType)) {
        flowType = body.flowType as FlowType;
      }
    } catch {
      // No body or invalid JSON - proceed without flow type
    }

    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile with Stripe customer ID
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    if (!profile.stripe_customer_id) {
      return NextResponse.json(
        { error: "No Stripe customer found" },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const returnUrl = `${baseUrl}/settings/billing`;

    // Build portal session params
    const sessionParams: Stripe.BillingPortal.SessionCreateParams = {
      customer: profile.stripe_customer_id,
      return_url: returnUrl,
    };

    // Add flow_data for specific actions if requested
    if (flowType) {
      // Get subscription ID if needed for subscription flows
      if (flowType === "subscription_update" || flowType === "subscription_cancel") {
        const subscriptions = await stripe.subscriptions.list({
          customer: profile.stripe_customer_id,
          status: "active",
          limit: 1,
        });

        const subscriptionId = subscriptions.data[0]?.id;
        if (subscriptionId) {
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
        }
      } else if (flowType === "payment_method_update") {
        sessionParams.flow_data = {
          type: "payment_method_update",
        };
      }
    }

    // Add configuration if available
    const configurationId = process.env.STRIPE_BILLING_PORTAL_CONFIGURATION_ID;
    if (configurationId) {
      sessionParams.configuration = configurationId;
    }

    // Create billing portal session
    const session = await stripe.billingPortal.sessions.create(sessionParams);

    return NextResponse.json({
      url: session.url,
      flowType: flowType || null,
    });
  } catch (error) {
    console.error("Error creating billing portal session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
