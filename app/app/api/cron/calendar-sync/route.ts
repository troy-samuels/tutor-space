import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { getCalendarEventsWithDetails } from "@/lib/calendar/busy-windows";

function isUndefinedColumnError(error: unknown, column: string): boolean {
  if (!error || typeof error !== "object") return false;
  const maybeError = error as { code?: string; message?: string };
  if (maybeError.code !== "42703") return false;
  if (typeof maybeError.message !== "string") return false;
  return maybeError.message.includes(column);
}

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error("[CalendarSyncCron] CRON_SECRET is not configured. Aborting job.");
    return NextResponse.json({ error: "Cron secret not configured" }, { status: 500 });
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminClient = createServiceRoleClient();
  if (!adminClient) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 500 });
  }

  const primary = await adminClient
    .from("calendar_connections")
    .select("tutor_id")
    .or("sync_enabled.is.null,sync_enabled.eq.true");

  let data = primary.data;
  let error = primary.error;

  if (error && isUndefinedColumnError(error, "sync_enabled")) {
    const fallback = await adminClient.from("calendar_connections").select("tutor_id");
    data = fallback.data;
    error = fallback.error;
  }

  if (error) {
    console.error("[CalendarSyncCron] Failed to load calendar connections", error);
    return NextResponse.json({ error: "Failed to load calendar connections" }, { status: 500 });
  }

  const tutorIds = Array.from(
    new Set((data ?? []).map((row: { tutor_id: string | null }) => row.tutor_id).filter(Boolean))
  ) as string[];

  let successes = 0;
  let failures = 0;
  let eventsSynced = 0;

  for (const tutorId of tutorIds) {
    try {
      const events = await getCalendarEventsWithDetails({
        tutorId,
        start: new Date(),
        days: 60,
      });
      successes += 1;
      eventsSynced += events.length;
    } catch (err) {
      failures += 1;
      console.error(`[CalendarSyncCron] Failed to sync tutor ${tutorId}`, err);
    }
  }

  return NextResponse.json({
    processed: tutorIds.length,
    successes,
    failures,
    eventsSynced,
  });
}
