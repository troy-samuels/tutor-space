/**
 * Stripe Connect Error Handling
 *
 * Enterprise-grade error types and messages for Stripe Connect onboarding flow.
 * Follows patterns from lib/calendar/errors.ts and lib/video/errors.ts.
 */

export type StripeConnectErrorCode =
  // Authentication errors (require user action)
  | "unauthenticated"
  | "session_expired"
  | "forbidden"

  // Configuration errors (require admin action)
  | "stripe_not_configured"
  | "admin_client_unavailable"

  // Validation errors
  | "missing_tutor_id"
  | "invalid_tutor_id"

  // Transient errors (can retry)
  | "stripe_rate_limited"
  | "stripe_api_error"
  | "stripe_network_error"
  | "db_write_failed"

  // Account state errors
  | "account_not_found"
  | "account_link_failed"
  | "account_restricted";

export type StripeConnectError = {
  code: StripeConnectErrorCode;
  message: string;
  recovery?: string;
  retryable: boolean;
  retryAfterMs?: number;
};

export const STRIPE_CONNECT_ERROR_MESSAGES: Record<
  StripeConnectErrorCode,
  Omit<StripeConnectError, "code">
> = {
  // Authentication errors
  unauthenticated: {
    message: "Your session has expired.",
    recovery: "Please sign in again to continue.",
    retryable: false,
  },
  session_expired: {
    message: "Your session has expired.",
    recovery: "Please refresh the page and sign in again.",
    retryable: false,
  },
  forbidden: {
    message: "You don't have permission for this action.",
    recovery: "Please contact support if this persists.",
    retryable: false,
  },

  // Configuration errors
  stripe_not_configured: {
    message: "Payment setup is temporarily unavailable.",
    recovery: "Our team has been notified. Please try again later or skip this step.",
    retryable: false,
  },
  admin_client_unavailable: {
    message: "A server error occurred.",
    recovery: "Please try again in a few moments.",
    retryable: true,
    retryAfterMs: 2000,
  },

  // Validation errors
  missing_tutor_id: {
    message: "Unable to identify your account.",
    recovery: "Please refresh the page and try again.",
    retryable: false,
  },
  invalid_tutor_id: {
    message: "Unable to verify your account.",
    recovery: "Please sign out and sign back in.",
    retryable: false,
  },

  // Transient errors (can retry)
  stripe_rate_limited: {
    message: "Too many requests to payment service.",
    recovery: "We'll automatically retry in a moment.",
    retryable: true,
    retryAfterMs: 2000,
  },
  stripe_api_error: {
    message: "Unable to connect to payment service.",
    recovery: "This is usually temporary. We'll retry automatically.",
    retryable: true,
    retryAfterMs: 1000,
  },
  stripe_network_error: {
    message: "Network connection issue.",
    recovery: "Please check your internet connection.",
    retryable: true,
    retryAfterMs: 1000,
  },
  db_write_failed: {
    message: "Failed to save your progress.",
    recovery: "Please try again.",
    retryable: true,
    retryAfterMs: 1000,
  },

  // Account state errors
  account_not_found: {
    message: "No payment account found.",
    recovery: "Please complete the Stripe setup first.",
    retryable: false,
  },
  account_link_failed: {
    message: "Unable to generate setup link.",
    recovery: "Please try again.",
    retryable: true,
    retryAfterMs: 1000,
  },
  account_restricted: {
    message: "Your payment account needs attention.",
    recovery: "Please complete the verification in Stripe.",
    retryable: false,
  },
};

/**
 * Creates a structured StripeConnectError from an error code
 */
export function createConnectError(code: StripeConnectErrorCode): StripeConnectError {
  const errorInfo = STRIPE_CONNECT_ERROR_MESSAGES[code];
  return {
    code,
    ...errorInfo,
  };
}

/**
 * Parses an API response into a structured StripeConnectError
 */
export function parseStripeConnectError(
  status: number,
  body: { error?: string; code?: string; retryable?: boolean } | null
): StripeConnectError {
  // Check if response includes a known error code
  if (body?.code && body.code in STRIPE_CONNECT_ERROR_MESSAGES) {
    return createConnectError(body.code as StripeConnectErrorCode);
  }

  // Map HTTP status codes to error codes
  switch (status) {
    case 401:
      return createConnectError("unauthenticated");
    case 403:
      return createConnectError("forbidden");
    case 429:
      return createConnectError("stripe_rate_limited");
    case 400:
      // Check for specific error messages
      if (body?.error?.toLowerCase().includes("no stripe account")) {
        return createConnectError("account_not_found");
      }
      if (body?.error?.toLowerCase().includes("missing")) {
        return createConnectError("missing_tutor_id");
      }
      return createConnectError("invalid_tutor_id");
    case 500:
    case 502:
    case 503:
    case 504:
      // Check for specific server errors
      if (body?.error?.toLowerCase().includes("admin client")) {
        return createConnectError("admin_client_unavailable");
      }
      if (body?.error?.toLowerCase().includes("stripe is not configured")) {
        return createConnectError("stripe_not_configured");
      }
      return createConnectError("stripe_api_error");
    default:
      // Network errors or unknown
      if (status === 0 || !status) {
        return createConnectError("stripe_network_error");
      }
      return createConnectError("stripe_api_error");
  }
}

/**
 * Gets a user-friendly error message for display
 */
export function getConnectErrorMessage(code: StripeConnectErrorCode): string {
  const errorInfo = STRIPE_CONNECT_ERROR_MESSAGES[code];
  return errorInfo?.message || "An unexpected error occurred. Please try again.";
}
