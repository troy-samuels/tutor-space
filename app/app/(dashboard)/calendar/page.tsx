import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CalendarPageClient } from "@/components/dashboard/calendar-page-client";
import type { CalendarViewType } from "@/lib/types/calendar";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;

  // Parse and validate view param
  const viewParam = typeof params.view === "string" ? params.view : "month";
  const validViews: CalendarViewType[] = ["month", "week", "day", "availability"];
  const initialView = validViews.includes(viewParam as CalendarViewType)
    ? (viewParam as CalendarViewType)
    : "month";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch profile, services, students, availability, and calendar connections in parallel
  const [profileResult, servicesResult, studentsResult, recentBookingsResult, availabilityResult, calendarConnectionsResult] = await Promise.all([
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
    supabase
      .from("availability")
      .select("id, day_of_week, start_time, end_time, is_available")
      .eq("tutor_id", user.id)
      .order("day_of_week")
      .order("start_time"),
    supabase
      .from("calendar_connections")
      .select("provider")
      .eq("tutor_id", user.id),
  ]);

  const profile = profileResult.data;
  const services = servicesResult.data ?? [];
  const students = studentsResult.data ?? [];
  const availability = availabilityResult.data ?? [];
  const calendarConnections = calendarConnectionsResult.data ?? [];
  const recentStudentIds: string[] = [];
  const seenStudentIds = new Set<string>();

  for (const booking of recentBookingsResult.data ?? []) {
    if (!booking.student_id || seenStudentIds.has(booking.student_id)) continue;
    seenStudentIds.add(booking.student_id);
    recentStudentIds.push(booking.student_id);
    if (recentStudentIds.length >= 4) break;
  }

  // Check which calendar providers are connected
  const connectedProviders = calendarConnections.map((c) => c.provider);

  return (
    <CalendarPageClient
      signupDate={profile?.created_at ?? null}
      services={services}
      students={students}
      recentStudentIds={recentStudentIds}
      tutorTimezone={profile?.timezone ?? "UTC"}
      tutorId={user.id}
      availability={availability}
      connectedCalendars={connectedProviders}
      initialView={initialView}
    />
  );
}
