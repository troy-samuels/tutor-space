import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getStudentTutors } from "@/lib/actions/student-schedule";
import { getStudentPreferences } from "@/lib/actions/student-settings";
import { StudentScheduleClient } from "./StudentScheduleClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "My Schedule | TutorLingua",
  description: "View your past, present, and upcoming lessons",
};

export default async function StudentSchedulePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/student/login?redirect=/student/schedule");
  }

  // Get list of tutors this student has bookings with
  const { tutors, error } = await getStudentTutors();
  const preferences = await getStudentPreferences();

  if (error) {
    console.error("Failed to load tutors:", error);
  }

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">My Schedule</h1>
        <p className="text-muted-foreground">
          View your past, present, and upcoming lessons
        </p>
      </div>

      <div className="flex-1 min-h-0">
        <StudentScheduleClient
          tutors={tutors || []}
          studentTimezone={preferences?.timezone || undefined}
        />
      </div>
    </div>
  );
}
