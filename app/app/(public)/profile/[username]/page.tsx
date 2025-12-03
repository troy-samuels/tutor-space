import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import { Instagram, Mail, CalendarDays, CheckCircle2, Music4, Facebook, Twitter } from "lucide-react";
import { generateCompleteProfileSchema } from "@/lib/utils/structured-data";
import { StudentConnectButton } from "@/components/student-auth/StudentConnectButton";

type ProfileRecord = {
  id: string;
  full_name: string | null;
  username: string | null;
  tagline: string | null;
  bio: string | null;
  languages_taught: string[] | string | null;
  timezone: string | null;
  website_url: string | null;
  avatar_url: string | null;
  instagram_handle: string | null;
  tiktok_handle: string | null;
  facebook_handle: string | null;
  x_handle: string | null;
  email: string | null;
  created_at: string | null;
  average_rating: number | null;
  testimonial_count: number | null;
  total_students: number | null;
  total_lessons: number | null;
};

type ProfilePageParams = Promise<{
  username: string;
}>;

export async function generateMetadata({
  params,
}: {
  params: ProfilePageParams;
}): Promise<Metadata> {
  const { username } = await params;
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("public_profiles")
    .select("full_name, tagline, bio, avatar_url, username, languages_taught, average_rating, testimonial_count, total_students")
    .eq("username", username.toLowerCase())
    .single();

  if (!profile) {
    return {
      title: "TutorLingua | Tutor not found",
    };
  }

  // Extract languages
  const languages = Array.isArray(profile.languages_taught)
    ? profile.languages_taught
    : profile.languages_taught
      ?.split(",")
      .map((lang: string) => lang.trim())
      .filter(Boolean) ?? [];
  
  const languagesList = languages.join(", ") || "Language";
  const primaryLanguage = languages[0] || "Language";

  const title = `${profile.full_name || profile.username} - ${primaryLanguage} Tutor | TutorLingua`;
  
  const ratingText = profile.average_rating && profile.testimonial_count 
    ? ` ${profile.average_rating.toFixed(1)}★ rating from ${profile.testimonial_count} students.`
    : "";
  
  const studentsText = profile.total_students && profile.total_students > 0
    ? ` Teaching ${profile.total_students}+ students.`
    : "";

  const description =
    profile.tagline ??
    `${languagesList} tutor ${profile.full_name || profile.username}.${ratingText}${studentsText} Book lessons directly with no commission fees on TutorLingua.`;

  return {
    title,
    description,
    keywords: [
      profile.full_name || "",
      ...languages.map((lang: string) => `${lang} tutor`),
      ...languages.map((lang: string) => `learn ${lang}`),
      ...languages.map((lang: string) => `${lang} lessons`),
      username,
      "online language tutor",
      "private language lessons",
    ].filter(Boolean),
    alternates: {
      canonical: `/profile/${profile.username ?? username}`,
    },
    openGraph: {
      title: `${profile.full_name || profile.username} - ${languagesList} Tutor`,
      description,
      type: "profile",
      url: `https://tutorlingua.co/profile/${profile.username ?? username}`,
      images: profile.avatar_url ? [{ 
        url: profile.avatar_url,
        width: 400,
        height: 400,
        alt: `${profile.full_name || profile.username} - ${primaryLanguage} Tutor Profile Picture`,
      }] : undefined,
    },
    twitter: {
      card: "summary",
      title: `${profile.full_name || profile.username}`,
      description: `${languagesList} tutor on TutorLingua${ratingText}`,
      images: profile.avatar_url ? [profile.avatar_url] : undefined,
    },
  };
}

function normaliseHandle(handle: string | null): string | null {
  if (!handle) return null;
  const trimmed = handle.trim();
  if (!trimmed) return null;
  return trimmed.startsWith("@") ? trimmed : `@${trimmed}`;
}

