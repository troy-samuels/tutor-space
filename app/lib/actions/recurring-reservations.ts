"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type {
  RecurringReservation,
  RecurringReservationInput,
  ReservedSlot,
  ReservationException,
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
// TYPES
// ============================================

// ============================================
// RECURRING RESERVATIONS CRUD
// ============================================

export async function listRecurringReservations(): Promise<{
  items: RecurringReservation[];
  error?: string;
}> {
  const { supabase, user } = await requireTutor();

  if (!user) {
    return { items: [], error: "Authentication required" };
  }

  const { data, error } = await supabase
    .from("recurring_lesson_reservations")
    .select(`
      *,
      students(full_name),
      services(name)
    `)
    .eq("tutor_id", user.id)
    .order("day_of_week")
    .order("start_time");

  if (error) {
    console.error("[RecurringReservations] Failed to list", error);
    return { items: [], error: "Failed to fetch reservations" };
  }

  return {
    items: data.map((item) => ({
      id: item.id,
      tutorId: item.tutor_id,
      studentId: item.student_id,
      studentName: item.students?.full_name ?? null,
      serviceId: item.service_id,
      serviceName: item.services?.name ?? null,
      dayOfWeek: item.day_of_week,
      startTime: item.start_time,
      durationMinutes: item.duration_minutes,
      timezone: item.timezone,
      effectiveFrom: item.effective_from,
      effectiveUntil: item.effective_until,
      isActive: item.is_active,
      autoCreateBookings: item.auto_create_bookings,
      autoBookDaysAhead: item.auto_book_days_ahead,
      createdAt: item.created_at,
    })),
  };
}

