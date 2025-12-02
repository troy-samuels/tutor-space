import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { createServiceRoleClient } from "@/lib/supabase/admin";

interface ServiceStatus {
  id: string;
  status: "operational" | "degraded" | "outage" | "unknown";
  message: string | null;
  last_check_at: string | null;
  last_error: string | null;
  consecutive_failures: number;
}

interface HealthOverview {
  overall_status: "operational" | "degraded" | "outage";
  services: ServiceStatus[];
  last_check: string;
  error_count_24h: number;
  metrics_summary: {
    api_requests_24h: number;
    avg_response_time_ms: number;
    error_rate_percent: number;
  };
}

/**
 * GET /api/admin/health
 * Get current system health status and overview
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const supabase = createServiceRoleClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 });
    }

    // Fetch current service statuses
    const { data: services, error: servicesError } = await supabase
      .from("system_status")
      .select("*")
      .order("id");

    if (servicesError) {
      console.error("Error fetching service status:", servicesError);
    }

    const serviceList = (services || []) as ServiceStatus[];

    // Calculate overall status
    let overall_status: "operational" | "degraded" | "outage" = "operational";
    const hasOutage = serviceList.some((s) => s.status === "outage");
    const hasDegraded = serviceList.some((s) => s.status === "degraded");

    if (hasOutage) {
      overall_status = "outage";
    } else if (hasDegraded) {
      overall_status = "degraded";
    }

    // Get error count from last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: errorCount } = await supabase
      .from("system_error_log")
      .select("*", { count: "exact", head: true })
      .gte("created_at", twentyFourHoursAgo);

    // Get metrics summary (from system_metrics table if available)
    const { data: metricsData } = await supabase
      .from("system_metrics")
      .select("metric_type, value")
      .gte("recorded_at", twentyFourHoursAgo)
      .in("metric_type", ["api_response", "error_rate"]);

    // Calculate metrics summary
    let apiRequests24h = 0;
    let totalResponseTime = 0;
    let responseTimeCount = 0;
    let errorCount24h = 0;

    if (metricsData) {
      for (const metric of metricsData) {
        if (metric.metric_type === "api_response") {
          apiRequests24h++;
          totalResponseTime += Number(metric.value);
          responseTimeCount++;
        } else if (metric.metric_type === "error_rate") {
          errorCount24h += Number(metric.value);
        }
      }
    }

    const response: HealthOverview = {
      overall_status,
      services: serviceList,
      last_check: new Date().toISOString(),
      error_count_24h: errorCount || 0,
      metrics_summary: {
        api_requests_24h: apiRequests24h,
        avg_response_time_ms:
          responseTimeCount > 0 ? Math.round(totalResponseTime / responseTimeCount) : 0,
        error_rate_percent:
          apiRequests24h > 0 ? Math.round((errorCount24h / apiRequests24h) * 100 * 100) / 100 : 0,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error in health API:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch health status" },
      { status: error instanceof Error && error.message.includes("authentication") ? 401 : 500 }
    );
  }
}

/**
 * POST /api/admin/health/check
 * Trigger a manual health check of all services
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);

    const supabase = createServiceRoleClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 });
    }

    const results: Record<string, { status: string; latency_ms?: number; error?: string }> = {};

    // Check database
    const dbStart = Date.now();
    try {
      await supabase.from("profiles").select("id").limit(1);
      results.database = { status: "operational", latency_ms: Date.now() - dbStart };
      await supabase
        .from("system_status")
        .update({
          status: "operational",
          last_check_at: new Date().toISOString(),
          last_error: null,
          consecutive_failures: 0,
        })
        .eq("id", "database");
    } catch (err) {
      results.database = { status: "outage", error: String(err) };
      await supabase
        .from("system_status")
        .update({
          status: "outage",
          last_check_at: new Date().toISOString(),
          last_error: String(err),
          consecutive_failures: 1,
        })
        .eq("id", "database");
    }

    // Check Stripe (just verify we have the API key configured)
    if (process.env.STRIPE_SECRET_KEY) {
      results.stripe = { status: "operational" };
      await supabase
        .from("system_status")
        .update({
          status: "operational",
          last_check_at: new Date().toISOString(),
          last_error: null,
        })
        .eq("id", "stripe");
    } else {
      results.stripe = { status: "degraded", error: "API key not configured" };
      await supabase
        .from("system_status")
        .update({
          status: "degraded",
          last_check_at: new Date().toISOString(),
          last_error: "API key not configured",
        })
        .eq("id", "stripe");
    }

    // Check Resend
    if (process.env.RESEND_API_KEY) {
      results.resend = { status: "operational" };
      await supabase
        .from("system_status")
        .update({
          status: "operational",
          last_check_at: new Date().toISOString(),
          last_error: null,
        })
        .eq("id", "resend");
    } else {
      results.resend = { status: "degraded", error: "API key not configured" };
      await supabase
        .from("system_status")
        .update({
          status: "degraded",
          last_check_at: new Date().toISOString(),
          last_error: "API key not configured",
        })
        .eq("id", "resend");
    }

    // Check storage (list buckets)
    try {
      const { data: buckets, error: storageError } = await supabase.storage.listBuckets();
      if (storageError) throw storageError;
      results.storage = { status: "operational" };
      await supabase
        .from("system_status")
        .update({
          status: "operational",
          last_check_at: new Date().toISOString(),
          last_error: null,
        })
        .eq("id", "storage");
    } catch (err) {
      results.storage = { status: "degraded", error: String(err) };
      await supabase
        .from("system_status")
        .update({
          status: "degraded",
          last_check_at: new Date().toISOString(),
          last_error: String(err),
        })
        .eq("id", "storage");
    }

    // Check Google Calendar (just check config)
    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
      results.google_calendar = { status: "operational" };
      await supabase
        .from("system_status")
        .update({
          status: "operational",
          last_check_at: new Date().toISOString(),
          last_error: null,
        })
        .eq("id", "google_calendar");
    } else {
      results.google_calendar = { status: "unknown", error: "Not configured" };
      await supabase
        .from("system_status")
        .update({
          status: "unknown",
          last_check_at: new Date().toISOString(),
          last_error: "Not configured",
        })
        .eq("id", "google_calendar");
    }

    // Check Outlook Calendar (just check config)
    if (process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET) {
      results.outlook_calendar = { status: "operational" };
      await supabase
        .from("system_status")
        .update({
          status: "operational",
          last_check_at: new Date().toISOString(),
          last_error: null,
        })
        .eq("id", "outlook_calendar");
    } else {
      results.outlook_calendar = { status: "unknown", error: "Not configured" };
      await supabase
        .from("system_status")
        .update({
          status: "unknown",
          last_check_at: new Date().toISOString(),
          last_error: "Not configured",
        })
        .eq("id", "outlook_calendar");
    }

    return NextResponse.json({
      success: true,
      checked_at: new Date().toISOString(),
      results,
    });
  } catch (error) {
    console.error("Error in health check:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Health check failed" },
      { status: error instanceof Error && error.message.includes("authentication") ? 401 : 500 }
    );
  }
}
