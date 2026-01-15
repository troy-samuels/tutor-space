import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CalendarPageClient } from "@/components/dashboard/calendar-page-client";

export default async function CalendarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch profile, services, and students in parallel
  const [profileResult, servicesResult, studentsResult, recentBookingsResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("created_at, timezone")
      .eq("id", user.id)
      .single(),
    supabase
      .from("services")
      .select("id, name, duration_minutes, price_amount, currency")
      .eq("tutor_id", user.id)
      .eq("is_active", true)
      .order("name"),
    supabase
      .from("students")
      .select("id, full_name, email, timezone")
      .eq("tutor_id", user.id)
      .order("full_name"),
    supabase
      .from("bookings")
      .select("student_id, scheduled_at")
      .eq("tutor_id", user.id)
      .order("scheduled_at", { ascending: false })
      .limit(12),
  ]);

  const profile = profileResult.data;
  const services = servicesResult.data ?? [];
  const students = studentsResult.data ?? [];
  const recentStudentIds: string[] = [];
  const seenStudentIds = new Set<string>();

  for (const booking of recentBookingsResult.data ?? []) {
    if (!booking.student_id || seenStudentIds.has(booking.student_id)) continue;
    seenStudentIds.add(booking.student_id);
    recentStudentIds.push(booking.student_id);
    if (recentStudentIds.length >= 4) break;
  }

  return (
    <CalendarPageClient
      signupDate={profile?.created_at ?? null}
      services={services}
      students={students}
      recentStudentIds={recentStudentIds}
      tutorTimezone={profile?.timezone ?? "UTC"}
      tutorId={user.id}
    />
  );
}
