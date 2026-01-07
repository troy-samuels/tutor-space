/**
 * Rate limiting middleware for API routes
 *
 * Uses in-memory store for development. For production, consider:
 * - Redis for distributed rate limiting
 * - Upstash Rate Limit for serverless
 * - Vercel Edge Config for edge functions
 *
 * @example
 * ```ts
 * import { rateLimit } from "@/lib/middleware/rate-limit";
 *
 * export async function POST(req: NextRequest) {
 *   const rateLimitResult = await rateLimit(req, {
 *     limit: 5,
 *     window: 60000, // 1 minute
 *   });
 *
 *   if (!rateLimitResult.success) {
 *     return NextResponse.json(
 *       { error: rateLimitResult.error },
 *       { status: 429 }
 *     );
 *   }
 *
 *   // ... rest of your endpoint logic
 * }
 * ```
 */

import { NextRequest } from "next/server";

type RateLimitConfig = {
  limit: number; // Max number of requests
  window: number; // Time window in milliseconds
};

type RateLimitResult = {
  success: boolean;
  error?: string;
  remaining?: number;
  reset?: number;
};

// In-memory store for rate limiting
// Key: identifier (IP address), Value: array of timestamps
const requestStore = new Map<string, number[]>();

/**
 * Get client identifier (IP address) from request
 */
function getClientIdentifier(req: NextRequest): string {
  // Try to get real IP from various headers (respecting proxies)
  const forwarded = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");

  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, take the first
    return forwarded.split(",")[0].trim();
  }

  if (realIp) {
    return realIp.trim();
  }

  // Fallback to a generic identifier if IP not available
  return "unknown";
}

/**
 * Rate limit a request based on client identifier
 */
export async function rateLimit(
  req: NextRequest,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const identifier = getClientIdentifier(req);
  const now = Date.now();
  const windowStart = now - config.window;

  // Get existing requests for this identifier
  let requests = requestStore.get(identifier) || [];

  // Filter out requests outside the current window
  requests = requests.filter((timestamp) => timestamp > windowStart);

  // Check if limit exceeded
  if (requests.length >= config.limit) {
    const oldestRequest = requests[0];
    const resetTime = oldestRequest + config.window;
    const resetInSeconds = Math.ceil((resetTime - now) / 1000);

    return {
      success: false,
      error: `Rate limit exceeded. Please try again in ${resetInSeconds} seconds.`,
      remaining: 0,
      reset: resetTime,
    };
  }

  // Add current request
  requests.push(now);
  requestStore.set(identifier, requests);

  // Clean up old entries periodically (every 100 requests)
  if (Math.random() < 0.01) {
    cleanupStore(windowStart);
  }

  return {
    success: true,
    remaining: config.limit - requests.length,
  };
}

/**
 * Cleanup old entries from the store
 */
function cleanupStore(windowStart: number) {
  for (const [identifier, requests] of requestStore.entries()) {
    const validRequests = requests.filter((timestamp) => timestamp > windowStart);
    if (validRequests.length === 0) {
      requestStore.delete(identifier);
    } else {
      requestStore.set(identifier, validRequests);
    }
  }
}

/**
 * Pre-configured rate limiters for common use cases
 */
export const RateLimiters = {
  // Authentication endpoints: 5 attempts per 15 minutes
  auth: (req: NextRequest) =>
    rateLimit(req, {
      limit: 5,
      window: 15 * 60 * 1000, // 15 minutes
    }),

  // Public booking: 10 bookings per 5 minutes
  booking: (req: NextRequest) =>
    rateLimit(req, {
      limit: 10,
      window: 5 * 60 * 1000, // 5 minutes
    }),

  // Package checks: 20 checks per 5 minutes
  packageCheck: (req: NextRequest) =>
    rateLimit(req, {
      limit: 20,
      window: 5 * 60 * 1000, // 5 minutes
    }),

  // API endpoints: 60 requests per minute
  api: (req: NextRequest) =>
    rateLimit(req, {
      limit: 60,
      window: 60 * 1000, // 1 minute
    }),

  // Strict endpoints (password reset): 3 attempts per hour
  strict: (req: NextRequest) =>
    rateLimit(req, {
      limit: 3,
      window: 60 * 60 * 1000, // 1 hour
    }),
};

/**
 * Helper to add rate limit headers to response
 */
