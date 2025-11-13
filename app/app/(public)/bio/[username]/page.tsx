import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Instagram, Mail, Music4, Facebook, Twitter } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { LinkRecord } from "@/lib/actions/links";

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

export async function generateMetadata({ params }: { params: BioParams }): Promise<Metadata> {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, tagline, username, avatar_url")
    .eq("username", params.username.toLowerCase())
    .single();

  if (!profile) {
    return {
      title: "TutorLingua | Link in bio not found",
    };
  }

  const name = profile.full_name ?? profile.username ?? params.username;
  const description =
    profile.tagline ?? `${name} – featured resources and ways to book a lesson on TutorLingua.`;

  return {
    title: `${name} | TutorLingua Link Hub`,
    description,
    alternates: {
      canonical: `/bio/${profile.username ?? params.username}`,
    },
    openGraph: {
      title: `${name} | TutorLingua Link Hub`,
      description,
      type: "website",
      url: `https://tutorlingua.co/bio/${profile.username ?? params.username}`,
      images: profile.avatar_url ? [{ url: profile.avatar_url }] : undefined,
    },
  };
}

export default async function BioPage({ params }: { params: BioParams }) {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, full_name, username, tagline, avatar_url, instagram_handle, tiktok_handle, facebook_handle, x_handle, email"
    )
    .eq("username", params.username.toLowerCase())
    .single<BioProfile>();

  if (!profile) {
    notFound();
  }

  const { data: links } = await supabase
    .from("links")
    .select("*")
    .eq("tutor_id", profile.id)
    .eq("is_visible", true)
    .order("sort_order", { ascending: true });

  const tutorLinks = (links as LinkRecord[] | null) ?? [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-cream via-brand-cream/60 to-white">
      <header className="border-b border-brand-brown/20 bg-white/70 backdrop-blur">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between px-4 py-6 sm:px-6">
          <Link
            href="/"
            className="text-sm font-semibold uppercase tracking-wide text-brand-brown hover:text-brand-brown/80"
          >
            TutorLingua
          </Link>
          <Link
            href="/signup"
            className="rounded-full border border-brand-brown/40 px-4 py-2 text-xs font-semibold text-brand-brown transition hover:bg-brand-brown hover:text-brand-white"
          >
            Tutors: Build your link hub
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-col items-center gap-8 px-4 py-12 sm:px-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="relative h-24 w-24 overflow-hidden rounded-full border border-brand-brown/30 bg-brand-brown/10">
            {profile.avatar_url ? (
              <Image src={profile.avatar_url} alt={profile.full_name ?? "Tutor avatar"} fill sizes="96px" className="object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-3xl font-semibold text-brand-brown">
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

          <div className="flex flex-wrap justify-center gap-2 text-xs text-brand-brown">
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
          {tutorLinks.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-brand-brown/30 bg-brand-brown/5 px-5 py-6 text-center text-sm text-brand-brown">
              This tutor is still adding resources. Check back soon, or tap book a lesson to connect directly.
            </div>
          ) : (
            tutorLinks.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackClick(link.id)}
                className={buttonClass(link.button_style ?? "default")}
              >
                {link.title}
              </a>
            ))
          )}
        </section>

        <section className="w-full max-w-xl">
          <p className="text-center text-xs text-muted-foreground mb-4">
            Follow @tutorlingua.co on Instagram for platform updates
          </p>
          <div className="flex justify-center">
            <a
              href="https://instagram.com/tutorlingua.co"
              className="inline-flex items-center gap-2 rounded-full border border-brand-brown/30 px-4 py-2 text-sm font-semibold text-brand-brown transition hover:bg-brand-brown/10"
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

function trackClick(linkId: string) {
  if (typeof navigator !== "undefined" && "sendBeacon" in navigator) {
    navigator.sendBeacon(`/api/links/${linkId}/click`);
    return;
  }

  void fetch(`/api/links/${linkId}/click`, {
    method: "POST",
    keepalive: true,
  });
}

function SocialLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="inline-flex items-center gap-1 rounded-full border border-brand-brown/30 px-3 py-1 font-semibold transition hover:bg-brand-brown/10"
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

function buttonClass(style: string) {
  switch (style) {
    case "primary":
      return "block rounded-full bg-brand-brown px-5 py-3 text-center text-sm font-semibold text-brand-white shadow-md transition hover:bg-brand-brown/90";
    case "secondary":
      return "block rounded-full bg-brand-brown/10 px-5 py-3 text-center text-sm font-semibold text-brand-brown transition hover:bg-brand-brown/20";
    case "outline":
      return "block rounded-full border border-brand-brown px-5 py-3 text-center text-sm font-semibold text-brand-brown transition hover:bg-brand-brown/10";
    default:
      return "block rounded-full bg-white px-5 py-3 text-center text-sm font-semibold text-brand-brown shadow-md transition hover:bg-brand-brown/10";
  }
}
