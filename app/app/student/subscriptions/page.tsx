import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StudentPortalLayout } from "@/components/student-auth/StudentPortalLayout";
import { SubscriptionsClient } from "./SubscriptionsClient";
import { getStudentLessonSubscriptions, getStudentSubscriptionSummary } from "@/lib/actions/subscriptions";
import { getStudentAvatarUrl } from "@/lib/actions/student-avatar";
import { getStudentDisplayName } from "@/lib/utils/student-name";

export const metadata = {
  title: "Subscriptions | TutorLingua",
  description: "Manage your lesson subscriptions",
};

export default async function StudentSubscriptionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/student/login");
  }

  const studentName = await getStudentDisplayName(supabase, user);
  const [{ data: subscriptions, error }, { data: subscriptionSummary }, avatarUrl] = await Promise.all([
    getStudentLessonSubscriptions(),
    getStudentSubscriptionSummary(),
    getStudentAvatarUrl(),
  ]);

  return (
    <StudentPortalLayout studentName={studentName} avatarUrl={avatarUrl} subscriptionSummary={subscriptionSummary}>
      <SubscriptionsClient
        subscriptions={subscriptions ?? []}
        error={error}
      />
    </StudentPortalLayout>
  );
}
