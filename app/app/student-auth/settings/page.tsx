import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StudentPortalLayout } from "@/components/student-auth/StudentPortalLayout";
import { StudentSettingsClient } from "./StudentSettingsClient";
import {
  getStudentPreferences,
  getStudentEmailPreferences,
  getStudentAccountInfo,
} from "@/lib/actions/student-settings";
import { getStudentAvatarUrl } from "@/lib/actions/student-avatar";

export const metadata = {
  title: "Settings | TutorLingua",
  description: "Manage your account settings and preferences",
};

export default async function StudentSettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/student-auth/login");
  }

  // Fetch all settings data
  const [preferences, emailPreferences, accountInfo, avatarUrl] = await Promise.all([
    getStudentPreferences(),
    getStudentEmailPreferences(),
    getStudentAccountInfo(),
    getStudentAvatarUrl(),
  ]);

  return (
    <StudentPortalLayout studentName={accountInfo?.email}>
      <StudentSettingsClient
        preferences={preferences}
        emailPreferences={emailPreferences}
        accountInfo={accountInfo}
        avatarUrl={avatarUrl}
      />
    </StudentPortalLayout>
  );
}
