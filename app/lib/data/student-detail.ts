"use server";

import { createClient } from "@/lib/supabase/server";
import { getTutorStudentProgress, getTutorStudentPracticeData } from "@/lib/actions/progress";
import { getStudentNextBooking } from "@/lib/actions/bookings";
import { getOrCreateThreadByStudentId, type ConversationMessage } from "@/lib/actions/messaging";
import { getStudentStripePayments } from "@/lib/actions/stripe-payments";

type StudentBookingRecord = {
  id: string;
  scheduled_at: string | null;
  duration_minutes: number | null;
  status: string;
  payment_status: string | null;
  payment_amount: number | null;
  currency: string | null;
  service: {
    name: string | null;
  } | null;
};

type StudentLessonNoteRecord = {
  id: string;
  created_at: string | null;
  notes: string | null;
  homework: string | null;
  student_performance: string | null;
  areas_to_focus: string[] | null;
  topics_covered: string[] | null;
};

export type StudentDetailData = {
  tutorId: string;
  student: {
    id: string;
    tutor_id: string;
    full_name: string | null;
    email: string;
    phone: string | null;
    proficiency_level: string | null;
    learning_goals: string | null;
    native_language: string | null;
    notes: string | null;
    status: string | null;
    labels: string[] | null;
    created_at: string | null;
    updated_at: string | null;
  };
  bookings: StudentBookingRecord[];
  lessonNotes: StudentLessonNoteRecord[];
  stats: {
    total_lessons: number;
    lessons_completed: number;
    lessons_cancelled: number;
  };
  homework: Array<{
    id: string;
    created_at: string | null;
    title?: string;
    homework?: string | null;
    status?: string | null;
  }>;
  practiceScenarios: Array<{
    id: string;
    title?: string;
    language?: string;
    level?: string;
  }>;
  nextBooking: Awaited<ReturnType<typeof getStudentNextBooking>>["data"];
  threadId: string | null;
  conversationMessages: ConversationMessage[];
  stripePayments: Awaited<ReturnType<typeof getStudentStripePayments>>["data"];
};

export async function getStudentDetailData(studentId: string): Promise<StudentDetailData | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: student } = await supabase
    .from("students")
    .select(
      "id, tutor_id, full_name, email, phone, proficiency_level, learning_goals, native_language, notes, status, labels, created_at, updated_at"
    )
    .eq("tutor_id", user.id)
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
    .eq("tutor_id", user.id)
    .eq("student_id", student.id)
    .order("scheduled_at", { ascending: false });

  const { data: lessonNotes } = await supabase
    .from("lesson_notes")
    .select(
      "id, created_at, notes, homework, student_performance, areas_to_focus, topics_covered"
    )
    .eq("tutor_id", user.id)
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
    const { data: messageRows } = await supabase
      .from("conversation_messages")
      .select("id, thread_id, sender_role, body, created_at")
      .eq("thread_id", threadResult.threadId)
      .order("created_at", { ascending: true });
    conversationMessages = (messageRows as ConversationMessage[] | null) ?? [];

    await supabase
      .from("conversation_messages")
      .update({ read_by_tutor: true })
      .eq("thread_id", threadResult.threadId)
      .eq("read_by_tutor", false);

    await supabase
      .from("conversation_threads")
      .update({ tutor_unread: false })
      .eq("id", threadResult.threadId);
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
    tutorId: user.id,
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
