import { NextResponse } from "next/server";
import { processAutomationEvents } from "@/lib/actions/automations";

/**
 * Cron job to process pending automation events
 *
 * Handles all automation types:
 * - lesson_completed: Post-lesson follow-up messages
 * - student_inactive: Re-engagement messages for inactive students
 * - package_low_balance: Low package balance alerts
 * - trial_completed_no_purchase: Trial conversion nudges
 *
 * Features:
 * - Scheduled execution (scheduled_for support)
 * - Condition checking at send time
 * - Retry logic with exponential backoff
 * - Email suppression (opt-out) checking
 * - Configurable cooldowns per rule
 *
 * Should be called every 5 minutes via Vercel Cron or external service
 * Protected by CRON_SECRET environment variable
 *
 * @example
 * GET /api/cron/process-automations
 * Authorization: Bearer <CRON_SECRET>
 */
export async function GET(request: Request) {
  const startTime = Date.now();

  // Verify cron secret to prevent unauthorized access
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error("[Cron:process-automations] CRON_SECRET is not configured");
    return NextResponse.json(
      { error: "Cron secret not configured" },
      { status: 500 }
    );
  }

  const authHeader = request.headers.get("authorization");

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const results = await processAutomationEvents();

    const durationMs = Date.now() - startTime;

    console.info("[Cron:process-automations] Completed", {
      ...results,
      durationMs,
    });

    return NextResponse.json({
      success: true,
      results,
      duration_ms: durationMs,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Cron:process-automations] Error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
