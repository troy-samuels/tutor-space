"use client";

import Image from "next/image";
import { Instagram, Music4, Facebook, Twitter, MessageCircle, Mail } from "lucide-react";
import type { LinkRecord } from "@/lib/actions/types";

type LinkPreviewProps = {
  profile: {
    full_name: string;
    username: string;
    avatar_url: string | null;
    socials: {
      instagram: string | null;
      tiktok: string | null;
      facebook: string | null;
      x: string | null;
    };
  };
  links: LinkRecord[];
};

export function LinkPreview({ profile, links }: LinkPreviewProps) {
  const visibleLinks = links.filter((link) => link.is_visible).slice(0, 8);

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

  return (
    <div className="rounded-4xl border border-border bg-white/80 p-6 shadow-lg backdrop-blur">
      <p className="text-xs font-semibold uppercase tracking-wide text-primary/70">
        Public preview
      </p>
      <div className="mt-4 flex justify-center">
        <div className="w-full max-w-[300px] rounded-[40px] border border-border/40 bg-muted px-5 pb-8 pt-6 shadow-inner">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="relative h-16 w-16 overflow-hidden rounded-full border border-border bg-primary/10">
              {profile.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={profile.full_name}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-2xl font-semibold text-primary">
                  {(profile.full_name ?? profile.username).slice(0, 1).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{profile.full_name}</p>
              <p className="text-xs text-muted-foreground">@{profile.username}</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 text-xs text-primary">
              {profile.socials.instagram ? <SocialBadge icon={<Instagram className="h-3 w-3" />} label="Instagram" /> : null}
              {profile.socials.tiktok ? <SocialBadge icon={<Music4 className="h-3 w-3" />} label="TikTok" /> : null}
              {profile.socials.facebook ? <SocialBadge icon={<Facebook className="h-3 w-3" />} label="Facebook" /> : null}
              {profile.socials.x ? <SocialBadge icon={<Twitter className="h-3 w-3" />} label="X" /> : null}
            </div>
          </div>

          <ul className="mt-5 space-y-3">
            {visibleLinks.length === 0 ? (
              <li className="rounded-2xl border border-dashed border-border bg-muted/50 px-4 py-3 text-xs text-foreground">
                Your published links will appear here. Add a link to see the preview update instantly.
              </li>
            ) : (
              visibleLinks.map((link) => (
                <li key={link.id}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackClick(link.id)}
                    className={buttonClass(link.button_style ?? "default")}
                  >
                    {link.title}
                  </a>
                </li>
              ))
            )}
          </ul>

          <div className="mt-5 space-y-2 text-xs text-muted-foreground">
            <p className="flex items-center justify-center gap-2 rounded-2xl border border-border/40 bg-white px-3 py-2 font-semibold text-foreground">
              <MessageCircle className="h-3.5 w-3.5" /> WhatsApp DM
            </p>
            <p className="flex items-center justify-center gap-2 rounded-2xl border border-border/40 bg-white px-3 py-2 font-semibold text-foreground">
              <Mail className="h-3.5 w-3.5" /> Email hello@tutorlingua.co
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 text-center text-[11px] uppercase tracking-wide text-muted-foreground">
        tutorlingua.co/@{profile.username}
      </div>
    </div>
  );
}

function SocialBadge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary">
      {icon}
      {label}
    </span>
  );
}

function buttonClass(style: string) {
  switch (style) {
    case "primary":
      return "block rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90";
    case "secondary":
      return "block rounded-full bg-primary/10 px-4 py-3 text-sm font-semibold text-primary transition hover:bg-primary/20";
    case "outline":
      return "block rounded-full shadow-sm px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-primary/10";
    default:
      return "block rounded-full bg-white px-4 py-3 text-sm font-semibold text-foreground shadow-sm transition hover:bg-primary/10";
  }
}
