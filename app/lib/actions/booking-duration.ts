"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { validateBooking } from "@/lib/utils/booking-conflicts";
import {
  getCalendarBusyWindowsWithStatus,
  updateCalendarEventForBooking,
} from "@/lib/calendar/busy-windows";

type BookingWithRelations = {
  id: string;
  tutor_id: string;
  scheduled_at: string;
  status: string | null;
  timezone: string | null;
  duration_minutes?: number | null;
  students?: { full_name: string | null; email: string | null } | { full_name: string | null; email: string | null }[] | null;
  services?: { name: string | null } | { name: string | null }[] | null;
};

/**
 * Update the duration of an existing booking
 * Only the tutor who owns the booking can update it
 */
export async function updateBookingDuration(params: {
  bookingId: string;
  durationMinutes: number;
}): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "You need to be signed in to update bookings." };
  }

  // Validate duration
  const validDurations = [15, 30, 45, 60, 90, 120, 180];
  if (!validDurations.includes(params.durationMinutes)) {
    return { error: "Invalid duration. Please select a valid duration." };
  }

  // Verify the booking exists and belongs to this tutor
  const { data: bookingData, error: fetchError } = await supabase
    .from("bookings")
    .select(
      `
      id,
      tutor_id,
      scheduled_at,
      duration_minutes,
      status,
      timezone,
      students (
        full_name,
        email
      ),
      services (
        name
      )
      `
    )
    .eq("id", params.bookingId)
    .single();

  const booking = bookingData as BookingWithRelations | null;

  if (fetchError || !booking) {
    return { error: "Booking not found." };
  }

  if (booking.tutor_id !== user.id) {
    return { error: "You can only update your own bookings." };
  }

  // Don't allow updating cancelled bookings
  if (booking.status?.startsWith("cancelled")) {
    return { error: "Cannot update a cancelled booking." };
  }

  if (booking.status === "completed") {
    return { error: "Cannot update a completed booking." };
  }

  const { data: tutorProfile } = await supabase
    .from("profiles")
    .select("buffer_time_minutes, timezone")
    .eq("id", booking.tutor_id)
    .single();

  const bufferMinutes = tutorProfile?.buffer_time_minutes ?? 0;
  const tutorTimezone = tutorProfile?.timezone || booking.timezone || "UTC";

  const { data: availability } = await supabase
    .from("availability")
    .select("day_of_week, start_time, end_time, is_available")
    .eq("tutor_id", booking.tutor_id)
    .eq("is_available", true);

  const { data: existingBookings } = await supabase
    .from("bookings")
    .select("id, scheduled_at, duration_minutes, status")
    .eq("tutor_id", booking.tutor_id)
    .in("status", ["pending", "confirmed"])
    .neq("id", params.bookingId)
    .gte("scheduled_at", new Date().toISOString());

  const busyResult = await getCalendarBusyWindowsWithStatus({
    tutorId: booking.tutor_id,
    start: new Date(booking.scheduled_at),
    days: 60,
  });

  if (busyResult.unverifiedProviders.length) {
    return {
      error:
        "We couldn't verify your external calendar. Please refresh and try again, or reconnect your calendar.",
    };
  }

  if (busyResult.staleProviders.length) {
    return {
      error:
        "External calendar sync looks stale. Please refresh your calendar connection before updating duration.",
    };
  }

  const validation = validateBooking({
    scheduledAt: booking.scheduled_at,
    durationMinutes: params.durationMinutes,
    availability: availability || [],
    existingBookings: existingBookings || [],
    bufferMinutes,
    busyWindows: busyResult.windows,
    timezone: tutorTimezone,
  });

  if (!validation.isValid) {
    return { error: validation.errors.join(" ") };
  }

  // Update the duration
  const { error: updateError } = await supabase
    .from("bookings")
    .update({
      duration_minutes: params.durationMinutes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.bookingId)
    .eq("tutor_id", user.id);

  if (updateError) {
    console.error("Failed to update booking duration:", updateError);
    return { error: "Failed to update duration. Please try again." };
  }

  if (booking.status === "confirmed" || booking.status === "completed") {
    try {
      const startDate = new Date(booking.scheduled_at);
      const endDate = new Date(startDate.getTime() + params.durationMinutes * 60000);
      const previousEndDate = new Date(
        startDate.getTime() + (booking.duration_minutes ?? params.durationMinutes) * 60000
      );
      const studentName =
        (Array.isArray(booking.students) ? booking.students[0]?.full_name : booking.students?.full_name) ||
        "Student";
      const serviceName =
        (Array.isArray(booking.services) ? booking.services[0]?.name : booking.services?.name) || "Lesson";

      const descriptionLines = [
        `TutorLingua booking - ${serviceName}`,
        `Student: ${studentName}`,
        `Booking ID: ${booking.id}`,
      ];

      await updateCalendarEventForBooking({
        tutorId: booking.tutor_id,
        bookingId: booking.id,
        title: `${serviceName} with ${studentName}`,
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        previousStart: startDate.toISOString(),
        previousEnd: previousEndDate.toISOString(),
        description: descriptionLines.join("\n"),
        studentEmail:
          (Array.isArray(booking.students) ? booking.students[0]?.email : booking.students?.email) ||
          undefined,
        timezone: tutorTimezone,
        createIfMissing: true,
      });
    } catch (calendarError) {
      console.error("[updateBookingDuration] Failed to update calendar event", calendarError);
    }
  }

  revalidatePath("/bookings");
  revalidatePath("/calendar");

  return { success: true };
}
