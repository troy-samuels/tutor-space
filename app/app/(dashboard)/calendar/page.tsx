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
  const [profileResult, servicesResult, studentsResult] = await Promise.all([
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
  ]);

  const profile = profileResult.data;
  const services = servicesResult.data ?? [];
  const students = studentsResult.data ?? [];

  return (
    <CalendarPageClient
      signupDate={profile?.created_at ?? null}
      services={services}
      students={students}
      tutorTimezone={profile?.timezone ?? "UTC"}
    />
  );
}
