import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";
import { extractTutorStripeStatus } from "@/lib/payments/connect-status";
import type { StripeConnectErrorCode } from "@/lib/stripe/connect-errors";

type ErrorResponse = {
  error: string;
  code: StripeConnectErrorCode;
  retryable: boolean;
};

type SuccessResponse = {
  url: string;
  accountId: string;
  existingAccount: boolean;
};

function errorResponse(
  message: string,
  code: StripeConnectErrorCode,
  status: number,
  retryable = false
): NextResponse<ErrorResponse> {
  return NextResponse.json({ error: message, code, retryable }, { status });
}

/**
 * Fast Stripe Connect Onboarding Endpoint
 *
 * Combines account creation + link generation into a single call.
 * Optimized for sub-150ms perceived performance with:
 * - Parallel auth + profile validation
 * - Idempotent account creation (reuses existing)
 * - Background saves (fire-and-forget)
 * - Single response with redirect URL
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    // Parse request body
    let tutorId: string;
    try {
      const body = await req.json();
      tutorId = body.tutorId;
    } catch {
      return errorResponse(
        "Invalid request body.",
        "missing_tutor_id",
        400
      );
    }

    if (!tutorId) {
      return errorResponse(
        "Missing tutor ID.",
        "missing_tutor_id",
        400
      );
    }

    // Parallel: Auth validation + profile lookup
    const authClient = await createClient();
    const adminClient = createServiceRoleClient();

    if (!adminClient) {
      return errorResponse(
        "Server configuration error.",
        "admin_client_unavailable",
        500,
        true
      );
    }

    const [authResult, profileResult] = await Promise.all([
      authClient.auth.getUser(),
      adminClient
        .from("profiles")
        .select("id, stripe_account_id, full_name, bio, tagline, website_url")
        .eq("id", tutorId)
        .single()
    ]);

    // Validate auth
    const { data: { user }, error: authError } = authResult;
    if (authError || !user) {
      return errorResponse(
        "Authentication required. Please sign in.",
        "unauthenticated",
        401
      );
    }

    // Security: Verify user owns the tutorId
    if (user.id !== tutorId) {
      return errorResponse(
        "You can only create Connect accounts for your own profile.",
        "forbidden",
        403
      );
    }

    // Validate profile exists
    const { data: profile, error: profileError } = profileResult;
    if (profileError || !profile) {
      return errorResponse(
        "Profile not found.",
        "invalid_tutor_id",
        400
      );
    }

    // Idempotent: Reuse existing account or create new
    let accountId = profile.stripe_account_id;
    const existingAccount = !!accountId;

    if (!accountId) {
      // Parse name for prefilling
      const nameParts = (profile.full_name || "").trim().split(/\s+/);
      const firstName = nameParts[0] || undefined;
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : undefined;
      const userEmail = user.email;

      // Build prefilled params (Stripe ignores empty/undefined fields)
      const accountParams = {
        type: "express" as const,
        email: userEmail,
        business_profile: {
          name: profile.full_name || undefined,
          product_description: profile.bio || profile.tagline || "Language tutoring services",
          url: profile.website_url || undefined,
        },
        individual: {
          email: userEmail,
          first_name: firstName,
          last_name: lastName,
        },
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        metadata: {
          tutor_id: tutorId,
        },
      };

      // Clean undefined values (Stripe doesn't like explicit undefined in nested objects)
      const cleanParams = JSON.parse(JSON.stringify(accountParams));

      // Create new Express account with prefilled data
      const account = await stripe.accounts.create(cleanParams);

      accountId = account.id;

      // Background: Save account ID and initial status (don't await)
      void adminClient
        .from("profiles")
        .update({
          stripe_account_id: accountId,
          ...extractTutorStripeStatus(account as unknown as Record<string, unknown>)
        })
        .eq("id", tutorId)
        .then(({ error }) => {
          if (error) {
            console.error("[Fast Onboard] Background save failed:", error);
          }
        });
    }

    // Generate onboarding link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const returnUrl = `${baseUrl}/onboarding?stripe_return=1`;
    const refreshUrl = `${baseUrl}/onboarding?stripe_refresh=1`;

    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: "account_onboarding",
    });

    // Background: Save onboarding step 7 (don't await)
    void adminClient
      .from("profiles")
      .update({
        onboarding_step: 7,
        payment_method: "stripe"
      })
      .eq("id", tutorId)
      .then(({ error }) => {
        if (error) {
          console.error("[Fast Onboard] Step save failed:", error);
        }
      });

    const duration = Date.now() - startTime;
    console.log(`[Fast Onboard] Completed in ${duration}ms (existing: ${existingAccount})`);

    return NextResponse.json<SuccessResponse>({
      url: link.url,
      accountId,
      existingAccount
    });

  } catch (error) {
    console.error("[Fast Onboard] Error:", error);

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

    if (errorMessage.includes("No such account")) {
      return errorResponse(
        "Payment account not found. Please contact support.",
        "account_not_found",
        400
      );
    }

    // Default: transient API error
    return errorResponse(
      "Unable to connect to payment service. Please try again.",
      "stripe_api_error",
      500,
      true
    );
  }
}
