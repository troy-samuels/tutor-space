import { redirect } from "next/navigation";
import { StudentPortalLayout } from "@/components/student-auth/StudentPortalLayout";
import { HomeworkPageClient } from "./HomeworkPageClient";
import { getStudentProgress, getStudentPracticeData } from "@/lib/actions/progress";
import { getDrillCounts, getStudentDrills } from "@/lib/actions/drills";
import { getStudentSubscriptionSummary } from "@/lib/actions/subscriptions";
import { getStudentAvatarUrl } from "@/lib/actions/student-avatar";
import { getStudentSession, getStudentDisplayName } from "@/lib/auth";

export const metadata = {
  title: "Homework | Student Portal",
  description: "View your assignments and linked practice.",
};

export default async function HomeworkPage() {
  // Single cached auth call replaces 3 sequential queries
  const { user, student } = await getStudentSession();

  if (!user) {
    redirect("/student/login?redirect=/student/homework");
  }

  const studentId = student?.id ?? null;
  const studentName = getStudentDisplayName(student, user);

  const [progressData, practiceData, subscriptionSummaryResult, avatarUrl] =
    await Promise.all([
      getStudentProgress(undefined, studentId ?? undefined),
      getStudentPracticeData(),
      getStudentSubscriptionSummary(),
      getStudentAvatarUrl(),
    ]);

  const [drillCounts, drillsData] = studentId
    ? await Promise.all([getDrillCounts(studentId), getStudentDrills(studentId)])
    : [null, { pending: [], completed: [] }];

  const subscriptionSummary = subscriptionSummaryResult.data;
  const openHomeworkCount = progressData.homework.filter(
    (item) => item.status !== "completed" && item.status !== "cancelled"
  ).length;
  const lessonsCompleted =
    progressData.stats?.lessons_completed ?? progressData.stats?.total_lessons ?? 0;
  const hasCompletedFirstClass = lessonsCompleted > 0;

  return (
    <StudentPortalLayout
      studentName={studentName}
      avatarUrl={avatarUrl}
      subscriptionSummary={subscriptionSummary}
      homeworkCount={openHomeworkCount}
    >
      <HomeworkPageClient
        homework={progressData.homework}
        practiceData={practiceData}
        stats={progressData.stats}
        drillCounts={hasCompletedFirstClass ? drillCounts : null}
        pendingDrills={hasCompletedFirstClass ? drillsData.pending : null}
        showPracticeSections={hasCompletedFirstClass}
      />
    </StudentPortalLayout>
  );
}
