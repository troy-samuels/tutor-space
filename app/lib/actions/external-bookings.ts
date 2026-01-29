"use server";

import { revalidatePath } from "next/cache";
import { requireTutor } from "@/lib/auth/guards";
import type { ExternalBookingSource } from "@/lib/types/calendar";

type ExternalBookingInput = {
  source: ExternalBookingSource;
  scheduledAt: string; // ISO date string
  durationMinutes: number;
  studentId?: string;
  studentName?: string;
  notes?: string;
};

type ExternalBookingResult = {
  success: boolean;
  id?: string;
  error?: string;
};

type ExternalBooking = {
  id: string;
  tutorId: string;
  studentId: string | null;
  source: ExternalBookingSource;
  scheduledAt: string;
  durationMinutes: number;
  studentName: string | null;
  notes: string | null;
  status: string;
  createdAt: string;
};

// Create a new external booking
export async function createExternalBooking(
  input: ExternalBookingInput
): Promise<ExternalBookingResult> {
  const { supabase, user } = await requireTutor();

  if (!user) {
    return { success: false, error: "Authentication required" };
  }

  const scheduledAt = new Date(input.scheduledAt);

  // Validate duration
  if (!input.durationMinutes || input.durationMinutes < 15 || input.durationMinutes > 480) {
    return { success: false, error: "Duration must be between 15 and 480 minutes" };
  }

  // Validate that we have at least student ID or student name
  if (!input.studentId && !input.studentName?.trim()) {
    return { success: false, error: "Please provide a student name or select an existing student" };
  }

  const endTime = new Date(scheduledAt.getTime() + input.durationMinutes * 60 * 1000);

  // Check for overlapping bookings (TutorLingua bookings)
  const { data: overlappingBookings } = await supabase
    .from("bookings")
    .select("id")
    .eq("tutor_id", user.id)
    .not("status", "in", '("cancelled","cancelled_by_tutor","cancelled_by_student")')
    .lt("scheduled_at", endTime.toISOString())
    .gte("scheduled_at", scheduledAt.toISOString())
    .limit(1);

  if (overlappingBookings && overlappingBookings.length > 0) {
    return { success: false, error: "This time conflicts with an existing TutorLingua booking" };
  }

  // Check for overlapping external bookings
  const { data: overlappingExternal } = await supabase
    .from("external_bookings")
    .select("id")
    .eq("tutor_id", user.id)
    .neq("status", "cancelled")
    .lt("scheduled_at", endTime.toISOString())
    .gte("scheduled_at", scheduledAt.toISOString())
    .limit(1);

  if (overlappingExternal && overlappingExternal.length > 0) {
    return { success: false, error: "This time conflicts with an existing external booking" };
  }

  // Check for overlapping blocked times
  const { data: overlappingBlocked } = await supabase
    .from("blocked_times")
    .select("id")
    .eq("tutor_id", user.id)
    .lt("start_time", endTime.toISOString())
    .gt("end_time", scheduledAt.toISOString())
    .limit(1);

  if (overlappingBlocked && overlappingBlocked.length > 0) {
    return { success: false, error: "This time conflicts with a blocked time" };
  }

  const { data, error } = await supabase
    .from("external_bookings")
    .insert({
      tutor_id: user.id,
      student_id: input.studentId || null,
      source: input.source,
      scheduled_at: scheduledAt.toISOString(),
      duration_minutes: input.durationMinutes,
      student_name: input.studentName?.trim() || null,
      notes: input.notes?.trim() || null,
      status: "scheduled",
    })
    .select("id")
    .single();

  if (error) {
    console.error("[ExternalBookings] Failed to create", error);
    return { success: false, error: "Failed to create external booking" };
  }

  revalidatePath("/calendar");
  revalidatePath("/bookings");

  return { success: true, id: data.id };
}

