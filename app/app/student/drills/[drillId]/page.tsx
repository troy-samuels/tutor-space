import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDrillById } from "@/lib/actions/drills";
import { DrillPlayerClient } from "./DrillPlayerClient";

export const metadata = {
  title: "Practice Drill | Student Portal",
  description: "Complete your practice drill",
};

interface DrillPlayerPageProps {
  params: Promise<{ drillId: string }>;
}

export default async function DrillPlayerPage({ params }: DrillPlayerPageProps) {
  const { drillId } = await params;
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get student record
  let studentId: string | null = null;
  let studentName: string | null = null;

  // Check student token first
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const studentTokenCookie = cookieStore.get("student_auth_token");

  if (studentTokenCookie?.value) {
    const { data: student } = await supabase
      .from("students")
      .select("id, name")
      .eq("access_token", studentTokenCookie.value)
      .single();

    if (student) {
      studentId = student.id;
      studentName = student.name;
    }
  }

  // Fallback to user-based lookup
  if (!studentId && user) {
    const { data: student } = await supabase
      .from("students")
      .select("id, name")
      .eq("user_id", user.id)
      .single();

    if (student) {
      studentId = student.id;
      studentName = student.name;
    }
  }

  if (!studentId) {
    redirect("/student/login");
  }

  // Fetch the drill
  const drill = await getDrillById(drillId);

  if (!drill) {
    notFound();
  }

  // Verify student owns this drill
  if (drill.student_id !== studentId) {
    redirect("/student/drills");
  }

  return (
    <DrillPlayerClient
      drill={drill}
      studentId={studentId}
      studentName={studentName}
    />
  );
}
