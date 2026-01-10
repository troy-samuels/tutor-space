"use server";

import { addDays, addMinutes } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { createClient } from "@/lib/supabase/server";
import type { AvailabilitySlotInput } from "@/lib/validators/availability";
import { generateBookingSlots } from "@/lib/utils/scheduling";
import { getCalendarBusyWindows } from "@/lib/calendar/busy-windows";

type BusyWindow = { start: string; end: string };

function formatSlotLabel(date: Date, timezone: string) {
  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const isTomorrow =
    date.getFullYear() === tomorrow.getFullYear() &&
    date.getMonth() === tomorrow.getMonth() &&
    date.getDate() === tomorrow.getDate();

  if (sameDay) {
    return `Today, ${formatInTimeZone(date, timezone, "h:mm a")}`;
  }
  if (isTomorrow) {
    return `Tomorrow, ${formatInTimeZone(date, timezone, "h:mm a")}`;
  }
  return formatInTimeZone(date, timezone, "EEE, MMM d h:mm a");
}

export async function getNextAvailableSlot(tutorId: string, viewerTimezone?: string) {
  const supabase = await createClient();

  // Tutor timezone fallback
  const { data: profile } = await supabase
    .from("profiles")
    .select("timezone, buffer_time_minutes")
    .eq("id", tutorId)
    .maybeSingle();
  const timezone = viewerTimezone || profile?.timezone || "UTC";
  const bufferMinutes = profile?.buffer_time_minutes ?? 0;
  const startRange = addDays(new Date(), -1);
  const endRange = addDays(new Date(), 8);

  // Availability (recurring rules)
  const { data: availabilityRows } = await supabase
    .from("availability")
    .select("day_of_week, start_time, end_time, is_available")
    .eq("tutor_id", tutorId)
    .eq("is_available", true);

  if (!availabilityRows || availabilityRows.length === 0) {
    return null;
  }

  const availability: AvailabilitySlotInput[] = availabilityRows.map((row: any) => ({
    day_of_week: row.day_of_week,
    start_time: row.start_time,
    end_time: row.end_time,
    is_available: row.is_available ?? true,
  }));

  // Bookings (future, pending/confirmed)
  const { data: bookings } = await supabase
    .from("bookings")
    .select("scheduled_at, duration_minutes, status")
    .eq("tutor_id", tutorId)
    .in("status", ["pending", "confirmed"])
    .gte("scheduled_at", startRange.toISOString())
    .lte("scheduled_at", endRange.toISOString());

  const busyFromBookings: BusyWindow[] =
    bookings?.map((b) => {
      if (!b.scheduled_at) return null;
      const start = new Date(b.scheduled_at as string);
      const end = addMinutes(start, Number(b.duration_minutes ?? 60));
      return { start: start.toISOString(), end: end.toISOString() };
    }).filter(Boolean) as BusyWindow[] ?? [];

  // Blocked times
  const { data: blocked } = await supabase
    .from("blocked_times")
    .select("start_time, end_time")
    .eq("tutor_id", tutorId)
    .lt("start_time", endRange.toISOString())
    .gt("end_time", startRange.toISOString());

  const busyFromBlocks: BusyWindow[] =
    blocked?.map((b) => (b.start_time && b.end_time ? { start: b.start_time as string, end: b.end_time as string } : null))
      .filter(Boolean) as BusyWindow[] ?? [];

  const externalBusy = await getCalendarBusyWindows({
    tutorId,
    start: startRange,
    days: 8,
  });

  const slots = generateBookingSlots({
    availability,
    timezone,
    days: 7,
    busyWindows: [...busyFromBookings, ...busyFromBlocks, ...externalBusy],
    bufferMinutes,
  });

  const next = slots.find((slot) => new Date(slot.start).getTime() > Date.now());
  if (!next) return null;

  return formatSlotLabel(new Date(next.start), timezone);
}
