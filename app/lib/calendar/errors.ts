export type CalendarProviderId = "google" | "outlook";

export type CalendarConfigIssueCode =
  | "missing_client_id"
  | "invalid_client_id"
  | "missing_client_secret"
  | "missing_redirect_uri"
  | "invalid_redirect_uri"
  | "missing_encryption_key";

export type CalendarOAuthErrorCode =
  | CalendarConfigIssueCode
  | "unsupported_provider"
  | "provider_not_configured"
  | "provider_misconfigured"
  | "invalid_state"
  | "unauthenticated"
  | "token_exchange_failed"
  | "missing_access_token"
  | "encryption_failed"
  | "persist_failed"
  | "access_denied";

export const CALENDAR_OAUTH_ERROR_MESSAGES: Record<CalendarOAuthErrorCode, string> = {
  unsupported_provider: "This calendar provider is not supported.",
  provider_not_configured: "This calendar provider is not configured.",
  provider_misconfigured: "This calendar provider is misconfigured. Contact support.",
  invalid_state: "The request was invalid. Please try again.",
  unauthenticated: "You must be logged in to connect a calendar.",
  token_exchange_failed: "Failed to connect to the calendar service.",
  missing_access_token: "Failed to get access from the calendar service.",
  encryption_failed: "Failed to securely store your credentials.",
  persist_failed: "Failed to save your calendar connection.",
  access_denied: "Calendar access was denied.",
  missing_client_id: "Missing OAuth client ID.",
  invalid_client_id: "OAuth client ID format looks invalid.",
  missing_client_secret: "Missing OAuth client secret.",
  missing_redirect_uri: "Missing OAuth redirect URL.",
  invalid_redirect_uri: "OAuth redirect URL must be a valid http(s) URL.",
  missing_encryption_key: "Missing token encryption key for calendar storage.",
};

export function getCalendarOAuthErrorMessage(error: string): string {
  return (
    CALENDAR_OAUTH_ERROR_MESSAGES[error as CalendarOAuthErrorCode] ||
    "An unexpected error occurred. Please try again or contact support at support@tutorlingua.co."
  );
}

export function formatCalendarConfigIssues(
  issues: CalendarConfigIssueCode[],
  provider: CalendarProviderId
): string {
  if (!issues.length) {
    return "Calendar provider is not configured yet.";
  }

  const providerLabel = provider === "google" ? "Google Calendar" : "Outlook Calendar";
  const primary = issues[0];
  const message = CALENDAR_OAUTH_ERROR_MESSAGES[primary] || "Calendar OAuth is not configured.";
  const codes = issues.join(", ");

  return `${providerLabel} connection is unavailable. ${message} (code${
    issues.length > 1 ? "s" : ""
  }: ${codes}).`;
}
