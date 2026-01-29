"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getTutorStudentProgress, getTutorStudentPracticeData } from "@/lib/actions/progress";
import { getStudentNextBooking } from "@/lib/actions/bookings";
import { getOrCreateThreadByStudentId } from "@/lib/actions/messaging";
import { listMessagesForThread, markMessagesReadByTutor, markThreadReadByTutor } from "@/lib/repositories/messaging";
import { getStudentStripePayments } from "@/lib/actions/stripe-payments";
import type { StudentDetailData, ConversationMessage, StudentBookingRecord, StudentLessonNoteRecord } from "@/lib/data/types";

type StudentDetailOptions = {
  supabase?: SupabaseClient;
  userId?: string | null;
};

export async function getStudentDetailData(
  studentId: string,
  options: StudentDetailOptions = {}
): Promise<StudentDetailData | null> {
  const supabase = options.supabase ?? await createClient();
  let userId = options.userId ?? null;

  if (!userId) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id ?? null;
  }

  if (!userId) {
    return null;
  }

  const { data: student } = await supabase
    .from("students")
    .select(
      "id, tutor_id, full_name, email, phone, proficiency_level, learning_goals, native_language, notes, status, labels, created_at, updated_at"
    )
    .eq("tutor_id", userId)
    .eq("id", studentId)
    .single();

  if (!student) {
    return null;
  }

  const { data: bookings } = await supabase
    .from("bookings")
    .select(
      "id, scheduled_at, duration_minutes, status, payment_status, payment_amount, currency, service:services(name)"
    )
    .eq("tutor_id", userId)
    .eq("student_id", student.id)
    .order("scheduled_at", { ascending: false });

  const { data: lessonNotes } = await supabase
    .from("lesson_notes")
    .select(
      "id, created_at, notes, homework, student_performance, areas_to_focus, topics_covered"
    )
    .eq("tutor_id", userId)
    .eq("student_id", student.id)
    .order("created_at", { ascending: false })
    .limit(10);

  const [progress, practiceData, nextBooking, threadResult, stripePayments] = await Promise.all([
    getTutorStudentProgress(student.id),
    getTutorStudentPracticeData(student.id),
    getStudentNextBooking(student.id),
    getOrCreateThreadByStudentId(student.id),
    getStudentStripePayments(student.id),
  ]);

  let conversationMessages: ConversationMessage[] = [];
  if (threadResult.threadId) {
    const { data: messageRows } = await listMessagesForThread(supabase, threadResult.threadId);
    conversationMessages = (messageRows as ConversationMessage[] | null) ?? [];

    await markMessagesReadByTutor(supabase, threadResult.threadId);
    await markThreadReadByTutor(supabase, threadResult.threadId);
  }

  const bookingRecords: StudentBookingRecord[] = (bookings as StudentBookingRecord[] | null) ?? [];
  const lessonNoteRecords: StudentLessonNoteRecord[] =
    (lessonNotes as StudentLessonNoteRecord[] | null) ?? [];

  const stats = {
    total_lessons: progress.stats?.total_lessons ?? 0,
    lessons_completed: progress.stats?.lessons_completed ?? progress.stats?.total_lessons ?? 0,
    lessons_cancelled: progress.stats?.lessons_cancelled ?? 0,
  };

  const practiceScenarios = practiceData.scenarios.slice(0, 3).map((scenario) => ({
    ...scenario,
    title: scenario.title ?? undefined,
    language: scenario.language ?? undefined,
    level: scenario.level ?? undefined,
  }));

  return {
    tutorId: userId,
    student: { ...student, email: student.email ?? "" },
    bookings: bookingRecords,
    lessonNotes: lessonNoteRecords,
    stats,
    homework: progress.homework.slice(0, 3),
    practiceScenarios,
    nextBooking: nextBooking.data,
    threadId: threadResult.threadId,
    conversationMessages,
    stripePayments: stripePayments.data,
  };
}
