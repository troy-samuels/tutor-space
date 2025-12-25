import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StudentPortalLayout } from "@/components/student-auth/StudentPortalLayout";
import { HomeworkPageClient } from "./HomeworkPageClient";
import { getStudentProgress, getStudentPracticeData } from "@/lib/actions/progress";
import { getDrillCounts, getStudentDrills } from "@/lib/actions/drills";
import { getStudentSubscriptionSummary } from "@/lib/actions/lesson-subscriptions";
import { getStudentAvatarUrl } from "@/lib/actions/student-avatar";

export const metadata = {
  title: "Homework | Student Portal",
  description: "View your assignments and linked practice.",
};

export default async function HomeworkPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const studentTokenCookie = cookieStore.get("student_auth_token");

  let studentId: string | null = null;
  let studentName: string | null = null;

  if (studentTokenCookie?.value) {
    const { data: student } = await supabase
      .from("students")
      .select("*")
      .eq("access_token", studentTokenCookie.value)
      .maybeSingle();

    if (student) {
      studentId = student.id;
      studentName = student.full_name ?? student.name ?? null;
    }
  }

  if (!studentId && user) {
    const { data: student } = await supabase
      .from("students")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (student) {
      studentId = student.id;
      studentName = student.full_name ?? student.name ?? null;
    }
  }

  if (!studentId && !user) {
    redirect("/student/login?redirect=/student/homework");
  }

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
  const displayName =
    studentName ??
    (user?.user_metadata as { full_name?: string } | null)?.full_name ??
    user?.email ??
    null;

  return (
    <StudentPortalLayout
      studentName={displayName}
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
