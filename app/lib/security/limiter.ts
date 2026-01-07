import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { verifyAdminSession } from "@/lib/admin/auth";
import type { SupabaseClient } from "@supabase/supabase-js";

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
	/** Homework uploads - IP-based */
	upload: { requests: 20, window: "5 m" as const },
	/** Homework submissions - IP-based */
	homework_submission: { requests: 10, window: "10 m" as const },
	/** AI Practice chat - User ID-based (legacy) */
	ai: { requests: 30, window: "1 m" as const },
	/** AI Practice - Studio tier tutors (30/min) */
	ai_studio: { requests: 30, window: "1 m" as const },
	/** AI Practice - Pro/Free tier tutors (10/min) */
	ai_limited: { requests: 10, window: "1 m" as const },
	/** Login/signup attempts - IP-based */
	auth: { requests: 5, window: "15 m" as const },
	/** General API calls */
	api: { requests: 60, window: "1 m" as const },
	/** Messaging - text messages - User ID-based (60/hour) */
	messaging: { requests: 60, window: "1 h" as const },
	/** Messaging - audio messages - User ID-based (30/hour) */
	messaging_audio: { requests: 30, window: "1 h" as const },
	/** Tutor site create - User ID-based (5/day) */
	site_create: { requests: 5, window: "24 h" as const },
	/** Tutor site update - User ID-based (30/hour) */
	site_update: { requests: 30, window: "1 h" as const },
	/** Tutor site publish - User ID-based (10/hour) */
	site_publish: { requests: 10, window: "1 h" as const },
} as const;

/** Monthly message cap for AI Practice (margin protection) */
export const MONTHLY_MESSAGE_CAP = 1000;

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

// ============================================================================
// AI Practice Rate Limiting
// ============================================================================

/**
 * Check AI Practice rate limit with tier-based limits.
 *
 * - Studio tutors: 30 requests/min
 * - Pro/Free tutors: 10 requests/min
 *
 * @param studentId - Student UUID to rate limit
 * @param isStudioTutor - Whether the student's tutor has Studio tier
 * @returns Rate limit result
 *
 * @example
 * const isStudio = await getTutorHasPracticeAccess(adminClient, student.tutor_id);
 * const result = await checkAIPracticeRateLimit(student.id, isStudio);
 */
export async function checkAIPracticeRateLimit(
	studentId: string,
	isStudioTutor: boolean
): Promise<RateLimitResult> {
	const limitKey: LimitKey = isStudioTutor ? "ai_studio" : "ai_limited";
	const identifier = `student:${studentId}`;

	return checkRateLimit(identifier, limitKey);
}

export interface MonthlyUsageCapResult {
	/** Whether the request is allowed (under cap) */
	allowed: boolean;
	/** Current usage count */
	used: number;
	/** Monthly cap limit */
	cap: number;
}

/**
 * Check if student has exceeded monthly message cap (Margin Guard).
 *
 * Queries `practice_usage_periods.text_turns_used` for current month.
 * Returns 403 Forbidden if usage >= MONTHLY_MESSAGE_CAP (1000).
 *
 * @param supabase - Supabase client (admin/service role)
 * @param studentId - Student UUID
 * @param tutorId - Tutor UUID
 * @returns Whether request is allowed and usage stats
 *
 * @example
 * const cap = await checkMonthlyUsageCap(adminClient, student.id, student.tutor_id);
 * if (!cap.allowed) {
 *   return NextResponse.json({ error: "Monthly limit reached" }, { status: 403 });
 * }
 */
export async function checkMonthlyUsageCap(
	supabase: SupabaseClient,
	studentId: string,
	tutorId: string
): Promise<MonthlyUsageCapResult> {
	// Get current month's usage period
	const now = new Date();
	const periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

	const { data: usagePeriod } = await supabase
		.from("practice_usage_periods")
		.select("text_turns_used")
		.eq("student_id", studentId)
		.eq("tutor_id", tutorId)
		.gte("period_start", periodStart.toISOString())
		.maybeSingle();

	const used = usagePeriod?.text_turns_used ?? 0;

	return {
		allowed: used < MONTHLY_MESSAGE_CAP,
		used,
		cap: MONTHLY_MESSAGE_CAP,
	};
}
