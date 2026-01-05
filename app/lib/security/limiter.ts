import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { verifyAdminSession } from "@/lib/admin/auth";

// ============================================================================
// Configuration
// ============================================================================

/**
 * Rate limit configurations per limit key.
 * Each key defines a specific use case with its own limits.
 */
const LIMITS = {
	/** Public booking pages - IP-based */
	booking: { requests: 10, window: "5 m" as const },
	/** AI Practice chat - User ID-based */
	ai: { requests: 30, window: "1 m" as const },
	/** Login/signup attempts - IP-based */
	auth: { requests: 5, window: "15 m" as const },
	/** General API calls */
	api: { requests: 60, window: "1 m" as const },
} as const;

export type LimitKey = keyof typeof LIMITS;

// ============================================================================
// Types
// ============================================================================

export interface RateLimitResult {
	/** Whether the request is allowed */
	success: boolean;
	/** Maximum requests allowed in the window */
	limit: number;
	/** Remaining requests in the current window */
	remaining: number;
	/** Unix timestamp (ms) when the window resets */
	reset: number;
}

// ============================================================================
// Lazy Initialization
// ============================================================================

let redis: Redis | null = null;
const limiters: Map<LimitKey, Ratelimit> = new Map();

/**
 * Get or create a Redis client (lazy initialization)
 */
function getRedis(): Redis | null {
	if (redis) return redis;

	const url = process.env.UPSTASH_REDIS_REST_URL;
	const token = process.env.UPSTASH_REDIS_REST_TOKEN;

	if (!url || !token) {
		console.warn(
			"[RateLimit] UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN not configured"
		);
		return null;
	}

	redis = new Redis({ url, token });
	return redis;
}

/**
 * Get or create a rate limiter for the specified key
 */
function getLimiter(limitKey: LimitKey): Ratelimit | null {
	const existing = limiters.get(limitKey);
	if (existing) return existing;

	const redisClient = getRedis();
	if (!redisClient) return null;

	const config = LIMITS[limitKey];
	const limiter = new Ratelimit({
		redis: redisClient,
		limiter: Ratelimit.slidingWindow(config.requests, config.window),
		prefix: `ratelimit:${limitKey}`,
		analytics: true,
	});

	limiters.set(limitKey, limiter);
	return limiter;
}

// ============================================================================
// Main API
// ============================================================================

/**
 * Check rate limit for an identifier.
 *
 * Usage patterns:
 * - Public pages (booking): Use IP address as identifier
 * - Authenticated routes (AI Practice): Use user ID as identifier
 *
 * Admin users bypass rate limiting automatically.
 *
 * @param identifier - IP address or user ID to rate limit
 * @param limitKey - Which rate limit configuration to use
 * @returns Rate limit result with success status and metadata
 *
 * @example
 * // IP-based rate limiting for public booking
 * const ip = headers().get("x-forwarded-for")?.split(",")[0] ?? "unknown";
 * const result = await checkRateLimit(ip, "booking");
 *
 * @example
 * // User-based rate limiting for AI Practice
 * const result = await checkRateLimit(user.id, "ai");
 */
export async function checkRateLimit(
	identifier: string,
	limitKey: LimitKey
): Promise<RateLimitResult> {
	// Admin bypass - admins skip all rate limits
	try {
		const adminSession = await verifyAdminSession();
		if (adminSession) {
			return {
				success: true,
				limit: Infinity,
				remaining: Infinity,
				reset: 0,
			};
		}
	} catch {
		// Not an admin request, continue with rate limiting
	}

	// Get rate limiter
	const limiter = getLimiter(limitKey);

	// If Upstash is not configured, allow the request (fail open)
	if (!limiter) {
		console.warn(`[RateLimit] Limiter not available for ${limitKey}, allowing request`);
		return {
			success: true,
			limit: LIMITS[limitKey].requests,
			remaining: LIMITS[limitKey].requests,
			reset: Date.now(),
		};
	}

	// Check rate limit
	const result = await limiter.limit(identifier);

	return {
		success: result.success,
		limit: result.limit,
		remaining: result.remaining,
		reset: result.reset,
	};
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Extract IP address from request headers.
 * Use this for IP-based rate limiting on public routes.
 *
 * @param headers - Request headers
 * @returns IP address or "unknown" fallback
 */
export function getClientIP(headers: Headers): string {
	const forwarded = headers.get("x-forwarded-for");
	if (forwarded) {
		return forwarded.split(",")[0].trim();
	}

	const realIp = headers.get("x-real-ip");
	if (realIp) {
		return realIp.trim();
	}

	return "unknown";
}

/**
 * Build rate limit response headers for 429 responses.
 *
 * @param result - Rate limit result
 * @returns Headers object for the response
 */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
	return {
		"X-RateLimit-Limit": String(result.limit),
		"X-RateLimit-Remaining": String(result.remaining),
		"X-RateLimit-Reset": String(result.reset),
		"Retry-After": String(Math.ceil((result.reset - Date.now()) / 1000)),
	};
}
