import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";

export type TutorStudentInsight = {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  proficiency: string | null;
  status: string | null;
  learningGoals: string | null;
  nativeLanguage: string | null;
  updatedAt: string | null;
  completedLessons: number;
  upcomingLessons: number;
  outstandingBalanceCents: number;
  outstandingBalanceFormatted: string;
  currency: string;
  lastLessonAt: string | null;
  performance: string | null;
  lastNoteAt: string | null;
};

export async function getTutorStudentInsights(
  tutorId: string,
  client?: SupabaseClient
) {
  const supabase = client ?? (await createClient());

  const [studentsResponse, bookingsResponse, lessonNotesResponse] = await Promise.all([
    supabase
      .from("students")
      .select(
        "id, full_name, email, phone, proficiency_level, status, learning_goals, native_language, updated_at, created_at"
      )
      .eq("tutor_id", tutorId)
      .order("full_name", { ascending: true }),
    supabase
      .from("bookings")
      .select("student_id, status, scheduled_at, payment_status, payment_amount, currency, tutor_id")
      .eq("tutor_id", tutorId),
    supabase
      .from("lesson_notes")
      .select("student_id, student_performance, created_at")
      .eq("tutor_id", tutorId)
      .order("created_at", { ascending: false }),
  ]);

  const students = studentsResponse.data ?? [];

  if (students.length === 0) {
    return [];
  }

  const bookings = bookingsResponse.data ?? [];
  const lessonNotes = lessonNotesResponse.data ?? [];

  const now = new Date();
  const bookingSummaryMap = new Map<
    string,
    {
      completed: number;
      upcoming: number;
      outstandingCents: number;
      currency: string;
      lastLessonAt: string | null;
    }
  >();

  for (const booking of bookings ?? []) {
    if (!booking.student_id) continue;
    const existing =
      bookingSummaryMap.get(booking.student_id) ?? {
        completed: 0,
        upcoming: 0,
        outstandingCents: 0,
        currency: booking.currency ?? "USD",
        lastLessonAt: null,
      };

    if (booking.status === "completed") {
      existing.completed += 1;
      const scheduledAt = booking.scheduled_at ?? null;
      if (scheduledAt) {
        if (!existing.lastLessonAt || new Date(scheduledAt) > new Date(existing.lastLessonAt)) {
          existing.lastLessonAt = scheduledAt;
        }
      }
    }

    if (
      (booking.status === "confirmed" || booking.status === "pending") &&
      booking.scheduled_at &&
      new Date(booking.scheduled_at) >= now
    ) {
      existing.upcoming += 1;
    }

    if (booking.payment_status === "unpaid" && booking.payment_amount) {
      existing.outstandingCents += booking.payment_amount ?? 0;
    }

    if (booking.currency) {
      existing.currency = booking.currency;
    }

    bookingSummaryMap.set(booking.student_id, existing);
  }

  const performanceMap = new Map<string, { performance: string | null; created_at: string | null }>();
  for (const note of lessonNotes ?? []) {
    if (!note.student_id) continue;
    if (!performanceMap.has(note.student_id)) {
      performanceMap.set(note.student_id, {
        performance: note.student_performance ?? null,
        created_at: note.created_at ?? null,
      });
    }
  }

  return students.map((student) => {
    const summary = bookingSummaryMap.get(student.id ?? "") ?? {
      completed: 0,
      upcoming: 0,
      outstandingCents: 0,
      currency: "USD",
      lastLessonAt: null,
    };

    const performance = performanceMap.get(student.id ?? "");

    const currencyCode = summary.currency ?? "USD";
    const outstandingFormatted =
      summary.outstandingCents > 0
        ? formatCurrency(summary.outstandingCents, currencyCode)
        : "All paid";

    const lastLessonAt = summary.lastLessonAt;

    return {
      id: student.id ?? "",
      fullName: student.full_name ?? "Student",
      email: student.email ?? null,
      phone: student.phone ?? null,
      proficiency: student.proficiency_level ?? null,
      status: student.status ?? null,
      learningGoals: student.learning_goals ?? null,
      nativeLanguage: student.native_language ?? null,
      updatedAt: student.updated_at ?? student.created_at ?? null,
      completedLessons: summary.completed,
      upcomingLessons: summary.upcoming,
      outstandingBalanceCents: summary.outstandingCents,
      outstandingBalanceFormatted: outstandingFormatted,
      currency: currencyCode,
      lastLessonAt,
      performance: performance?.performance ?? null,
      lastNoteAt: performance?.created_at ?? null,
    } satisfies TutorStudentInsight;
  });
}
