"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import type { CalendarEvent, PackageType } from "@/lib/types/calendar";
import { startOfMonth, endOfMonth, format, addMinutes } from "date-fns";

// Map service offer_type to PackageType for color coding
function mapOfferTypeToPackageType(offerType?: string | null): PackageType {
  switch (offerType) {
    case "trial":
      return "trial";
    case "subscription":
      return "subscription";
    case "lesson_block":
      return "lesson_block";
    case "one_off":
    default:
      return "one_off";
  }
}

export type StudentScheduleEvent = CalendarEvent & {
  tutorId: string;
  tutorName: string;
  tutorAvatar: string | null;
};

export type DayLessonInfo = {
  count: number;
  packageTypes: PackageType[];
};

// Type definitions for database results
type StudentRecord = {
  id: string;
  tutor_id: string;
};

type BookingRecord = {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  meeting_url: string | null;
  meeting_provider: string | null;
  payment_status: string | null;
  tutor_id: string;
  service_id: string | null;
  student_id: string;
};

type TutorProfile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
};

type ServiceRecord = {
  id: string;
  name: string;
  offer_type: string | null;
};

/**
 * Get all bookings for a student within a date range
 * Used for the student schedule calendar view
 */
export async function getStudentScheduleEvents(options: {
  startDate: string;
  endDate: string;
  tutorId?: string;
}): Promise<{ events: StudentScheduleEvent[]; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { events: [], error: "Please log in" };
  }

  const adminClient = createServiceRoleClient();
  if (!adminClient) {
    return { events: [], error: "Service unavailable" };
  }

  // Get all student records for this user
  const { data: students } = await adminClient
    .from("students")
    .select("id, tutor_id")
    .eq("user_id", user.id);

  if (!students || students.length === 0) {
    return { events: [] };
  }

  const studentRecords = students as StudentRecord[];
  const studentIds = studentRecords.map((s) => s.id);

  // Build bookings query
  let query = adminClient
    .from("bookings")
    .select(`
      id,
      scheduled_at,
      duration_minutes,
      status,
      meeting_url,
      meeting_provider,
      payment_status,
      tutor_id,
      service_id,
      student_id
    `)
    .in("student_id", studentIds)
    .gte("scheduled_at", options.startDate)
    .lte("scheduled_at", options.endDate)
    .not("status", "in", '("cancelled","cancelled_by_tutor","cancelled_by_student")')
    .order("scheduled_at", { ascending: true });

  // Optional tutor filter
  if (options.tutorId) {
    query = query.eq("tutor_id", options.tutorId);
  }

  const { data: bookings, error: bookingsError } = await query;

  if (bookingsError) {
    console.error("Failed to fetch student schedule:", bookingsError);
    return { events: [], error: "Failed to load schedule" };
  }

  if (!bookings || bookings.length === 0) {
    return { events: [] };
  }

  const bookingRecords = bookings as BookingRecord[];

  // Get tutor and service info
  const tutorIds = [...new Set(bookingRecords.map((b) => b.tutor_id))];
  const serviceIds = [...new Set(bookingRecords.map((b) => b.service_id).filter(Boolean))] as string[];

  const [tutorsResult, servicesResult] = await Promise.all([
    adminClient
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", tutorIds),
    serviceIds.length > 0
      ? adminClient
          .from("services")
          .select("id, name, offer_type")
          .in("id", serviceIds)
      : Promise.resolve({ data: [] as ServiceRecord[] }),
  ]);

  const tutorMap = new Map<string, TutorProfile>(
    ((tutorsResult.data || []) as TutorProfile[]).map((t) => [t.id, t])
  );
  const serviceMap = new Map<string, ServiceRecord>(
    ((servicesResult.data || []) as ServiceRecord[]).map((s) => [s.id, s])
  );

  // Transform to CalendarEvent format
  const events: StudentScheduleEvent[] = bookingRecords.map((booking) => {
    const tutor = tutorMap.get(booking.tutor_id);
    const service = booking.service_id ? serviceMap.get(booking.service_id) : undefined;
    const startDate = new Date(booking.scheduled_at);
    const endDate = addMinutes(startDate, booking.duration_minutes);

    return {
      id: booking.id,
      title: service?.name || "Lesson",
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      type: "tutorlingua" as const,
      source: "TutorLingua",
      tutorId: booking.tutor_id,
      tutorName: tutor?.full_name || "Tutor",
      tutorAvatar: tutor?.avatar_url || null,
      studentId: booking.student_id,
      serviceId: booking.service_id || undefined,
      serviceName: service?.name,
      meetingUrl: booking.meeting_url || undefined,
      bookingStatus: booking.status,
      paymentStatus: booking.payment_status || undefined,
      durationMinutes: booking.duration_minutes,
      packageType: mapOfferTypeToPackageType(service?.offer_type),
    };
  });

  return { events };
}

/**
 * Get monthly lesson counts for the student calendar month view
 * Returns count and package types per day for indicator dots
 */
export async function getStudentMonthlyLessonCounts(
  year: number,
  month: number,
  tutorId?: string
): Promise<{
  counts: Record<string, DayLessonInfo>;
  error?: string;
}> {
  const startDate = startOfMonth(new Date(year, month - 1));
  const endDate = endOfMonth(new Date(year, month - 1));

  const { events, error } = await getStudentScheduleEvents({
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    tutorId,
  });

  if (error) {
    return { counts: {}, error };
  }

  // Group by date
  const counts: Record<string, DayLessonInfo> = {};

  events.forEach((event) => {
    const dateKey = format(new Date(event.start), "yyyy-MM-dd");

    if (!counts[dateKey]) {
      counts[dateKey] = { count: 0, packageTypes: [] };
    }

    counts[dateKey].count++;
    if (event.packageType && !counts[dateKey].packageTypes.includes(event.packageType)) {
      counts[dateKey].packageTypes.push(event.packageType);
    }
  });

  return { counts };
}

/**
 * Get lessons for a specific day
 * Returns detailed lesson info for the day view sidebar
 */
export async function getStudentDayLessons(
  date: string,
  tutorId?: string
): Promise<{ lessons: StudentScheduleEvent[]; error?: string }> {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);

  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  const { events, error } = await getStudentScheduleEvents({
    startDate: dayStart.toISOString(),
    endDate: dayEnd.toISOString(),
    tutorId,
  });

  if (error) {
    return { lessons: [], error };
  }

  return { lessons: events };
}

/**
 * Get list of tutors the student has bookings with
 * Used for the tutor filter dropdown
 */
export async function getStudentTutors(): Promise<{
  tutors: { id: string; name: string; avatar: string | null }[];
  error?: string;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { tutors: [], error: "Please log in" };
  }

  const adminClient = createServiceRoleClient();
  if (!adminClient) {
    return { tutors: [], error: "Service unavailable" };
  }

  // Get all student records for this user
  const { data: students } = await adminClient
    .from("students")
    .select("tutor_id")
    .eq("user_id", user.id);

  if (!students || students.length === 0) {
    return { tutors: [] };
  }

  const tutorIds = [...new Set((students as { tutor_id: string }[]).map((s) => s.tutor_id))];

  const { data: tutors } = await adminClient
    .from("profiles")
    .select("id, full_name, avatar_url")
    .in("id", tutorIds);

  return {
    tutors: ((tutors || []) as TutorProfile[]).map((t) => ({
      id: t.id,
      name: t.full_name || "Tutor",
      avatar: t.avatar_url,
    })),
  };
}
