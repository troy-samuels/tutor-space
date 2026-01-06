"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type {
  SchedulingPreferences,
  RecurringBlockedTime,
  RecurringBlockedTimeInput,
  TimeOffPeriod,
  TimeOffPeriodInput,
  ExpandedRecurringBlock,
} from "@/lib/actions/types";

async function requireTutor() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { supabase, user: null as null };
  }

  return { supabase, user };
}

// ============================================
// SCHEDULING PREFERENCES
// ============================================

export async function getSchedulingPreferences(): Promise<{
  preferences: SchedulingPreferences | null;
  error?: string;
}> {
  const { supabase, user } = await requireTutor();

  if (!user) {
    return { preferences: null, error: "Authentication required" };
  }

  const { data, error } = await supabase
    .from("profiles")
    .select(
      "max_lessons_per_day, max_lessons_per_week, advance_booking_days_min, advance_booking_days_max, buffer_time_minutes"
    )
    .eq("id", user.id)
    .single();

  if (error) {
    console.error("[CalendarSettings] Failed to fetch preferences", error);
    return { preferences: null, error: "Failed to fetch preferences" };
  }

  return {
    preferences: {
      maxLessonsPerDay: data.max_lessons_per_day,
      maxLessonsPerWeek: data.max_lessons_per_week,
      advanceBookingDaysMin: data.advance_booking_days_min ?? 1,
      advanceBookingDaysMax: data.advance_booking_days_max ?? 60,
      bufferTimeMinutes: data.buffer_time_minutes ?? 0,
    },
  };
}

export async function saveSchedulingPreferences(
  preferences: Partial<SchedulingPreferences>
): Promise<{ success?: boolean; error?: string }> {
  const { supabase, user } = await requireTutor();

  if (!user) {
    return { error: "Authentication required" };
  }

  const updateData: Record<string, unknown> = {};

  if (preferences.maxLessonsPerDay !== undefined) {
    updateData.max_lessons_per_day = preferences.maxLessonsPerDay;
  }
  if (preferences.maxLessonsPerWeek !== undefined) {
    updateData.max_lessons_per_week = preferences.maxLessonsPerWeek;
  }
  if (preferences.advanceBookingDaysMin !== undefined) {
    updateData.advance_booking_days_min = preferences.advanceBookingDaysMin;
  }
  if (preferences.advanceBookingDaysMax !== undefined) {
    updateData.advance_booking_days_max = preferences.advanceBookingDaysMax;
  }
  if (preferences.bufferTimeMinutes !== undefined) {
    updateData.buffer_time_minutes = preferences.bufferTimeMinutes;
  }

  const { error } = await supabase
    .from("profiles")
    .update(updateData)
    .eq("id", user.id);

  if (error) {
    console.error("[CalendarSettings] Failed to save preferences", error);
    return { error: "Failed to save preferences" };
  }

  revalidatePath("/settings/calendar");
  revalidatePath("/calendar");
  revalidatePath("/bookings");

  return { success: true };
}

// ============================================
// RECURRING BLOCKED TIMES
// ============================================

export async function listRecurringBlockedTimes(): Promise<{
  items: RecurringBlockedTime[];
  error?: string;
}> {
  const { supabase, user } = await requireTutor();

  if (!user) {
    return { items: [], error: "Authentication required" };
  }

  const { data, error } = await supabase
    .from("recurring_blocked_times")
    .select("*")
    .eq("tutor_id", user.id)
    .order("day_of_week")
    .order("start_time");

  if (error) {
    console.error("[CalendarSettings] Failed to list recurring blocks", error);
    return { items: [], error: "Failed to fetch recurring blocked times" };
  }

  return {
    items: data.map((item) => ({
      id: item.id,
      dayOfWeek: item.day_of_week,
      startTime: item.start_time,
      endTime: item.end_time,
      label: item.label,
      isActive: item.is_active,
      effectiveFrom: item.effective_from,
      effectiveUntil: item.effective_until,
      createdAt: item.created_at,
    })),
  };
}

