"use server";

import { startOfDay, endOfDay, startOfWeek, endOfWeek, addDays } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { getCalendarEventsWithDetails } from "@/lib/calendar/busy-windows";
import type { CalendarEvent, PackageType } from "@/lib/types/calendar";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

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

type GetCalendarEventsParams = {
  start: string;  // ISO date string
  end: string;    // ISO date string
};

type GetCalendarEventsResult = {
  events: CalendarEvent[];
  error?: string;
};

// Get all calendar events for a date range
// Combines: TutorLingua bookings, external calendar events, and blocked times
export async function getCalendarEvents({
  start,
  end,
}: GetCalendarEventsParams): Promise<GetCalendarEventsResult> {
  const { supabase, user } = await requireTutor();

  if (!user) {
    return { events: [], error: "Authentication required" };
  }

  const startDate = new Date(start);
  const endDate = new Date(end);
  const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));

  // Fetch all event sources in parallel
  const [bookings, externalEvents, blockedTimes] = await Promise.all([
    // 1. TutorLingua bookings
    fetchTutorLinguaBookings(supabase, user.id, startDate, endDate),
    // 2. External calendar events (Google/Outlook)
    getCalendarEventsWithDetails({ tutorId: user.id, start: startDate, days }),
    // 3. Manually blocked times
    fetchBlockedTimes(supabase, user.id, startDate, endDate),
  ]);

  // Combine all events
  const allEvents = [...bookings, ...externalEvents, ...blockedTimes];

  // Sort by start time
  allEvents.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  return { events: allEvents };
}

// Get events for a specific week
export async function getWeekEvents(weekStart: string): Promise<GetCalendarEventsResult> {
  const start = startOfWeek(new Date(weekStart), { weekStartsOn: 0 }); // Sunday
  const end = endOfWeek(start, { weekStartsOn: 0 });

  return getCalendarEvents({
    start: start.toISOString(),
    end: end.toISOString(),
  });
}

// Get events for a specific day
export async function getDayEvents(date: string): Promise<GetCalendarEventsResult> {
  const dayDate = new Date(date);
  const start = startOfDay(dayDate);
  const end = endOfDay(dayDate);

  return getCalendarEvents({
    start: start.toISOString(),
    end: end.toISOString(),
  });
}

// Fetch TutorLingua bookings and convert to CalendarEvent format
async function fetchTutorLinguaBookings(
  supabase: SupabaseClient,
  tutorId: string,
  start: Date,
  end: Date
): Promise<CalendarEvent[]> {
  const { data, error } = await supabase
    .from("bookings")
    .select(`
      id,
      scheduled_at,
      duration_minutes,
      timezone,
      status,
      payment_status,
      meeting_url,
      students (
        id,
        full_name,
        email
      ),
      services (
        id,
        name,
        offer_type
      )
    `)
    .eq("tutor_id", tutorId)
    .gte("scheduled_at", start.toISOString())
    .lte("scheduled_at", end.toISOString())
    .neq("status", "cancelled")
    .order("scheduled_at", { ascending: true });

  if (error) {
    console.error("[CalendarEvents] Failed to fetch bookings", error);
    return [];
  }

  return (data ?? []).map((booking: any) => {
    const startTime = new Date(booking.scheduled_at);
    const endTime = new Date(startTime.getTime() + booking.duration_minutes * 60 * 1000);

    const student = Array.isArray(booking.students) ? booking.students[0] : booking.students;
    const service = Array.isArray(booking.services) ? booking.services[0] : booking.services;

    // Map offer_type to packageType (default to one_off if not set)
    const offerType = service?.offer_type;
    let packageType: PackageType = "one_off";
    if (offerType === "trial") packageType = "trial";
    else if (offerType === "subscription") packageType = "subscription";
    else if (offerType === "lesson_block") packageType = "lesson_block";

    return {
      id: booking.id,
      title: student?.full_name
        ? `${student.full_name}${service?.name ? ` - ${service.name}` : ""}`
        : service?.name || "Lesson",
      start: startTime.toISOString(),
      end: endTime.toISOString(),
      type: "tutorlingua" as const,
      source: "TutorLingua",
      studentId: student?.id,
      studentName: student?.full_name,
      serviceId: service?.id,
      serviceName: service?.name,
      meetingUrl: booking.meeting_url,
      bookingStatus: booking.status,
      paymentStatus: booking.payment_status,
      timezone: booking.timezone,
      durationMinutes: booking.duration_minutes,
      packageType,
    };
  });
}

// Fetch manually blocked times and convert to CalendarEvent format
async function fetchBlockedTimes(
  supabase: SupabaseClient,
  tutorId: string,
  start: Date,
  end: Date
): Promise<CalendarEvent[]> {
  const { data, error } = await supabase
    .from("blocked_times")
    .select("id, start_time, end_time, label")
    .eq("tutor_id", tutorId)
    .gte("start_time", start.toISOString())
    .lte("start_time", end.toISOString())
    .order("start_time", { ascending: true });

  if (error) {
    // Table might not exist yet - return empty array
    if (error.code === "42P01") {
      return [];
    }
    console.error("[CalendarEvents] Failed to fetch blocked times", error);
    return [];
  }

  return (data ?? []).map((block) => ({
    id: block.id,
    title: block.label || "Blocked",
    start: block.start_time,
    end: block.end_time,
    type: "blocked" as const,
    source: "Blocked Time",
  }));
}

// Get events grouped by day for week view
export async function getWeekEventsGroupedByDay(weekStart: string): Promise<{
  days: Array<{
    date: string;
    dayName: string;
    events: CalendarEvent[];
  }>;
  error?: string;
}> {
  const result = await getWeekEvents(weekStart);

  if (result.error) {
    return { days: [], error: result.error };
  }

  const start = startOfWeek(new Date(weekStart), { weekStartsOn: 0 });
  const days = [];

  for (let i = 0; i < 7; i++) {
    const date = addDays(start, i);
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);

    const dayEvents = result.events.filter((event) => {
      const eventStart = new Date(event.start);
      return eventStart >= dayStart && eventStart <= dayEnd;
    });

    days.push({
      date: date.toISOString(),
      dayName: date.toLocaleDateString("en-US", { weekday: "short" }),
      events: dayEvents,
    });
  }

  return { days };
}
