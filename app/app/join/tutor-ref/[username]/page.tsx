import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { setServerAttributionCookie } from "@/lib/practice/attribution";

type PageProps = {
  params: Promise<{
    username: string;
  }>;
};

type ReferrerProfile = {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  languages_taught: string[] | null;
};

/**
 * Loads referral tutor profile for the public referral landing page.
 *
 * @param username - Tutor username slug.
 * @returns Referrer profile row or `null`.
 */
async function loadReferrerProfile(username: string): Promise<ReferrerProfile | null> {
  const adminClient = createServiceRoleClient();
  if (!adminClient) {
    return null;
  }

  const { data } = await adminClient
    .from("profiles")
    .select("id, username, full_name, avatar_url, languages_taught")
    .eq("username", username.toLowerCase())
    .eq("role", "tutor")
    .limit(1)
    .maybeSingle();

  if (!data?.id) {
    return null;
  }

  return data as ReferrerProfile;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  const profile = await loadReferrerProfile(username);

  if (!profile) {
    return {
      title: "Tutor Referral | TutorLingua",
      description: "Join TutorLingua and grow your language tutoring business.",
    };
  }

  const displayName = profile.full_name || profile.username || "Tutor";
  return {
    title: `Join ${displayName} on TutorLingua`,
    description: `Join ${displayName} on TutorLingua — the platform built for language tutors.`,
  };
}

export default async function TutorReferralLandingPage({ params }: PageProps) {
  const { username } = await params;
  const profile = await loadReferrerProfile(username);

  if (!profile) {
    notFound();
  }

  const displayName = profile.full_name || profile.username || "Tutor";
  const languages = (profile.languages_taught || []).slice(0, 4);

  await setServerAttributionCookie({
    tutorId: profile.id,
    tutorUsername: profile.username || username.toLowerCase(),
    source: "referral",
  });

  return (
    <div className="min-h-screen bg-background px-4 py-12 text-foreground">
      <div className="mx-auto w-full max-w-2xl rounded-3xl border border-white/[0.1] bg-white/[0.05] p-8 shadow-[0_0_80px_-30px_rgba(232,120,77,0.45)] backdrop-blur-xl">
        <p className="mb-3 inline-flex rounded-full border border-primary/45 bg-primary/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-[#E8A84D]">
          Tutor referral
        </p>
        <h1 className="text-3xl font-semibold">
          Join {displayName} on TutorLingua
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          The platform built for language tutors: bookings, payments, student CRM, and AI teaching tools.
        </p>

        <div className="mt-6 rounded-2xl border border-white/[0.1] bg-background/70 p-4">
          <p className="text-sm font-medium text-foreground">{displayName}</p>
          <p className="mt-1 text-xs text-muted-foreground">@{profile.username || username}</p>
          {languages.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {languages.map((language) => (
                <span
                  key={language}
                  className="rounded-full border border-white/[0.12] bg-white/[0.04] px-2.5 py-1 text-xs text-muted-foreground"
                >
                  {language}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href={`/signup?ref=${encodeURIComponent(profile.username || username)}`}
            className="inline-flex h-11 items-center justify-center rounded-full border border-primary/60 bg-primary/20 px-5 text-sm font-semibold text-foreground shadow-[0_0_26px_-12px_rgba(232,120,77,0.6)]"
          >
            Start your free account
          </Link>
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-full border border-white/[0.12] bg-white/[0.04] px-5 text-sm text-muted-foreground"
          >
            Learn more
          </Link>
        </div>
      </div>
    </div>
  );
}
