import { NextRequest } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";

type ServiceRoleClient = NonNullable<ReturnType<typeof createServiceRoleClient>>;

type RateLimitParams = {
  supabaseAdmin: ServiceRoleClient | null;
  userId?: string | null;
  req?: NextRequest | Request;
  identifierOverride?: string;
  limit?: number;
  windowSeconds?: number;
  keyPrefix?: string;
};

type RateLimitResult = {
  ok: boolean;
  status?: number;
  error?: string;
  remaining?: number | null;
  resetAt?: string | null;
};

function getIdentifierFromRequest(req?: NextRequest | Request): string | null {
  if (!req) return null;
  const forwarded = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");

  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || null;
  }

  if (realIp) {
    return realIp.trim();
  }

  return null;
}

/**
 * Enforce checkout rate limits using a database-backed limiter.
 * Falls back to IP if userId is not available.
 */
export async function enforceCheckoutRateLimit({
  supabaseAdmin,
  userId,
  req,
  identifierOverride,
  limit = 5,
  windowSeconds = 60,
  keyPrefix = "checkout",
}: RateLimitParams): Promise<RateLimitResult> {
  if (!supabaseAdmin) {
    return { ok: false, status: 503, error: "Rate limiting unavailable" };
  }

  const identifier =
    (userId ? `user:${userId}` : null) ||
    (identifierOverride ? `id:${identifierOverride}` : null) ||
    (() => {
      const ip = getIdentifierFromRequest(req);
      return ip ? `ip:${ip}` : null;
    })() ||
    "anon";

  const key = `${keyPrefix}:${identifier}`;

  const { data, error } = await supabaseAdmin.rpc("consume_rate_limit", {
    p_key: key,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });

  if (error) {
    console.error("[RateLimit] Failed to consume checkout rate limit", { error, key });
    return { ok: false, status: 503, error: "Rate limit check failed" };
  }

  const result = Array.isArray(data) ? data[0] : data;

  if (!result?.allowed) {
    return {
      ok: false,
      status: 429,
      error: "Too many checkout attempts. Please wait a moment and try again.",
      remaining: result?.remaining ?? 0,
      resetAt: result?.reset_at ?? null,
    };
  }

  return {
    ok: true,
    remaining: result?.remaining ?? null,
    resetAt: result?.reset_at ?? null,
  };
}
