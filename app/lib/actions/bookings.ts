"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { differenceInCalendarDays, endOfDay, endOfWeek, startOfDay, startOfWeek } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { validateBooking } from "@/lib/utils/booking-conflicts";
import { validateServicePricing } from "@/lib/utils/booking-validation";
import {
  sendBookingCancelledEmail,
  sendBookingConfirmationEmail,
  sendPaymentReceiptEmail,
  sendTutorBookingNotificationEmail,
  sendBookingPaymentRequestEmail,
} from "@/lib/emails/booking-emails";
import {
  sendBookingRescheduledEmails,
  sendTutorCancellationEmail,
} from "@/lib/emails/ops-emails";
import { getActivePackages } from "@/lib/actions/packages";
import { ServerActionLimiters } from "@/lib/middleware/rate-limit";
import {
  createCalendarEventForBooking,
  getCalendarBusyWindowsWithStatus,
  updateCalendarEventForBooking,
  deleteCalendarEventsForBooking,
} from "@/lib/calendar/busy-windows";
import { isTableMissing } from "@/lib/utils/supabase-errors";

export type BookingRecord = {
  id: string;
  tutor_id: string;
  student_id: string;
  service_id: string | null;
  scheduled_at: string;
  duration_minutes: number;
  timezone: string;
  status: string;
  payment_status: string;
  payment_amount: number | null;
  currency: string | null;
  student_notes: string | null;
  meeting_url?: string | null;
  meeting_provider?: string | null;
  created_at: string;
  updated_at: string;
  students?: {
    id?: string;
    full_name: string;
    email: string;
  } | null;
  services?: {
    name: string;
  } | null;
  tutor?: {
    full_name: string;
    email?: string | null;
  } | null;
};

const MAX_RESCHEDULES = 3;
const isCancelledStatus = (status?: string | null) =>
  Boolean(status && status.startsWith("cancelled"));

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

async function ensureConversationThread(
  adminClient: NonNullable<ReturnType<typeof createServiceRoleClient>>,
  tutorId: string,
  studentId: string
) {
  const { error } = await adminClient
    .from("conversation_threads")
    .insert({ tutor_id: tutorId, student_id: studentId })
    .select("id")
    .single();

  if (error && error.code !== "23505") {
    console.error("Failed to create conversation thread:", error);
  }
}

async function checkAdvanceBookingWindow(params: {
  adminClient: NonNullable<ReturnType<typeof createServiceRoleClient>>;
  tutorId: string;
  scheduledAt: string;
  timezone?: string | null;
}): Promise<{ ok: true } | { error: string }> {
  const { adminClient, tutorId, scheduledAt, timezone } = params;

  const { data: profile, error } = await adminClient
    .from("profiles")
    .select("advance_booking_days_min, advance_booking_days_max")
    .eq("id", tutorId)
    .single();

  if (error) {
    console.error("[Bookings] Failed to load booking window settings", error);
    return { error: "Unable to validate booking window. Please try again." };
  }

  const minDays = profile?.advance_booking_days_min ?? 0;
  const maxDays = profile?.advance_booking_days_max ?? 365;
  const now = new Date();
  const scheduledDate = new Date(scheduledAt);
  let zonedNow = now;
  let zonedScheduled = scheduledDate;

  if (timezone) {
    try {
      zonedNow = toZonedTime(now, timezone);
      zonedScheduled = toZonedTime(scheduledDate, timezone);
    } catch (timezoneError) {
      console.warn("[Bookings] Invalid timezone for booking window check", timezoneError);
    }
  }

  const daysAhead = differenceInCalendarDays(startOfDay(zonedScheduled), startOfDay(zonedNow));

  if (daysAhead < minDays) {
    return {
      error: `Bookings must be at least ${minDays} day${minDays === 1 ? "" : "s"} in advance.`,
    };
  }

  if (daysAhead > maxDays) {
    return {
      error: `Bookings cannot be more than ${maxDays} day${maxDays === 1 ? "" : "s"} in advance.`,
    };
  }

  return { ok: true };
}

async function checkBookingLimits(params: {
  adminClient: NonNullable<ReturnType<typeof createServiceRoleClient>>;
  tutorId: string;
  scheduledAt: string;
  timezone?: string | null;
  excludeBookingId?: string;
}): Promise<{ ok: true } | { error: string }> {
  const { adminClient, tutorId, scheduledAt, timezone, excludeBookingId } = params;

  const { data: profile, error } = await adminClient
    .from("profiles")
    .select("max_lessons_per_day, max_lessons_per_week")
    .eq("id", tutorId)
    .single();

  if (error) {
    console.error("[Bookings] Failed to load booking limits", error);
    return { error: "Unable to validate booking limits. Please try again." };
  }

  const maxDaily = profile?.max_lessons_per_day ?? null;
  const maxWeekly = profile?.max_lessons_per_week ?? null;

  if (!maxDaily && !maxWeekly) {
    return { ok: true };
  }

  const scheduledDate = new Date(scheduledAt);
  let zonedScheduled = scheduledDate;
  if (timezone) {
    try {
      zonedScheduled = toZonedTime(scheduledDate, timezone);
    } catch (timezoneError) {
      console.warn("[Bookings] Invalid timezone for booking limit check", timezoneError);
    }
  }
  const dayStartZoned = startOfDay(zonedScheduled);
  const dayEndZoned = endOfDay(zonedScheduled);
  const weekStartZoned = startOfWeek(zonedScheduled, { weekStartsOn: 0 });
  const weekEndZoned = endOfWeek(zonedScheduled, { weekStartsOn: 0 });

  let dayStart = dayStartZoned;
  let dayEnd = dayEndZoned;
  let weekStart = weekStartZoned;
  let weekEnd = weekEndZoned;

  if (timezone) {
    try {
      dayStart = fromZonedTime(dayStartZoned, timezone);
      dayEnd = fromZonedTime(dayEndZoned, timezone);
      weekStart = fromZonedTime(weekStartZoned, timezone);
      weekEnd = fromZonedTime(weekEndZoned, timezone);
    } catch (timezoneError) {
      console.warn("[Bookings] Invalid timezone for booking limit boundaries", timezoneError);
    }
  }

  const buildCountQuery = (start: Date, end: Date) => {
    let query = adminClient
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("tutor_id", tutorId)
      .in("status", ["pending", "confirmed"])
      .gte("scheduled_at", start.toISOString())
      .lte("scheduled_at", end.toISOString());

    if (excludeBookingId) {
      query = query.neq("id", excludeBookingId);
    }

    return query;
  };

  if (maxDaily) {
    const { count: dailyCount, error: dailyError } = await buildCountQuery(dayStart, dayEnd);
    if (dailyError) {
      console.error("[Bookings] Failed to check daily booking limit", dailyError);
      return { error: "Unable to validate daily booking limit. Please try again." };
    }

    if ((dailyCount ?? 0) >= maxDaily) {
      return { error: `This tutor has reached the daily booking limit (${maxDaily}).` };
    }
  }

  if (maxWeekly) {
    const { count: weeklyCount, error: weeklyError } = await buildCountQuery(weekStart, weekEnd);
    if (weeklyError) {
      console.error("[Bookings] Failed to check weekly booking limit", weeklyError);
      return { error: "Unable to validate weekly booking limit. Please try again." };
    }

    if ((weeklyCount ?? 0) >= maxWeekly) {
      return { error: `This tutor has reached the weekly booking limit (${maxWeekly}).` };
    }
  }

  return { ok: true };
}

export async function listBookings(): Promise<BookingRecord[]> {
  const { supabase, user } = await requireTutor();
  if (!user) {
    return [];
  }

  const { data } = await supabase
    .from("bookings")
    .select(`
      *,
      students(full_name, email),
      services(name),
      session_package_redemptions(
        id,
        minutes_redeemed,
        status,
        session_package_purchases(
          session_package_templates(name)
        )
      )
    `)
    .eq("tutor_id", user.id)
    .order("scheduled_at", { ascending: true })
    .limit(100);

  return (data as BookingRecord[] | null) ?? [];
}

export async function checkSlotAvailabilityForTutor(params: {
  tutorId: string;
  startISO: string;
  durationMinutes: number;
}): Promise<{ available: boolean } | { error: string }> {
  const adminClient = createServiceRoleClient();

  if (!adminClient) {
    return { error: "Service unavailable. Please try again." };
  }

  const start = new Date(params.startISO);
  if (Number.isNaN(start.getTime())) {
    return { error: "Invalid start time." };
  }

  const end = new Date(start.getTime() + params.durationMinutes * 60000);
  const windowStart = new Date(start.getTime() - 3 * 60 * 60000);
  const windowEnd = new Date(end.getTime() + 3 * 60 * 60000);

  const { data: tutorProfile } = await adminClient
    .from("profiles")
    .select("timezone")
    .eq("id", params.tutorId)
    .single();

  const tutorTimezone = tutorProfile?.timezone ?? "UTC";

  const bookingWindow = await checkAdvanceBookingWindow({
    adminClient,
    tutorId: params.tutorId,
    scheduledAt: params.startISO,
    timezone: tutorTimezone,
  });

  if ("error" in bookingWindow) {
    return { error: bookingWindow.error };
  }

  const bookingLimits = await checkBookingLimits({
    adminClient,
    tutorId: params.tutorId,
    scheduledAt: params.startISO,
    timezone: tutorTimezone,
  });

  if ("error" in bookingLimits) {
    return { error: bookingLimits.error };
  }

  const { data: bookings } = await adminClient
    .from("bookings")
    .select("id, scheduled_at, duration_minutes, status")
    .eq("tutor_id", params.tutorId)
    .in("status", ["pending", "confirmed"])
    .gte("scheduled_at", windowStart.toISOString())
    .lte("scheduled_at", windowEnd.toISOString());

  const hasBookingConflict =
    bookings?.some((booking) => {
      const bookingStart = new Date(booking.scheduled_at);
      const bookingEnd = new Date(
        bookingStart.getTime() + (booking.duration_minutes || params.durationMinutes) * 60000
      );
      return bookingStart < end && bookingEnd > start;
    }) ?? false;

  const { data: blockedTimes } = await adminClient
    .from("blocked_times")
    .select("id, start_time, end_time")
    .eq("tutor_id", params.tutorId)
    .lt("start_time", end.toISOString())
    .gt("end_time", start.toISOString());

  const blockedConflict = (blockedTimes?.length ?? 0) > 0;

  return { available: !(hasBookingConflict || blockedConflict) };
}

