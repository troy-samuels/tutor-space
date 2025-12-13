import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { RateLimiters, addRateLimitHeaders } from "@/lib/middleware/rate-limit";
import { createHash } from "crypto";

function parseDeviceType(userAgent: string | null): string {
  if (!userAgent) return "unknown";
  const ua = userAgent.toLowerCase();
  if (/mobile|android|iphone|ipad|ipod|blackberry|windows phone/i.test(ua)) {
    if (/ipad|tablet/i.test(ua)) return "tablet";
    return "mobile";
  }
  return "desktop";
}

/**
 * Anonymize IP address for GDPR/privacy compliance.
 * Uses SHA-256 hash with daily rotation salt to prevent tracking across days
 * while still allowing same-day session correlation.
 */
function anonymizeIP(request: NextRequest): string {
  const rawIP =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  if (rawIP === "unknown") {
    return "unknown";
  }

  // Use date as rotation salt - prevents long-term tracking
  // but allows same-day analytics aggregation
  const dailySalt = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const hashInput = `${rawIP}:${dailySalt}:analytics`;

  // SHA-256 hash, truncated to 16 chars for storage efficiency
  const hash = createHash("sha256").update(hashInput).digest("hex").slice(0, 16);

  return hash;
}

export async function POST(request: NextRequest) {
  try {
    const rateLimitResult = await RateLimiters.api(request);
    if (!rateLimitResult.success) {
      const res = NextResponse.json(
        { error: rateLimitResult.error ?? "Too many requests" },
        { status: 429 }
      );
      return addRateLimitHeaders(res, rateLimitResult);
    }

    const supabase = createServiceRoleClient();
    if (!supabase) {
      // Fail silently - analytics shouldn't break the app
      return NextResponse.json({ success: false });
    }

    let body: unknown = null;
    try {
      body = await request.json();
    } catch {
      // Fail silently - analytics shouldn't break the app
      return NextResponse.json({ success: false });
    }
    const payload =
      body && typeof body === "object" ? (body as Record<string, unknown>) : ({} as Record<string, unknown>);
    const path = payload.path;
    const sessionId = payload.sessionId;
    const referrer = payload.referrer;

    if (
      typeof path !== "string" ||
      !path.startsWith("/") ||
      path.length > 512 ||
      typeof sessionId !== "string" ||
      sessionId.length < 8 ||
      sessionId.length > 64 ||
      !/^[a-zA-Z0-9._-]+$/.test(sessionId) ||
      (referrer && (typeof referrer !== "string" || referrer.length > 2048))
    ) {
      return NextResponse.json({ success: false });
    }

    // Skip tracking for certain paths
    if (
      path.startsWith("/api") ||
      path.startsWith("/_next") ||
      path.startsWith("/admin")
    ) {
      return NextResponse.json({ success: true, skipped: true });
    }

    // Normalise and trim incoming values to avoid oversized payloads
    const sanitizedPath = path.split("?")[0].slice(0, 512);
    const sanitizedReferrer = referrer ? String(referrer).slice(0, 2048) : null;

    // Try to get current user info
    let userId: string | null = null;
    let userType: string | null = null;

    try {
      const userSupabase = await createClient();
      const {
        data: { user },
      } = await userSupabase.auth.getUser();

      if (user) {
        userId = user.id;

        // Check if tutor or student
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        userType = profile?.role || "tutor";
      }
    } catch {
      // User not authenticated - that's okay
    }

    // Insert page view
    const userAgent =
      request.headers.get("user-agent")?.slice(0, 512) || null;
    await supabase.from("page_views").insert({
      page_path: sanitizedPath,
      user_id: userId,
      user_type: userType,
      session_id: sessionId,
      referrer: sanitizedReferrer,
      user_agent: userAgent,
      ip_hash: anonymizeIP(request),
      device_type: parseDeviceType(userAgent),
    });

    const response = NextResponse.json({ success: true });
    return addRateLimitHeaders(response, rateLimitResult);
  } catch (error) {
    // Fail silently - analytics shouldn't break the app
    console.error("Page view tracking error:", error);
    return NextResponse.json({ success: false });
  }
}
