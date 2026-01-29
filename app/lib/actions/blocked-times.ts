"use server";

import { revalidatePath } from "next/cache";
import { requireTutor } from "@/lib/auth/guards";
import {
  createCalendarEventForBlockedTime,
  deleteCalendarEventsForBlockedTime,
} from "@/lib/calendar/busy-windows";

type BlockedTimeInput = {
  startTime: string;  // ISO date string
  endTime: string;    // ISO date string
  label?: string;
};

type BlockedTimeResult = {
  success: boolean;
  id?: string;
  error?: string;
};

// Create a new blocked time
export async function createBlockedTime(
  input: BlockedTimeInput
): Promise<BlockedTimeResult> {
  const { supabase, user } = await requireTutor();

  if (!user) {
    return { success: false, error: "Authentication required" };
  }

  const startTime = new Date(input.startTime);
  const endTime = new Date(input.endTime);

  // Validate time range
  if (endTime <= startTime) {
    return { success: false, error: "End time must be after start time" };
  }

  // Check for overlapping blocked times
  const { data: existing } = await supabase
    .from("blocked_times")
    .select("id")
    .eq("tutor_id", user.id)
    .lt("start_time", endTime.toISOString())
    .gt("end_time", startTime.toISOString())
    .limit(1);

  if (existing && existing.length > 0) {
    return { success: false, error: "This time overlaps with an existing blocked time" };
  }

  // Get tutor's timezone for calendar event
  const { data: profile } = await supabase
    .from("profiles")
    .select("timezone")
    .eq("id", user.id)
    .single();

  const { data, error } = await supabase
    .from("blocked_times")
    .insert({
      tutor_id: user.id,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      label: input.label || null,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[BlockedTimes] Failed to create", error);
    return { success: false, error: "Failed to create blocked time" };
  }

  // Sync to Google/Outlook Calendar (fire and forget, don't block on failure)
  try {
    const calendarResult = await createCalendarEventForBlockedTime({
      tutorId: user.id,
      blockedTimeId: data.id,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      label: input.label,
      timezone: profile?.timezone || undefined,
    });

    // Update blocked_times with external calendar event IDs
    if (calendarResult.googleEventId || calendarResult.outlookEventId) {
      await supabase
        .from("blocked_times")
        .update({
          google_event_id: calendarResult.googleEventId || null,
          outlook_event_id: calendarResult.outlookEventId || null,
        })
        .eq("id", data.id);
    }
  } catch (err) {
    // Log but don't fail - calendar sync is best-effort
    console.error("[BlockedTimes] Calendar sync failed:", err);
  }

  revalidatePath("/calendar");
  revalidatePath("/bookings");

  return { success: true, id: data.id };
}

// Update an existing blocked time
export async function updateBlockedTime(
  id: string,
  input: Partial<BlockedTimeInput>
): Promise<BlockedTimeResult> {
  const { supabase, user } = await requireTutor();

  if (!user) {
    return { success: false, error: "Authentication required" };
  }

  const updateData: Record<string, unknown> = {};

  if (input.startTime) {
    updateData.start_time = new Date(input.startTime).toISOString();
  }
  if (input.endTime) {
    updateData.end_time = new Date(input.endTime).toISOString();
  }
  if (input.label !== undefined) {
    updateData.label = input.label || null;
  }

  // Validate time range if both are provided
  if (input.startTime && input.endTime) {
    const startTime = new Date(input.startTime);
    const endTime = new Date(input.endTime);
    if (endTime <= startTime) {
      return { success: false, error: "End time must be after start time" };
    }
  }

  const { error } = await supabase
    .from("blocked_times")
    .update(updateData)
    .eq("id", id)
    .eq("tutor_id", user.id);

  if (error) {
    console.error("[BlockedTimes] Failed to update", error);
    return { success: false, error: "Failed to update blocked time" };
  }

  revalidatePath("/calendar");
  revalidatePath("/bookings");

  return { success: true, id };
}

// Delete a blocked time
export async function deleteBlockedTime(id: string): Promise<BlockedTimeResult> {
  const { supabase, user } = await requireTutor();

  if (!user) {
    return { success: false, error: "Authentication required" };
  }

  // First, fetch the blocked time to get the calendar event IDs
  const { data: blockedTime } = await supabase
    .from("blocked_times")
    .select("id, google_event_id, outlook_event_id")
    .eq("id", id)
    .eq("tutor_id", user.id)
    .single();

  if (!blockedTime) {
    return { success: false, error: "Blocked time not found" };
  }

  // Delete from external calendars first (fire and forget)
  if (blockedTime.google_event_id || blockedTime.outlook_event_id) {
    try {
      await deleteCalendarEventsForBlockedTime(
        user.id,
        blockedTime.google_event_id,
        blockedTime.outlook_event_id
      );
    } catch (err) {
      // Log but don't fail - calendar sync is best-effort
      console.error("[BlockedTimes] Calendar delete failed:", err);
    }
  }

  const { error } = await supabase
    .from("blocked_times")
    .delete()
    .eq("id", id)
    .eq("tutor_id", user.id);

  if (error) {
    console.error("[BlockedTimes] Failed to delete", error);
    return { success: false, error: "Failed to delete blocked time" };
  }

  revalidatePath("/calendar");
  revalidatePath("/bookings");

  return { success: true };
}

// Get all blocked times for a date range
export async function getBlockedTimes(start: string, end: string) {
  const { supabase, user } = await requireTutor();

  if (!user) {
    return { blockedTimes: [], error: "Authentication required" };
  }

  const { data, error } = await supabase
    .from("blocked_times")
    .select("id, start_time, end_time, label")
    .eq("tutor_id", user.id)
    .gte("start_time", start)
    .lte("end_time", end)
    .order("start_time", { ascending: true });

  if (error) {
    console.error("[BlockedTimes] Failed to fetch", error);
    return { blockedTimes: [], error: "Failed to fetch blocked times" };
  }

  return {
    blockedTimes: data.map((item: { id: string; start_time: string; end_time: string; label: string | null }) => ({
      id: item.id,
      startTime: item.start_time,
      endTime: item.end_time,
      label: item.label,
    })),
  };
}
