"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { rescheduleBooking as rescheduleBookingAction } from "@/lib/actions/bookings";
import { getCalendarBusyWindowsWithStatus } from "@/lib/calendar/busy-windows";
import { validateBooking } from "@/lib/utils/booking-conflicts";
import { addMinutes } from "date-fns";
import { z } from "zod";
import type { RescheduleHistoryItem } from "@/lib/actions/types";

const rescheduleSchema = z.object({
  bookingId: z.string().uuid(),
  newScheduledAt: z.string().datetime(),
  reason: z.string().optional(),
  requestedBy: z.enum(["tutor", "student"]),
});

/**
 * Reschedule a booking to a new time
 */
export async function rescheduleBooking(
  data: z.infer<typeof rescheduleSchema>
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Validate input
  const result = rescheduleSchema.safeParse(data);
  if (!result.success) {
    return { success: false, error: result.error.issues[0].message };
  }

  const { bookingId, newScheduledAt, reason, requestedBy } = result.data;

  const actionResult = await rescheduleBookingAction({
    bookingId,
    newStart: newScheduledAt,
    requestedBy,
    reason,
  });

  if (actionResult.error) {
    return { success: false, error: actionResult.error };
  }

  return { success: true };
}

/**
 * Get reschedule history for a booking
 */
export async function getRescheduleHistory(
  bookingId: string
): Promise<RescheduleHistoryItem[]> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("booking_reschedule_history")
    .select("*")
    .eq("booking_id", bookingId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching reschedule history:", error);
    return [];
  }

  return data as RescheduleHistoryItem[];
}

/**
 * Check if a booking can be rescheduled
 */
export async function canRescheduleBooking(
  bookingId: string
): Promise<{ canReschedule: boolean; reason?: string }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { canReschedule: false, reason: "Not authenticated" };
  }

  const serviceClient = createServiceRoleClient();
  if (!serviceClient) {
    return { canReschedule: false, reason: "Database connection failed" };
  }

  const { data: booking, error } = await serviceClient
    .from("bookings")
    .select("id, status, scheduled_at, tutor_id, student_id, reschedule_count")
    .eq("id", bookingId)
    .single();

  if (error || !booking) {
    return { canReschedule: false, reason: "Booking not found" };
  }

  // Check status
  if (booking.status?.startsWith("cancelled")) {
    return { canReschedule: false, reason: "Cannot reschedule a cancelled booking" };
  }

  if (booking.status === "completed") {
    return { canReschedule: false, reason: "Cannot reschedule a completed booking" };
  }

  // Check if booking is in the past
  const scheduledDate = new Date(booking.scheduled_at);
  if (scheduledDate < new Date()) {
    return { canReschedule: false, reason: "Cannot reschedule a past booking" };
  }

  // Optional: Limit reschedules (configurable)
  const MAX_RESCHEDULES = 3;
  if (booking.reschedule_count >= MAX_RESCHEDULES) {
    return { canReschedule: false, reason: `Maximum reschedules (${MAX_RESCHEDULES}) reached` };
  }

  return { canReschedule: true };
}

/**
 * Get available times for rescheduling
 */
export async function getAvailableRescheduleTimes(
  bookingId: string,
  date: string
): Promise<{ times: string[]; error?: string }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { times: [], error: "Not authenticated" };
  }

  const serviceClient = createServiceRoleClient();
  if (!serviceClient) {
    return { times: [], error: "Database connection failed" };
  }

  // Get the booking
  const { data: booking, error: bookingError } = await serviceClient
    .from("bookings")
    .select("tutor_id, duration_minutes, timezone")
    .eq("id", bookingId)
    .single();

  if (bookingError || !booking) {
    return { times: [], error: "Booking not found" };
  }

  // Get tutor's availability for the day
  const targetDate = new Date(date);
  const dayOfWeek = targetDate.getDay();

  // Calculate day boundaries for queries
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  // Parallelize availability, existingBookings, tutorProfile, and busyWindows fetch
  const [availabilityResult, existingBookingsResult, tutorProfileResult, busyResult] = await Promise.all([
    serviceClient
      .from("availability")
      .select("day_of_week, start_time, end_time, is_available")
      .eq("tutor_id", booking.tutor_id)
      .eq("day_of_week", dayOfWeek)
      .eq("is_available", true),
    serviceClient
      .from("bookings")
      .select("scheduled_at, duration_minutes, status")
      .eq("tutor_id", booking.tutor_id)
      .neq("id", bookingId) // Exclude current booking
      .not("status", "in", '("cancelled","cancelled_by_tutor","cancelled_by_student")')
      .gte("scheduled_at", startOfDay.toISOString())
      .lte("scheduled_at", endOfDay.toISOString()),
    serviceClient
      .from("profiles")
      .select("buffer_time_minutes, timezone")
      .eq("id", booking.tutor_id)
      .single(),
    getCalendarBusyWindowsWithStatus({
      tutorId: booking.tutor_id,
      start: startOfDay,
      days: 2,
    }),
  ]);

  const availability = availabilityResult.data;
  const existingBookings = existingBookingsResult.data;
  const tutorProfile = tutorProfileResult.data;

  if (!availability || availability.length === 0) {
    return { times: [] };
  }

  const bufferMinutes = tutorProfile?.buffer_time_minutes ?? 0;
  const tutorTimezone = tutorProfile?.timezone || booking.timezone || "UTC";
  const blockedStart = addMinutes(startOfDay, -bufferMinutes);
  const blockedEnd = addMinutes(endOfDay, bufferMinutes);

  const { data: blockedTimes } = await serviceClient
    .from("blocked_times")
    .select("start_time, end_time")
    .eq("tutor_id", booking.tutor_id)
    .lt("start_time", blockedEnd.toISOString())
    .gt("end_time", blockedStart.toISOString());

  if (busyResult.unverifiedProviders.length) {
    return {
      times: [],
      error:
        "We couldn't verify your external calendar. Please refresh and try again, or reconnect your calendar.",
    };
  }

  if (busyResult.staleProviders.length) {
    return {
      times: [],
      error:
        "External calendar sync looks stale. Please refresh your calendar connection before rescheduling.",
    };
  }

  // Calculate available slots
  const availableTimes: string[] = [];
  const bookingDuration = booking.duration_minutes || 60;
  const durationMs = bookingDuration * 60 * 1000;
  const busyWindows = [
    ...busyResult.windows,
    ...(blockedTimes ?? [])
      .filter((block) => block.start_time && block.end_time)
      .map((block) => ({ start: block.start_time as string, end: block.end_time as string })),
  ];

  for (const slot of availability) {
    const [startHour, startMin] = slot.start_time.split(":").map(Number);
    const [endHour, endMin] = slot.end_time.split(":").map(Number);

    let slotTime = new Date(date);
    slotTime.setHours(startHour, startMin, 0, 0);

    const slotEnd = new Date(date);
    slotEnd.setHours(endHour, endMin, 0, 0);

    while (slotTime.getTime() + durationMs <= slotEnd.getTime()) {
      const slotEndTime = new Date(slotTime.getTime() + durationMs);

      const validation = validateBooking({
        scheduledAt: slotTime.toISOString(),
        durationMinutes: bookingDuration,
        availability: availability || [],
        existingBookings: existingBookings || [],
        bufferMinutes,
        busyWindows,
        timezone: tutorTimezone,
      });

      if (validation.isValid && slotTime > new Date()) {
        availableTimes.push(slotTime.toISOString());
      }

      // Move to next 30-minute slot
      slotTime = new Date(slotTime.getTime() + 30 * 60 * 1000);
    }
  }

  return { times: availableTimes };
}