type CreateBookingInput = {
  service_id: string | null;
  student_id: string;
  scheduled_at: string;
  duration_minutes: number;
  timezone: string;
  notes?: string;
  skipAdvanceBookingCheck?: boolean; // Skip validation for tutor-initiated bookings
};

export async function createBooking(input: CreateBookingInput) {
  const { supabase, user } = await requireTutor();
  if (!user) {
    return { error: "You need to be signed in to create bookings." };
  }

  const adminClient = createServiceRoleClient();
  if (!adminClient) {
    return { error: "Service unavailable. Please try again." };
  }

  // CONFLICT VALIDATION: Check for overlapping bookings before insert
  // This prevents double-booking the same timeslot
  const { data: existingBookings } = await supabase
    .from("bookings")
    .select("id, scheduled_at, duration_minutes")
    .eq("tutor_id", user.id)
    .in("status", ["pending", "confirmed"])
    .gte(
      "scheduled_at",
      new Date(
        new Date(input.scheduled_at).getTime() - 24 * 60 * 60 * 1000
      ).toISOString()
    )
    .lte(
      "scheduled_at",
      new Date(
        new Date(input.scheduled_at).getTime() + 24 * 60 * 60 * 1000
      ).toISOString()
    );

  const initialBookingStart = new Date(input.scheduled_at);
  const initialBookingEnd = new Date(
    initialBookingStart.getTime() + input.duration_minutes * 60 * 1000
  );

  const hasConflict = existingBookings?.some((existing) => {
    const existingStart = new Date(existing.scheduled_at);
    const existingEnd = new Date(
      existingStart.getTime() + existing.duration_minutes * 60 * 1000
    );
    // Check if time ranges overlap
    return initialBookingStart < existingEnd && initialBookingEnd > existingStart;
  });

  if (hasConflict) {
    return {
      error:
        "This time slot conflicts with an existing booking. Please select a different time.",
    };
  }

  const { data: tutorProfile } = await adminClient
    .from("profiles")
    .select("timezone, max_lessons_per_day, max_lessons_per_week, advance_booking_days_min, advance_booking_days_max")
    .eq("id", user.id)
    .single();

  const tutorTimezone = tutorProfile?.timezone || input.timezone || "UTC";

  // Only check advance booking window if not explicitly skipped (tutor-initiated bookings skip this)
  if (!input.skipAdvanceBookingCheck) {
    const bookingWindow = await checkAdvanceBookingWindow({
      adminClient,
      tutorId: user.id,
      scheduledAt: input.scheduled_at,
      timezone: tutorTimezone,
    });

    if ("error" in bookingWindow) {
      return { error: bookingWindow.error };
    }
  }

  const bookingLimits = await checkBookingLimits({
    adminClient,
    tutorId: user.id,
    scheduledAt: input.scheduled_at,
    timezone: tutorTimezone,
  });

  if ("error" in bookingLimits) {
    return { error: bookingLimits.error };
  }

  // Create the booking atomically to avoid race conditions
  const { data: bookingResult, error: bookingError } = await adminClient.rpc(
    "create_booking_atomic",
    {
      p_tutor_id: user.id,
      p_student_id: input.student_id,
      p_service_id: input.service_id,
      p_scheduled_at: input.scheduled_at,
      p_duration_minutes: input.duration_minutes,
      p_timezone: tutorTimezone,
      p_status: "confirmed",
      p_payment_status: "unpaid",
      p_payment_amount: 0,
      p_currency: null,
      p_student_notes: input.notes ?? null,
    }
  );

  const booking = Array.isArray(bookingResult)
    ? bookingResult[0]
    : (bookingResult as { id: string; created_at: string } | null);

  if (bookingError || !booking) {
    if (bookingError?.code === "P0001" || bookingError?.code === "23P01") {
      return {
        error:
          "This time slot was just booked. Please refresh and select a different time.",
      };
    }

    if (bookingError?.code === "P0002") {
      return { error: "This time window is blocked by the tutor." };
    }

    if (bookingError?.code === "55P03") {
      return { error: "Please retry booking; the tutor calendar is busy right now." };
    }

    console.error("Booking RPC failed:", bookingError);
    return { error: "We couldn't save that booking. Please try again." };
  }

  // Post-insert conflict check (first-come-first-serve) in case of concurrent inserts
  const postInsertStart = new Date(input.scheduled_at);
  const postInsertEnd = new Date(postInsertStart.getTime() + input.duration_minutes * 60 * 1000);

  const { data: conflictingBookings } = await adminClient
    .from("bookings")
    .select("id, scheduled_at, duration_minutes, created_at")
    .eq("tutor_id", user.id)
    .in("status", ["pending", "confirmed"])
    .neq("id", booking.id)
    .lte("scheduled_at", postInsertEnd.toISOString())
    .order("created_at", { ascending: true });

  const hasPostInsertConflict = conflictingBookings?.some((existing) => {
    const existingStart = new Date(existing.scheduled_at);
    const existingEnd = new Date(existingStart.getTime() + existing.duration_minutes * 60 * 1000);
    return postInsertStart < existingEnd && postInsertEnd > existingStart && new Date(existing.created_at) < new Date(booking.created_at);
  });

  if (hasPostInsertConflict) {
    await adminClient.from("bookings").delete().eq("id", booking.id).eq("tutor_id", user.id);
    return {
      error:
        "This time slot was just booked. Please refresh and select a different time.",
    };
  }

  const { data, error } = await supabase
    .from("bookings")
    .select("*, students(full_name, email), services(name)")
    .eq("id", booking.id)
    .single<BookingRecord>();

  if (error) {
    return { error: "We couldn't load the new booking. Please try again." };
  }

  try {
    const student = Array.isArray(data.students) ? data.students[0] : data.students;
    const service = Array.isArray(data.services) ? data.services[0] : data.services;
    const studentName = student?.full_name ?? "Student";
    const serviceName = service?.name ?? "Lesson";
    const startDate = new Date(data.scheduled_at);
    const endDate = new Date(startDate.getTime() + data.duration_minutes * 60000);

    const descriptionLines = [
      `TutorLingua booking - ${serviceName}`,
      `Student: ${studentName}`,
      `Booking ID: ${data.id}`,
    ];

    await createCalendarEventForBooking({
      tutorId: user.id,
      bookingId: data.id,
      title: `${serviceName} with ${studentName}`,
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      description: descriptionLines.join("\n"),
      studentEmail: student?.email ?? undefined,
      timezone: tutorTimezone,
    });
  } catch (calendarError) {
    console.error("[createBooking] Failed to create calendar event", calendarError);
  }

  return { data };
}

/**
 * Create a booking for public booking flow with optional Stripe Connect payment
 * If tutor has Stripe Connect enabled, creates a checkout session
 * Otherwise falls back to manual payment instructions
 * This is called from the public booking page (no auth required)
 */
export async function createBookingAndCheckout(params: {
  tutorId: string;
  serviceId: string;
  scheduledAt: string;
  durationMinutes: number;
  timezone: string;
  student: {
    fullName: string;
    email: string;
    phone: string | null;
    timezone?: string;
    parentName: string | null;
    parentEmail: string | null;
    parentPhone: string | null;
  };
  notes: string | null;
  amount: number;
  currency: string;
  packageId?: string; // Optional: Use package instead of payment
  subscriptionId?: string; // Optional: Use subscription credit instead of payment
}): Promise<
  | { error: string }
  | { success: true; bookingId: string; checkoutUrl?: string | null }
