"use server";

import { createClient } from "@/lib/supabase/server";

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
  const { data: booking, error: fetchError } = await supabase
    .from("bookings")
    .select("id, tutor_id, scheduled_at, status")
    .eq("id", params.bookingId)
    .single();

  if (fetchError || !booking) {
    return { error: "Booking not found." };
  }

  if (booking.tutor_id !== user.id) {
    return { error: "You can only update your own bookings." };
  }

  // Don't allow updating cancelled bookings
  if (booking.status === "cancelled") {
    return { error: "Cannot update a cancelled booking." };
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

  return { success: true };
}
