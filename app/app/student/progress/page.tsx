import { redirect } from "next/navigation";
import { StudentPortalLayout } from "@/components/student-auth/StudentPortalLayout";
import { StudentProgressClient } from "./StudentProgressClient";
import { getStudentProgress, getStudentPracticeData } from "@/lib/actions/progress";
import { getStudentSubscriptionSummary } from "@/lib/actions/subscriptions";
import { getDrillCounts, getStudentDrills } from "@/lib/actions/drills";
import { getStudentAvatarUrl } from "@/lib/actions/student-avatar";
import { getTutorsAvailableForReview } from "@/lib/actions/reviews";
import { getStudentOnboardingProgressForPortal } from "@/lib/actions/student-onboarding";
import { getStudentSession, getStudentDisplayName } from "@/lib/auth";

export const metadata = {
  title: "My Progress | TutorLingua",
  description: "Track your learning progress and achievements",
};

export default async function StudentProgressPage() {
  // Cached auth call - deduplicates across the request
  const { user, student } = await getStudentSession();

  if (!user) {
    redirect("/student/login");
  }

  const studentName = getStudentDisplayName(student, user);
  // Fetch progress, practice data, drills, onboarding, and reviewable tutors in parallel
  const [progressData, practiceData, drillCounts, drillsData, { data: subscriptionSummary }, avatarUrl, reviewableTutorsResult, onboardingProgress] = await Promise.all([
    getStudentProgress(),
    getStudentPracticeData(),
    getDrillCounts(user.id),
    getStudentDrills(user.id),
    getStudentSubscriptionSummary(),
    getStudentAvatarUrl(),
    getTutorsAvailableForReview(),
    getStudentOnboardingProgressForPortal(),
  ]);
  const openHomeworkCount = progressData.homework.filter(
    (item) => item.status !== "completed" && item.status !== "cancelled"
  ).length;

  return (
    <StudentPortalLayout
      studentName={studentName}
      avatarUrl={avatarUrl}
      subscriptionSummary={subscriptionSummary}
      homeworkCount={openHomeworkCount}
    >
      <StudentProgressClient
        stats={progressData.stats}
        goals={progressData.goals}
        assessments={progressData.assessments}
        recentNotes={progressData.recentNotes}
        homework={progressData.homework}
        practiceData={practiceData}
        drillCounts={drillCounts}
        pendingDrills={drillsData.pending}
        reviewableTutors={reviewableTutorsResult.tutors || []}
        onboardingProgress={onboardingProgress}
      />
    </StudentPortalLayout>
  );
}
