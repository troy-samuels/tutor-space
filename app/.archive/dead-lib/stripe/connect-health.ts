/**
 * Stripe Connect Health Check
 *
 * Pre-flight validation before starting the Stripe Connect onboarding flow.
 * Catches configuration and auth issues early to provide better error messages.
 */

import { createClient } from "@/lib/supabase/client";
import {
  type StripeConnectError,
  createConnectError,
} from "./connect-errors";

export type ConnectHealthResult = {
  ready: boolean;
  existingAccountId?: string | null;
  error?: StripeConnectError;
  checks: {
    authenticated: boolean;
    profileExists: boolean;
    stripeConfigured: boolean;
  };
};

/**
 * Performs pre-flight checks before starting Stripe Connect flow
 *
 * Checks:
 * 1. User is authenticated
 * 2. Profile exists and matches the profileId
 * 3. Returns existing Stripe account ID if one exists (for idempotency)
 */
export async function checkConnectHealth(
  profileId: string
): Promise<ConnectHealthResult> {
  const supabase = createClient();

  const checks = {
    authenticated: false,
    profileExists: false,
    stripeConfigured: true, // Assume configured until API tells us otherwise
  };

  try {
    // Check 1: User is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        ready: false,
        error: createConnectError("unauthenticated"),
        checks,
      };
    }

    checks.authenticated = true;

    // Check 2: User ID matches profileId (security check)
    if (user.id !== profileId) {
      return {
        ready: false,
        error: createConnectError("forbidden"),
        checks,
      };
    }

    // Check 3: Profile exists and get existing Stripe account
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, stripe_account_id")
      .eq("id", profileId)
      .single();

    if (profileError || !profile) {
      return {
        ready: false,
        error: createConnectError("invalid_tutor_id"),
        checks,
      };
    }

    checks.profileExists = true;

    // All checks passed
    return {
      ready: true,
      existingAccountId: profile.stripe_account_id || null,
      checks,
    };
  } catch (err) {
    // Unexpected error during health check
    console.error("[Stripe Connect] Health check failed:", err);
    return {
      ready: false,
      error: createConnectError("stripe_network_error"),
      checks,
    };
  }
}

/**
 * Quick check if user appears to be authenticated
 * Does not validate with server - use checkConnectHealth for full validation
 */
export async function isLikelyAuthenticated(): Promise<boolean> {
  try {
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    return !!data.session;
  } catch {
    return false;
  }
}
