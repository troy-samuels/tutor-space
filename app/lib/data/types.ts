import type { ConversationMessage } from "@/lib/actions/messaging";
import type { StudentStripePaymentSummary } from "@/lib/types/stripe-payments";

export type { ConversationMessage };

export type StudentBookingRecord = {
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

export type StudentLessonNoteRecord = {
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
  nextBooking: {
    id: string;
    scheduled_at: string;
    duration_minutes: number | null;
    services?: { name: string | null } | null;
  } | null;
  threadId: string | null;
  conversationMessages: ConversationMessage[];
  stripePayments: StudentStripePaymentSummary | null;
};
