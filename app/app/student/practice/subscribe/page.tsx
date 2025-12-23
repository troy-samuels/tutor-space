import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StudentPortalLayout } from "@/components/student-auth/StudentPortalLayout";
import { SubscribeClient } from "./SubscribeClient";
import { getStudentSubscriptionSummary } from "@/lib/actions/lesson-subscriptions";

export const metadata = {
  title: "Conversation Practice | TutorLingua",
  description: "Extra practice between your lessons",
};

export default async function SubscribePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/student/login");
  }

  // Get student record
  const { data: student } = await supabase
    .from("students")
    .select("*, profiles:tutor_id(full_name)")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!student) {
    redirect("/student/progress");
  }

  // Check if already subscribed
  const isSubscribed = (student.ai_practice_enabled === true &&
    (!student.ai_practice_current_period_end ||
      new Date(student.ai_practice_current_period_end) > new Date())) ||
    student.ai_practice_free_tier_enabled === true;

  if (isSubscribed) {
    redirect("/student/progress");
  }

  const tutorName = (student.profiles as any)?.full_name || "your tutor";
  const { data: subscriptionSummary } = await getStudentSubscriptionSummary();

  return (
    <StudentPortalLayout studentName={user.email} subscriptionSummary={subscriptionSummary}>
      <SubscribeClient
        studentId={student.id}
        tutorId={student.tutor_id}
        tutorName={tutorName}
      />
    </StudentPortalLayout>
  );
}
