import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StudentPortalLayout } from "@/components/student-auth/StudentPortalLayout";
import { StudentCalendar } from "@/components/student-auth/StudentCalendar";

export const metadata: Metadata = {
  title: "Book a Lesson | TutorLingua",
  description: "Book lessons with your tutors",
};

export default async function StudentCalendarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/student-auth/login");
  }

  // Get student info
  const { data: student } = await supabase
    .from("students")
    .select("full_name")
    .eq("user_id", user.id)
    .single();

  // Use user metadata as fallback for name
  const studentName = student?.full_name || user.user_metadata?.full_name || null;

  return (
    <StudentPortalLayout studentName={studentName}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Book a Lesson</h1>
          <p className="mt-1 text-muted-foreground">
            Select a tutor and choose an available time slot
          </p>
        </div>

        <StudentCalendar />
      </div>
    </StudentPortalLayout>
  );
}
