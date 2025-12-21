/**
 * Fast Retry Utility for Stripe Connect
 *
 * Optimized for sub-150ms perceived performance with:
 * - 200ms base delay (down from 1000ms)
 * - 500ms max delay (down from 8000ms)
 * - 2 max retries (down from 3)
 * - Exponential factor of 1.5 (not 2)
 */

export type FastRetryConfig = {
  /** Maximum retry attempts (default: 2) */
  maxRetries: number;
  /** Base delay in ms (default: 200) */
  baseDelayMs: number;
  /** Maximum delay in ms (default: 500) */
  maxDelayMs: number;
  /** Jitter in ms to prevent thundering herd (default: 50) */
  jitterMs: number;
};

export type FastRetryResult<T> =
  | { success: true; data: T; attempts: number; durationMs: number }
  | { success: false; error: Error; attempts: number; durationMs: number };

export const FAST_RETRY_CONFIG: FastRetryConfig = {
  maxRetries: 2,
  baseDelayMs: 200,
  maxDelayMs: 500,
  jitterMs: 50,
};

/**
 * Calculates delay with gentle exponential backoff (1.5x) and jitter
 */
function calculateDelay(attempt: number, config: FastRetryConfig): number {
  // Exponential backoff with factor 1.5 (gentler than 2x)
  const exponentialDelay = config.baseDelayMs * Math.pow(1.5, attempt);

  // Cap at maximum
  const cappedDelay = Math.min(exponentialDelay, config.maxDelayMs);

  // Add jitter
  const jitter = Math.random() * config.jitterMs;

  return Math.floor(cappedDelay + jitter);
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Non-retryable error patterns
 */
const NON_RETRYABLE_PATTERNS = [
  "unauthenticated",
  "forbidden",
  "not configured",
  "invalid",
  "missing",
  "No such account",
];

/**
 * Check if error is non-retryable
 */
function isNonRetryable(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return NON_RETRYABLE_PATTERNS.some(pattern =>
    message.toLowerCase().includes(pattern.toLowerCase())
  );
}

/**
 * Retry a function with fast exponential backoff
 *
 * @example
 * const result = await fastRetry(async () => {
 *   const response = await fetch('/api/stripe/connect/fast-onboard', { method: 'POST' });
 *   if (!response.ok) throw new Error('Request failed');
 *   return response.json();
 * });
 */
export async function fastRetry<T>(
  fn: () => Promise<T>,
  config: Partial<FastRetryConfig> = {},
  onRetry?: (attempt: number, error: Error, delayMs: number) => void
): Promise<FastRetryResult<T>> {
  const fullConfig = { ...FAST_RETRY_CONFIG, ...config };
  const startTime = Date.now();
  let lastError: Error = new Error("Unknown error");
  let attempts = 0;

  for (let attempt = 0; attempt <= fullConfig.maxRetries; attempt++) {
    attempts = attempt + 1;

    try {
      const data = await fn();
      return {
        success: true,
        data,
        attempts,
        durationMs: Date.now() - startTime,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry non-retryable errors
      if (isNonRetryable(error)) {
        return {
          success: false,
          error: lastError,
          attempts,
          durationMs: Date.now() - startTime,
        };
      }

      // If we have retries left, wait and try again
      if (attempt < fullConfig.maxRetries) {
        const delayMs = calculateDelay(attempt, fullConfig);

        if (onRetry) {
          onRetry(attempt + 1, lastError, delayMs);
        }

        await sleep(delayMs);
      }
    }
  }

  return {
    success: false,
    error: lastError,
    attempts,
    durationMs: Date.now() - startTime,
  };
}

/**
 * Simplified fetch with fast retry
 */
export async function fetchWithFastRetry<T>(
  url: string,
  options: RequestInit,
  retryConfig: Partial<FastRetryConfig> = {},
  onRetry?: (attempt: number, error: Error, delayMs: number) => void
): Promise<FastRetryResult<T>> {
  return fastRetry<T>(
    async () => {
      const response = await fetch(url, options);

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        const error = new Error(body.error || `HTTP ${response.status}`);
        // Attach retryable status to error for upstream handling
        (error as Error & { retryable?: boolean }).retryable = body.retryable ?? true;
        throw error;
      }

      return response.json() as Promise<T>;
    },
    retryConfig,
    onRetry
  );
}
