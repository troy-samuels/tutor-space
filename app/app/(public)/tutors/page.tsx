import { Metadata } from "next";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { TutorsComingSoon } from "@/components/landing/TutorsComingSoon";
import { GlobalNav } from "@/components/landing/GlobalNav";
import { Footer } from "@/components/landing/Footer";
import { getLandingCopy } from "@/lib/constants/landing-copy";

export const metadata: Metadata = {
  title: "Find Language Tutors | TutorLingua",
  description:
    "Browse professional language tutors worldwide. Find your perfect tutor for Spanish, French, German, Japanese, Korean, Mandarin, and 20+ more languages.",
  openGraph: {
    title: "Find Language Tutors | TutorLingua",
    description: "Browse professional language tutors worldwide.",
    type: "website",
    url: "/tutors",
  },
};

export default async function TutorDirectoryPage() {
  const supabaseAdmin = createServiceRoleClient();
  const supabase = supabaseAdmin ?? (await createClient());

  // Check if we have real tutors
  const { count } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "tutor")
    .eq("onboarding_completed", true)
    .eq("account_status", "active");

  const copy = getLandingCopy("en");

  // If no real tutors yet, show the holding page
  if (!count || count < 3) {
    return (
      <div className="min-h-screen bg-background">
        <GlobalNav
          navigation={copy.navigation}
          isAuthenticated={false}
          audience="student"
        />
        <TutorsComingSoon />
        <Footer footer={copy.footer} />
      </div>
    );
  }

  // TODO: Build out full directory when tutors are available
  return (
    <div className="min-h-screen bg-background">
      <GlobalNav
        navigation={copy.navigation}
        isAuthenticated={false}
        audience="student"
      />
      <TutorsComingSoon />
      <Footer footer={copy.footer} />
    </div>
  );
}
