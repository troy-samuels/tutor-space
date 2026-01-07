import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StudentPortalLayout } from "@/components/student-auth/StudentPortalLayout";
import { StudentBookingPage } from "@/components/student-auth/StudentBookingPage";
import { getApprovedTutors } from "@/lib/actions/student-connections";
import { getStudentSubscriptionSummary } from "@/lib/actions/subscriptions";
import { getStudentAvatarUrl } from "@/lib/actions/student-avatar";
import { getStudentDisplayName } from "@/lib/utils/student-name";

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

  const studentName = await getStudentDisplayName(supabase, user);
  // Get approved tutors, subscription summary, and avatar in parallel
  const [tutorsResult, { data: subscriptionSummary }, avatarUrl] = await Promise.all([
    getApprovedTutors(),
    getStudentSubscriptionSummary(),
    getStudentAvatarUrl(),
  ]);
  const { tutors, error: tutorsError } = tutorsResult;

  return (
    <StudentPortalLayout studentName={studentName} avatarUrl={avatarUrl} subscriptionSummary={subscriptionSummary}>
      <StudentBookingPage
        tutors={tutors || []}
        tutorsError={tutorsError}
      />
    </StudentPortalLayout>
  );
}
