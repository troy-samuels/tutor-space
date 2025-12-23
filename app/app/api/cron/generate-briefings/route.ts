/**
 * Cron Job: Generate Pre-Lesson Briefings
 *
 * Runs daily (or on demand) to generate AI-powered briefings for upcoming lessons.
 * Generates briefings for lessons scheduled within the next 24-48 hours.
 *
 * Schedule: Daily at 00:00 UTC via Vercel cron
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { generateBriefing, saveBriefing } from "@/lib/copilot/briefing-generator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutes

const BATCH_LIMIT = 20;

interface ProcessingResult {
  bookingId: string;
  studentName: string;
  success: boolean;
  error?: string;
}

export async function POST(request: NextRequest) {
  // Verify cron secret
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    console.error("[GenerateBriefings] Unauthorized request");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceRoleClient();
  if (!supabase) {
    console.error("[GenerateBriefings] No Supabase client");
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  const startTime = Date.now();
  const results: ProcessingResult[] = [];

  try {
    // Get briefing timing window (default 24 hours, configurable per tutor)
    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const in48Hours = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    // Find upcoming bookings for Studio-tier tutors that don't have briefings yet
    const { data: upcomingBookings, error: bookingsError } = await supabase
      .from("bookings")
      .select(`
        id,
        tutor_id,
        student_id,
        scheduled_at,
        students (
          id,
          full_name
        ),
        profiles!bookings_tutor_id_fkey (
          id,
          tier,
          copilot_settings
        )
      `)
      .in("status", ["confirmed", "pending"])
      .gte("scheduled_at", now.toISOString())
      .lte("scheduled_at", in48Hours.toISOString())
      .order("scheduled_at", { ascending: true })
      .limit(BATCH_LIMIT * 2); // Fetch more to account for filtering

    if (bookingsError) {
      console.error("[GenerateBriefings] Error fetching bookings:", bookingsError);
      return NextResponse.json({
        error: "Failed to fetch bookings",
        details: bookingsError.message,
      }, { status: 500 });
    }

    if (!upcomingBookings || upcomingBookings.length === 0) {
      return NextResponse.json({
        message: "No upcoming bookings to process",
        processed: 0,
        duration: Date.now() - startTime,
      });
    }

    // Filter to Studio-tier tutors only
    const studioBookings = upcomingBookings.filter((booking) => {
      const profile = booking.profiles as { tier?: string; copilot_settings?: { briefingsEnabled?: boolean } } | null;
      // Check tier is studio
      if (profile?.tier !== "studio") return false;
      // Check if briefings are enabled (default true)
      const settings = profile?.copilot_settings;
      if (settings?.briefingsEnabled === false) return false;
      return true;
    });

    if (studioBookings.length === 0) {
      return NextResponse.json({
        message: "No Studio-tier bookings to process",
        processed: 0,
        duration: Date.now() - startTime,
      });
    }

    // Check which bookings already have briefings
    const bookingIds = studioBookings.map((b) => b.id);
    const { data: existingBriefings } = await supabase
      .from("lesson_briefings")
      .select("booking_id")
      .in("booking_id", bookingIds);

    const existingBookingIds = new Set((existingBriefings || []).map((b) => b.booking_id));

    // Filter to bookings without briefings
    const bookingsToProcess = studioBookings
      .filter((b) => !existingBookingIds.has(b.id))
      .slice(0, BATCH_LIMIT);

    if (bookingsToProcess.length === 0) {
      return NextResponse.json({
        message: "All eligible bookings already have briefings",
        processed: 0,
        duration: Date.now() - startTime,
      });
    }

    // Process each booking
    for (const booking of bookingsToProcess) {
      const studentsData = booking.students;
      const student = Array.isArray(studentsData) ? studentsData[0] : studentsData;
      const studentName = (student as { full_name: string } | null)?.full_name || "Unknown";

      try {
        // Generate briefing
        const briefingData = await generateBriefing(booking.id);

        if (!briefingData) {
          results.push({
            bookingId: booking.id,
            studentName,
            success: false,
            error: "Failed to generate briefing data",
          });
          continue;
        }

        // Save to database
        const briefingId = await saveBriefing(briefingData);

        if (!briefingId) {
          results.push({
            bookingId: booking.id,
            studentName,
            success: false,
            error: "Failed to save briefing",
          });
          continue;
        }

        results.push({
          bookingId: booking.id,
          studentName,
          success: true,
        });

        // Log success
        await logProcessing(supabase, {
          entityType: "lesson_briefing",
          entityId: briefingId,
          level: "info",
          message: `Generated briefing for booking ${booking.id}`,
          meta: {
            studentId: booking.student_id,
            tutorId: booking.tutor_id,
            scheduledAt: booking.scheduled_at,
          },
        });
      } catch (error) {
        console.error(`[GenerateBriefings] Error processing booking ${booking.id}:`, error);
        results.push({
          bookingId: booking.id,
          studentName,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });

        // Log error
        await logProcessing(supabase, {
          entityType: "lesson_briefing",
          entityId: booking.id,
          level: "error",
          message: `Failed to generate briefing`,
          meta: {
            error: error instanceof Error ? error.message : "Unknown error",
          },
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;

    return NextResponse.json({
      message: `Processed ${results.length} bookings`,
      processed: results.length,
      success: successCount,
      failed: failureCount,
      duration: Date.now() - startTime,
      results,
    });
  } catch (error) {
    console.error("[GenerateBriefings] Unexpected error:", error);
    return NextResponse.json({
      error: "Unexpected error",
      details: error instanceof Error ? error.message : "Unknown error",
      duration: Date.now() - startTime,
    }, { status: 500 });
  }
}

// Also support GET for manual triggering via browser (with auth)
export async function GET(request: NextRequest) {
  // Only allow in development or with valid cron secret
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (process.env.NODE_ENV !== "development" && cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Use POST with authorization" }, { status: 405 });
  }

  // Convert to POST request
  return POST(request);
}

// =============================================================================
// HELPERS
// =============================================================================

async function logProcessing(
  client: ReturnType<typeof createServiceRoleClient>,
  params: {
    entityType: string;
    entityId: string;
    level: "info" | "warn" | "error";
    message: string;
    meta?: Record<string, unknown>;
  }
) {
  if (!client) return;

  try {
    await client.from("processing_logs").insert({
      entity_type: params.entityType,
      entity_id: params.entityId,
      level: params.level,
      message: params.message,
      meta: params.meta ?? {},
    });
  } catch (error) {
    console.error("[GenerateBriefings] Failed to log:", error);
  }
}
