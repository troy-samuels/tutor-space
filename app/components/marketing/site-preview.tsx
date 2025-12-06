"use client";

import Image from "next/image";
import { CalendarDays, Instagram, Mail, Link2, MessageCircle, Facebook, Twitter, Youtube, Music2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export type SitePageView =
  | "home"
  | "services"
  | "faq"
  | "contact";

type EditorProfile = {
  id: string;
  full_name: string;
  username: string;
  tagline: string;
  bio: string;
  avatar_url: string | null;
  stripe_payment_link?: string | null;
};

type ServiceLite = {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number | null;
  price: number | null;
  currency: string | null;
};

type ThemeFont =
  | "system"
  | "serif"
  | "mono"
  | "rounded"
  | "editorial"
  | "humanist"
  | "grotesk"
  | "playful"
  | "luxury"
  | "tech";

type ThemeSettings = {
  background: string;
  backgroundStyle: "solid" | "gradient";
  gradientFrom: string;
  gradientTo: string;
  primary: string;
  font: ThemeFont;
  spacing: "cozy" | "comfortable" | "compact";
};

// Modern Google Fonts for 2024-2025
const FONT_STACKS: Record<ThemeFont, string> = {
  system: '"Inter", "Segoe UI", system-ui, sans-serif',
  rounded: '"Manrope", "Segoe UI", system-ui, sans-serif',
  tech: '"Poppins", "Segoe UI", system-ui, sans-serif',
  serif: '"Merriweather", "Georgia", serif',
  luxury: '"DM Sans", "Segoe UI", system-ui, sans-serif',
  grotesk: '"Space Grotesk", system-ui, sans-serif',
  humanist: '"Plus Jakarta Sans", system-ui, sans-serif',
  editorial: '"Playfair Display", "Georgia", serif',
  playful: '"Nunito", "Quicksand", system-ui, sans-serif',
  mono: '"JetBrains Mono", "SFMono-Regular", monospace',
};

// Placeholder defaults for empty content
const PLACEHOLDER_DEFAULTS = {
  name: "Your Name",
  tagline: "Language Tutor · Online & In-Person",
  about: "Share your teaching philosophy, experience, and what makes your lessons unique. Students want to know who you are!",
  services: [
    { id: "placeholder-1", name: "Conversation Practice", description: "Improve fluency through natural dialogue", duration_minutes: 60, price: 4000, currency: "USD" },
    { id: "placeholder-2", name: "Grammar Foundations", description: "Build a solid grammar base", duration_minutes: 45, price: 3000, currency: "USD" },
  ] as ServiceLite[],
  faq: [
    { q: "What's your teaching style?", a: "Describe how you approach lessons and what students can expect..." },
    { q: "How do online lessons work?", a: "Explain your video call setup, tools you use, and how students prepare..." },
    { q: "Do you offer trial lessons?", a: "Let students know about trial availability and pricing..." },
  ] as PreviewFAQ[],
};

// Helper to check if a string value is empty
const isEmpty = (value: string | null | undefined): boolean => !value?.trim();

type PageVisibilityConfig = {
  about: boolean;
  lessons: boolean;
  booking: boolean;
  reviews: boolean;
  social: boolean;
  resources: boolean;
  contact: boolean;
  digital: boolean;
  faq: boolean;
};

type PreviewResourceLink = { id: string; label: string; url: string };
type PreviewContactCTA = { label: string; url: string };
type PreviewFAQ = { q: string; a: string };
type AdditionalPages = {
  faq: PreviewFAQ[];
  resources: Array<{ title: string; url: string; description?: string }>;
};

type SitePreviewProps = {
  profile: EditorProfile;
  about: { title: string; subtitle: string; body: string };
  services: ServiceLite[];
  reviews: Array<{ author: string; quote: string }>;
  theme: ThemeSettings;
  pageVisibility: PageVisibilityConfig;
  heroImageUrl: string | null;
  galleryImages?: string[];
  contactCTA: PreviewContactCTA | null;
  socialLinks: PreviewResourceLink[];
  digitalResources: PreviewResourceLink[];
  additionalPages: AdditionalPages;
  booking: {
    headline: string;
    subcopy: string;
    ctaLabel: string;
    ctaUrl: string;
  };
  showDigital?: boolean;
  showSocialIconsHeader: boolean;
  showSocialIconsFooter?: boolean;
  heroStyle: "minimal" | "portrait" | "banner";
  lessonsStyle: "cards" | "list";
  reviewsStyle: "cards" | "highlight";
  page: SitePageView;
  onNavigate?: (page: SitePageView) => void;
};

// Helper function to determine if a color is dark
function isColorDark(color: string): boolean {
  // Convert hex to RGB
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance < 0.5;
}

export function SitePreview(props: SitePreviewProps) {
  const {
    profile,
    about,
    services,
    reviews,
    theme,
    pageVisibility,
    heroImageUrl,
    contactCTA,
    socialLinks,
    additionalPages,
    booking,
    showSocialIconsHeader,
    heroStyle,
    lessonsStyle,
    page,
    onNavigate,
  } = props;
  const previewFont = FONT_STACKS[theme.font] ?? FONT_STACKS.system;

  const spacingClass =
    theme.spacing === "compact"
      ? "space-y-4"
      : theme.spacing === "comfortable"
        ? "space-y-6"
        : "space-y-8";

  // Always use flat solid background (no gradients)
  const backgroundLayer = { backgroundColor: theme.background };

  // Determine if the background is dark
  const isDark = isColorDark(theme.background);

  // Flat solid color values (no rgba, no transparency)
  const sectionBg = isDark ? "#1a1a1a" : "#ffffff";
  const cardBg = isDark ? "#222222" : "#ffffff";
  const textPrimary = isDark ? "#ffffff" : "#0a0a0a";
  const textSecondary = isDark ? "#b0b0b0" : "#666666";
  const borderColor = isDark ? "#333333" : "#e5e5e5";

  // Hero content with placeholder fallbacks
  const heroTitleValue = about.title || profile.full_name;
  const heroSubtitleValue = about.subtitle || profile.tagline;
  const isHeroTitlePlaceholder = isEmpty(heroTitleValue);
  const isHeroSubtitlePlaceholder = isEmpty(heroSubtitleValue);
  const heroTitle = heroTitleValue || PLACEHOLDER_DEFAULTS.name;
  const heroSubtitle = heroSubtitleValue || PLACEHOLDER_DEFAULTS.tagline;

  const fallbackCheckout = profile.stripe_payment_link || (profile.username ? `/book/${profile.username}` : "#");

  const renderSocialIconChips = (appearance: "default" | "inverted" = "default") => {
    const chipBorder = appearance === "inverted" ? "rgba(255,255,255,0.4)" : borderColor;
    const chipBg = appearance === "inverted" ? "rgba(255,255,255,0.15)" : cardBg;
    const chipText = appearance === "inverted" ? "#ffffff" : textSecondary;

    // Map common social platforms to icons
    const getIcon = (label: string) => {
      const l = label.toLowerCase();
      if (l.includes('mail') || l.includes('email')) return <Mail className="h-3.5 w-3.5" />;
      if (l.includes('instagram') || l.includes('insta')) return <Instagram className="h-3.5 w-3.5" />;
      if (l.includes('facebook') || l.includes('fb')) return <Facebook className="h-3.5 w-3.5" />;
      if (l.includes('twitter') || l.includes('x.com') || l === 'x') return <Twitter className="h-3.5 w-3.5" />;
      if (l.includes('youtube') || l.includes('yt')) return <Youtube className="h-3.5 w-3.5" />;
      if (l.includes('tiktok') || l.includes('tik')) return <Music2 className="h-3.5 w-3.5" />;
      if (l.includes('message') || l.includes('chat')) return <MessageCircle className="h-3.5 w-3.5" />;
      return <Link2 className="h-3.5 w-3.5" />;
    };

    return (
      <div className="flex flex-wrap gap-2">
        {socialLinks.slice(0, 4).map((link) => (
          <span
            key={link.id}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:opacity-80"
            style={{
              border: `1px solid ${chipBorder}`,
              backgroundColor: chipBg,
              color: chipText
            }}
            title={link.label}
          >
            {getIcon(link.label)}
          </span>
        ))}
      </div>
    );
  };

  const renderAvatar = (size = 96) => {
    const getInitials = (name: string) => {
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    };

    return (
      <div
        className="overflow-hidden rounded-full flex items-center justify-center"
        style={{
          width: size,
          height: size,
          border: `1px solid ${borderColor}`,
          backgroundColor: profile.avatar_url ? cardBg : theme.primary
        }}
      >
        {profile.avatar_url ? (
          <Image
            src={profile.avatar_url}
            alt={`${profile.full_name} avatar`}
            width={size}
            height={size}
            className="h-full w-full object-cover"
          />
        ) : (
          <span
            className="font-semibold"
            style={{
              color: 'white',
              fontSize: size * 0.4
            }}
          >
            {getInitials(profile.full_name || profile.username)}
          </span>
        )}
      </div>
    );
  };

  const heroSection = (() => {
    const mediaBlock = heroImageUrl ? (
      <div
        className="overflow-hidden rounded-2xl"
        style={{
          border: `1px solid ${borderColor}`,
          backgroundColor: cardBg
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={heroImageUrl} alt="Hero visual" className="h-36 w-full object-cover" />
      </div>
    ) : null;

    if (heroStyle === "portrait") {
      return (
        <section
          className="grid place-items-center gap-4 rounded-3xl p-5 text-center shadow-sm"
          style={{
            border: `1px solid ${borderColor}`,
            backgroundColor: sectionBg
          }}
        >
          <div className="flex flex-col items-center gap-3">
            {renderAvatar(96)}
            {/* Social icons under avatar */}
            {showSocialIconsHeader && socialLinks.length > 0 ? (
              <div className="flex justify-center">{renderSocialIconChips()}</div>
            ) : null}
            {mediaBlock}
          </div>
          <div className="space-y-2">
            <p
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: textSecondary }}
            >
              Featured tutor
            </p>
            <h1 className="text-2xl font-bold" style={{ color: textPrimary }}>{heroTitle}</h1>
            {heroSubtitle ? (
              <p className="text-sm" style={{ color: textSecondary }}>{heroSubtitle}</p>
            ) : null}
          </div>
        </section>
      );
    }

    if (heroStyle === "banner") {
      // Name-first layout: Name → Tagline → CTA → Avatar → Trust
      return (
        <section
          className="rounded-3xl p-6 text-center shadow-sm"
          style={{
            border: `1px solid ${borderColor}`,
            backgroundColor: sectionBg
          }}
        >
          {/* Name-first order (differentiator) */}
          <h1
            className={cn("text-2xl font-bold", isHeroTitlePlaceholder && "opacity-50 italic")}
            style={{ color: textPrimary }}
          >
            {heroTitle}
          </h1>
          <p
            className={cn("mt-2 text-sm", isHeroSubtitlePlaceholder && "opacity-50 italic")}
            style={{ color: textSecondary }}
          >
            {heroSubtitle}
          </p>

          {/* Avatar */}
          <div className="mt-5">{renderAvatar(80)}</div>

          {/* Social icons if enabled */}
          {showSocialIconsHeader && socialLinks.length > 0 ? (
            <div className="mt-3 flex justify-center">{renderSocialIconChips()}</div>
          ) : null}

          {/* Trust indicator */}
          <p className="mt-3 text-xs" style={{ color: textSecondary, opacity: 0.8 }}>
            ✓ Trial lesson available
          </p>

          {/* Media block if present */}
          {mediaBlock ? <div className="mt-5 w-full">{mediaBlock}</div> : null}
        </section>
      );
    }

    // Minimal style - clean but with visual polish
    return (
      <section
        className="flex flex-col items-center rounded-3xl p-8 md:p-10 lg:p-12 text-center shadow-sm"
        style={{
          border: `1px solid ${borderColor}`,
          backgroundColor: sectionBg,
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}
      >
        {/* Avatar with accent ring */}
        <div
          className="relative"
          style={{
            padding: 4,
            borderRadius: '50%',
            backgroundColor: theme.primary
          }}
        >
          {renderAvatar(100)}
        </div>

        {/* Social icons under avatar */}
        {showSocialIconsHeader && socialLinks.length > 0 ? (
          <div className="mt-4 flex justify-center">{renderSocialIconChips()}</div>
        ) : null}

        {/* Name and tagline */}
        <h1
          className={cn(
            "mt-6 text-2xl font-bold tracking-tight",
            isHeroTitlePlaceholder && "opacity-50 italic"
          )}
          style={{ color: textPrimary }}
        >
          {heroTitle}
        </h1>
        <p
          className={cn(
            "mt-2 max-w-xs text-sm leading-relaxed",
            isHeroSubtitlePlaceholder && "opacity-50 italic"
          )}
          style={{ color: textSecondary }}
        >
          {heroSubtitle}
        </p>

        {/* Trust indicator */}
        <p className="mt-4 text-xs" style={{ color: textSecondary, opacity: 0.8 }}>
          ✓ Trial lesson available
        </p>

        {/* Media block if present */}
        {mediaBlock ? <div className="mt-6 w-full">{mediaBlock}</div> : null}
      </section>
    );
  })();

  const renderLessonsContent = (displayServices: ServiceLite[] = services, isPlaceholder = false) => {
    if (lessonsStyle === "list") {
      return (
        <div className={cn("mt-3 space-y-3", isPlaceholder && "opacity-50")}>
          {displayServices.map((svc) => (
            <div
              key={svc.id}
              className={cn(
                "flex flex-col items-center gap-3 rounded-2xl px-4 py-3 text-center",
                isPlaceholder && "italic"
              )}
              style={{
                border: `1px solid ${borderColor}`,
                backgroundColor: cardBg
              }}
            >
              <div>
                <p className="font-semibold" style={{ color: textPrimary }}>{svc.name}</p>
                {svc.description ? (
                  <p className="text-sm" style={{ color: textSecondary }}>{svc.description}</p>
                ) : null}
              </div>
              <div className="text-sm font-semibold" style={{ color: textPrimary }}>
                {svc.price != null ? formatCurrency(svc.price, svc.currency || "USD") : ""}
              </div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className={cn("mt-3 space-y-3", isPlaceholder && "opacity-50")}>
        {displayServices.map((svc) => (
          <div
            key={svc.id}
            className={cn("rounded-2xl p-4 text-center", isPlaceholder && "italic")}
            style={{
              border: `1px solid ${borderColor}`,
              backgroundColor: cardBg
            }}
          >
            <p className="font-semibold" style={{ color: textPrimary }}>{svc.name}</p>
            {svc.description ? (
              <p className="mt-1 text-sm" style={{ color: textSecondary }}>{svc.description}</p>
            ) : null}
            <div className="mt-2 flex items-center justify-center gap-2">
              <span className="text-xs" style={{ color: textSecondary }}>
                {svc.duration_minutes ? `${svc.duration_minutes} min` : ""}
              </span>
              {svc.price != null ? (
                <span className="text-sm font-semibold" style={{ color: textPrimary }}>
                  {formatCurrency(svc.price, svc.currency || "USD")}
                </span>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Booking page variables - defined before render functions that use them
  const bookingHeadline = booking.headline?.trim() || "Ready to start?";
  const bookingSubcopy = booking.subcopy?.trim() || "Pick a time that works — we will map out goals in the first call.";
  const bookingLabel = booking.ctaLabel?.trim() || "Book a class";
  const bookingUrl = booking.ctaUrl?.trim() || fallbackCheckout;

  // Home page - Hero with value proposition
  const renderHomePage = () => (
    <>
      {heroSection}
      {pageVisibility.about && about.body ? (
        <section
          className="rounded-3xl p-5 shadow-sm text-center"
          style={{
            border: `1px solid ${borderColor}`,
            backgroundColor: sectionBg
          }}
        >
          <h2 className="text-base font-semibold" style={{ color: textPrimary }}>About</h2>
          <p className="mt-2 text-sm leading-6" style={{ color: textSecondary }}>{about.body}</p>
        </section>
      ) : null}
      {pageVisibility.reviews && reviews.length > 0 ? (
        <section
          className="rounded-3xl p-5 shadow-sm text-center"
          style={{
            border: `1px solid ${borderColor}`,
            backgroundColor: sectionBg
          }}
        >
          <h2 className="text-base font-semibold" style={{ color: textPrimary }}>What students say</h2>
          {/* Show just the first review as social proof */}
          <blockquote
            className="mt-3 rounded-2xl p-4 text-sm"
            style={{
              border: `1px solid ${borderColor}`,
              backgroundColor: cardBg
            }}
          >
            <p style={{ color: textSecondary }}>"{reviews[0].quote}"</p>
            <footer className="mt-2 text-xs font-semibold" style={{ color: textPrimary }}>— {reviews[0].author}</footer>
          </blockquote>
        </section>
      ) : null}
    </>
  );

  // Services page - Lesson types and pricing
  const renderServicesPage = () => {
    const displayServices = services.length > 0 ? services : PLACEHOLDER_DEFAULTS.services;
    const isPlaceholder = services.length === 0;

    return (
      <section
        className="rounded-3xl p-5 md:p-8 shadow-sm text-center"
        style={{
          border: `1px solid ${borderColor}`,
          backgroundColor: sectionBg
        }}
      >
        <h2 className="text-base md:text-lg font-semibold" style={{ color: textPrimary }}>Services & Pricing</h2>
        <p className="mt-1 text-xs md:text-sm" style={{ color: textSecondary }}>Choose a lesson type that fits your goals</p>
        {renderLessonsContent(displayServices, isPlaceholder)}
      </section>
    );
  };

  // Contact page - Booking CTA with social icons in footer
  const renderContactPage = () => (
    <>
      <section
        className="rounded-3xl p-6 shadow-sm text-center"
        style={{
          border: `1px solid ${borderColor}`,
          backgroundColor: sectionBg
        }}
      >
        <h2 className="text-xl font-bold" style={{ color: textPrimary }}>{bookingHeadline}</h2>
        <p className="mt-2 text-sm" style={{ color: textSecondary }}>{bookingSubcopy}</p>
        <div className="mt-5">
          <a
            href={bookingUrl}
            className="inline-flex items-center gap-2.5 rounded-full px-7 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:scale-[1.03]"
            style={{
              backgroundColor: theme.primary
            }}
          >
            <CalendarDays className="h-4 w-4" />
            {bookingLabel}
          </a>
        </div>
        <p className="mt-4 text-xs" style={{ color: textSecondary, opacity: 0.7 }}>
          Usually responds within 24 hours
        </p>
      </section>

      {/* Alternative contact methods */}
      {(contactCTA?.url || socialLinks.length > 0) && (
        <section
          className="rounded-3xl p-5 shadow-sm text-center"
          style={{
            border: `1px solid ${borderColor}`,
            backgroundColor: sectionBg
          }}
        >
          <h3 className="text-sm font-semibold" style={{ color: textPrimary }}>Other ways to connect</h3>

          {/* Social icons row */}
          {socialLinks.length > 0 && (
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              {socialLinks.map((link) => {
                const getIcon = (label: string) => {
                  const l = label.toLowerCase();
                  if (l.includes('mail') || l.includes('email')) return <Mail className="h-4 w-4" />;
                  if (l.includes('instagram') || l.includes('insta')) return <Instagram className="h-4 w-4" />;
                  if (l.includes('message') || l.includes('chat')) return <MessageCircle className="h-4 w-4" />;
                  return <Link2 className="h-4 w-4" />;
                };
                return (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-10 w-10 items-center justify-center rounded-full transition-all hover:scale-110"
                    style={{
                      border: `1px solid ${borderColor}`,
                      backgroundColor: cardBg,
                      color: textPrimary
                    }}
                    title={link.label}
                  >
                    {getIcon(link.label)}
                  </a>
                );
              })}
            </div>
          )}

          {/* Direct contact CTA */}
          {contactCTA?.url && (
            <div className="mt-4">
              <a
                href={contactCTA.url}
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all hover:opacity-80"
                style={{
                  border: `1px solid ${theme.primary}`,
                  color: theme.primary
                }}
              >
                <MessageCircle className="h-4 w-4" />
                {contactCTA.label || "Send a message"}
              </a>
            </div>
          )}
        </section>
      )}
    </>
  );

  const renderFaqPage = () => {
    const displayFaq = additionalPages.faq && additionalPages.faq.length > 0
      ? additionalPages.faq
      : PLACEHOLDER_DEFAULTS.faq;
    const isPlaceholder = !additionalPages.faq || additionalPages.faq.length === 0;

    return (
      <section
        className="rounded-3xl p-5 md:p-8 text-center shadow-sm"
        style={{
          border: `1px solid ${borderColor}`,
          backgroundColor: sectionBg
        }}
      >
        <h2 className="text-base md:text-lg font-semibold" style={{ color: textPrimary }}>Frequently asked questions</h2>
        <div className={cn("mt-3 space-y-3", isPlaceholder && "opacity-50")}>
          {displayFaq.map((item, index) => (
            <div
              key={`${item.q}-${index}`}
              className={cn("rounded-2xl p-4 text-left", isPlaceholder && "italic")}
              style={{
                border: `1px solid ${borderColor}`,
                backgroundColor: cardBg
              }}
            >
              <p className="text-sm font-semibold" style={{ color: textPrimary }}>{item.q}</p>
              <p className="mt-1 text-sm" style={{ color: textSecondary }}>{item.a}</p>
            </div>
          ))}
        </div>
      </section>
    );
  };

  // Fixed 4-page funnel structure
  const pageNav: Array<{ id: SitePageView; label: string }> = [
    { id: "home", label: "Home" },
    { id: "services", label: "Services" },
    { id: "faq", label: "FAQ" },
    { id: "contact", label: "Contact" },
  ];

  return (
    <div className={cn("relative w-full rounded-3xl overflow-hidden", "font-sans")} style={{ ...backgroundLayer, fontFamily: previewFont }}>
      {/* Minimal page indicator dots */}
      <div className="flex justify-center py-3">
        <div className="flex items-center gap-1.5">
          {pageNav.map((nav) => (
            <button
              key={nav.id}
              type="button"
              onClick={() => onNavigate?.(nav.id)}
              className={cn(
                "rounded-full transition-all",
                page === nav.id ? "h-1.5 w-4" : "h-1.5 w-1.5 hover:opacity-80"
              )}
              style={{
                backgroundColor: page === nav.id ? theme.primary : `${textSecondary}30`
              }}
              aria-label={`Go to ${nav.label}`}
            />
          ))}
        </div>
      </div>

      <main
        className={cn(
          "mx-auto w-full px-4 py-6 text-center",
          spacingClass
        )}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={page}
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            {page === "home" && renderHomePage()}
            {page === "services" && renderServicesPage()}
            {page === "faq" && renderFaqPage()}
            {page === "contact" && renderContactPage()}
          </motion.div>
        </AnimatePresence>

      </main>

      {/* Sticky bottom CTA bar - shows on all pages except Contact */}
      {page !== "contact" && (
        <div
          className="sticky bottom-0 z-30 border-t px-4 py-3"
          style={{
            backgroundColor: theme.background,
            borderColor: borderColor
          }}
        >
          <button
            type="button"
            onClick={() => onNavigate?.("contact")}
            className="w-full rounded-lg py-3 text-sm font-semibold text-white shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{
              backgroundColor: theme.primary
            }}
          >
            Book a class →
          </button>
        </div>
      )}
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
