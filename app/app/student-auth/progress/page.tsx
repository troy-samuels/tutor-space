import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StudentPortalLayout } from "@/components/student-auth/StudentPortalLayout";
import { StudentProgressClient } from "./StudentProgressClient";
import { getStudentProgress, getStudentPracticeData } from "@/lib/actions/progress";

export const metadata = {
  title: "My Progress | TutorLingua",
  description: "Track your learning progress and achievements",
};

export default async function StudentProgressPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/student-auth/login");
  }

  // Fetch progress and practice data in parallel
  const [progressData, practiceData] = await Promise.all([
    getStudentProgress(),
    getStudentPracticeData(),
  ]);

  return (
    <StudentPortalLayout studentName={user.email}>
      <StudentProgressClient
        stats={progressData.stats}
        goals={progressData.goals}
        assessments={progressData.assessments}
        recentNotes={progressData.recentNotes}
        homework={progressData.homework}
        practiceData={practiceData}
      />
    </StudentPortalLayout>
  );
}
