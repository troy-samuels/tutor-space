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

  const { data: profile } = await supabase
    .from("profiles")
    .select("created_at")
    .eq("id", user.id)
    .single();

  return (
    <CalendarPageClient signupDate={profile?.created_at ?? null} />
  );
}
