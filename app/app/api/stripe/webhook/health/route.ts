import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { validateWebhookConfig } from "@/lib/stripe/webhook-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type HealthStatus = "healthy" | "degraded" | "unhealthy";

interface WebhookHealthResponse {
  status: HealthStatus;
  secretConfigured: boolean;
  configIssues: string[];
  lastEventAt: string | null;
  lastEventType: string | null;
  eventsLast24h: number;
  failedEventsLast24h: number;
  processingEventsCount: number;
  avgProcessingTimeMs: number | null;
  timestamp: string;
}

/**
 * GET /api/stripe/webhook/health
 *
 * Health check endpoint for Stripe webhook monitoring.
 * Returns configuration status and recent event statistics.
 *
 * Use this endpoint for:
 * - External monitoring (Datadog, PagerDuty, etc.)
 * - Debugging webhook issues
 * - Verifying configuration after deployment
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const timestamp = new Date().toISOString();

  // Check webhook configuration
  const config = validateWebhookConfig();
  const configIssues = config.issues.map((i) => `${i.code}: ${i.message}`);

  // If not configured, return unhealthy immediately
  if (!config.isConfigured) {
    return NextResponse.json<WebhookHealthResponse>({
      status: "unhealthy",
      secretConfigured: false,
      configIssues,
      lastEventAt: null,
      lastEventType: null,
      eventsLast24h: 0,
      failedEventsLast24h: 0,
      processingEventsCount: 0,
      avgProcessingTimeMs: null,
      timestamp,
    });
  }

  // Get database stats
  const supabase = createServiceRoleClient();

  if (!supabase) {
    return NextResponse.json<WebhookHealthResponse>({
      status: "unhealthy",
      secretConfigured: true,
      configIssues: [...configIssues, "DATABASE_UNAVAILABLE: Cannot connect to database"],
      lastEventAt: null,
      lastEventType: null,
      eventsLast24h: 0,
      failedEventsLast24h: 0,
      processingEventsCount: 0,
      avgProcessingTimeMs: null,
      timestamp,
    });
  }

  // Query recent events (last 24 hours)
  const twentyFourHoursAgo = new Date(
    Date.now() - 24 * 60 * 60 * 1000
  ).toISOString();

  // Get last processed event
  const { data: lastEvent } = await supabase
    .from("processed_stripe_events")
    .select("processed_at, event_type")
    .eq("status", "processed")
    .order("processed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Count events in last 24 hours
  const { count: totalEvents } = await supabase
    .from("processed_stripe_events")
    .select("*", { count: "exact", head: true })
    .gte("processed_at", twentyFourHoursAgo);

  // Count failed events in last 24 hours
  const { count: failedEvents } = await supabase
    .from("processed_stripe_events")
    .select("*", { count: "exact", head: true })
    .eq("status", "failed")
    .gte("updated_at", twentyFourHoursAgo);

  // Count currently processing events (stuck events indicator)
  const { count: processingEvents } = await supabase
    .from("processed_stripe_events")
    .select("*", { count: "exact", head: true })
    .eq("status", "processing");

  // Calculate average processing time if we have the field
  // Note: This requires the migration to add processing_duration_ms
  let avgProcessingTimeMs: number | null = null;
  try {
    const { data: avgData } = await supabase
      .from("processed_stripe_events")
      .select("processing_duration_ms")
      .eq("status", "processed")
      .gte("processed_at", twentyFourHoursAgo)
      .not("processing_duration_ms", "is", null)
      .limit(100);

    if (avgData && avgData.length > 0) {
      const durations = avgData
        .map((d) => d.processing_duration_ms)
        .filter((d): d is number => d !== null);
      if (durations.length > 0) {
        avgProcessingTimeMs = Math.round(
          durations.reduce((a, b) => a + b, 0) / durations.length
        );
      }
    }
  } catch {
    // Column may not exist yet before migration
  }

  // Determine health status
  let status: HealthStatus = "healthy";

  // Degraded: Has config warnings or some failures
  if (config.issues.length > 0 || (failedEvents ?? 0) > 0) {
    status = "degraded";
  }

  // Unhealthy: High failure rate or stuck events
  const failureRate =
    (totalEvents ?? 0) > 0
      ? (failedEvents ?? 0) / (totalEvents ?? 1)
      : 0;

  if (failureRate > 0.1 || (processingEvents ?? 0) > 5) {
    status = "unhealthy";
  }

  // Also unhealthy if no events in 24 hours and we expect traffic
  // (This could be normal for low-traffic sites, so it's a soft signal)

  return NextResponse.json<WebhookHealthResponse>({
    status,
    secretConfigured: true,
    configIssues,
    lastEventAt: lastEvent?.processed_at ?? null,
    lastEventType: lastEvent?.event_type ?? null,
    eventsLast24h: totalEvents ?? 0,
    failedEventsLast24h: failedEvents ?? 0,
    processingEventsCount: processingEvents ?? 0,
    avgProcessingTimeMs,
    timestamp,
  });
}
