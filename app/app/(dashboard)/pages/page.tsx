import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSite } from "@/lib/actions/tutor-sites";
import { SiteEditor } from "@/components/marketing/site-editor";

type ProfileBasics = {
  id: string;
  full_name: string | null;
  username: string | null;
  tagline: string | null;
  bio: string | null;
  avatar_url: string | null;
  plan: "professional" | "growth" | "studio" | null;
};

type ServiceLite = {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number | null;
  price: number | null;
  currency: string | null;
  is_active: boolean | null;
};

type StudentForReviews = {
  id: string;
  full_name: string | null;
  email: string | null;
  parent_email: string | null;
  parent_name: string | null;
};

export default async function PagesBuilder() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/pages");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, username, tagline, bio, avatar_url, plan")
    .eq("id", user.id)
    .single<ProfileBasics>();

  const tutorId = profile?.id ?? user.id;
  const derivedProfile: ProfileBasics = {
    id: tutorId,
    full_name: profile?.full_name ?? user.user_metadata?.full_name ?? user.email ?? "",
    username:
      profile?.username ??
      user.user_metadata?.preferred_username ??
      user.user_metadata?.user_name ??
      "",
    tagline: profile?.tagline ?? "",
    bio: profile?.bio ?? "",
    avatar_url: profile?.avatar_url ?? (user.user_metadata?.avatar_url as string | null) ?? null,
    plan: profile?.plan ?? "professional",
  };

  const { data: services } = await supabase
    .from("services")
    .select("id, name, description, duration_minutes, price, currency, is_active")
    .eq("tutor_id", tutorId)
    .order("created_at", { ascending: true });

  const { data: students } = await supabase
    .from("students")
    .select("id, full_name, email, parent_email, parent_name")
    .eq("tutor_id", tutorId)
    .order("full_name", { ascending: true });

  const activeServices = ((services as ServiceLite[] | null) ?? []).filter((svc) => svc.is_active);
  const reviewableStudents: StudentForReviews[] = (students as StudentForReviews[] | null) ?? [];
  const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.tutorlingua.com";
  const defaultReviewFormUrl = derivedProfile.username
    ? `${appBaseUrl}/book/${derivedProfile.username}`
    : appBaseUrl;

  // Fetch existing site data from database
  const siteResult = await getSite();
  const existingSite = "error" in siteResult ? null : siteResult;

  return (
    <SiteEditor
      profile={{
        id: derivedProfile.id,
        full_name: derivedProfile.full_name ?? "",
        username: derivedProfile.username ?? "",
        tagline: derivedProfile.tagline ?? "",
        bio: derivedProfile.bio ?? "",
        avatar_url: derivedProfile.avatar_url ?? null,
        email: user.email ?? null,
      }}
      services={activeServices}
      plan={(derivedProfile.plan as "professional" | "growth" | "studio") ?? "professional"}
      students={reviewableStudents.map((student) => ({
        id: student.id,
        name: student.full_name ?? "Student",
        hasContact: Boolean(student.email || student.parent_email),
      }))}
      defaultReviewFormUrl={defaultReviewFormUrl}
      initialSiteData={existingSite}
    />
  );
}
