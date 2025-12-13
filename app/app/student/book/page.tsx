import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StudentPortalLayout } from "@/components/student-auth/StudentPortalLayout";
import { StudentBookingPage } from "@/components/student-auth/StudentBookingPage";
import { getApprovedTutors, type TutorSearchResult } from "@/lib/actions/student-connections";
import { getStudentSubscriptionSummary } from "@/lib/actions/lesson-subscriptions";
import { getStudentAvatarUrl } from "@/lib/actions/student-avatar";

export const metadata = {
  title: "Book a Lesson | Student Portal",
  description: "Book lessons with your connected tutors",
};

export default async function BookPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/student/login?redirect=/student/book");
  }

  // Get approved tutors, subscription summary, and avatar in parallel
  const [tutorsResult, { data: subscriptionSummary }, avatarUrl] = await Promise.all([
    getApprovedTutors(),
    getStudentSubscriptionSummary(),
    getStudentAvatarUrl(),
  ]);
  const { tutors, error: tutorsError } = tutorsResult;

  // Get student name for layout
  const studentName = user.user_metadata?.full_name || null;

  return (
    <StudentPortalLayout studentName={studentName} avatarUrl={avatarUrl} subscriptionSummary={subscriptionSummary}>
      <StudentBookingPage
        tutors={tutors || []}
        tutorsError={tutorsError}
      />
    </StudentPortalLayout>
  );
}
