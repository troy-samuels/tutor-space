"use server";

import { createClient } from "@/lib/supabase/server";

export interface LessonHistoryStats {
  total_lessons: number;
  total_minutes: number;
  next_lesson: {
    id: string;
    scheduled_at: string;
    service_name: string;
    meeting_url: string | null;
    duration_minutes: number;
  } | null;
  last_lesson: {
    id: string;
    scheduled_at: string;
    service_name: string;
    duration_minutes: number;
  } | null;
}

export interface Booking {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  meeting_url: string | null;
  service_name: string;
  lesson_notes?: string | null;
}

type BookingRow = {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  meeting_url: string | null;
  services: {
    name: string | null;
  } | null;
  lesson_notes: Array<{
    notes: string | null;
  }> | null;
};

export interface StudentLessonHistoryData {
  stats: LessonHistoryStats;
  upcoming: Booking[];
  past: Booking[];
}

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
      const record = booking as BookingRow;
      return {
        id: record.id,
        scheduled_at: record.scheduled_at,
        duration_minutes: record.duration_minutes,
        status: record.status,
        meeting_url: record.meeting_url,
        service_name: record.services?.name || "Lesson",
        lesson_notes: record.lesson_notes?.[0]?.notes || null,
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
