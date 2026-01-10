"use server";

import { createClient } from "@/lib/supabase/server";
import { endOfDay, endOfMonth, startOfDay, startOfMonth } from "date-fns";
import { getDashboardExternalEvents } from "@/lib/actions/calendar-events";
import type { PackageType } from "@/lib/types/calendar";
import type { DailyLesson, DayBookingInfo } from "@/lib/actions/types";
import { isClassroomUrl, resolveBookingMeetingUrl, tutorHasStudioAccess } from "@/lib/utils/classroom-links";

// Helper to map offer_type to PackageType
function mapOfferTypeToPackageType(offerType?: string | null): PackageType {
  if (offerType === "trial") return "trial";
  if (offerType === "subscription") return "subscription";
  if (offerType === "lesson_block") return "lesson_block";
  return "one_off";
}

export async function getDailyLessons(date: Date) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return { lessons: [] };

  const { data: profile } = await supabase
    .from("profiles")
    .select("tier, plan")
    .eq("id", user.id)
    .maybeSingle();
  const tutorHasStudio = tutorHasStudioAccess({
    tier: profile?.tier ?? null,
    plan: profile?.plan ?? null,
  });

  const dayStart = startOfDay(date).toISOString();
  const dayEnd = endOfDay(date).toISOString();

  const { data: bookings, error } = await supabase
    .from("bookings")
    .select(`
      id,
      scheduled_at,
      duration_minutes,
      status,
      meeting_url,
      meeting_provider,
      short_code,
      payment_status,
      students (
        id,
        full_name,
        email
      ),
      services (
        name,
        offer_type
      )
    `)
    .eq("tutor_id", user.id)
    .gte("scheduled_at", dayStart)
    .lte("scheduled_at", dayEnd)
    .in("status", ["pending", "confirmed", "completed"])
    .is("deleted_at", null)
    .order("scheduled_at", { ascending: true });

  if (error) {
    console.error("Error fetching daily lessons:", error);
    return { lessons: [] };
  }

  const lessons: DailyLesson[] = (bookings || []).map((booking: any) => {
    const student = Array.isArray(booking.students) ? booking.students[0] : booking.students;
    const service = Array.isArray(booking.services) ? booking.services[0] : booking.services;
    const meetingUrl = resolveBookingMeetingUrl({
      meetingUrl: booking.meeting_url,
      bookingId: booking.id,
      shortCode: booking.short_code,
      tutorHasStudio,
      allowClassroomFallback: true,
    });

    return {
      id: booking.id,
      scheduled_at: booking.scheduled_at,
      duration_minutes: booking.duration_minutes,
      status: booking.status,
      meeting_url: meetingUrl,
      meeting_provider:
        booking.meeting_provider ?? (isClassroomUrl(meetingUrl) ? "livekit" : null),
      payment_status: booking.payment_status,
      packageType: mapOfferTypeToPackageType(service?.offer_type),
      student: student
        ? {
            id: student.id,
            full_name: student.full_name,
            email: student.email,
          }
        : null,
      service: service ? { name: service.name } : null,
    };
  });

  return { lessons };
}

// Type for booking counts with package type information
export async function getMonthlyBookingCounts(year: number, month: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { counts: {}, bookingsByDay: {} as Record<string, DayBookingInfo> };

  const monthStartDate = startOfMonth(new Date(year, month, 1));
  const monthEndDate = endOfMonth(new Date(year, month, 1));
  const monthStart = monthStartDate.toISOString();
  const monthEnd = monthEndDate.toISOString();

  // Fetch TutorLingua bookings and external events in parallel
  const [bookingsResult, externalEvents] = await Promise.all([
    // 1. TutorLingua bookings (user client with RLS)
    supabase
      .from("bookings")
      .select(`
        scheduled_at,
        status,
        services (
          offer_type
        )
      `)
      .eq("tutor_id", user.id)
      .gte("scheduled_at", monthStart)
      .lte("scheduled_at", monthEnd)
      .in("status", ["pending", "confirmed", "completed"])
      .is("deleted_at", null),
    // 2. External calendar events (uses service role via helper)
    getDashboardExternalEvents({ tutorId: user.id, year, month }),
  ]);

  const { data: bookings, error } = bookingsResult;

  if (error) {
    console.error("[DashboardCalendar] Error fetching monthly bookings:", error);
    return { counts: {}, bookingsByDay: {} as Record<string, DayBookingInfo> };
  }

  // Group by date with package types
  const counts: Record<string, number> = {};
  const bookingsByDay: Record<string, DayBookingInfo> = {};

  // Process TutorLingua bookings
  bookings?.forEach((booking: any) => {
    const date = booking.scheduled_at.split("T")[0]; // YYYY-MM-DD
    counts[date] = (counts[date] || 0) + 1;

    const service = Array.isArray(booking.services) ? booking.services[0] : booking.services;
    const packageType = mapOfferTypeToPackageType(service?.offer_type);

    if (!bookingsByDay[date]) {
      bookingsByDay[date] = { count: 0, packageTypes: [] };
    }
    bookingsByDay[date].count += 1;
    if (!bookingsByDay[date].packageTypes.includes(packageType)) {
      bookingsByDay[date].packageTypes.push(packageType);
    }
  });

  // Process external calendar events
  if (externalEvents.length > 0) {
    for (const event of externalEvents) {
      const start = new Date(event.start);
      const end = new Date(event.end);

      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        continue;
      }

      const endInclusive = new Date(end.getTime() - 1);
      const cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
      const endCursor = new Date(Date.UTC(endInclusive.getUTCFullYear(), endInclusive.getUTCMonth(), endInclusive.getUTCDate()));

      while (cursor.getTime() <= endCursor.getTime()) {
        const dateKey = cursor.toISOString().slice(0, 10);
        counts[dateKey] = (counts[dateKey] || 0) + 1;

        if (!bookingsByDay[dateKey]) {
          bookingsByDay[dateKey] = { count: 0, packageTypes: [] };
        }

        bookingsByDay[dateKey].count += 1;
        if (!bookingsByDay[dateKey].packageTypes.includes("external")) {
          bookingsByDay[dateKey].packageTypes.push("external");
        }

        cursor.setUTCDate(cursor.getUTCDate() + 1);
      }
    }
  }

  return { counts, bookingsByDay };
}

export async function getTodayLessonsCount() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return { count: 0 };

  const today = new Date();
  const dayStart = startOfDay(today).toISOString();
  const dayEnd = endOfDay(today).toISOString();

  const { count, error } = await supabase
    .from("bookings")
    .select("*", { count: "exact", head: true })
    .eq("tutor_id", user.id)
    .gte("scheduled_at", dayStart)
    .lte("scheduled_at", dayEnd)
    .in("status", ["pending", "confirmed"]);

  if (error) {
    console.error("Error fetching today's count:", error);
    return { count: 0 };
  }

  return { count: count || 0 };
}