export async function createRecurringBlockedTime(
  input: RecurringBlockedTimeInput
): Promise<{ id?: string; error?: string }> {
  const { supabase, user } = await requireTutor();

  if (!user) {
    return { error: "Authentication required" };
  }

  // Validate day of week
  if (input.dayOfWeek < 0 || input.dayOfWeek > 6) {
    return { error: "Invalid day of week" };
  }

  // Validate time format
  const timeRegex = /^\d{2}:\d{2}$/;
  if (!timeRegex.test(input.startTime) || !timeRegex.test(input.endTime)) {
    return { error: "Invalid time format. Use HH:MM" };
  }

  const { data, error } = await supabase
    .from("recurring_blocked_times")
    .insert({
      tutor_id: user.id,
      day_of_week: input.dayOfWeek,
      start_time: input.startTime,
      end_time: input.endTime,
      label: input.label || null,
      is_active: input.isActive ?? true,
      effective_from: input.effectiveFrom || null,
      effective_until: input.effectiveUntil || null,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[CalendarSettings] Failed to create recurring block", error);
    if (error.code === "23514") {
      return { error: "End time must be after start time" };
    }
    return { error: "Failed to create recurring blocked time" };
  }

  revalidatePath("/settings/calendar");
  revalidatePath("/calendar");

  return { id: data.id };
}

export async function updateRecurringBlockedTime(
  id: string,
  input: Partial<RecurringBlockedTimeInput>
): Promise<{ success?: boolean; error?: string }> {
  const { supabase, user } = await requireTutor();

  if (!user) {
    return { error: "Authentication required" };
  }

  const updateData: Record<string, unknown> = {};

  if (input.dayOfWeek !== undefined) {
    if (input.dayOfWeek < 0 || input.dayOfWeek > 6) {
      return { error: "Invalid day of week" };
    }
    updateData.day_of_week = input.dayOfWeek;
  }
  if (input.startTime !== undefined) {
    updateData.start_time = input.startTime;
  }
  if (input.endTime !== undefined) {
    updateData.end_time = input.endTime;
  }
  if (input.label !== undefined) {
    updateData.label = input.label || null;
  }
  if (input.isActive !== undefined) {
    updateData.is_active = input.isActive;
  }
  if (input.effectiveFrom !== undefined) {
    updateData.effective_from = input.effectiveFrom || null;
  }
  if (input.effectiveUntil !== undefined) {
    updateData.effective_until = input.effectiveUntil || null;
  }

  const { error } = await supabase
    .from("recurring_blocked_times")
    .update(updateData)
    .eq("id", id)
    .eq("tutor_id", user.id);

  if (error) {
    console.error("[CalendarSettings] Failed to update recurring block", error);
    if (error.code === "23514") {
      return { error: "End time must be after start time" };
    }
    return { error: "Failed to update recurring blocked time" };
  }

  revalidatePath("/settings/calendar");
  revalidatePath("/calendar");

  return { success: true };
}

export async function deleteRecurringBlockedTime(
  id: string
): Promise<{ success?: boolean; error?: string }> {
  const { supabase, user } = await requireTutor();

  if (!user) {
    return { error: "Authentication required" };
  }

  const { error } = await supabase
    .from("recurring_blocked_times")
    .delete()
    .eq("id", id)
    .eq("tutor_id", user.id);

  if (error) {
    console.error("[CalendarSettings] Failed to delete recurring block", error);
    return { error: "Failed to delete recurring blocked time" };
  }

  revalidatePath("/settings/calendar");
  revalidatePath("/calendar");

  return { success: true };
}

// ============================================
// TIME-OFF PERIODS
// ============================================

export async function listTimeOffPeriods(): Promise<{
  items: TimeOffPeriod[];
  error?: string;
}> {
  const { supabase, user } = await requireTutor();

  if (!user) {
    return { items: [], error: "Authentication required" };
  }

  const { data, error } = await supabase
    .from("time_off_periods")
    .select("*")
    .eq("tutor_id", user.id)
    .order("start_date", { ascending: true });

  if (error) {
    console.error("[CalendarSettings] Failed to list time-off periods", error);
    return { items: [], error: "Failed to fetch time-off periods" };
  }

  return {
    items: data.map((item) => ({
      id: item.id,
      name: item.name,
      startDate: item.start_date,
      endDate: item.end_date,
      allDay: item.all_day,
      startTime: item.start_time,
      endTime: item.end_time,
      showOnCalendar: item.show_on_calendar,
      blockBookings: item.block_bookings,
      createdAt: item.created_at,
    })),
  };
}

export async function createTimeOffPeriod(
  input: TimeOffPeriodInput
): Promise<{ id?: string; error?: string }> {
  const { supabase, user } = await requireTutor();

  if (!user) {
    return { error: "Authentication required" };
  }

  if (!input.name?.trim()) {
    return { error: "Name is required" };
  }

  const { data, error } = await supabase
    .from("time_off_periods")
    .insert({
      tutor_id: user.id,
      name: input.name.trim(),
      start_date: input.startDate,
      end_date: input.endDate,
      all_day: input.allDay ?? true,
      start_time: input.allDay ? null : input.startTime || null,
      end_time: input.allDay ? null : input.endTime || null,
      show_on_calendar: input.showOnCalendar ?? true,
      block_bookings: input.blockBookings ?? true,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[CalendarSettings] Failed to create time-off period", error);
    if (error.code === "23514") {
      return { error: "End date must be on or after start date" };
    }
    return { error: "Failed to create time-off period" };
  }

  revalidatePath("/settings/calendar");
  revalidatePath("/calendar");

  return { id: data.id };
}

export async function updateTimeOffPeriod(
  id: string,
  input: Partial<TimeOffPeriodInput>
): Promise<{ success?: boolean; error?: string }> {
  const { supabase, user } = await requireTutor();

  if (!user) {
    return { error: "Authentication required" };
  }

  const updateData: Record<string, unknown> = {};

  if (input.name !== undefined) {
    if (!input.name?.trim()) {
      return { error: "Name is required" };
    }
    updateData.name = input.name.trim();
  }
  if (input.startDate !== undefined) {
    updateData.start_date = input.startDate;
  }
  if (input.endDate !== undefined) {
    updateData.end_date = input.endDate;
  }
  if (input.allDay !== undefined) {
    updateData.all_day = input.allDay;
    if (input.allDay) {
      updateData.start_time = null;
      updateData.end_time = null;
    }
  }
  if (input.startTime !== undefined && input.allDay !== true) {
    updateData.start_time = input.startTime || null;
  }
  if (input.endTime !== undefined && input.allDay !== true) {
    updateData.end_time = input.endTime || null;
  }
  if (input.showOnCalendar !== undefined) {
    updateData.show_on_calendar = input.showOnCalendar;
  }
  if (input.blockBookings !== undefined) {
    updateData.block_bookings = input.blockBookings;
  }

  const { error } = await supabase
    .from("time_off_periods")
    .update(updateData)
    .eq("id", id)
    .eq("tutor_id", user.id);

  if (error) {
    console.error("[CalendarSettings] Failed to update time-off period", error);
    if (error.code === "23514") {
      return { error: "Invalid date or time range" };
    }
    return { error: "Failed to update time-off period" };
  }

  revalidatePath("/settings/calendar");
  revalidatePath("/calendar");

  return { success: true };
}

export async function deleteTimeOffPeriod(
  id: string
): Promise<{ success?: boolean; error?: string }> {
  const { supabase, user } = await requireTutor();

  if (!user) {
    return { error: "Authentication required" };
  }

  const { error } = await supabase
    .from("time_off_periods")
    .delete()
    .eq("id", id)
    .eq("tutor_id", user.id);

  if (error) {
    console.error("[CalendarSettings] Failed to delete time-off period", error);
    return { error: "Failed to delete time-off period" };
  }

  revalidatePath("/settings/calendar");
  revalidatePath("/calendar");

  return { success: true };
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

export async function expandRecurringBlocksForRange(
  startDate: string,
  endDate: string
): Promise<{ blocks: ExpandedRecurringBlock[]; error?: string }> {
  const { supabase, user } = await requireTutor();

  if (!user) {
    return { blocks: [], error: "Authentication required" };
  }

  const { data, error } = await supabase.rpc("expand_recurring_blocks_for_range", {
    p_tutor_id: user.id,
    p_start_date: startDate,
    p_end_date: endDate,
  });

  if (error) {
    console.error("[CalendarSettings] Failed to expand recurring blocks", error);
    return { blocks: [], error: "Failed to expand recurring blocks" };
  }

  return {
    blocks: (data || []).map((item: { id: string; occurrence_date: string; start_time: string; end_time: string; label: string | null }) => ({
      id: item.id,
      occurrenceDate: item.occurrence_date,
      startTime: item.start_time,
      endTime: item.end_time,
      label: item.label,
    })),
  };
}
