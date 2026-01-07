import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StudentPortalLayout } from "@/components/student-auth/StudentPortalLayout";
import { SubscribeClient } from "../subscribe/SubscribeClient";
import { getStudentSubscriptionSummary } from "@/lib/actions/subscriptions";
import { getStudentAvatarUrl } from "@/lib/actions/student-avatar";

export const metadata = {
  title: "Practice Credits | TutorLingua",
  description: "Unlock more practice credits",
};

export default async function BuyCreditsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/student/login");
  }

  const { data: student } = await supabase
    .from("students")
    .select("*, profiles:tutor_id(full_name)")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!student) {
    redirect("/student/progress");
  }

  const studentName = student.full_name || (user.user_metadata?.full_name as string | undefined) || null;
  const tutorName = (student.profiles as any)?.full_name || "your tutor";
  const [{ data: subscriptionSummary }, avatarUrl] = await Promise.all([
    getStudentSubscriptionSummary(),
    getStudentAvatarUrl(),
  ]);

  return (
    <StudentPortalLayout studentName={studentName} avatarUrl={avatarUrl} subscriptionSummary={subscriptionSummary}>
      <SubscribeClient
        studentId={student.id}
        tutorId={student.tutor_id}
        tutorName={tutorName}
      />
    </StudentPortalLayout>
  );
}
