import { redirect } from "next/navigation";
import { StudentPortalLayout } from "@/components/student-auth/StudentPortalLayout";
import { getStudentAvatarUrl } from "@/lib/actions/student-avatar";
import { getStudentSession, getStudentDisplayName } from "@/lib/auth";
import { NotificationsClient } from "./NotificationsClient";

export const metadata = {
  title: "Notifications | TutorLingua",
  description: "View your latest notifications",
};

export default async function StudentNotificationsPage() {
  // Cached auth call - deduplicates across the request
  const { user, student } = await getStudentSession();

  if (!user) {
    redirect("/student/login?redirect=/student/notifications");
  }

  const studentName = getStudentDisplayName(student, user);
  const avatarUrl = await getStudentAvatarUrl();

  return (
    <StudentPortalLayout studentName={studentName} avatarUrl={avatarUrl}>
      <NotificationsClient />
    </StudentPortalLayout>
  );
}
