/**
 * Stripe Webhook Configuration Validation
 *
 * Provides startup validation and runtime checks for webhook secrets
 * to catch misconfigurations before they cause production outages.
 */

export interface WebhookConfigIssue {
  code: string;
  message: string;
  severity: "error" | "warning";
}

export interface WebhookConfig {
  platformSecret: string | null;
  isConfigured: boolean;
  issues: WebhookConfigIssue[];
}

/**
 * Validates webhook configuration and returns issues found.
 * Call this at startup to catch misconfigurations early.
 */
export function validateWebhookConfig(): WebhookConfig {
  const issues: WebhookConfigIssue[] = [];
  const platformSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim() || null;

  // Check if secret exists
  if (!platformSecret) {
    issues.push({
      code: "MISSING_SECRET",
      message: "STRIPE_WEBHOOK_SECRET environment variable is not set",
      severity: "error",
    });
    return { platformSecret: null, isConfigured: false, issues };
  }

  // Check secret format (should start with whsec_)
  if (!platformSecret.startsWith("whsec_")) {
    issues.push({
      code: "INVALID_SECRET_FORMAT",
      message:
        "STRIPE_WEBHOOK_SECRET should start with 'whsec_' - verify you copied the signing secret, not the API key",
      severity: "error",
    });
  }

  // Check minimum length (Stripe secrets are typically 32+ chars)
  if (platformSecret.length < 32) {
    issues.push({
      code: "SECRET_TOO_SHORT",
      message:
        "STRIPE_WEBHOOK_SECRET appears truncated (less than 32 characters)",
      severity: "error",
    });
  }

  // Warn if using test mode in production
  const isProduction = process.env.NODE_ENV === "production";
  const isTestSecret = platformSecret.includes("_test_");
  if (isProduction && isTestSecret) {
    issues.push({
      code: "TEST_SECRET_IN_PRODUCTION",
      message:
        "Using test mode webhook secret in production - webhooks from live mode will fail",
      severity: "warning",
    });
  }

  // Warn if test secret appears to be live mode (shouldn't normally happen)
  const isLiveSecret = platformSecret.includes("_live_");
  if (!isProduction && isLiveSecret) {
    issues.push({
      code: "LIVE_SECRET_IN_DEVELOPMENT",
      message:
        "Using live mode webhook secret in development - use test mode secret for local testing",
      severity: "warning",
    });
  }

  const hasErrors = issues.some((i) => i.severity === "error");

  return {
    platformSecret,
    isConfigured: !hasErrors,
    issues,
  };
}

/**
 * Asserts that webhook is properly configured.
 * Throws if configuration is invalid.
 * Use in webhook handler for fail-fast behavior.
 */
export function assertWebhookConfigured(): string {
  const config = validateWebhookConfig();

  if (!config.isConfigured) {
    const errorMessages = config.issues
      .filter((i) => i.severity === "error")
      .map((i) => i.message)
      .join("; ");
    throw new Error(`Stripe webhook misconfigured: ${errorMessages}`);
  }

  return config.platformSecret!;
}

/**
 * Gets the webhook secret or null if not configured.
 * Logs warnings but doesn't throw.
 */
export function getWebhookSecret(): string | null {
  const config = validateWebhookConfig();

  // Log warnings at startup
  for (const issue of config.issues) {
    if (issue.severity === "warning") {
      console.warn(`[Stripe Webhook Config] Warning: ${issue.message}`);
    }
  }

  if (!config.isConfigured) {
    for (const issue of config.issues) {
      if (issue.severity === "error") {
        console.error(`[Stripe Webhook Config] Error: ${issue.message}`);
      }
    }
    return null;
  }

  return config.platformSecret;
}

/**
 * Logs webhook configuration status.
 * Call once at server startup for visibility.
 */
export function logWebhookConfigStatus(): void {
  const config = validateWebhookConfig();

  if (config.isConfigured) {
    const secretPreview = config.platformSecret
      ? `${config.platformSecret.slice(0, 10)}...${config.platformSecret.slice(-4)}`
      : "null";
    console.log(
      `[Stripe Webhook Config] Configured: secret=${secretPreview}`
    );
  } else {
    console.error("[Stripe Webhook Config] NOT CONFIGURED - webhook will fail");
  }

  for (const issue of config.issues) {
    const level = issue.severity === "error" ? "error" : "warn";
    console[level](`[Stripe Webhook Config] ${issue.code}: ${issue.message}`);
  }
}
