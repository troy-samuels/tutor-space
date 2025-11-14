"use client";

import Image from "next/image";
import Link from "next/link";
import { CalendarDays, Instagram, Mail, Link2, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type EditorProfile = {
  id: string;
  full_name: string;
  username: string;
  tagline: string;
  bio: string;
  avatar_url: string | null;
};

type ServiceLite = {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number | null;
  price: number | null;
  currency: string | null;
};

type ThemeSettings = {
  background: string;
  primary: string;
  font: "system" | "serif" | "mono";
  spacing: "cozy" | "comfortable" | "compact";
};

type PageVisibilityConfig = {
  about: boolean;
  lessons: boolean;
  reviews: boolean;
  resources: boolean;
  contact: boolean;
};

type PreviewResourceLink = { id: string; label: string; url: string };
type PreviewContactCTA = { label: string; url: string };

type SitePreviewProps = {
  profile: EditorProfile;
  about: { title: string; subtitle: string; body: string };
  services: ServiceLite[];
  reviews: Array<{ author: string; quote: string }>;
  theme: ThemeSettings;
  pageVisibility: PageVisibilityConfig;
  resources: PreviewResourceLink[];
  contactCTA: PreviewContactCTA | null;
};

export function SitePreview({
  profile,
  about,
  services,
  reviews,
  theme,
  pageVisibility,
  resources,
  contactCTA,
}: SitePreviewProps) {
  const fontClass =
    theme.font === "serif"
      ? "font-serif"
      : theme.font === "mono"
        ? "font-mono"
        : "font-sans";

  const spacingClass =
    theme.spacing === "compact"
      ? "space-y-4"
      : theme.spacing === "comfortable"
        ? "space-y-6"
        : "space-y-8";

  return (
    <div
      className={cn("w-full rounded-b-3xl", fontClass)}
      style={{ backgroundColor: theme.background }}
    >
      <div className="sticky top-0 z-10 border-b border-border/50 bg-white/70 backdrop-blur">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            TutorLingua
          </Link>
          <Link
            href={`/book/${profile.username}`}
            className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold"
            style={{ borderColor: theme.primary, color: theme.primary }}
          >
            <CalendarDays className="h-4 w-4" />
            View availability
          </Link>
        </div>
      </div>

      <main className={cn("mx-auto w-full max-w-4xl px-4 py-6 sm:px-6", spacingClass)}>
        {/* Hero */}
        <section className="flex flex-col items-center text-center">
          <div className="h-20 w-20 overflow-hidden rounded-full border border-border/60 bg-muted">
            {profile.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt={`${profile.full_name} avatar`}
                width={80}
                height={80}
                className="h-full w-full object-cover"
              />
            ) : null}
          </div>
          <h1 className="mt-3 text-2xl font-bold text-foreground">{about.title || profile.full_name}</h1>
          {about.subtitle ? (
            <p className="mt-1 text-sm text-muted-foreground">{about.subtitle}</p>
          ) : null}
        </section>

        {/* About */}
        {pageVisibility.about && about.body ? (
          <section className="rounded-3xl border border-border/60 bg-background/80 p-5 shadow-sm backdrop-blur">
            <h2 className="text-base font-semibold text-foreground">About</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{about.body}</p>
          </section>
        ) : null}

        {/* Services */}
        {pageVisibility.lessons && services.length > 0 ? (
          <section className="rounded-3xl border border-border/60 bg-background/80 p-5 shadow-sm backdrop-blur">
            <h2 className="text-base font-semibold text-foreground">Lessons</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {services.map((svc) => (
                <div key={svc.id} className="rounded-2xl border border-border/60 bg-white/80 p-4">
                  <p className="font-semibold text-foreground">{svc.name}</p>
                  {svc.description ? (
                    <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{svc.description}</p>
                  ) : null}
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {svc.duration_minutes ? `${svc.duration_minutes} min` : ""}
                    </span>
                    {svc.price != null ? (
                      <span className="text-sm font-semibold text-foreground">
                        {formatCurrency(svc.price, svc.currency || "USD")}
                      </span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {/* Reviews */}
        {pageVisibility.reviews && reviews.length > 0 ? (
          <section className="rounded-3xl border border-border/60 bg-background/80 p-5 shadow-sm backdrop-blur">
            <h2 className="text-base font-semibold text-foreground">Reviews</h2>
            <div className="mt-3 space-y-3">
              {reviews.map((r, i) => (
                <blockquote key={`${r.author}-${i}`} className="rounded-2xl border border-border/60 bg-white/80 p-4 text-sm">
                  <p className="text-muted-foreground">“{r.quote}”</p>
                  <footer className="mt-2 text-xs font-semibold text-foreground">— {r.author}</footer>
                </blockquote>
              ))}
            </div>
          </section>
        ) : null}

        {/* Resources */}
        {pageVisibility.resources && resources.length > 0 ? (
          <section className="rounded-3xl border border-border/60 bg-background/80 p-5 shadow-sm backdrop-blur">
            <h2 className="text-base font-semibold text-foreground">Resources</h2>
            <div className="mt-3 space-y-2">
              {resources.map((resource) => (
                <a
                  key={resource.id}
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-2xl border border-border/60 bg-white/80 px-4 py-3 text-sm text-foreground transition hover:border-primary hover:text-primary"
                >
                  <span className="truncate">{resource.label}</span>
                  <Link2 className="h-4 w-4 shrink-0" />
                </a>
              ))}
            </div>
          </section>
        ) : null}

        {/* Contact */}
        {pageVisibility.contact && contactCTA?.url ? (
          <section className="rounded-3xl border border-border/60 bg-background/80 p-5 text-center shadow-sm backdrop-blur">
            <h2 className="text-base font-semibold text-foreground">Contact</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Parents can reach out with custom lesson requests or follow-up questions.
            </p>
            <a
              href={contactCTA.url}
              target={contactCTA.url.startsWith("http") ? "_blank" : undefined}
              rel={contactCTA.url.startsWith("http") ? "noopener noreferrer" : undefined}
              className="mt-4 inline-flex items-center gap-2 rounded-full border border-primary px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/10"
            >
              <MessageCircle className="h-4 w-4" />
              {contactCTA.label || "Contact me"}
            </a>
          </section>
        ) : null}

        {/* Footer */}
        <footer className="flex items-center justify-center gap-4 py-6">
          <a
            href={`/profile/${profile.username}`}
            className="text-xs font-semibold"
            style={{ color: theme.primary }}
          >
            View profile
          </a>
          <a
            href={`mailto:${profile.username}@example.com`}
            className="text-xs text-muted-foreground"
            aria-label="Email"
          >
            <Mail className="h-4 w-4" />
          </a>
          <a
            href={`https://instagram.com/${profile.username}`}
            className="text-xs text-muted-foreground"
            aria-label="Instagram"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Instagram className="h-4 w-4" />
          </a>
        </footer>
      </main>
    </div>
  );
}

function formatCurrency(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(amount / 100);
  } catch {
    return `$${(amount / 100).toFixed(2)}`;
  }
}

