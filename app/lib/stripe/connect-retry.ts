/**
 * Stripe Connect Retry Utility
 *
 * Provides exponential backoff retry logic for transient failures
 * during Stripe Connect onboarding flow.
 */

import {
  type StripeConnectError,
  parseStripeConnectError,
} from "./connect-errors";

export type RetryConfig = {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries: number;
  /** Base delay in milliseconds (default: 1000) */
  baseDelayMs: number;
  /** Maximum delay in milliseconds (default: 8000) */
  maxDelayMs: number;
  /** Random jitter in milliseconds to prevent thundering herd (default: 100) */
  jitterMs: number;
};

export type RetryResult<T> =
  | { success: true; data: T; attempts: number }
  | { success: false; error: StripeConnectError; attempts: number };

const DEFAULT_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 8000,
  jitterMs: 100,
};

/**
 * Calculates delay with exponential backoff and jitter
 */
function calculateDelay(
  attempt: number,
  config: RetryConfig,
  errorRetryAfter?: number
): number {
  // If error specifies retry-after, respect it
  if (errorRetryAfter && errorRetryAfter > 0) {
    return errorRetryAfter;
  }

  // Exponential backoff: baseDelay * 2^attempt
  const exponentialDelay = config.baseDelayMs * Math.pow(2, attempt);

  // Cap at maximum delay
  const cappedDelay = Math.min(exponentialDelay, config.maxDelayMs);

  // Add random jitter to prevent thundering herd
  const jitter = Math.random() * config.jitterMs;

  return Math.floor(cappedDelay + jitter);
}

/**
 * Sleeps for the specified number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Wraps a fetch call with retry logic
 */
export async function withRetry<T>(
  fn: () => Promise<Response>,
  parseResponse: (res: Response) => Promise<T>,
  config: Partial<RetryConfig> = {},
  onRetry?: (attempt: number, error: StripeConnectError, delayMs: number) => void
): Promise<RetryResult<T>> {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  let lastError: StripeConnectError | null = null;
  let attempts = 0;

  for (let attempt = 0; attempt <= fullConfig.maxRetries; attempt++) {
    attempts = attempt + 1;

    try {
      const response = await fn();

      // Success case
      if (response.ok) {
        const data = await parseResponse(response);
        return { success: true, data, attempts };
      }

      // Parse error from response
      let body: { error?: string; code?: string; retryable?: boolean } | null = null;
      try {
        body = await response.json();
      } catch {
        // Body parsing failed, continue with null
      }

      const error = parseStripeConnectError(response.status, body);
      lastError = error;

      // Check if error is retryable and we have attempts left
      if (!error.retryable || attempt >= fullConfig.maxRetries) {
        return { success: false, error, attempts };
      }

      // Calculate delay and wait before retry
      const delayMs = calculateDelay(attempt, fullConfig, error.retryAfterMs);

      // Notify caller about retry
      if (onRetry) {
        onRetry(attempt + 1, error, delayMs);
      }

      await sleep(delayMs);
    } catch (err) {
      // Network error or other exception
      const error = parseStripeConnectError(0, null);
      lastError = error;

      // Network errors are retryable
      if (attempt >= fullConfig.maxRetries) {
        return { success: false, error, attempts };
      }

      const delayMs = calculateDelay(attempt, fullConfig);

      if (onRetry) {
        onRetry(attempt + 1, error, delayMs);
      }

      await sleep(delayMs);
    }
  }

  // Should not reach here, but handle edge case
  return {
    success: false,
    error: lastError || parseStripeConnectError(500, null),
    attempts,
  };
}

/**
 * Simplified helper for JSON API calls
 */
export async function fetchWithRetry<T>(
  url: string,
  options: RequestInit,
  retryConfig: Partial<RetryConfig> = {},
  onRetry?: (attempt: number, error: StripeConnectError, delayMs: number) => void
): Promise<RetryResult<T>> {
  return withRetry<T>(
    () => fetch(url, options),
    async (res) => {
      const json = await res.json();
      return json as T;
    },
    retryConfig,
    onRetry
  );
}
