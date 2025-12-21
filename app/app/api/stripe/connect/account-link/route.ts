import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";
import { createAccountLink } from "@/lib/services/connect";
import { RateLimiters } from "@/lib/middleware/rate-limit";
import type { StripeConnectErrorCode } from "@/lib/stripe/connect-errors";

type ErrorResponse = {
  error: string;
  code: StripeConnectErrorCode;
  retryable: boolean;
};

function errorResponse(
  message: string,
  code: StripeConnectErrorCode,
  status: number,
  retryable = false
): NextResponse<ErrorResponse> {
  return NextResponse.json({ error: message, code, retryable }, { status });
}

export async function POST(req: NextRequest) {
  try {
    let bodyAccountId: string | null = null;
    let returnContext: "onboarding" | "settings" | undefined;
    try {
      const body = await req.json();
      if (typeof body?.accountId === "string") {
        bodyAccountId = body.accountId;
      }
      if (body?.returnContext === "onboarding" || body?.returnContext === "settings") {
        returnContext = body.returnContext;
      }
    } catch {
      bodyAccountId = null;
      returnContext = undefined;
    }

    // Rate limiting
    const rateLimitResult = await RateLimiters.api(req);
    if (!rateLimitResult.success) {
      return errorResponse(
        rateLimitResult.error || "Too many requests. Please wait a moment.",
        "stripe_rate_limited",
        429,
        true
      );
    }

    // Authentication
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return errorResponse(
        "Please sign in to continue.",
        "unauthenticated",
        401
      );
    }

    // Get accountId from authenticated user's profile (ownership check)
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("stripe_account_id")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("[Stripe Connect] Profile lookup failed:", profileError);
      return errorResponse(
        "Unable to verify your account.",
        "invalid_tutor_id",
        500,
        true
      );
    }

    let accountId = profile?.stripe_account_id ?? null;

    if (accountId && bodyAccountId && bodyAccountId !== accountId) {
      return errorResponse(
        "You can only access your own payment account.",
        "forbidden",
        403
      );
    }

    if (!accountId && bodyAccountId) {
      const account = await stripe.accounts.retrieve(bodyAccountId);
      const metadataTutorId = account?.metadata?.tutor_id ?? null;

      if (metadataTutorId !== user.id) {
        return errorResponse(
          "You can only access your own payment account.",
          "forbidden",
          403
        );
      }

      accountId = bodyAccountId;
      const adminClient = createServiceRoleClient();
      if (!adminClient) {
        return errorResponse(
          "Unable to save your payment account.",
          "admin_client_unavailable",
          500,
          true
        );
      }

      const { error: updateError } = await adminClient
        .from("profiles")
        .update({ stripe_account_id: accountId })
        .eq("id", user.id);

      if (updateError) {
        console.error("[Stripe Connect] Failed to persist account ID:", updateError);
        return errorResponse(
          "Unable to save your payment account.",
          "db_write_failed",
          500,
          true
        );
      }
    }

    if (!accountId) {
      return errorResponse(
        "No payment account found. Please set up Stripe first.",
        "account_not_found",
        400
      );
    }
    // Generate context-aware return URLs
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    let returnUrl: string;
    let refreshUrl: string;

    if (returnContext === "onboarding") {
      // Return to onboarding flow with success indicator
      returnUrl = `${baseUrl}/onboarding?stripe_return=1`;
      refreshUrl = `${baseUrl}/onboarding?stripe_refresh=1`;
    } else {
      // Default: settings page (existing behavior, backward compatible)
      returnUrl = process.env.STRIPE_CONNECT_RETURN_URL || `${baseUrl}/settings/payments`;
      refreshUrl = process.env.STRIPE_CONNECT_REFRESH_URL || `${baseUrl}/settings/payments`;
    }

    const url = await createAccountLink(accountId, refreshUrl, returnUrl);
    return NextResponse.json({ url });
  } catch (error) {
    console.error("[Stripe Connect] Account link creation failed:", error);

    // Check for specific Stripe errors
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (errorMessage.includes("Stripe is not configured")) {
      return errorResponse(
        "Payment service is not configured.",
        "stripe_not_configured",
        500
      );
    }

    if (errorMessage.includes("rate limit") || errorMessage.includes("Too many")) {
      return errorResponse(
        "Too many requests. Please try again in a moment.",
        "stripe_rate_limited",
        429,
        true
      );
    }

    if (errorMessage.includes("No such account") || errorMessage.includes("account")) {
      return errorResponse(
        "Payment account not found or restricted.",
        "account_restricted",
        400
      );
    }

    // Default: transient API error
    return errorResponse(
      "Unable to generate setup link. Please try again.",
      "account_link_failed",
      500,
      true
    );
  }
}
