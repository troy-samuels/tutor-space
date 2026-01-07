import { redirect } from "next/navigation";
import { StudentPortalLayout } from "@/components/student-auth/StudentPortalLayout";
import { StudentJourneyClient } from "./StudentJourneyClient";
import { getStudentJourney } from "@/lib/actions/student-timeline";
import { getStudentProgress } from "@/lib/actions/progress";
import { getStudentSubscriptionSummary } from "@/lib/actions/subscriptions";
import { getStudentAvatarUrl } from "@/lib/actions/student-avatar";
import { getStudentSession, getStudentDisplayName } from "@/lib/auth";

export const metadata = {
  title: "My Journey | TutorLingua",
  description: "View your learning journey and milestones",
};

export default async function StudentJourneyPage() {
  // Cached auth call - deduplicates across the request
  const { user, student } = await getStudentSession();

  if (!user) {
    redirect("/student/login");
  }

  const studentName = getStudentDisplayName(student, user);
  // Fetch journey data, progress, and subscription in parallel
  // getStudentJourney() returns events, milestones, and stats
  const [journeyResult, progressData, { data: subscriptionSummary }, avatarUrl] = await Promise.all([
    getStudentJourney(),
    getStudentProgress(),
    getStudentSubscriptionSummary(),
    getStudentAvatarUrl(),
  ]);

  const openHomeworkCount = progressData.homework.filter(
    (item) => item.status !== "completed" && item.status !== "cancelled"
  ).length;

  // Map progress stats to the format expected by StudentJourneyClient
  const clientStats = progressData.stats ? {
    totalLessons: progressData.stats.total_lessons,
    totalMinutes: progressData.stats.total_minutes,
    currentStreak: progressData.stats.current_streak,
    longestStreak: progressData.stats.longest_streak,
    homeworkCompleted: progressData.stats.homework_completed,
  } : null;

  return (
    <StudentPortalLayout
      studentName={studentName}
      avatarUrl={avatarUrl}
      subscriptionSummary={subscriptionSummary}
      homeworkCount={openHomeworkCount}
    >
      <StudentJourneyClient
        events={journeyResult.events}
        milestones={journeyResult.milestones}
        stats={clientStats}
      />
    </StudentPortalLayout>
  );
}