> {
  // Rate limit public booking requests to prevent abuse
  const headersList = await headers();
  const rateLimitResult = await ServerActionLimiters.booking(headersList);
  if (!rateLimitResult.success) {
    return { error: rateLimitResult.error || "Too many booking attempts. Please try again later." };
  }

  const supabase = await createClient();
  const adminClient = createServiceRoleClient();

  if (!adminClient) {
    return { error: "Service unavailable. Please try again later." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  try {
    const { data: serviceRecord } = await adminClient
      .from("services")
      .select(`
        id,
        tutor_id,
        name,
        description,
        duration_minutes,
        price,
        price_amount,
        currency,
        price_currency,
        is_active
      `)
      .eq("id", params.serviceId)
      .eq("tutor_id", params.tutorId)
      .eq("is_active", true)
      .single();

    if (!serviceRecord) {
      return { error: "Service not found or inactive" };
    }

    const servicePriceCents =
      typeof serviceRecord.price_amount === "number"
        ? serviceRecord.price_amount
        : typeof serviceRecord.price === "number"
          ? serviceRecord.price
          : 0;

    const pricingValidation = validateServicePricing({
      servicePriceCents,
      serviceCurrency:
        serviceRecord.price_currency || serviceRecord.currency || "USD",
      serviceDurationMinutes: serviceRecord.duration_minutes,
      requestedAmount: params.amount,
      requestedCurrency: params.currency,
      requestedDuration: params.durationMinutes,
    });

    if (!pricingValidation.success) {
      return { error: pricingValidation.error };
    }

    const serviceCurrency = pricingValidation.currency;
    const normalizedPriceCents = pricingValidation.priceCents;
    const serviceDurationMinutes =
      serviceRecord.duration_minutes || params.durationMinutes || 60;
    const serviceName = serviceRecord.name ?? "Lesson";
    let packageCalendarContext: {
      remainingMinutes: number | null;
      totalMinutes: number | null;
      sessionCount: number | null;
      packageName: string | null;
    } | null = null;

    const { data: tutorSettings } = await adminClient
      .from("profiles")
      .select("buffer_time_minutes, timezone")
      .eq("id", params.tutorId)
      .single();

    const bufferMinutes = tutorSettings?.buffer_time_minutes ?? 0;
    const tutorTimezone = tutorSettings?.timezone || params.timezone;

    const bookingWindow = await checkAdvanceBookingWindow({
      adminClient,
      tutorId: params.tutorId,
      scheduledAt: params.scheduledAt,
      timezone: tutorTimezone,
    });

    if ("error" in bookingWindow) {
      return { error: bookingWindow.error };
    }

    const bookingLimits = await checkBookingLimits({
      adminClient,
      tutorId: params.tutorId,
      scheduledAt: params.scheduledAt,
      timezone: tutorTimezone,
    });

    if ("error" in bookingLimits) {
      return { error: bookingLimits.error };
    }

    // 1. Get tutor's availability to validate booking
    const { data: availability } = await adminClient
      .from("availability")
      .select("day_of_week, start_time, end_time, is_available")
      .eq("tutor_id", params.tutorId)
      .eq("is_available", true);

    // 2. Get existing bookings to check conflicts
    const { data: existingBookings } = await adminClient
      .from("bookings")
      .select("id, scheduled_at, duration_minutes, status")
      .eq("tutor_id", params.tutorId)
      .in("status", ["pending", "confirmed"])
      .gte("scheduled_at", new Date().toISOString());

    const busyResult = await getCalendarBusyWindowsWithStatus({
      tutorId: params.tutorId,
      start: new Date(params.scheduledAt),
      days: 60,
    });

    if (busyResult.unverifiedProviders.length) {
      return {
        error:
          "We couldn't verify your external calendar. Please refresh the page or reconnect your calendar and try again.",
      };
    }

    if (busyResult.staleProviders.length) {
      return {
        error:
          "External calendar sync looks stale. Please open Calendar settings to refresh the connection before booking.",
      };
    }

    const busyWindows = busyResult.windows;

    // 3. Validate the booking
    const validation = validateBooking({
      scheduledAt: params.scheduledAt,
      durationMinutes: serviceRecord.duration_minutes,
      availability: availability || [],
      existingBookings: existingBookings || [],
      bufferMinutes,
      busyWindows,
      timezone: tutorTimezone,
    });

    if (!validation.isValid) {
      return { error: validation.errors.join(" ") };
    }

    // 4. Create or find student record
    let studentId: string;
    let studentProfileId: string | null = user?.id ?? null;

    // Check if student already exists by email
    const { data: existingStudent } = await adminClient
      .from("students")
      .select("id, user_id, status")
      .eq("tutor_id", params.tutorId)
      .eq("email", params.student.email)
      .single();

    // Enforce student status - only active/trial students can book
    if (existingStudent) {
      const blockedStatuses = ["paused", "alumni", "inactive", "suspended"];
      if (blockedStatuses.includes(existingStudent.status)) {
        return {
          error: `Your account status is "${existingStudent.status}". Please contact your tutor to reactivate your account before booking.`,
        };
      }
    }

    if (existingStudent) {
      studentId = existingStudent.id;
      studentProfileId = existingStudent.user_id ?? studentProfileId;

      // Update student info
      const updatePayload: Record<string, unknown> = {
        full_name: params.student.fullName,
        phone: params.student.phone,
        timezone: params.student.timezone || "UTC",
        parent_name: params.student.parentName,
        parent_email: params.student.parentEmail,
        parent_phone: params.student.parentPhone,
        updated_at: new Date().toISOString(),
      };

      if (!existingStudent.user_id && user?.id) {
        updatePayload.user_id = user.id;
      }

      await adminClient
        .from("students")
        .update(updatePayload)
        .eq("id", studentId)
        .eq("tutor_id", params.tutorId);
    } else {
      // Create new student
      const { data: newStudent, error: studentError } = await adminClient
        .from("students")
        .insert({
          tutor_id: params.tutorId,
          user_id: user?.id ?? null,
          full_name: params.student.fullName,
          email: params.student.email,
          phone: params.student.phone,
          timezone: params.student.timezone || "UTC",
          parent_name: params.student.parentName,
          parent_email: params.student.parentEmail,
          parent_phone: params.student.parentPhone,
          source: "booking_page",
        })
        .select("id, user_id")
        .single();

      if (studentError || !newStudent) {
        console.error("Failed to create student:", studentError);
        return { error: "Failed to save student information. Please try again." };
      }

      studentId = newStudent.id;
      studentProfileId = newStudent.user_id ?? studentProfileId;
    }

    if (studentId) {
      await ensureConversationThread(adminClient, params.tutorId, studentId);

      // Sync access + connection for logged-in students so portal flows work
      if (user?.id) {
        let connectionTableAvailable = true;
        const { data: existingConnection, error: existingConnectionError } = await adminClient
          .from("student_tutor_connections")
          .select("id, status")
          .eq("student_user_id", user.id)
          .eq("tutor_id", params.tutorId)
          .maybeSingle();

        if (existingConnectionError) {
          if (isTableMissing(existingConnectionError, "student_tutor_connections")) {
            connectionTableAvailable = false;
            console.warn("[Bookings] Connection table missing, skipping connection sync");
          } else if (existingConnectionError.code !== "PGRST116") {
            console.error("Failed to look up connection:", existingConnectionError);
          }
        }

        if (connectionTableAvailable) {
          if (!existingConnection) {
            const { error: insertConnectionError } = await adminClient
              .from("student_tutor_connections")
              .insert({
                student_user_id: user.id,
                tutor_id: params.tutorId,
                status: "approved",
                requested_at: new Date().toISOString(),
                resolved_at: new Date().toISOString(),
                initial_message: "Auto-approved from booking",
              });

            if (insertConnectionError && !isTableMissing(insertConnectionError, "student_tutor_connections")) {
              console.error("Failed to create connection:", insertConnectionError);
            }
          } else if (existingConnection.status !== "approved") {
            const { error: updateConnectionError } = await adminClient
              .from("student_tutor_connections")
              .update({
                status: "approved",
                resolved_at: new Date().toISOString(),
              })
              .eq("id", existingConnection.id);

            if (updateConnectionError && !isTableMissing(updateConnectionError, "student_tutor_connections")) {
              console.error("Failed to update connection:", updateConnectionError);
            }
          }
        }

        // Ensure calendar access flag is aligned for legacy checks
        await adminClient
          .from("students")
          .update({
            calendar_access_status: "approved",
            access_approved_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", studentId)
          .eq("tutor_id", params.tutorId);
      }
    }

    // 5. Create booking record atomically to avoid race conditions
    // If packageId or subscriptionId provided, booking will be confirmed immediately
    const usingCredit = !!(params.packageId || params.subscriptionId);
    const { data: bookingResult, error: bookingError } = await adminClient.rpc(
      "create_booking_atomic",
      {
        p_tutor_id: params.tutorId,
        p_student_id: studentId,
        p_service_id: params.serviceId,
        p_scheduled_at: params.scheduledAt,
        p_duration_minutes: serviceRecord.duration_minutes,
        p_timezone: tutorTimezone,
        p_status: usingCredit ? "confirmed" : "pending",
        p_payment_status: usingCredit ? "paid" : "unpaid",
        p_payment_amount: normalizedPriceCents,
        p_currency: serviceCurrency,
        p_student_notes: params.notes,
      }
    );

    const booking = Array.isArray(bookingResult)
      ? bookingResult[0]
      : (bookingResult as { id: string; created_at: string } | null);

    if (bookingError || !booking) {
      if (bookingError?.code === "P0001") {
        return {
          error: "This time slot was just booked. Please select a different time.",
        };
      }

      if (bookingError?.code === "P0002") {
        return {
          error: "This time window is blocked by the tutor.",
        };
      }

      if (bookingError?.code === "55P03") {
        return {
          error: "Please retry booking; the tutor calendar is busy right now.",
        };
      }

      console.error("Failed to create booking:", bookingError);
      return { error: "Failed to create booking. Please try again." };
    }

    // 5.5. POST-INSERT CONFLICT CHECK: Prevent race conditions
    // Check if another booking was created at the same time slot while we were processing
    const bookingStartTime = new Date(params.scheduledAt);
    const bookingEndTime = new Date(bookingStartTime.getTime() + serviceRecord.duration_minutes * 60 * 1000);

    const { data: conflictingBookings } = await adminClient
      .from("bookings")
      .select("id, scheduled_at, duration_minutes, created_at")
      .eq("tutor_id", params.tutorId)
      .in("status", ["pending", "confirmed"])
      .neq("id", booking.id) // Exclude our own booking
      .lte("scheduled_at", bookingEndTime.toISOString())
      .order("created_at", { ascending: true });

    // Check for actual time overlap
    const hasConflict = conflictingBookings?.some((existing) => {
      const existingStart = new Date(existing.scheduled_at);
      const existingEnd = new Date(existingStart.getTime() + existing.duration_minutes * 60 * 1000);

      // Overlap if: our start < their end AND our end > their start
      const overlaps =
        bookingStartTime < existingEnd && bookingEndTime > existingStart;

      // Only conflict if the other booking was created before ours (first-come-first-serve)
      return overlaps && new Date(existing.created_at) < new Date(booking.created_at);
    });

    if (hasConflict) {
      // Another booking was created first - delete ours and return error
      console.log(`[bookings] Race condition detected - deleting booking ${booking.id}`);
      await adminClient
        .from("bookings")
        .delete()
        .eq("id", booking.id)
        .eq("tutor_id", params.tutorId);
      return {
        error: "This time slot was just booked by someone else. Please select a different time.",
      };
    }

    // 5a. If package redemption requested, process it
    if (params.packageId) {
      const { redeemPackageMinutes } = await import("@/lib/actions/packages");

      const redemptionResult = await redeemPackageMinutes({
        packageId: params.packageId,
        bookingId: booking.id,
        minutesToRedeem: serviceDurationMinutes,
        tutorId: params.tutorId,
        studentId,
      });

      if (!redemptionResult.success) {
        // Failed to redeem - delete booking and return error
        await adminClient
          .from("bookings")
          .delete()
          .eq("id", booking.id)
          .eq("tutor_id", params.tutorId);
        return {
          error: redemptionResult.error || "Failed to redeem package minutes"
        };
      }

      packageCalendarContext = {
        remainingMinutes: redemptionResult.remainingMinutes ?? null,
        totalMinutes: redemptionResult.packageTotalMinutes ?? null,
        sessionCount: redemptionResult.packageSessionCount ?? null,
        packageName: redemptionResult.packageName ?? null,
      };
    }

    // 5b. If subscription redemption requested, process it
    if (params.subscriptionId) {
      const { redeemSubscriptionLesson } = await import("@/lib/actions/lesson-subscriptions");

      const redemptionResult = await redeemSubscriptionLesson(
        params.subscriptionId,
        booking.id
      );

      if (redemptionResult.error) {
        // Failed to redeem - delete booking and return error
        await adminClient
          .from("bookings")
          .delete()
          .eq("id", booking.id)
          .eq("tutor_id", params.tutorId);
        return {
          error: redemptionResult.error
        };
      }
    }

    // 6. Fetch tutor profile and service info for emails + Stripe Connect status
    const { data: tutorProfile } = await adminClient
      .from("profiles")
      .select(
        "full_name, email, payment_instructions, venmo_handle, paypal_email, zelle_phone, stripe_payment_link, custom_payment_url, video_provider, zoom_personal_link, google_meet_link, microsoft_teams_link, calendly_link, custom_video_url, custom_video_name, stripe_account_id, stripe_charges_enabled, stripe_payouts_enabled, stripe_onboarding_status"
      )
      .eq("id", params.tutorId)
      .single();

    // 7. Get meeting URL based on tutor's video provider
    let meetingUrl: string | null = null;
    let meetingProvider: string | null = null;

    if (tutorProfile) {
      switch (tutorProfile.video_provider) {
        case "zoom_personal":
          meetingUrl = tutorProfile.zoom_personal_link;
          meetingProvider = "zoom_personal";
          break;
        case "google_meet":
          meetingUrl = tutorProfile.google_meet_link;
          meetingProvider = "google_meet";
          break;
        case "microsoft_teams":
          meetingUrl = tutorProfile.microsoft_teams_link;
          meetingProvider = "microsoft_teams";
          break;
        case "calendly":
          meetingUrl = tutorProfile.calendly_link;
          meetingProvider = "calendly";
          break;
        case "custom":
          meetingUrl = tutorProfile.custom_video_url;
          meetingProvider = "custom";
          break;
        default:
          meetingUrl = null;
          meetingProvider = "none";
      }

      // Update booking with meeting URL
      if (meetingUrl) {
        await adminClient
          .from("bookings")
          .update({
            meeting_url: meetingUrl,
            meeting_provider: meetingProvider,
          })
          .eq("id", booking.id)
          .eq("tutor_id", params.tutorId);
      }
    }

    // 8. Send confirmation emails (don't block on email sending)
    if (tutorProfile) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

      // Send to student
      sendBookingConfirmationEmail({
        studentName: params.student.fullName,
        studentEmail: params.student.email,
        tutorName: tutorProfile.full_name || "Your tutor",
        tutorEmail: tutorProfile.email,
        serviceName,
        scheduledAt: params.scheduledAt,
        durationMinutes: serviceRecord.duration_minutes,
        timezone: tutorTimezone,
        amount: normalizedPriceCents,
        currency: serviceCurrency,
        paymentInstructions: {
          general: tutorProfile.payment_instructions || undefined,
          venmoHandle: tutorProfile.venmo_handle || undefined,
          paypalEmail: tutorProfile.paypal_email || undefined,
          zellePhone: tutorProfile.zelle_phone || undefined,
          stripePaymentLink: tutorProfile.stripe_payment_link || undefined,
          customPaymentUrl: tutorProfile.custom_payment_url || undefined,
        },
        meetingUrl: meetingUrl || undefined,
        meetingProvider: meetingProvider || undefined,
        customVideoName: tutorProfile.custom_video_name || undefined,
      }).catch((error) => {
        console.error("Failed to send student confirmation email:", error);
      });

      // Send to tutor
      sendTutorBookingNotificationEmail({
        tutorName: tutorProfile.full_name || "Tutor",
        tutorEmail: tutorProfile.email,
        studentName: params.student.fullName,
        studentEmail: params.student.email,
        studentPhone: params.student.phone || undefined,
        serviceName,
        scheduledAt: params.scheduledAt,
        durationMinutes: serviceRecord.duration_minutes,
        timezone: tutorTimezone,
        amount: normalizedPriceCents,
        currency: serviceCurrency,
        notes: params.notes || undefined,
        dashboardUrl: `${appUrl}/bookings`,
      }).catch((error) => {
        console.error("Failed to send tutor notification email:", error);
      });

      // Send in-app notification to tutor
      try {
        const { notifyNewBooking } = await import("@/lib/actions/notifications");
        await notifyNewBooking({
          tutorId: params.tutorId,
          studentName: params.student.fullName,
          serviceName,
          scheduledAt: params.scheduledAt,
          bookingId: booking.id,
        });
      } catch (notificationError) {
        console.error("[createBookingAndCheckout] notification error:", notificationError);
      }
    }

    // 8.5. Create calendar event immediately for confirmed bookings (packages/subscriptions)
    if (usingCredit) {
      const startDate = new Date(params.scheduledAt);
      const endDate = new Date(
        startDate.getTime() + (serviceDurationMinutes > 0 ? serviceDurationMinutes : 60) * 60000
      );

      if (!Number.isNaN(startDate.getTime())) {
        const lessonsTotal =
          packageCalendarContext?.sessionCount ??
          (serviceDurationMinutes > 0 && packageCalendarContext?.totalMinutes
            ? Math.floor(packageCalendarContext.totalMinutes / serviceDurationMinutes)
            : null);
        const lessonsRemaining =
          serviceDurationMinutes > 0 && packageCalendarContext?.remainingMinutes != null
            ? Math.max(
                0,
                Math.floor(packageCalendarContext.remainingMinutes / serviceDurationMinutes)
              )
            : null;

        const descriptionLines = [
          `TutorLingua booking - ${serviceName}`,
          `Student: ${params.student.fullName}`,
          `Booking ID: ${booking.id}`,
        ];

        if (packageCalendarContext) {
          descriptionLines.push(
            `Package: ${packageCalendarContext.packageName || "Lesson package"}`
          );

          if (lessonsRemaining !== null) {
            const totalLabel = lessonsTotal !== null ? `/${lessonsTotal}` : "";
            descriptionLines.push(`Remaining lessons: ${lessonsRemaining}${totalLabel}`);
          } else if (packageCalendarContext.remainingMinutes !== null) {
            descriptionLines.push(
              `Remaining minutes: ${packageCalendarContext.remainingMinutes}`
            );
          }
        }

        const eventTitle =
          lessonsRemaining !== null
            ? `${serviceName} with ${params.student.fullName} (${lessonsRemaining}${
                lessonsTotal !== null ? `/${lessonsTotal}` : ""
              } left)`
            : `${serviceName} with ${params.student.fullName}`;

        createCalendarEventForBooking({
          tutorId: params.tutorId,
          bookingId: booking.id,
          title: eventTitle,
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          description: descriptionLines.join("\n"),
          studentEmail: params.student.email,
          timezone: tutorTimezone,
        }).catch((error) => {
          console.error("[createBookingAndCheckout] Failed to create calendar event", error);
        });
      }
    }

    // 9. Check if tutor has Stripe Connect enabled and account is healthy
    const stripeAccountReady =
      tutorProfile?.stripe_charges_enabled === true &&
      tutorProfile?.stripe_account_id &&
      tutorProfile?.stripe_onboarding_status !== "restricted";

    if (!params.packageId && stripeAccountReady) {
      if (!studentProfileId) {
        console.warn("Student is not authenticated; skipping Stripe checkout and falling back to manual payment.");
      } else {
        // Tutor has Stripe Connect - create checkout session
        try {
          // First, ensure student has a Stripe customer ID
          const { data: studentProfile } = await adminClient
            .from("profiles")
            .select("stripe_customer_id, email, full_name")
            .eq("id", studentProfileId)
            .single();

          let stripeCustomerId = studentProfile?.stripe_customer_id;
          const studentEmail = studentProfile?.email || params.student.email;
          const studentName = studentProfile?.full_name || params.student.fullName;
          
          if (!stripeCustomerId) {
            // Create Stripe customer for the student
            const { getOrCreateStripeCustomer } = await import("@/lib/stripe");
            const customer = await getOrCreateStripeCustomer({
              userId: studentProfileId,
              email: studentEmail,
              name: studentName,
              metadata: {
                tutorId: params.tutorId,
                profileId: studentProfileId,
                studentRecordId: studentId,
              },
            });
            stripeCustomerId = customer.id;

            // Save to database
            await adminClient
              .from("profiles")
              .update({ stripe_customer_id: stripeCustomerId })
              .eq("id", studentProfileId);
          }

          // Create checkout session with destination charges
          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
          const stripeCurrency = serviceCurrency.toLowerCase();
          const { createCheckoutSession } = await import("@/lib/stripe");
          
          const session = await createCheckoutSession({
            customerId: stripeCustomerId,
            priceAmount: normalizedPriceCents,
            currency: stripeCurrency,
            successUrl: `${baseUrl}/book/success?booking_id=${booking.id}&session_id={CHECKOUT_SESSION_ID}`,
            cancelUrl: `${baseUrl}/book/cancelled?booking_id=${booking.id}`,
            metadata: {
              bookingId: booking.id,
              studentProfileId,
              studentRecordId: studentId,
              tutorId: params.tutorId,
            },
            lineItems: [
              {
                name: serviceName,
                description: `${serviceRecord.duration_minutes} minute lesson with ${tutorProfile.full_name || "your tutor"}`,
                amount: normalizedPriceCents,
                quantity: 1,
              },
            ],
            transferDestinationAccountId: tutorProfile.stripe_account_id,
            // No platform fee for now as per user requirements
            applicationFeeCents: undefined,
          });

          // Return checkout URL for redirect
          return {
            success: true,
            bookingId: booking.id,
            checkoutUrl: session.url,
          };
      }
        catch (stripeError) {
          console.error("Failed to create Stripe checkout:", stripeError);
          // Fall back to manual payment instructions
        }
      }
    }

    // Success - booking created, student will pay tutor directly (manual payment)
    return {
      success: true,
      bookingId: booking.id,
    };
  } catch (error) {
    console.error("Error in createBookingAndCheckout:", error);
    return { error: "An unexpected error occurred. Please try again." };
  }
}

/**
 * Mark a booking as paid and confirmed
 * Called by tutor when student has paid via Venmo/PayPal/Zelle/etc
 */
export async function markBookingAsPaid(bookingId: string) {
  const { supabase, user } = await requireTutor();

  if (!user) {
    return { error: "You need to be signed in to update bookings." };
  }

  // Verify the booking belongs to this tutor
  const { data: booking, error: fetchError } = await supabase
    .from("bookings")
    .select(
      `
        id,
        tutor_id,
        scheduled_at,
        timezone,
        payment_amount,
        currency,
        services (
          name,
          price_amount,
          price_currency,
          duration_minutes
        ),
        students (
          full_name,
          email
        ),
        tutor:profiles!bookings_tutor_id_fkey (
          full_name,
          email
        )
      `
    )
    .eq("id", bookingId)
    .single();

  if (fetchError || !booking) {
    return { error: "Booking not found." };
  }

  if (booking.tutor_id !== user.id) {
    return { error: "You can only update your own bookings." };
  }

  const student = Array.isArray(booking.students) ? booking.students[0] : booking.students;
  const service = Array.isArray(booking.services) ? booking.services[0] : booking.services;
  const tutorProfile = Array.isArray(booking.tutor) ? booking.tutor[0] : booking.tutor;

  // Update booking status
  // SECURITY: Include tutor_id check in UPDATE for defense-in-depth
  const { error: updateError } = await supabase
    .from("bookings")
    .update({
      status: "confirmed",
      payment_status: "paid",
      updated_at: new Date().toISOString(),
    })
    .eq("id", bookingId)
    .eq("tutor_id", user.id);

  if (updateError) {
    console.error("Failed to update booking:", updateError);
    return { error: "Failed to mark booking as paid. Please try again." };
  }

  const studentEmail = student?.email;
  const amountCents =
    booking.payment_amount ??
    (service?.price_amount ?? 0);
  const currency =
    booking.currency ??
    service?.price_currency ??
    "USD";

  if (studentEmail && amountCents > 0) {
    await sendPaymentReceiptEmail({
      studentName: student?.full_name ?? "Student",
      studentEmail,
      tutorName: tutorProfile?.full_name ?? "Your tutor",
      serviceName: service?.name ?? "Lesson",
      scheduledAt: booking.scheduled_at,
      timezone: booking.timezone ?? "UTC",
      amountCents,
      currency,
      paymentMethod: "Manual payment",
      notes: "Marked as paid by your tutor",
    });
  }

  try {
    const serviceName = service?.name ?? "Lesson";
    const studentName = student?.full_name ?? "Student";
    const startDate = new Date(booking.scheduled_at);
    const durationMinutes = service?.duration_minutes ?? 60;
    const endDate = new Date(startDate.getTime() + durationMinutes * 60000);

    const descriptionLines = [
      `TutorLingua booking - ${serviceName}`,
      `Student: ${studentName}`,
      `Booking ID: ${bookingId}`,
    ];

    await createCalendarEventForBooking({
      tutorId: user.id,
      bookingId,
      title: `${serviceName} with ${studentName}`,
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      description: descriptionLines.join("\n"),
      studentEmail: studentEmail || undefined,
      timezone: booking.timezone ?? "UTC",
    });
  } catch (calendarError) {
    console.error("[markBookingAsPaid] Failed to create calendar event", calendarError);
  }

  return { success: true };
}

/**
 * Send payment request email for a tutor-initiated booking
 * If tutor has Stripe Connect enabled, generates checkout link and sends payment request email
 * If no Stripe, sends confirmation email with manual payment instructions
 */
export async function sendPaymentRequestForBooking(bookingId: string) {
  const { supabase, user } = await requireTutor();

  if (!user) {
    return { error: "You need to be signed in." };
  }

  const adminClient = createServiceRoleClient();
  if (!adminClient) {
    return { error: "Service unavailable." };
  }

  // Fetch booking with student, service, and tutor profile
  const { data: booking, error: fetchError } = await supabase
    .from("bookings")
    .select(`
      id,
      tutor_id,
      scheduled_at,
      duration_minutes,
      timezone,
      payment_amount,
      currency,
      services (
        id,
        name,
        price_amount,
        price_currency
      ),
      students (
        id,
        full_name,
        email,
        timezone
      )
    `)
    .eq("id", bookingId)
    .single();

  if (fetchError || !booking) {
    return { error: "Booking not found." };
  }

  if (booking.tutor_id !== user.id) {
    return { error: "You can only send payment requests for your own bookings." };
  }

  const student = Array.isArray(booking.students) ? booking.students[0] : booking.students;
  const service = Array.isArray(booking.services) ? booking.services[0] : booking.services;

  if (!student?.email) {
    return { error: "Student email not found." };
  }

  // Get tutor profile for payment settings
  const { data: tutorProfile } = await adminClient
    .from("profiles")
    .select(`
      full_name, email, timezone,
      stripe_account_id, stripe_charges_enabled, stripe_onboarding_status,
      payment_instructions, venmo_handle, paypal_email, zelle_phone,
      stripe_payment_link, custom_payment_url,
      video_provider, zoom_personal_link, google_meet_link, microsoft_teams_link,
      custom_video_url, custom_video_name
    `)
    .eq("id", user.id)
    .single();

  if (!tutorProfile) {
    return { error: "Could not load tutor profile." };
  }

  const serviceName = service?.name ?? "Lesson";
  const paymentAmount = booking.payment_amount ?? service?.price_amount ?? 0;
  const currency = booking.currency ?? service?.price_currency ?? "USD";
  const tutorTimezone = tutorProfile.timezone ?? booking.timezone ?? "UTC";
  const studentTimezone = student.timezone ?? tutorTimezone;

  // Check if Stripe Connect is enabled
  const stripeAccountReady =
    tutorProfile.stripe_charges_enabled === true &&
    tutorProfile.stripe_account_id &&
    tutorProfile.stripe_onboarding_status !== "restricted";

  let paymentUrl: string | undefined;

  // Try to generate Stripe checkout link if Stripe is enabled and there's a price
  if (stripeAccountReady && paymentAmount > 0) {
    try {
      const { createCheckoutSession, getOrCreateStripeCustomer } = await import("@/lib/stripe");

      const stripeCustomer = await getOrCreateStripeCustomer({
        userId: student.id,
        email: student.email,
        name: student.full_name,
      });

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const stripeCurrency = currency.toLowerCase();

      const session = await createCheckoutSession({
        customerId: stripeCustomer.id,
        priceAmount: paymentAmount,
        currency: stripeCurrency,
        successUrl: `${baseUrl}/book/success?booking_id=${bookingId}&session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${baseUrl}/book/cancelled?booking_id=${bookingId}`,
        metadata: {
          bookingId,
          studentRecordId: student.id,
          tutorId: user.id,
        },
        lineItems: [
          {
            name: serviceName,
            description: `${booking.duration_minutes} minute lesson`,
            amount: paymentAmount,
          },
        ],
        transferDestinationAccountId: tutorProfile.stripe_account_id,
      });

      paymentUrl = session.url ?? undefined;

      // Store checkout session ID on booking
      if (session.id) {
        await adminClient
          .from("bookings")
          .update({ stripe_checkout_session_id: session.id })
          .eq("id", bookingId);
      }
    } catch (stripeError) {
      console.error("Failed to create Stripe checkout session:", stripeError);
      // Fall back to manual payment instructions
    }
  }

  // Send appropriate email based on whether we have a payment URL
  if (paymentUrl) {
    // Send payment request email with Stripe checkout link
    await sendBookingPaymentRequestEmail({
      studentName: student.full_name,
      studentEmail: student.email,
      tutorName: tutorProfile.full_name ?? "Your tutor",
      tutorEmail: tutorProfile.email ?? "",
      serviceName,
      scheduledAt: booking.scheduled_at,
      durationMinutes: booking.duration_minutes,
      timezone: studentTimezone,
      amount: paymentAmount / 100, // Convert cents to dollars
      currency,
      paymentUrl,
    });
  } else {
    // No Stripe - send confirmation email with manual payment instructions
    let meetingUrl: string | undefined;
    let meetingProvider: string | undefined;

    switch (tutorProfile.video_provider) {
      case "zoom_personal":
        meetingUrl = tutorProfile.zoom_personal_link ?? undefined;
        meetingProvider = "zoom_personal";
        break;
      case "google_meet":
        meetingUrl = tutorProfile.google_meet_link ?? undefined;
        meetingProvider = "google_meet";
        break;
      case "microsoft_teams":
        meetingUrl = tutorProfile.microsoft_teams_link ?? undefined;
        meetingProvider = "microsoft_teams";
        break;
      case "custom":
        meetingUrl = tutorProfile.custom_video_url ?? undefined;
        meetingProvider = "custom";
        break;
    }

    await sendBookingConfirmationEmail({
      studentName: student.full_name,
      studentEmail: student.email,
      tutorName: tutorProfile.full_name ?? "Your tutor",
      tutorEmail: tutorProfile.email ?? "",
      serviceName,
      scheduledAt: booking.scheduled_at,
      durationMinutes: booking.duration_minutes,
      timezone: studentTimezone,
      amount: paymentAmount / 100,
      currency,
      paymentInstructions: {
        general: tutorProfile.payment_instructions ?? undefined,
        venmoHandle: tutorProfile.venmo_handle ?? undefined,
        paypalEmail: tutorProfile.paypal_email ?? undefined,
        zellePhone: tutorProfile.zelle_phone ?? undefined,
        stripePaymentLink: tutorProfile.stripe_payment_link ?? undefined,
        customPaymentUrl: tutorProfile.custom_payment_url ?? undefined,
      },
      meetingUrl,
      meetingProvider,
      customVideoName: tutorProfile.custom_video_name ?? undefined,
    });
  }

  return { success: true, hasStripePaymentLink: !!paymentUrl };
}

/**
 * Move a booking to a new time (tutor or student initiated)
 * - Tutors can reschedule their own bookings
 * - Students can reschedule their own bookings when linked to the booking record
 */
export async function rescheduleBooking(params: {
  bookingId: string;
  newStart: string;
  durationMinutes?: number;
  timezone?: string;
  requestedBy?: "tutor" | "student";
  reason?: string | null;
}) {
  const supabase = await createClient();
  const adminClient = createServiceRoleClient();

  if (!adminClient) {
    return { error: "Service unavailable. Please try again." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You need to be signed in to update bookings." };
  }

  // Fetch booking with student + service context for authorization and defaults
  const { data: booking, error: bookingError } = await adminClient
    .from("bookings")
    .select(`
      id,
      tutor_id,
      student_id,
      scheduled_at,
      duration_minutes,
      status,
      timezone,
      reschedule_count,
      payment_status,
      payment_amount,
      currency,
      meeting_url,
      meeting_provider,
      students (
        id,
        user_id,
        full_name,
        email
      ),
      services (
        id,
        name,
        duration_minutes
      )
    `)
    .eq("id", params.bookingId)
    .single();

  if (bookingError || !booking) {
    return { error: "Booking not found." };
  }
  const bookingRecord: any = booking;

  const studentUserId = Array.isArray(bookingRecord.students)
    ? bookingRecord.students[0]?.user_id
    : bookingRecord.students?.user_id;

  const isTutor = booking.tutor_id === user.id;
  const isStudent = studentUserId === user.id;

  if (!isTutor && !isStudent) {
    return { error: "You are not allowed to move this booking." };
  }

  if (isCancelledStatus(booking.status)) {
    return { error: "Cannot reschedule a cancelled booking." };
  }

  if (booking.status === "completed") {
    return { error: "Cannot reschedule a completed booking." };
  }

  if (new Date(booking.scheduled_at) < new Date()) {
    return { error: "Cannot reschedule a past booking." };
  }

  if ((booking.reschedule_count ?? 0) >= MAX_RESCHEDULES) {
    return { error: `Maximum reschedules (${MAX_RESCHEDULES}) reached.` };
  }

  const { data: tutorProfile } = await adminClient
    .from("profiles")
    .select("buffer_time_minutes, timezone, full_name, email, advance_booking_days_min, advance_booking_days_max, max_lessons_per_day, max_lessons_per_week")
    .eq("id", booking.tutor_id)
    .single();

  const bufferMinutes = tutorProfile?.buffer_time_minutes ?? 0;
  const tutorTimezone = tutorProfile?.timezone || booking.timezone || params.timezone || "UTC";

  const { data: availability } = await adminClient
    .from("availability")
    .select("day_of_week, start_time, end_time, is_available")
    .eq("tutor_id", booking.tutor_id)
    .eq("is_available", true);

  const { data: existingBookings } = await adminClient
    .from("bookings")
    .select("id, scheduled_at, duration_minutes, status")
    .eq("tutor_id", booking.tutor_id)
    .in("status", ["pending", "confirmed"])
    .neq("id", params.bookingId)
    .gte("scheduled_at", new Date().toISOString());

  const busyResult = await getCalendarBusyWindowsWithStatus({
    tutorId: booking.tutor_id,
    start: new Date(params.newStart),
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
        "External calendar sync looks stale. Please refresh your calendar connection before rescheduling.",
    };
  }

  const busyWindows = busyResult.windows;

  const durationMinutes =
    params.durationMinutes ??
    bookingRecord.duration_minutes ??
    (Array.isArray(bookingRecord.services)
      ? bookingRecord.services[0]?.duration_minutes
      : bookingRecord.services?.duration_minutes) ??
    60;
  const previousSchedule = {
    scheduledAt: booking.scheduled_at,
    timezone: booking.timezone || tutorTimezone,
    durationMinutes:
      bookingRecord.duration_minutes ||
      (Array.isArray(bookingRecord.services)
        ? bookingRecord.services[0]?.duration_minutes
        : bookingRecord.services?.duration_minutes) ||
      durationMinutes,
    meetingUrl: booking.meeting_url ?? null,
    meetingProvider: booking.meeting_provider ?? null,
  };
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tutorlingua.co";
  const requestedBy = params.requestedBy ?? (isTutor ? "tutor" : "student");

  const bookingWindow = await checkAdvanceBookingWindow({
    adminClient,
    tutorId: booking.tutor_id,
    scheduledAt: params.newStart,
    timezone: tutorTimezone,
  });

  if ("error" in bookingWindow) {
    return { error: bookingWindow.error };
  }

  const bookingLimits = await checkBookingLimits({
    adminClient,
    tutorId: booking.tutor_id,
    scheduledAt: params.newStart,
    timezone: tutorTimezone,
    excludeBookingId: params.bookingId,
  });

  if ("error" in bookingLimits) {
    return { error: bookingLimits.error };
  }

  const validation = validateBooking({
    scheduledAt: params.newStart,
    durationMinutes,
    availability: availability || [],
    existingBookings: existingBookings || [],
    bufferMinutes,
    busyWindows,
    timezone: tutorTimezone,
  });

  if (!validation.isValid) {
    return { error: validation.errors.join(" ") };
  }

  const { data: updated, error: updateError } = await adminClient
    .from("bookings")
    .update({
      scheduled_at: params.newStart,
      duration_minutes: durationMinutes,
      timezone: tutorTimezone,
      reschedule_count: (booking.reschedule_count ?? 0) + 1,
      reschedule_requested_at: new Date().toISOString(),
      reschedule_requested_by: requestedBy,
      reschedule_reason: params.reason ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.bookingId)
    .select("*, students(full_name, email), services(name)")
    .single<BookingRecord>();

  if (updateError || !updated) {
    console.error("Failed to reschedule booking:", updateError);
    return { error: "Could not reschedule this booking. Please try again." };
  }

  try {
    const updatedStudent = Array.isArray(updated.students) ? updated.students[0] : updated.students;
    const updatedService = Array.isArray(updated.services) ? updated.services[0] : updated.services;

    await sendBookingRescheduledEmails({
      studentEmail: updatedStudent?.email,
      tutorEmail: tutorProfile?.email,
      studentName: updatedStudent?.full_name ?? "Student",
      tutorName: tutorProfile?.full_name ?? "Your tutor",
      serviceName: updatedService?.name ?? "Lesson",
      oldScheduledAt: previousSchedule.scheduledAt,
      newScheduledAt: updated.scheduled_at,
      timezone: updated.timezone ?? tutorTimezone,
      durationMinutes: updated.duration_minutes ?? durationMinutes,
      meetingUrl: updated.meeting_url ?? previousSchedule.meetingUrl ?? undefined,
      meetingProvider: updated.meeting_provider ?? previousSchedule.meetingProvider ?? undefined,
      rescheduleUrl: `${appUrl.replace(/\/$/, "")}/bookings`,
    });
  } catch (emailError) {
    console.error("[rescheduleBooking] Failed to send reschedule emails", emailError);
  }

  try {
    const updatedStudent = Array.isArray(updated.students) ? updated.students[0] : updated.students;
    const updatedService = Array.isArray(updated.services) ? updated.services[0] : updated.services;
    const studentName = updatedStudent?.full_name ?? "Student";
    const serviceName = updatedService?.name ?? "Lesson";
    const startDate = new Date(updated.scheduled_at);
    const previousStart = new Date(previousSchedule.scheduledAt);
    const previousEnd = new Date(
      previousStart.getTime() + (previousSchedule.durationMinutes ?? durationMinutes) * 60000
    );
    const endDate = new Date(
      startDate.getTime() + (updated.duration_minutes ?? durationMinutes) * 60000
    );

    const descriptionLines = [
      `TutorLingua booking - ${serviceName}`,
      `Student: ${studentName}`,
      `Booking ID: ${updated.id}`,
    ];

    await updateCalendarEventForBooking({
      tutorId: booking.tutor_id,
      bookingId: updated.id,
      title: `${serviceName} with ${studentName}`,
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      previousStart: previousStart.toISOString(),
      previousEnd: previousEnd.toISOString(),
      description: descriptionLines.join("\n"),
      studentEmail: updatedStudent?.email ?? undefined,
      timezone: updated.timezone ?? tutorTimezone,
      createIfMissing: updated.status === "confirmed" || updated.status === "completed",
    });
  } catch (calendarError) {
    console.error("[rescheduleBooking] Failed to update calendar event", calendarError);
  }

  revalidatePath("/bookings");
  revalidatePath("/calendar");
  revalidatePath("/student/bookings");

  return { success: true, booking: updated };
}

/**
 * Check if student has available packages for booking
 * Used by public booking page to show package redemption option
 *
 * SECURITY NOTE: This is called from public booking page.
 * - If user is authenticated as a student, verify they own the email
 * - If user is authenticated as a tutor, verify they own the tutorId
 * - Unauthenticated users can check (for booking flow), but should be rate-limited
 */
export async function checkStudentPackages(params: {
  studentEmail: string;
  tutorId: string;
  durationMinutes: number;
}) {
  const supabase = await createClient();

  // SECURITY: If user is authenticated, verify authorization
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    // Get user's profile to check if they're a tutor
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .single();

    // If authenticated as a tutor, verify they own the tutorId
    if (profile) {
      if (profile.id !== params.tutorId) {
        return {
          error: "You can only check packages for your own students.",
          packages: []
        };
      }
    } else {
      // If authenticated as a student, verify they own the email
      const { data: studentProfile } = await supabase
        .from("students")
        .select("email, user_id")
        .eq("user_id", user.id)
        .single();

      if (studentProfile && studentProfile.email.toLowerCase() !== params.studentEmail.toLowerCase()) {
        return {
          error: "You can only check your own packages.",
          packages: []
        };
      }
    }
  }

  const adminClient = createServiceRoleClient();

  if (!adminClient) {
    return { packages: [] };
  }

  try {
    // Find student by email and tutor
    const { data: student } = await adminClient
      .from("students")
      .select("id")
      .eq("email", params.studentEmail)
      .eq("tutor_id", params.tutorId)
      .single();

    if (!student) {
      return { packages: [] };
    }

    // Get active packages
    const packages = await getActivePackages(student.id, params.tutorId);

    // Filter packages with enough minutes
    const suitablePackages = packages.filter(
      (pkg) => pkg.remaining_minutes >= params.durationMinutes
    );

    return { packages: suitablePackages };
  } catch (error) {
    console.error("Error checking student packages:", error);
    return { packages: [] };
  }
}

/**
 * Get the next upcoming booking for a student
 * Used to auto-populate homework due dates
 */
export async function getStudentNextBooking(studentId: string): Promise<{
  data:
    | {
        id: string;
        scheduled_at: string;
        duration_minutes: number | null;
        services?: { name: string | null } | null;
      }
    | null;
  error: string | null;
}> {
  const { supabase, user } = await requireTutor();

  if (!user) {
    return { data: null, error: "You need to be signed in." };
  }

  const { data, error } = await supabase
    .from("bookings")
    .select("id, scheduled_at, duration_minutes, services(name)")
    .eq("tutor_id", user.id)
    .eq("student_id", studentId)
    .in("status", ["pending", "confirmed"])
    .gt("scheduled_at", new Date().toISOString())
    .order("scheduled_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Failed to get next booking:", error);
    return { data: null, error: "Failed to fetch next booking" };
  }

  const rawService = data
    ? Array.isArray((data as { services?: unknown }).services)
      ? ((data as { services?: { name?: string | null }[] }).services?.[0] ?? null)
      : ((data as { services?: { name?: string | null } }).services ?? null)
    : null;

  const normalized = data
    ? {
        id: String(data.id),
        scheduled_at: String(data.scheduled_at),
        duration_minutes: (data as { duration_minutes?: number | null }).duration_minutes ?? null,
        services:
          rawService && typeof rawService === "object"
            ? { name: (rawService as { name?: string | null }).name ?? null }
            : null,
      }
    : null;

  return { data: normalized, error: null };
}

/**
 * Cancel a booking and refund package minutes if applicable
 */
export async function cancelBooking(bookingId: string) {
  const { supabase, user } = await requireTutor();

  if (!user) {
    return { error: "You need to be signed in to cancel bookings." };
  }

  // Verify the booking belongs to this tutor
  const { data: booking, error: fetchError } = await supabase
    .from("bookings")
    .select(
      `
        id,
        tutor_id,
        status,
        scheduled_at,
        duration_minutes,
        timezone,
        services (
          name,
          duration_minutes
        ),
        students (
          full_name,
          email
        ),
        tutor:profiles!bookings_tutor_id_fkey (
          full_name,
          email
        )
      `
    )
    .eq("id", bookingId)
    .single();

  if (fetchError || !booking) {
    return { error: "Booking not found." };
  }

  if (booking.tutor_id !== user.id) {
    return { error: "You can only cancel your own bookings." };
  }

  const student = Array.isArray(booking.students) ? booking.students[0] : booking.students;
  const tutorProfile = Array.isArray(booking.tutor) ? booking.tutor[0] : booking.tutor;
  const service = Array.isArray(booking.services) ? booking.services[0] : booking.services;
  const studentName = student?.full_name ?? "Student";
  const serviceName = service?.name ?? "Lesson";
  const durationMinutes = booking.duration_minutes ?? service?.duration_minutes ?? 60;
  const startDate = new Date(booking.scheduled_at);
  const endDate = new Date(startDate.getTime() + durationMinutes * 60000);

  if (isCancelledStatus(booking.status)) {
    return { error: "Booking is already cancelled." };
  }

  // Update booking status
  const { error: updateError } = await supabase
    .from("bookings")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      cancelled_by: "tutor",
      updated_at: new Date().toISOString(),
    })
    .eq("id", bookingId)
    .eq("tutor_id", user.id);

  if (updateError) {
    console.error("Failed to cancel booking:", updateError);
    return { error: "Failed to cancel booking. Please try again." };
  }

  // Refund package minutes if this booking used a package
  const { refundPackageMinutes } = await import("@/lib/actions/packages");
  const refundResult = await refundPackageMinutes(bookingId);

  if (!refundResult.success) {
    console.warn("Failed to refund package minutes:", refundResult.error);
    // Don't fail the cancellation if refund fails - just log it
  }

  const { refundSubscriptionLesson } = await import("@/lib/actions/lesson-subscriptions");
  const subscriptionRefund = await refundSubscriptionLesson(bookingId);

  if (!subscriptionRefund.success) {
    console.warn("Failed to refund subscription lesson:", subscriptionRefund.error);
  }

  const studentEmail = student?.email;
  if (studentEmail) {
    await sendBookingCancelledEmail({
      studentName,
      studentEmail,
      tutorName: tutorProfile?.full_name ?? "Your tutor",
      serviceName,
      scheduledAt: booking.scheduled_at,
      timezone: booking.timezone ?? "UTC",
    });
  }

  try {
    await sendTutorCancellationEmail({
      tutorEmail: tutorProfile?.email ?? null,
      tutorName: tutorProfile?.full_name ?? "Tutor",
      studentName,
      serviceName,
      scheduledAt: booking.scheduled_at,
      timezone: booking.timezone ?? "UTC",
      rescheduleUrl: `${(process.env.NEXT_PUBLIC_APP_URL || "https://tutorlingua.co").replace(/\/$/, "")}/bookings`,
    });
  } catch (emailError) {
    console.error("[cancelBooking] Failed to send tutor cancellation email", emailError);
  }

  // Send in-app notification to student about cancellation
  // Need to get student's user_id if they have an account
  const adminClient = createServiceRoleClient();
  if (adminClient && student) {
    try {
      const { data: studentRecord } = await adminClient
        .from("students")
        .select("user_id")
        .eq("email", student.email)
        .eq("tutor_id", user.id)
        .single();

      if (studentRecord?.user_id) {
        const { notifyBookingCancelled } = await import("@/lib/actions/notifications");
        await notifyBookingCancelled({
          userId: studentRecord.user_id,
          userRole: "student",
          otherPartyName: tutorProfile?.full_name ?? "Your tutor",
          serviceName,
          scheduledAt: booking.scheduled_at,
          bookingId,
        });
      }
    } catch (notificationError) {
      console.error("[cancelBooking] notification error:", notificationError);
    }
  }

  try {
    await deleteCalendarEventsForBooking({
      tutorId: user.id,
      bookingId,
      match: {
        title: `${serviceName} with ${studentName}`,
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
    });
  } catch (calendarError) {
    console.error("[cancelBooking] Failed to delete calendar event", calendarError);
  }

  revalidatePath("/bookings");
  revalidatePath("/calendar");
  revalidatePath("/student/bookings");

  return { success: true };
}

/**
 * Input for manual booking creation with payment options
 */
export type ManualBookingInput = {
  service_id: string;
  student_id?: string;
  new_student?: {
    name: string;
    email: string;
    timezone: string;
  };
  scheduled_at: string;
  duration_minutes: number;
  timezone: string;
  notes?: string;
  payment_option: "send_link" | "already_paid" | "free";
};

/**
 * Create a manual booking with flexible payment options
 *
 * Payment options:
 * - send_link: Creates pending booking, generates Stripe checkout, sends payment email
 * - already_paid: Creates confirmed booking, sends confirmation email
 * - free: Creates confirmed booking with complimentary status, sends confirmation email
 */
export async function createManualBookingWithPaymentLink(input: ManualBookingInput): Promise<{
  data?: { bookingId: string; paymentUrl?: string };
  error?: string;
}> {
  const { supabase, user } = await requireTutor();
  if (!user) {
    return { error: "You need to be signed in to create bookings." };
  }

  const adminClient = createServiceRoleClient();
  if (!adminClient) {
    return { error: "Service unavailable. Please try again." };
  }

  // Validate input
  if (!input.student_id && !input.new_student) {
    return { error: "Please select or add a student." };
  }

  if (!input.service_id) {
    return { error: "Please select a service." };
  }

  // Get service details
  const { data: service, error: serviceError } = await supabase
    .from("services")
    .select("id, name, duration_minutes, price_amount, price_currency")
    .eq("id", input.service_id)
    .eq("tutor_id", user.id)
    .single();

  if (serviceError || !service) {
    return { error: "Service not found. Please select a valid service." };
  }

  // Get tutor profile
  const { data: tutorProfile, error: profileError } = await adminClient
    .from("profiles")
    .select(`
      full_name, email, timezone,
      video_provider, zoom_personal_link, google_meet_link, microsoft_teams_link,
      calendly_link, custom_video_url, custom_video_name,
      stripe_account_id, stripe_charges_enabled, stripe_onboarding_status,
      payment_instructions, venmo_handle, paypal_email, zelle_phone,
      stripe_payment_link, custom_payment_url
    `)
    .eq("id", user.id)
    .single();

  if (profileError || !tutorProfile) {
    return { error: "Could not load your profile. Please try again." };
  }

  const tutorTimezone = tutorProfile.timezone || input.timezone || "UTC";

  // Validate booking window
  const bookingWindow = await checkAdvanceBookingWindow({
    adminClient,
    tutorId: user.id,
    scheduledAt: input.scheduled_at,
    timezone: tutorTimezone,
  });

  if ("error" in bookingWindow) {
    return { error: bookingWindow.error };
  }

  // Check booking limits
  const bookingLimits = await checkBookingLimits({
    adminClient,
    tutorId: user.id,
    scheduledAt: input.scheduled_at,
    timezone: tutorTimezone,
  });

  if ("error" in bookingLimits) {
    return { error: bookingLimits.error };
  }

  // Check for conflicts
  const { data: existingBookings } = await supabase
    .from("bookings")
    .select("id, scheduled_at, duration_minutes")
    .eq("tutor_id", user.id)
    .in("status", ["pending", "confirmed"])
    .gte("scheduled_at", new Date(new Date(input.scheduled_at).getTime() - 24 * 60 * 60 * 1000).toISOString())
    .lte("scheduled_at", new Date(new Date(input.scheduled_at).getTime() + 24 * 60 * 60 * 1000).toISOString());

  const bookingStart = new Date(input.scheduled_at);
  const bookingEnd = new Date(bookingStart.getTime() + input.duration_minutes * 60 * 1000);

  const hasConflict = existingBookings?.some((existing) => {
    const existingStart = new Date(existing.scheduled_at);
    const existingEnd = new Date(existingStart.getTime() + existing.duration_minutes * 60 * 1000);
    return bookingStart < existingEnd && bookingEnd > existingStart;
  });

  if (hasConflict) {
    return { error: "This time slot conflicts with an existing booking. Please select a different time." };
  }

  // Get or create student
  let studentId = input.student_id;
  let studentData: { id: string; full_name: string; email: string; timezone?: string } | null = null;

  if (input.new_student) {
    // Create new student
    const { data: newStudent, error: studentError } = await adminClient
      .from("students")
      .insert({
        tutor_id: user.id,
        full_name: input.new_student.name,
        email: input.new_student.email.toLowerCase().trim(),
        timezone: input.new_student.timezone,
        source: "manual",
        calendar_access_status: "approved",
      })
      .select("id, full_name, email, timezone")
      .single();

    if (studentError) {
      // Check if student already exists
      if (studentError.code === "23505") {
        const { data: existing } = await adminClient
          .from("students")
          .select("id, full_name, email, timezone")
          .eq("tutor_id", user.id)
          .eq("email", input.new_student.email.toLowerCase().trim())
          .single();

        if (existing) {
          studentId = existing.id;
          studentData = existing;
        } else {
          return { error: "A student with this email already exists but could not be retrieved." };
        }
      } else {
        console.error("Failed to create student:", studentError);
        return { error: "Could not create student. Please try again." };
      }
    } else {
      studentId = newStudent.id;
      studentData = newStudent;
    }
  } else if (studentId) {
    // Fetch existing student
    const { data: existing } = await supabase
      .from("students")
      .select("id, full_name, email, timezone")
      .eq("id", studentId)
      .eq("tutor_id", user.id)
      .single();

    if (!existing) {
      return { error: "Student not found. Please select a valid student." };
    }
    studentData = existing;
  }

  if (!studentId || !studentData) {
    return { error: "Could not identify student. Please try again." };
  }

  // Determine booking status based on payment option
  const isPendingPayment = input.payment_option === "send_link";
  const isFree = input.payment_option === "free";

  const bookingStatus = isPendingPayment ? "pending" : "confirmed";
  const paymentStatus = isFree ? "complimentary" : (isPendingPayment ? "unpaid" : "paid");
  const paymentAmount = isFree ? 0 : (service.price_amount ?? 0);

  // Get meeting URL from tutor's video settings
  let meetingUrl: string | null = null;
  let meetingProvider: string | null = null;

  if (tutorProfile.video_provider) {
    switch (tutorProfile.video_provider) {
      case "zoom_personal":
        meetingUrl = tutorProfile.zoom_personal_link;
        meetingProvider = "zoom_personal";
        break;
      case "google_meet":
        meetingUrl = tutorProfile.google_meet_link;
        meetingProvider = "google_meet";
        break;
      case "microsoft_teams":
        meetingUrl = tutorProfile.microsoft_teams_link;
        meetingProvider = "microsoft_teams";
        break;
      case "calendly":
        meetingUrl = tutorProfile.calendly_link;
        meetingProvider = "calendly";
        break;
      case "custom":
        meetingUrl = tutorProfile.custom_video_url;
        meetingProvider = "custom";
        break;
    }
  }

  // Create booking
  const { data: bookingResult, error: bookingError } = await adminClient.rpc(
    "create_booking_atomic",
    {
      p_tutor_id: user.id,
      p_student_id: studentId,
      p_service_id: input.service_id,
      p_scheduled_at: input.scheduled_at,
      p_duration_minutes: input.duration_minutes,
      p_timezone: tutorTimezone,
      p_status: bookingStatus,
      p_payment_status: paymentStatus,
      p_payment_amount: paymentAmount,
      p_currency: service.price_currency ?? "USD",
      p_student_notes: input.notes ?? null,
    }
  );

  const booking = Array.isArray(bookingResult)
    ? bookingResult[0]
    : (bookingResult as { id: string; created_at: string } | null);

  if (bookingError || !booking) {
    if (bookingError?.code === "P0001" || bookingError?.code === "23P01") {
      return { error: "This time slot was just booked. Please refresh and select a different time." };
    }
    console.error("Booking RPC failed:", bookingError);
    return { error: "We couldn't save that booking. Please try again." };
  }

  // Update booking with meeting URL
  if (meetingUrl) {
    await adminClient
      .from("bookings")
      .update({
        meeting_url: meetingUrl,
        meeting_provider: meetingProvider,
      })
      .eq("id", booking.id);
  }

  // Ensure conversation thread exists
  await ensureConversationThread(adminClient, user.id, studentId);

  // Handle payment link generation if needed
  let paymentUrl: string | undefined;

  if (input.payment_option === "send_link") {
    // Check if Stripe Connect is enabled
    const stripeAccountReady =
      tutorProfile.stripe_charges_enabled === true &&
      tutorProfile.stripe_account_id &&
      tutorProfile.stripe_onboarding_status !== "restricted";

    if (stripeAccountReady && paymentAmount > 0) {
      try {
        const { createCheckoutSession, getOrCreateStripeCustomer } = await import("@/lib/stripe");

        // Get or create Stripe customer for student
        const stripeCustomer = await getOrCreateStripeCustomer({
          userId: studentId, // Use studentId as the user identifier
          email: studentData.email,
          name: studentData.full_name,
        });

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const stripeCurrency = (service.price_currency ?? "USD").toLowerCase();

        const session = await createCheckoutSession({
          customerId: stripeCustomer.id,
          priceAmount: paymentAmount,
          currency: stripeCurrency,
          successUrl: `${baseUrl}/book/success?booking_id=${booking.id}&session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${baseUrl}/book/cancelled?booking_id=${booking.id}`,
          metadata: {
            bookingId: booking.id,
            studentRecordId: studentId,
            tutorId: user.id,
          },
          lineItems: [
            {
              name: service.name,
              description: `${input.duration_minutes} minute lesson`,
              amount: paymentAmount, // Price in cents
            },
          ],
          transferDestinationAccountId: tutorProfile.stripe_account_id,
        });

        paymentUrl = session.url ?? undefined;

        // Store checkout session ID on booking
        await adminClient
          .from("bookings")
          .update({ stripe_checkout_session_id: session.id })
          .eq("id", booking.id);

      } catch (stripeError) {
        console.error("Failed to create Stripe checkout session:", stripeError);
        // Fall back to manual payment
        paymentUrl = undefined;
      }
    }

    // Send payment request email
    if (paymentUrl) {
      await sendBookingPaymentRequestEmail({
        studentName: studentData.full_name,
        studentEmail: studentData.email,
        tutorName: tutorProfile.full_name ?? "Your tutor",
        tutorEmail: tutorProfile.email ?? "",
        serviceName: service.name,
        scheduledAt: input.scheduled_at,
        durationMinutes: input.duration_minutes,
        timezone: studentData.timezone ?? tutorTimezone,
        amount: paymentAmount / 100,
        currency: service.price_currency ?? "USD",
        paymentUrl,
      });
    } else {
      // Stripe not available, send confirmation with manual payment instructions
      await sendBookingConfirmationEmail({
        studentName: studentData.full_name,
        studentEmail: studentData.email,
        tutorName: tutorProfile.full_name ?? "Your tutor",
        tutorEmail: tutorProfile.email ?? "",
        serviceName: service.name,
        scheduledAt: input.scheduled_at,
        durationMinutes: input.duration_minutes,
        timezone: studentData.timezone ?? tutorTimezone,
        amount: paymentAmount / 100,
        currency: service.price_currency ?? "USD",
        paymentInstructions: {
          general: tutorProfile.payment_instructions ?? undefined,
          venmoHandle: tutorProfile.venmo_handle ?? undefined,
          paypalEmail: tutorProfile.paypal_email ?? undefined,
          zellePhone: tutorProfile.zelle_phone ?? undefined,
          stripePaymentLink: tutorProfile.stripe_payment_link ?? undefined,
          customPaymentUrl: tutorProfile.custom_payment_url ?? undefined,
        },
        meetingUrl: meetingUrl ?? undefined,
        meetingProvider: meetingProvider ?? undefined,
        customVideoName: tutorProfile.custom_video_name ?? undefined,
      });
    }
  } else {
    // Send confirmation email for already_paid or free bookings
    await sendBookingConfirmationEmail({
      studentName: studentData.full_name,
      studentEmail: studentData.email,
      tutorName: tutorProfile.full_name ?? "Your tutor",
      tutorEmail: tutorProfile.email ?? "",
      serviceName: service.name,
      scheduledAt: input.scheduled_at,
      durationMinutes: input.duration_minutes,
      timezone: studentData.timezone ?? tutorTimezone,
      amount: isFree ? 0 : paymentAmount / 100,
      currency: service.price_currency ?? "USD",
      meetingUrl: meetingUrl ?? undefined,
      meetingProvider: meetingProvider ?? undefined,
      customVideoName: tutorProfile.custom_video_name ?? undefined,
    });
  }

  // Send notification to tutor
  await sendTutorBookingNotificationEmail({
    tutorName: tutorProfile.full_name ?? "Tutor",
    tutorEmail: tutorProfile.email ?? "",
    studentName: studentData.full_name,
    studentEmail: studentData.email,
    serviceName: service.name,
    scheduledAt: input.scheduled_at,
    durationMinutes: input.duration_minutes,
    timezone: tutorTimezone,
    amount: isFree ? 0 : paymentAmount / 100,
    currency: service.price_currency ?? "USD",
    notes: input.notes,
    dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/bookings`,
  });

  // Create calendar event
  try {
    const startDate = new Date(input.scheduled_at);
    const endDate = new Date(startDate.getTime() + input.duration_minutes * 60000);

    await createCalendarEventForBooking({
      tutorId: user.id,
      bookingId: booking.id,
      title: `${service.name} with ${studentData.full_name}`,
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      description: `TutorLingua booking - ${service.name}\nStudent: ${studentData.full_name}\nBooking ID: ${booking.id}`,
      studentEmail: studentData.email,
      timezone: tutorTimezone,
    });
  } catch (calendarError) {
    console.error("[createManualBookingWithPaymentLink] Failed to create calendar event", calendarError);
  }

  revalidatePath("/bookings");
  revalidatePath("/calendar");

  return {
    data: {
      bookingId: booking.id,
      paymentUrl,
    },
  };
}