// Update an external booking
export async function updateExternalBooking(
  id: string,
  input: Partial<ExternalBookingInput> & { status?: string }
): Promise<ExternalBookingResult> {
  const { supabase, user } = await requireTutor();

  if (!user) {
    return { success: false, error: "Authentication required" };
  }

  const updateData: Record<string, unknown> = {};

  if (input.source) {
    updateData.source = input.source;
  }
  if (input.scheduledAt) {
    updateData.scheduled_at = new Date(input.scheduledAt).toISOString();
  }
  if (input.durationMinutes !== undefined) {
    if (input.durationMinutes < 15 || input.durationMinutes > 480) {
      return { success: false, error: "Duration must be between 15 and 480 minutes" };
    }
    updateData.duration_minutes = input.durationMinutes;
  }
  if (input.studentId !== undefined) {
    updateData.student_id = input.studentId || null;
  }
  if (input.studentName !== undefined) {
    updateData.student_name = input.studentName?.trim() || null;
  }
  if (input.notes !== undefined) {
    updateData.notes = input.notes?.trim() || null;
  }
  if (input.status !== undefined) {
    updateData.status = input.status;
  }

  const { error } = await supabase
    .from("external_bookings")
    .update(updateData)
    .eq("id", id)
    .eq("tutor_id", user.id);

  if (error) {
    console.error("[ExternalBookings] Failed to update", error);
    return { success: false, error: "Failed to update external booking" };
  }

  revalidatePath("/calendar");
  revalidatePath("/bookings");

  return { success: true, id };
}

// Delete an external booking
export async function deleteExternalBooking(id: string): Promise<ExternalBookingResult> {
  const { supabase, user } = await requireTutor();

  if (!user) {
    return { success: false, error: "Authentication required" };
  }

  const { error } = await supabase
    .from("external_bookings")
    .delete()
    .eq("id", id)
    .eq("tutor_id", user.id);

  if (error) {
    console.error("[ExternalBookings] Failed to delete", error);
    return { success: false, error: "Failed to delete external booking" };
  }

  revalidatePath("/calendar");
  revalidatePath("/bookings");

  return { success: true };
}

// Get external bookings for a date range
export async function listExternalBookings(
  start: string,
  end: string
): Promise<{ bookings: ExternalBooking[]; error?: string }> {
  const { supabase, user } = await requireTutor();

  if (!user) {
    return { bookings: [], error: "Authentication required" };
  }

  const { data, error } = await supabase
    .from("external_bookings")
    .select(`
      id,
      tutor_id,
      student_id,
      source,
      scheduled_at,
      duration_minutes,
      student_name,
      notes,
      status,
      created_at
    `)
    .eq("tutor_id", user.id)
    .neq("status", "cancelled")
    .gte("scheduled_at", start)
    .lte("scheduled_at", end)
    .order("scheduled_at", { ascending: true });

  if (error) {
    console.error("[ExternalBookings] Failed to fetch", error);
    return { bookings: [], error: "Failed to fetch external bookings" };
  }

  return {
    bookings: (data || []).map((item) => ({
      id: item.id,
      tutorId: item.tutor_id,
      studentId: item.student_id,
      source: item.source as ExternalBookingSource,
      scheduledAt: item.scheduled_at,
      durationMinutes: item.duration_minutes,
      studentName: item.student_name,
      notes: item.notes,
      status: item.status,
      createdAt: item.created_at,
    })),
  };
}

// Get a single external booking by ID
export async function getExternalBooking(id: string): Promise<{
  booking: ExternalBooking | null;
  error?: string;
}> {
  const { supabase, user } = await requireTutor();

  if (!user) {
    return { booking: null, error: "Authentication required" };
  }

  const { data, error } = await supabase
    .from("external_bookings")
    .select(`
      id,
      tutor_id,
      student_id,
      source,
      scheduled_at,
      duration_minutes,
      student_name,
      notes,
      status,
      created_at
    `)
    .eq("id", id)
    .eq("tutor_id", user.id)
    .single();

  if (error) {
    console.error("[ExternalBookings] Failed to fetch single", error);
    return { booking: null, error: "External booking not found" };
  }

  return {
    booking: {
      id: data.id,
      tutorId: data.tutor_id,
      studentId: data.student_id,
      source: data.source as ExternalBookingSource,
      scheduledAt: data.scheduled_at,
      durationMinutes: data.duration_minutes,
      studentName: data.student_name,
      notes: data.notes,
      status: data.status,
      createdAt: data.created_at,
    },
  };
}
