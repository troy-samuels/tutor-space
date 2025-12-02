"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { checkBookingConflict } from "@/lib/utils/booking-conflicts";

const rescheduleSchema = z.object({
  bookingId: z.string().uuid(),
  newScheduledAt: z.string().datetime(),
  reason: z.string().optional(),
  requestedBy: z.enum(["tutor", "student"]),
});

export interface RescheduleHistoryItem {
  id: string;
  booking_id: string;
  previous_scheduled_at: string;
  new_scheduled_at: string;
  requested_by: "tutor" | "student";
  reason: string | null;
  created_at: string;
}

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

  const serviceClient = createServiceRoleClient();
  if (!serviceClient) {
    return { success: false, error: "Database connection failed" };
  }

  // Get the booking to verify ownership and get details
  const { data: booking, error: fetchError } = await serviceClient
    .from("bookings")
    .select("*, students(email, full_name), services(name)")
    .eq("id", bookingId)
    .single();

  if (fetchError || !booking) {
    return { success: false, error: "Booking not found" };
  }

  // Verify the user has permission (tutor or student who owns the booking)
  const isOwner = booking.tutor_id === user.id;

  // Check if user is the student
  const { data: studentRecord } = await serviceClient
    .from("students")
    .select("id")
    .eq("user_id", user.id)
    .eq("id", booking.student_id)
    .single();

  const isStudent = !!studentRecord;

  if (!isOwner && !isStudent) {
    return { success: false, error: "Not authorized to reschedule this booking" };
  }

  // Check if booking can be rescheduled (not cancelled or completed)
  if (booking.status === "cancelled" || booking.status === "completed") {
    return { success: false, error: "Cannot reschedule a cancelled or completed booking" };
  }

  // Get existing bookings to check for conflicts
  const { data: existingBookings } = await serviceClient
    .from("bookings")
    .select("id, scheduled_at, duration_minutes, status")
    .eq("tutor_id", booking.tutor_id)
    .neq("id", bookingId)
    .not("status", "in", '("cancelled_by_tutor","cancelled_by_student")');

  // Check for conflicts
  const conflictCheck = checkBookingConflict(
    newScheduledAt,
    booking.duration_minutes,
    existingBookings || []
  );

  if (conflictCheck.hasConflict) {
    return { success: false, error: conflictCheck.message || "The new time conflicts with existing bookings" };
  }

  // Update the booking
  const { error: updateError } = await serviceClient
    .from("bookings")
    .update({
      scheduled_at: newScheduledAt,
      reschedule_requested_at: new Date().toISOString(),
      reschedule_requested_by: requestedBy,
      reschedule_reason: reason || null,
    })
    .eq("id", bookingId);

  if (updateError) {
    console.error("Error rescheduling booking:", updateError);
    return { success: false, error: "Failed to reschedule booking" };
  }

  // Send notification emails (could be expanded)
  // For now, we'll let the caller handle notifications

  revalidatePath("/bookings");
  revalidatePath("/calendar");
  revalidatePath("/student-auth/bookings");

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
  if (booking.status === "cancelled") {
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

  const { data: availability } = await serviceClient
    .from("availability")
    .select("start_time, end_time")
    .eq("tutor_id", booking.tutor_id)
    .eq("day_of_week", dayOfWeek);

  if (!availability || availability.length === 0) {
    return { times: [] };
  }

  // Get existing bookings for that day
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const { data: existingBookings } = await serviceClient
    .from("bookings")
    .select("scheduled_at, duration_minutes")
    .eq("tutor_id", booking.tutor_id)
    .neq("id", bookingId) // Exclude current booking
    .neq("status", "cancelled")
    .gte("scheduled_at", startOfDay.toISOString())
    .lte("scheduled_at", endOfDay.toISOString());

  // Calculate available slots
  const availableTimes: string[] = [];
  const durationMs = booking.duration_minutes * 60 * 1000;

  for (const slot of availability) {
    const [startHour, startMin] = slot.start_time.split(":").map(Number);
    const [endHour, endMin] = slot.end_time.split(":").map(Number);

    let slotTime = new Date(date);
    slotTime.setHours(startHour, startMin, 0, 0);

    const slotEnd = new Date(date);
    slotEnd.setHours(endHour, endMin, 0, 0);

    while (slotTime.getTime() + durationMs <= slotEnd.getTime()) {
      const slotEndTime = new Date(slotTime.getTime() + durationMs);

      // Check for conflicts with existing bookings
      const hasConflict = existingBookings?.some((existing) => {
        const existingStart = new Date(existing.scheduled_at);
        const existingEnd = new Date(existingStart.getTime() + existing.duration_minutes * 60 * 1000);

        return (
          (slotTime >= existingStart && slotTime < existingEnd) ||
          (slotEndTime > existingStart && slotEndTime <= existingEnd) ||
          (slotTime <= existingStart && slotEndTime >= existingEnd)
        );
      });

      if (!hasConflict && slotTime > new Date()) {
        availableTimes.push(slotTime.toISOString());
      }

      // Move to next 30-minute slot
      slotTime = new Date(slotTime.getTime() + 30 * 60 * 1000);
    }
  }

  return { times: availableTimes };
}
