import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";

/**
 * Cron job to clean up old analytics data for GDPR compliance.
 *
 * Should be called daily via Vercel Cron or external service.
 * Deletes page_views and link_events older than RETENTION_DAYS.
 *
 * Protected by CRON_SECRET environment variable.
 *
 * Add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/cleanup-analytics",
 *     "schedule": "0 3 * * *"  // Daily at 3 AM UTC
 *   }]
 * }
 */

const RETENTION_DAYS = 90; // Keep 90 days of analytics data

export async function GET(request: Request) {
  // Verify cron secret to prevent unauthorized access
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error("[Cron] CRON_SECRET is not configured. Aborting cleanup job.");
    return NextResponse.json(
      { error: "Cron secret not configured" },
      { status: 500 }
    );
  }

  const authHeader = request.headers.get("authorization");

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminClient = createServiceRoleClient();

  if (!adminClient) {
    return NextResponse.json(
      { error: "Service unavailable" },
      { status: 500 }
    );
  }

  try {
    // Call the database function to clean up old analytics
    const { data, error } = await adminClient.rpc("cleanup_old_analytics", {
      retention_days: RETENTION_DAYS,
    });

    if (error) {
      console.error("[Cron] Analytics cleanup failed:", error);
      return NextResponse.json(
        { error: "Cleanup failed", details: error.message },
        { status: 500 }
      );
    }

    const deletedCount = data ?? 0;

    console.info(
      `[Cron] Analytics cleanup completed: ${deletedCount} records deleted (retention: ${RETENTION_DAYS} days)`
    );

    return NextResponse.json({
      success: true,
      deleted_count: deletedCount,
      retention_days: RETENTION_DAYS,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Cron] Error in cleanup-analytics cron:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
