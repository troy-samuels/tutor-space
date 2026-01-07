import { redirect } from "next/navigation";
import { StudentPortalLayout } from "@/components/student-auth/StudentPortalLayout";
import { StudentSettingsClient } from "./StudentSettingsClient";
import {
  getStudentPreferences,
  getStudentEmailPreferences,
  getStudentAccountInfo,
} from "@/lib/actions/student-settings";
import { getStudentAvatarUrl } from "@/lib/actions/student-avatar";
import { getStudentSubscriptionSummary } from "@/lib/actions/subscriptions";
import { getSession } from "@/lib/auth";

export const metadata = {
  title: "Settings | TutorLingua",
  description: "Manage your account settings and preferences",
};

export default async function StudentSettingsPage() {
  // Cached auth call - deduplicates across the request
  const { user } = await getSession();

  if (!user) {
    redirect("/student/login");
  }

  // Fetch all settings data in parallel
  const [preferences, emailPreferences, accountInfo, avatarUrl, { data: subscriptionSummary }] = await Promise.all([
    getStudentPreferences(),
    getStudentEmailPreferences(),
    getStudentAccountInfo(),
    getStudentAvatarUrl(),
    getStudentSubscriptionSummary(),
  ]);

  return (
    <StudentPortalLayout studentName={accountInfo?.full_name} avatarUrl={avatarUrl} subscriptionSummary={subscriptionSummary}>
      <StudentSettingsClient
        preferences={preferences}
        emailPreferences={emailPreferences}
        accountInfo={accountInfo}
        avatarUrl={avatarUrl}
      />
    </StudentPortalLayout>
  );
}
