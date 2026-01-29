"use server";

import { createClient } from "@/lib/supabase/server";
import type { LessonHistoryStats, Booking, StudentLessonHistoryData } from "@/lib/actions/types";
import { resolveBookingMeetingUrl, tutorHasStudioAccess } from "@/lib/utils/classroom-links";

/**
 * Fetch complete lesson history for a student
 * Includes stats, upcoming lessons, and past lessons
 */
export async function getStudentLessonHistory(
  studentId: string,
  tutorId: string
): Promise<{ data: StudentLessonHistoryData | null; error: string | null }> {
  try {
    const supabase = await createClient();

    const { data: tutorProfile } = await supabase
      .from("profiles")
      .select("tier, plan")
      .eq("id", tutorId)
      .maybeSingle();
    const tutorHasStudio = tutorHasStudioAccess({
      tier: tutorProfile?.tier ?? null,
      plan: tutorProfile?.plan ?? null,
    });

    // Fetch all bookings for this student
    const { data: bookings, error: bookingsError } = await supabase
      .from("bookings")
      .select(
        `
        id,
        scheduled_at,
        duration_minutes,
        status,
        meeting_url,
        short_code,
        services (
          name
        ),
        lesson_notes (
          notes
        )
      `
      )
      .eq("student_id", studentId)
      .eq("tutor_id", tutorId)
      .order("scheduled_at", { ascending: false });

    if (bookingsError) {
      console.error("Error fetching bookings:", bookingsError);
      return { data: null, error: "Failed to fetch lesson history" };
    }

    if (!bookings) {
      return {
        data: {
          stats: {
            total_lessons: 0,
            total_minutes: 0,
            next_lesson: null,
            last_lesson: null,
          },
          upcoming: [],
          past: [],
        },
        error: null,
      };
    }

    const now = new Date();

    // Transform bookings to flat structure
    const flatBookings: Booking[] = bookings.map((booking) => {
      const service = Array.isArray(booking.services) ? booking.services[0] : booking.services;
      const lessonNote = Array.isArray(booking.lesson_notes)
        ? booking.lesson_notes[0]
        : booking.lesson_notes?.[0];
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
        service_name: service?.name || "Lesson",
        lesson_notes: lessonNote?.notes || null,
      };
    });

    // Calculate stats
    const completedLessons = flatBookings.filter((b) => b.status === "completed");
    const total_lessons = completedLessons.length;
    const total_minutes = completedLessons.reduce(
      (sum, b) => sum + b.duration_minutes,
      0
    );

    // Find next upcoming lesson
    const upcomingConfirmed = flatBookings
      .filter(
        (b) =>
          b.status === "confirmed" && new Date(b.scheduled_at) > now
      )
      .sort(
        (a, b) =>
          new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
      );

    const next_lesson = upcomingConfirmed.length > 0
      ? {
          id: upcomingConfirmed[0].id,
          scheduled_at: upcomingConfirmed[0].scheduled_at,
          service_name: upcomingConfirmed[0].service_name,
          meeting_url: upcomingConfirmed[0].meeting_url,
          duration_minutes: upcomingConfirmed[0].duration_minutes,
        }
      : null;

    // Find last completed lesson
    const last_lesson = completedLessons.length > 0
      ? {
          id: completedLessons[0].id,
          scheduled_at: completedLessons[0].scheduled_at,
          service_name: completedLessons[0].service_name,
          duration_minutes: completedLessons[0].duration_minutes,
        }
      : null;

    // Split upcoming and past
    const upcoming = flatBookings
      .filter(
        (b) =>
          (b.status === "confirmed" || b.status === "pending") &&
          new Date(b.scheduled_at) > now
      )
      .sort(
        (a, b) =>
          new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
      )
      .slice(0, 5); // Limit to next 5

    const past = flatBookings
      .filter((b) => b.status === "completed")
      .slice(0, 10); // Limit to last 10

    return {
      data: {
        stats: {
          total_lessons,
          total_minutes,
          next_lesson,
          last_lesson,
        },
        upcoming,
        past,
      },
      error: null,
    };
  } catch (error) {
    console.error("Error in getStudentLessonHistory:", error);
    return { data: null, error: "An unexpected error occurred" };
  }
}
