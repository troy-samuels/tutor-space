import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Instagram, Mail, Music4, Facebook, Twitter } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { LinkRecord } from "@/lib/actions/links";
import { normalizeUsernameSlug } from "@/lib/utils/username-slug";
import { BioLinkList } from "@/components/bio/BioLinkList";

type BioProfile = {
  id: string;
  full_name: string | null;
  username: string | null;
  tagline: string | null;
  avatar_url: string | null;
  instagram_handle: string | null;
  tiktok_handle: string | null;
  facebook_handle: string | null;
  x_handle: string | null;
  email: string | null;
};

type BioParams = {
  username: string;
};

export async function generateMetadata({ params }: { params: Promise<BioParams> }): Promise<Metadata> {
  const resolvedParams = await params;
  const supabase = await createClient();
  const rawLower = resolvedParams.username.trim().toLowerCase();
  const normalized = normalizeUsernameSlug(resolvedParams.username) || rawLower;
  const { data: profile } = await supabase
    .from("public_profiles")
    .select("full_name, tagline, username, avatar_url")
    .eq("username", normalized)
    .single();

  if (!profile) {
    return {
      title: "TutorLingua | Link in bio not found",
    };
  }

  const name = profile.full_name ?? profile.username ?? resolvedParams.username;
  const description =
    profile.tagline ?? `${name} – featured resources and ways to book a lesson on TutorLingua.`;

  return {
    title: `${name} | TutorLingua Link Hub`,
    description,
    alternates: {
      canonical: `/bio/${profile.username ?? resolvedParams.username}`,
    },
    openGraph: {
      title: `${name} | TutorLingua Link Hub`,
      description,
      type: "website",
      url: `https://tutorlingua.co/bio/${profile.username ?? resolvedParams.username}`,
      images: profile.avatar_url ? [{ url: profile.avatar_url }] : undefined,
    },
  };
}

export default async function BioPage({ params }: { params: Promise<BioParams> }) {
  const resolvedParams = await params;
  const supabase = await createClient();
  const rawLower = resolvedParams.username.trim().toLowerCase();
  const normalized = normalizeUsernameSlug(resolvedParams.username) || rawLower;

  const { data: profile } = await supabase
    .from("public_profiles")
    .select(
      "id, full_name, username, tagline, avatar_url, instagram_handle, tiktok_handle, facebook_handle, x_handle, email"
    )
    .eq("username", normalized)
    .single<BioProfile>();

  if (!profile) {
    notFound();
  }

  if (profile.username && profile.username !== resolvedParams.username) {
    redirect(`/bio/${profile.username}`);
  }

  const { data: links } = await supabase
    .from("links")
    .select("*")
    .eq("tutor_id", profile.id)
    .eq("is_visible", true)
    .order("sort_order", { ascending: true });

  const tutorLinks = (links as LinkRecord[] | null) ?? [];
  const linkCards = tutorLinks.map((link) => ({
    id: link.id,
    url: link.url,
    title: link.title,
    button_style: link.button_style ?? "default",
  }));

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted via-muted/60 to-white">
      <header className="border-b border-border bg-white/70 backdrop-blur">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between px-4 py-6 sm:px-6">
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
            Tutors: Build your link hub
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-col items-center gap-8 px-4 py-12 sm:px-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="relative h-24 w-24 overflow-hidden rounded-full border border-border bg-primary/10">
            {profile.avatar_url ? (
              <Image src={profile.avatar_url} alt={profile.full_name ?? "Tutor avatar"} fill sizes="96px" className="object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-3xl font-semibold text-primary">
                {(profile.full_name ?? profile.username ?? "T").slice(0, 1).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">{profile.full_name ?? profile.username}</h1>
            {profile.tagline ? (
              <p className="mt-1 text-sm text-muted-foreground">{profile.tagline}</p>
            ) : null}
          </div>

          <div className="flex flex-wrap justify-center gap-2 text-xs text-primary">
            {profile.instagram_handle ? (
              <SocialLink href={`https://instagram.com/${cleanHandle(profile.instagram_handle)}`}>
                <Instagram className="h-4 w-4" /> Instagram
              </SocialLink>
            ) : null}
            {profile.tiktok_handle ? (
              <SocialLink href={`https://tiktok.com/@${cleanHandle(profile.tiktok_handle)}`}>
                <Music4 className="h-4 w-4" /> TikTok
              </SocialLink>
            ) : null}
            {profile.facebook_handle ? (
              <SocialLink href={`https://facebook.com/${cleanHandle(profile.facebook_handle)}`}>
                <Facebook className="h-4 w-4" /> Facebook
              </SocialLink>
            ) : null}
            {profile.x_handle ? (
              <SocialLink href={`https://x.com/${cleanHandle(profile.x_handle)}`}>
                <Twitter className="h-4 w-4" /> X
              </SocialLink>
            ) : null}
            {profile.email ? (
              <SocialLink href={`mailto:${profile.email}`}>
                <Mail className="h-4 w-4" /> Email
              </SocialLink>
            ) : null}
          </div>
        </div>

        <section className="w-full max-w-xl space-y-4">
          <BioLinkList links={linkCards} />
        </section>

        <section className="w-full max-w-xl">
          <p className="text-center text-xs text-muted-foreground mb-4">
            Follow @tutorlingua.co on Instagram for platform updates
          </p>
          <div className="flex justify-center">
            <a
              href="https://instagram.com/tutorlingua.co"
              className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/10"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Instagram className="h-4 w-4" />
              @tutorlingua.co
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}

function SocialLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 font-semibold transition hover:bg-primary/10"
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  );
}

function cleanHandle(handle: string) {
  return handle.startsWith("@") ? handle.slice(1) : handle;
}
