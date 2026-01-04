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

  // Fetch students with CRM data for the list view
  const { data: students } = await supabase
    .from("students")
    .select("id, full_name, email, status, onboarding_status, engagement_score, risk_status")
    .eq("tutor_id", user.id)
    .order("created_at", { ascending: false });

  const formattedStudents = (students ?? []).map((s) => ({
    id: s.id,
    fullName: s.full_name,
    email: s.email ?? "",
    status: s.status ?? "active",
    onboardingStatus: s.onboarding_status ?? "not_started",
    engagementScore: s.engagement_score ?? 100,
    riskStatus: s.risk_status ?? "healthy",
  }));

  // Fetch invite links
  const { data: inviteLinks } = await supabase
    .from("tutor_invite_links")
    .select("*")
    .eq("tutor_id", user.id)
    .order("created_at", { ascending: false });

  // Fetch active services for link creation
  const { data: services } = await supabase
    .from("services")
    .select("id, name")
    .eq("tutor_id", user.id)
    .eq("is_active", true)
    .order("name");

  // Get service names for links that have service scope
  const allServiceIds = [
    ...new Set((inviteLinks ?? []).flatMap((link) => link.service_ids ?? [])),
  ];

  let serviceMap: Record<string, string> = {};
  if (allServiceIds.length > 0) {
    const { data: scopedServices } = await supabase
      .from("services")
      .select("id, name")
      .in("id", allServiceIds);
    serviceMap = Object.fromEntries(
      (scopedServices ?? []).map((s) => [s.id, s.name])
    );
  }

  const formattedInviteLinks = (inviteLinks ?? []).map((link) => ({
    id: link.id,
    token: link.token,
    name: link.name,
    expiresAt: link.expires_at,
    isActive: link.is_active,
    serviceIds: link.service_ids ?? [],
    usageCount: link.usage_count,
    createdAt: link.created_at,
    services: (link.service_ids ?? [])
      .filter((id: string) => serviceMap[id])
      .map((id: string) => ({ id, name: serviceMap[id] })),
  }));

  const formattedServices = (services ?? []).map((s) => ({
    id: s.id,
    name: s.name,
  }));

  return (
    <StudentsPageClient
      initialStudents={formattedStudents}
      initialInviteLinks={formattedInviteLinks}
      services={formattedServices}
    />
  );
}