export async function createRecurringReservation(
  input: RecurringReservationInput
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
  if (!timeRegex.test(input.startTime)) {
    return { error: "Invalid time format. Use HH:MM" };
  }

  // Verify student belongs to tutor
  const { data: student, error: studentError } = await supabase
    .from("students")
    .select("id")
    .eq("id", input.studentId)
    .eq("tutor_id", user.id)
    .single();

  if (studentError || !student) {
    return { error: "Student not found" };
  }

  // Verify service belongs to tutor
  const { data: service, error: serviceError } = await supabase
    .from("services")
    .select("id, duration_minutes")
    .eq("id", input.serviceId)
    .eq("tutor_id", user.id)
    .single();

  if (serviceError || !service) {
    return { error: "Service not found" };
  }

  const durationMinutes = input.durationMinutes ?? service.duration_minutes ?? 60;

  // Check for conflicts using the database function
  const { data: conflictCheck, error: conflictError } = await supabase.rpc(
    "check_reservation_conflict",
    {
      p_tutor_id: user.id,
      p_day_of_week: input.dayOfWeek,
      p_start_time: input.startTime,
      p_duration_minutes: durationMinutes,
    }
  );

  if (conflictError) {
    console.error("[RecurringReservations] Conflict check failed", conflictError);
    return { error: "Failed to check for conflicts" };
  }

  if (conflictCheck?.[0]?.has_conflict) {
    const conflictName = conflictCheck[0].conflicting_student_name;
    return {
      error: conflictName
        ? `This time conflicts with ${conflictName}'s reservation`
        : "This time conflicts with an existing reservation",
    };
  }

  // Create the reservation
  const { data, error } = await supabase
    .from("recurring_lesson_reservations")
    .insert({
      tutor_id: user.id,
      student_id: input.studentId,
      service_id: input.serviceId,
      day_of_week: input.dayOfWeek,
      start_time: input.startTime,
      duration_minutes: durationMinutes,
      timezone: input.timezone,
      effective_from: input.effectiveFrom || new Date().toISOString().split("T")[0],
      effective_until: input.effectiveUntil || null,
      is_active: true,
      auto_create_bookings: input.autoCreateBookings ?? false,
      auto_book_days_ahead: input.autoBookDaysAhead ?? 7,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[RecurringReservations] Failed to create", error);
    if (error.code === "23505") {
      return { error: "This student already has a reservation at this time" };
    }
    return { error: "Failed to create reservation" };
  }

  revalidatePath("/calendar");
  revalidatePath("/students");

  return { id: data.id };
}

export async function updateRecurringReservation(
  id: string,
  input: Partial<RecurringReservationInput>
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
  if (input.durationMinutes !== undefined) {
    updateData.duration_minutes = input.durationMinutes;
  }
  if (input.timezone !== undefined) {
    updateData.timezone = input.timezone;
  }
  if (input.effectiveFrom !== undefined) {
    updateData.effective_from = input.effectiveFrom;
  }
  if (input.effectiveUntil !== undefined) {
    updateData.effective_until = input.effectiveUntil || null;
  }
  if (input.autoCreateBookings !== undefined) {
    updateData.auto_create_bookings = input.autoCreateBookings;
  }
  if (input.autoBookDaysAhead !== undefined) {
    updateData.auto_book_days_ahead = input.autoBookDaysAhead;
  }

  const { error } = await supabase
    .from("recurring_lesson_reservations")
    .update(updateData)
    .eq("id", id)
    .eq("tutor_id", user.id);

  if (error) {
    console.error("[RecurringReservations] Failed to update", error);
    return { error: "Failed to update reservation" };
  }

  revalidatePath("/calendar");
  revalidatePath("/students");

  return { success: true };
}

export async function cancelRecurringReservation(
  id: string
): Promise<{ success?: boolean; error?: string }> {
  const { supabase, user } = await requireTutor();

  if (!user) {
    return { error: "Authentication required" };
  }

  const { error } = await supabase
    .from("recurring_lesson_reservations")
    .delete()
    .eq("id", id)
    .eq("tutor_id", user.id);

  if (error) {
    console.error("[RecurringReservations] Failed to cancel", error);
    return { error: "Failed to cancel reservation" };
  }

  revalidatePath("/calendar");
  revalidatePath("/students");

  return { success: true };
}

export async function pauseRecurringReservation(
  id: string
): Promise<{ success?: boolean; error?: string }> {
  const { supabase, user } = await requireTutor();

  if (!user) {
    return { error: "Authentication required" };
  }

  const { error } = await supabase
    .from("recurring_lesson_reservations")
    .update({ is_active: false })
    .eq("id", id)
    .eq("tutor_id", user.id);

  if (error) {
    console.error("[RecurringReservations] Failed to pause", error);
    return { error: "Failed to pause reservation" };
  }

  revalidatePath("/calendar");

  return { success: true };
}

export async function resumeRecurringReservation(
  id: string
): Promise<{ success?: boolean; error?: string }> {
  const { supabase, user } = await requireTutor();

  if (!user) {
    return { error: "Authentication required" };
  }

  const { error } = await supabase
    .from("recurring_lesson_reservations")
    .update({ is_active: true })
    .eq("id", id)
    .eq("tutor_id", user.id);

  if (error) {
    console.error("[RecurringReservations] Failed to resume", error);
    return { error: "Failed to resume reservation" };
  }

  revalidatePath("/calendar");

  return { success: true };
}

// ============================================
// OCCURRENCE MANAGEMENT
// ============================================

export async function skipOccurrence(
  reservationId: string,
  occurrenceDate: string,
  reason?: string
): Promise<{ success?: boolean; error?: string }> {
  const { supabase, user } = await requireTutor();

  if (!user) {
    return { error: "Authentication required" };
  }

  // Verify reservation belongs to tutor
  const { data: reservation, error: resError } = await supabase
    .from("recurring_lesson_reservations")
    .select("id")
    .eq("id", reservationId)
    .eq("tutor_id", user.id)
    .single();

  if (resError || !reservation) {
    return { error: "Reservation not found" };
  }

  // Create exception
  const { error } = await supabase
    .from("recurring_reservation_exceptions")
    .upsert(
      {
        reservation_id: reservationId,
        occurrence_date: occurrenceDate,
        exception_type: "skipped",
        reason: reason || null,
      },
      { onConflict: "reservation_id,occurrence_date" }
    );

  if (error) {
    console.error("[RecurringReservations] Failed to skip occurrence", error);
    return { error: "Failed to skip occurrence" };
  }

  revalidatePath("/calendar");

  return { success: true };
}

export async function rescheduleOccurrence(
  reservationId: string,
  occurrenceDate: string,
  newDateTime: string,
  reason?: string
): Promise<{ success?: boolean; error?: string }> {
  const { supabase, user } = await requireTutor();

  if (!user) {
    return { error: "Authentication required" };
  }

  // Verify reservation belongs to tutor
  const { data: reservation, error: resError } = await supabase
    .from("recurring_lesson_reservations")
    .select("id")
    .eq("id", reservationId)
    .eq("tutor_id", user.id)
    .single();

  if (resError || !reservation) {
    return { error: "Reservation not found" };
  }

  // Create exception
  const { error } = await supabase
    .from("recurring_reservation_exceptions")
    .upsert(
      {
        reservation_id: reservationId,
        occurrence_date: occurrenceDate,
        exception_type: "rescheduled",
        rescheduled_to: newDateTime,
        reason: reason || null,
      },
      { onConflict: "reservation_id,occurrence_date" }
    );

  if (error) {
    console.error("[RecurringReservations] Failed to reschedule occurrence", error);
    return { error: "Failed to reschedule occurrence" };
  }

  revalidatePath("/calendar");

  return { success: true };
}

export async function cancelOccurrence(
  reservationId: string,
  occurrenceDate: string,
  reason?: string
): Promise<{ success?: boolean; error?: string }> {
  const { supabase, user } = await requireTutor();

  if (!user) {
    return { error: "Authentication required" };
  }

  // Verify reservation belongs to tutor
  const { data: reservation, error: resError } = await supabase
    .from("recurring_lesson_reservations")
    .select("id")
    .eq("id", reservationId)
    .eq("tutor_id", user.id)
    .single();

  if (resError || !reservation) {
    return { error: "Reservation not found" };
  }

  // Create exception
  const { error } = await supabase
    .from("recurring_reservation_exceptions")
    .upsert(
      {
        reservation_id: reservationId,
        occurrence_date: occurrenceDate,
        exception_type: "cancelled",
        reason: reason || null,
      },
      { onConflict: "reservation_id,occurrence_date" }
    );

  if (error) {
    console.error("[RecurringReservations] Failed to cancel occurrence", error);
    return { error: "Failed to cancel occurrence" };
  }

  revalidatePath("/calendar");

  return { success: true };
}

export async function removeOccurrenceException(
  reservationId: string,
  occurrenceDate: string
): Promise<{ success?: boolean; error?: string }> {
  const { supabase, user } = await requireTutor();

  if (!user) {
    return { error: "Authentication required" };
  }

  // Verify reservation belongs to tutor
  const { data: reservation, error: resError } = await supabase
    .from("recurring_lesson_reservations")
    .select("id")
    .eq("id", reservationId)
    .eq("tutor_id", user.id)
    .single();

  if (resError || !reservation) {
    return { error: "Reservation not found" };
  }

  // Delete exception
  const { error } = await supabase
    .from("recurring_reservation_exceptions")
    .delete()
    .eq("reservation_id", reservationId)
    .eq("occurrence_date", occurrenceDate);

  if (error) {
    console.error("[RecurringReservations] Failed to remove exception", error);
    return { error: "Failed to remove exception" };
  }

  revalidatePath("/calendar");

  return { success: true };
}

// ============================================
// QUERY FUNCTIONS
// ============================================

export async function getReservedSlotsForRange(
  startDate: string,
  endDate: string
): Promise<{ slots: ReservedSlot[]; error?: string }> {
  const { supabase, user } = await requireTutor();

  if (!user) {
    return { slots: [], error: "Authentication required" };
  }

  const { data, error } = await supabase.rpc("get_reserved_slots_for_range", {
    p_tutor_id: user.id,
    p_start_date: startDate,
    p_end_date: endDate,
  });

  if (error) {
    console.error("[RecurringReservations] Failed to get reserved slots", error);
    return { slots: [], error: "Failed to fetch reserved slots" };
  }

  return {
    slots: (data || []).map((item: {
      reservation_id: string;
      student_id: string;
      student_name: string | null;
      service_id: string;
      service_name: string | null;
      occurrence_date: string;
      start_time: string;
      duration_minutes: number;
      timezone: string;
      is_exception: boolean;
      exception_type: string | null;
    }) => ({
      reservationId: item.reservation_id,
      studentId: item.student_id,
      studentName: item.student_name,
      serviceId: item.service_id,
      serviceName: item.service_name,
      occurrenceDate: item.occurrence_date,
      startTime: item.start_time,
      durationMinutes: item.duration_minutes,
      timezone: item.timezone,
      isException: item.is_exception,
      exceptionType: item.exception_type,
    })),
  };
}

export async function getStudentReservations(
  studentId: string
): Promise<{ items: RecurringReservation[]; error?: string }> {
  const { supabase, user } = await requireTutor();

  if (!user) {
    return { items: [], error: "Authentication required" };
  }

  const { data, error } = await supabase
    .from("recurring_lesson_reservations")
    .select(`
      *,
      students(full_name),
      services(name)
    `)
    .eq("tutor_id", user.id)
    .eq("student_id", studentId)
    .order("day_of_week")
    .order("start_time");

  if (error) {
    console.error("[RecurringReservations] Failed to get student reservations", error);
    return { items: [], error: "Failed to fetch reservations" };
  }

  return {
    items: data.map((item) => ({
      id: item.id,
      tutorId: item.tutor_id,
      studentId: item.student_id,
      studentName: item.students?.full_name ?? null,
      serviceId: item.service_id,
      serviceName: item.services?.name ?? null,
      dayOfWeek: item.day_of_week,
      startTime: item.start_time,
      durationMinutes: item.duration_minutes,
      timezone: item.timezone,
      effectiveFrom: item.effective_from,
      effectiveUntil: item.effective_until,
      isActive: item.is_active,
      autoCreateBookings: item.auto_create_bookings,
      autoBookDaysAhead: item.auto_book_days_ahead,
      createdAt: item.created_at,
    })),
  };
}