export function addRateLimitHeaders(
  response: Response,
  result: RateLimitResult
): Response {
  if (result.remaining !== undefined) {
    response.headers.set("X-RateLimit-Remaining", result.remaining.toString());
  }
  if (result.reset) {
    response.headers.set("X-RateLimit-Reset", result.reset.toString());
  }
  return response;
}

/**
 * Rate limit for server actions using headers() from next/headers
 * Since server actions don't have NextRequest, we extract IP from headers
 *
 * @example
 * ```ts
 * import { rateLimitServerAction } from "@/lib/middleware/rate-limit";
 * import { headers } from "next/headers";
 *
 * export async function myServerAction() {
 *   const headersList = await headers();
 *   const rateLimitResult = await rateLimitServerAction(headersList, {
 *     limit: 10,
 *     window: 60000,
 *     prefix: "booking",
 *   });
 *
 *   if (!rateLimitResult.success) {
 *     return { error: rateLimitResult.error };
 *   }
 *   // ... rest of action
 * }
 * ```
 */
export async function rateLimitServerAction(
  headersList: Headers,
  config: RateLimitConfig & { prefix?: string }
): Promise<RateLimitResult> {
  // Extract IP from headers
  const forwarded = headersList.get("x-forwarded-for");
  const realIp = headersList.get("x-real-ip");

  let identifier = "unknown";
  if (forwarded) {
    identifier = forwarded.split(",")[0].trim();
  } else if (realIp) {
    identifier = realIp.trim();
  }

  // Add prefix for namespacing different actions
  if (config.prefix) {
    identifier = `${config.prefix}:${identifier}`;
  }

  const now = Date.now();
  const windowStart = now - config.window;

  // Get existing requests for this identifier
  let requests = requestStore.get(identifier) || [];

  // Filter out requests outside the current window
  requests = requests.filter((timestamp) => timestamp > windowStart);

  // Check if limit exceeded
  if (requests.length >= config.limit) {
    const oldestRequest = requests[0];
    const resetTime = oldestRequest + config.window;
    const resetInSeconds = Math.ceil((resetTime - now) / 1000);

    return {
      success: false,
      error: `Too many requests. Please try again in ${resetInSeconds} seconds.`,
      remaining: 0,
      reset: resetTime,
    };
  }

  // Add current request
  requests.push(now);
  requestStore.set(identifier, requests);

  // Clean up old entries periodically
  if (Math.random() < 0.01) {
    cleanupStore(windowStart);
  }

  return {
    success: true,
    remaining: config.limit - requests.length,
  };
}

/**
 * Pre-configured rate limiters for server actions
 */
export const ServerActionLimiters = {
  // Public booking: 5 bookings per 5 minutes per IP
  booking: (headersList: Headers) =>
    rateLimitServerAction(headersList, {
      limit: 5,
      window: 5 * 60 * 1000, // 5 minutes
      prefix: "sa:booking",
    }),

  // Contact form: 3 submissions per 10 minutes
  contact: (headersList: Headers) =>
    rateLimitServerAction(headersList, {
      limit: 3,
      window: 10 * 60 * 1000, // 10 minutes
      prefix: "sa:contact",
    }),

  // Access request: 3 requests per 10 minutes
  accessRequest: (headersList: Headers) =>
    rateLimitServerAction(headersList, {
      limit: 3,
      window: 10 * 60 * 1000, // 10 minutes
      prefix: "sa:access",
    }),

  // Email invite: 10 emails per 5 minutes (prevents spam)
  email: (headersList: Headers) =>
    rateLimitServerAction(headersList, {
      limit: 10,
      window: 5 * 60 * 1000, // 5 minutes
      prefix: "sa:email",
    }),

  // Bulk import: 3 imports per 10 minutes (prevents resource exhaustion)
  import: (headersList: Headers) =>
    rateLimitServerAction(headersList, {
      limit: 3,
      window: 10 * 60 * 1000, // 10 minutes
      prefix: "sa:import",
    }),

  // File upload: 20 uploads per 5 minutes (prevents storage exhaustion)
  upload: (headersList: Headers) =>
    rateLimitServerAction(headersList, {
      limit: 20,
      window: 5 * 60 * 1000, // 5 minutes
      prefix: "sa:upload",
    }),

  // Homework submission: 10 submissions per 10 minutes
  homeworkSubmission: (headersList: Headers) =>
    rateLimitServerAction(headersList, {
      limit: 10,
      window: 10 * 60 * 1000, // 10 minutes
      prefix: "sa:hw-submit",
    }),
};
