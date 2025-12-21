import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { createExpressAccount } from "@/lib/services/connect";
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
    // SECURITY: Verify authenticated user
    const authClient = await createClient();
    const {
      data: { user },
      error: authError,
    } = await authClient.auth.getUser();

    if (authError || !user) {
      return errorResponse(
        "Authentication required. Please sign in.",
        "unauthenticated",
        401
      );
    }

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

    // SECURITY: Verify user owns the tutorId
    if (user.id !== tutorId) {
      return errorResponse(
        "You can only create Connect accounts for your own profile.",
        "forbidden",
        403
      );
    }

    const supabase = createServiceRoleClient();
    if (!supabase) {
      return errorResponse(
        "Server configuration error.",
        "admin_client_unavailable",
        500,
        true
      );
    }

    // Check if account already exists (idempotent operation)
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_account_id")
      .eq("id", tutorId)
      .single();

    if (profile?.stripe_account_id) {
      // Account already exists, return it
      return NextResponse.json({ accountId: profile.stripe_account_id });
    }

    const accountId = await createExpressAccount(tutorId, supabase);
    return NextResponse.json({ accountId });
  } catch (error) {
    console.error("[Stripe Connect] Account creation failed:", error);

    // Check for specific Stripe errors
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (errorMessage.includes("Stripe is not configured")) {
      return errorResponse(
        "Payment service is not configured.",
        "stripe_not_configured",
        500
      );
    }

    // Rate limit from Stripe
    if (errorMessage.includes("rate limit") || errorMessage.includes("Too many")) {
      return errorResponse(
        "Too many requests. Please try again in a moment.",
        "stripe_rate_limited",
        429,
        true
      );
    }

    // Default: transient API error
    return errorResponse(
      "Unable to create payment account. Please try again.",
      "stripe_api_error",
      500,
      true
    );
  }
}