const SOCIAL_LINKS = [
  {
    key: "instagram_handle",
    icon: Instagram,
    label: "Instagram",
    href: (handle: string) => `https://instagram.com/${handle.replace(/^@/, "")}`,
  },
  {
    key: "tiktok_handle",
    icon: Music4,
    label: "TikTok",
    href: (handle: string) => `https://tiktok.com/@${handle.replace(/^@/, "")}`,
  },
  {
    key: "facebook_handle",
    icon: Facebook,
    label: "Facebook",
    href: (handle: string) => `https://facebook.com/${handle.replace(/^@/, "")}`,
  },
  {
    key: "x_handle",
    icon: Twitter,
    label: "X",
    href: (handle: string) => `https://x.com/${handle.replace(/^@/, "")}`,
  },
  {
    key: "email",
    icon: Mail,
    label: "Email",
    href: (email: string) => `mailto:${email}`,
  },
] as const;

export default async function PublicProfilePage({ params }: { params: ProfilePageParams }) {
  const { username } = await params;
  const supabase = await createClient();

  // Check if current user is a logged-in student
  const { data: { user } } = await supabase.auth.getUser();
  const isStudentLoggedIn = !!user && user.user_metadata?.role === "student";

  const { data: profile } = await supabase
    .from("public_profiles")
    .select(
      "id, full_name, username, tagline, bio, languages_taught, timezone, website_url, avatar_url, instagram_handle, tiktok_handle, facebook_handle, x_handle, email, created_at, average_rating, testimonial_count, total_students, total_lessons"
    )
    .eq("username", username.toLowerCase())
    .single<ProfileRecord>();

  if (!profile) {
    notFound();
  }

  const languages = Array.isArray(profile.languages_taught)
    ? profile.languages_taught
    : profile.languages_taught
      ?.split(",")
      .map((lang) => lang.trim())
      .filter(Boolean) ?? [];

  // Fetch tutor's services for structured data
  const { data: services } = await supabase
    .from("services")
    .select("id, name, description, duration_minutes, price, currency")
    .eq("tutor_id", profile.id)
    .eq("is_active", true)
    .limit(10);

  // TODO: Fetch approved testimonials when testimonials table is created
  // For now, using empty array until testimonials feature is implemented
  const testimonials: any[] = [];

  // Generate comprehensive structured data
  const structuredData = generateCompleteProfileSchema(
    {
      id: profile.id,
      username: profile.username || username,
      full_name: profile.full_name || "",
      bio: profile.bio || "",
      tagline: profile.tagline || undefined,
      avatar_url: profile.avatar_url || undefined,
      languages_taught: languages,
      website_url: profile.website_url || undefined,
      instagram_handle: profile.instagram_handle || undefined,
      timezone: profile.timezone || undefined,
      average_rating: profile.average_rating || undefined,
      testimonial_count: profile.testimonial_count || undefined,
      total_students: profile.total_students || undefined,
      total_lessons: profile.total_lessons || undefined,
    },
    services || [],
    testimonials
  );

  const socials = SOCIAL_LINKS.map((social) => {
    const value = profile[social.key as keyof ProfileRecord] as string | null;
    if (!value) return null;
    
    // For Instagram, normalize the handle
    const display = social.key === "instagram_handle" ? normaliseHandle(value) : value;
    if (!display) return null;
    
    return {
      label: social.label,
      url: social.href(value),
      Icon: social.icon,
      display: display,
    };
  }).filter(Boolean) as Array<{
    label: string;
    url: string;
    Icon: typeof Instagram;
    display: string;
  }>;

  const credibilityPoints = [
    "Certified tutor with verified background checks via TutorLingua.",
    "Personalised lesson plans aligned to CEFR goals.",
    "Parent updates delivered automatically after every session.",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted via-muted/40 to-white">
      {/* Structured Data for SEO & LLMs */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />
      
      <header className="border-b border-border bg-white/70 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-6 sm:px-6">
          <Link
            href="/"
            className="text-sm font-semibold uppercase tracking-wide text-primary hover:text-primary/80"
          >
            TutorLingua
          </Link>
          <Link
            href="/signup"
            className="rounded-full border border-border px-4 py-2 text-xs font-semibold text-foreground transition hover:bg-primary hover:text-primary-foreground"
          >
            Tutors: Claim your profile
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-0">
        <section className="rounded-4xl border border-border bg-white/90 p-8 shadow-lg backdrop-blur">
          <div className="flex flex-col gap-6 md:flex-row md:items-center">
            <div className="relative h-28 w-28 overflow-hidden rounded-3xl border border-border bg-muted">
              {profile.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={profile.full_name ?? "Tutor avatar"}
                  fill
                  sizes="112px"
                  className="object-cover"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-2xl font-semibold text-primary">
                  {profile.full_name?.slice(0, 1) ?? profile.username?.slice(0, 1) ?? "T"}
                </span>
              )}
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <h1 className="text-3xl font-semibold text-foreground">
                  {profile.full_name ?? profile.username}
                </h1>
                {profile.tagline ? (
                  <p className="mt-1 text-sm text-primary/80">{profile.tagline}</p>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                {languages.map((lang) => (
                  <span
                    key={lang}
                    className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 font-semibold text-primary"
                  >
                    {lang}
                  </span>
                ))}
                {profile.timezone ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1">
                    <CalendarDays className="h-3.5 w-3.5 text-primary" />
                    {profile.timezone}
                  </span>
                ) : null}
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Link
                href={`/book/${profile.username}`}
                className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
              >
                Book a lesson
              </Link>
              <StudentConnectButton
                tutor={{
                  id: profile.id,
                  username: profile.username || username,
                  full_name: profile.full_name,
                  avatar_url: profile.avatar_url,
                }}
                isLoggedIn={isStudentLoggedIn}
              />
              {profile.website_url ? (
                <Link
                  href={profile.website_url}
                  className="inline-flex items-center justify-center rounded-full border shadow-sm px-6 py-2 text-sm font-semibold text-primary transition hover:bg-primary/10"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Visit website
                </Link>
              ) : null}
            </div>
          </div>

          {socials.length > 0 ? (
            <div className="mt-6 flex flex-wrap gap-3">
              {socials.map((social) => (
                <Link
                  key={social.label}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border shadow-sm px-4 py-2 text-xs font-semibold text-primary transition hover:bg-primary/10"
                >
                  <social.Icon className="h-4 w-4" />
                  <span>{social.display}</span>
                </Link>
              ))}
            </div>
          ) : null}
        </section>

        <section className="grid gap-6 lg:grid-cols-[3fr_2fr]">
          <article className="rounded-4xl border border-border bg-white/90 p-8 text-sm leading-relaxed text-muted-foreground shadow-lg backdrop-blur">
            <h2 className="text-lg font-semibold text-foreground">About {profile.full_name ?? "this tutor"}</h2>
            {profile.bio ? (
              <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                {profile.bio}
              </p>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">
                This tutor is still polishing their story. Check back soon for a detailed credibility overview.
              </p>
            )}
          </article>

          <aside className="space-y-6">
            <div className="rounded-4xl border border-border bg-white/90 p-6 shadow-lg backdrop-blur">
              <h3 className="text-base font-semibold text-foreground">Why families choose this tutor</h3>
              <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                {credibilityPoints.map((point) => (
                  <li key={point} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-4xl border border-dashed shadow-sm bg-primary/5 p-6 text-xs text-muted-foreground">
              <p>
                Profile last updated{" "}
                {profile.created_at ? formatDate(profile.created_at) : "recently"}.
              </p>
              <p className="mt-2">
                Want a profile like this?{" "}
                <Link href="/signup" className="font-semibold text-primary hover:underline">
                  Join TutorLingua
                </Link>{" "}
                and publish your tutor brand in minutes.
              </p>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}
