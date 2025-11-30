import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StudentsPageClient } from "./students-page-client";

export default async function StudentsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/students");
  }

  // Fetch students with minimal data for the list view
  const { data: students } = await supabase
    .from("students")
    .select("id, full_name, email, status")
    .eq("tutor_id", user.id)
    .order("created_at", { ascending: false });

  const formattedStudents = (students ?? []).map((s) => ({
    id: s.id,
    fullName: s.full_name,
    email: s.email ?? "",
    status: s.status ?? "active",
  }));

  return <StudentsPageClient initialStudents={formattedStudents} />;
}
