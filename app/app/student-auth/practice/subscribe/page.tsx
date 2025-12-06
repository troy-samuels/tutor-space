import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StudentPortalLayout } from "@/components/student-auth/StudentPortalLayout";
import { SubscribeClient } from "./SubscribeClient";

export const metadata = {
  title: "Subscribe to AI Practice | TutorLingua",
  description: "Unlock AI-powered language practice between lessons",
};

export default async function SubscribePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/student-auth/login");
  }

  // Get student record
  const { data: student } = await supabase
    .from("students")
    .select("id, tutor_id, ai_practice_enabled, ai_practice_current_period_end, profiles:tutor_id(full_name)")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!student) {
    redirect("/student-auth/progress");
  }

  // Check if already subscribed
  const isSubscribed = student.ai_practice_enabled === true &&
    (!student.ai_practice_current_period_end ||
      new Date(student.ai_practice_current_period_end) > new Date());

  if (isSubscribed) {
    redirect("/student-auth/progress");
  }

  const tutorName = (student.profiles as any)?.full_name || "your tutor";

  return (
    <StudentPortalLayout studentName={user.email}>
      <SubscribeClient
        studentId={student.id}
        tutorId={student.tutor_id}
        tutorName={tutorName}
      />
    </StudentPortalLayout>
  );
}
