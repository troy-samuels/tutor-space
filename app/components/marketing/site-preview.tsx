"use client";

import Image from "next/image";
import { CalendarDays, Instagram, Mail, Link2, MessageCircle, Facebook, Twitter, Youtube, Music2, ChevronLeft, ChevronRight, X, Share } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useState, useEffect, type MouseEvent } from "react";
import { InlineBookingSheet } from "@/components/booking/InlineBookingSheet";

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
  offer_type?: "one_off" | "trial" | "subscription" | "lesson_block" | null;
};

type SubscriptionTemplateLite = {
  id: string;
  serviceId: string;
  tier: string;
  lessonsPerMonth: number;
  priceCents: number;
  currency: string;
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
  hero: boolean;
  gallery: boolean;
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
  subscriptionTemplates?: SubscriptionTemplateLite[];
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
    inlineBookingEnabled?: boolean;
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

// Gallery Section Component
type GallerySectionProps = {
  images: string[];
  borderColor: string;
  sectionBg: string;
  theme: ThemeSettings;
};

function GallerySection({ images, borderColor, sectionBg, theme }: GallerySectionProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Adaptive grid layout based on image count
  const getGridClass = (count: number) => {
    switch (count) {
      case 1:
        return "grid-cols-1";
      case 2:
        return "grid-cols-2";
      case 3:
        return "grid-cols-3";
      case 4:
        return "grid-cols-2";
      case 5:
        return "grid-cols-6";
      default:
        return "grid-cols-3";
    }
  };

  const getSpanClass = (count: number, index: number) => {
    if (count === 5) {
      // First 2 images: 50% width each, Last 3: 33% width each
      return index < 2 ? "col-span-3" : "col-span-2";
    }
    return "";
  };

  return (
    <>
      <section
        className="rounded-3xl p-4 shadow-sm"
        style={{
          backgroundColor: sectionBg
        }}
      >
        <div className={cn("grid gap-2", getGridClass(images.length))}>
          {images.map((url, index) => (
            <button
              key={`gallery-${index}`}
              type="button"
              onClick={() => setLightboxIndex(index)}
              className={cn(
                "group relative overflow-hidden rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2",
                getSpanClass(images.length, index)
              )}
              style={{
                aspectRatio: images.length === 1 ? "16/9" : "1/1",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`Gallery photo ${index + 1}`}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
            </button>
          ))}
        </div>
      </section>

      <GalleryLightbox
        images={images}
        currentIndex={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onNavigate={setLightboxIndex}
        primaryColor={theme.primary}
      />
    </>
  );
}

// Gallery Lightbox Component
type GalleryLightboxProps = {
  images: string[];
  currentIndex: number | null;
  onClose: () => void;
  onNavigate: (index: number) => void;
  primaryColor: string;
};

function GalleryLightbox({ images, currentIndex, onClose, onNavigate, primaryColor }: GalleryLightboxProps) {
  const [touchStart, setTouchStart] = useState<number | null>(null);

  // Keyboard navigation and body scroll lock
  useEffect(() => {
    if (currentIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && currentIndex > 0) {
        onNavigate(currentIndex - 1);
      }
      if (e.key === "ArrowRight" && currentIndex < images.length - 1) {
        onNavigate(currentIndex + 1);
      }
    };

    // Prevent body scroll when lightbox is open
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [currentIndex, images.length, onClose, onNavigate]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null || currentIndex === null) return;

    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;

    // 50px swipe threshold
    if (Math.abs(diff) > 50) {
      if (diff > 0 && currentIndex < images.length - 1) {
        onNavigate(currentIndex + 1);
      } else if (diff < 0 && currentIndex > 0) {
        onNavigate(currentIndex - 1);
      }
    }
    setTouchStart(null);
  };

  return (
    <AnimatePresence>
      {currentIndex !== null && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white backdrop-blur-sm transition hover:bg-white/20"
            aria-label="Close gallery"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Navigation arrows (desktop only) */}
          {currentIndex > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onNavigate(currentIndex - 1);
              }}
              className="absolute left-4 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-white/10 p-3 text-white backdrop-blur-sm transition hover:bg-white/20 sm:block"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}

          {currentIndex < images.length - 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onNavigate(currentIndex + 1);
              }}
              className="absolute right-4 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-white/10 p-3 text-white backdrop-blur-sm transition hover:bg-white/20 sm:block"
              aria-label="Next image"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}

          {/* Image with swipe support */}
          <motion.div
            key={currentIndex}
            className="relative max-h-[85vh] max-w-[90vw]"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[currentIndex]}
              alt={`Gallery photo ${currentIndex + 1}`}
              className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain"
            />
          </motion.div>

          {/* Dot indicators */}
          {images.length > 1 && (
            <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 gap-2">
              {images.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigate(index);
                  }}
                  className={cn(
                    "h-2 rounded-full transition-all",
                    index === currentIndex
                      ? "w-6 bg-white"
                      : "w-2 bg-white/40 hover:bg-white/60"
                  )}
                  aria-label={`Go to image ${index + 1}`}
                />
              ))}
            </div>
          )}

          {/* Mobile counter */}
          <div className="absolute bottom-6 right-4 text-sm text-white/70 sm:hidden">
            {currentIndex + 1} / {images.length}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function SitePreview(props: SitePreviewProps) {
  const {
    profile,
    about,
    services,
    subscriptionTemplates = [],
    reviews,
    theme,
    pageVisibility,
    heroImageUrl,
    galleryImages = [],
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
  const [bookingOpen, setBookingOpen] = useState(false);
  const [subscribingTemplateId, setSubscribingTemplateId] = useState<string | null>(null);
  const previewFont = FONT_STACKS[theme.font] ?? FONT_STACKS.system;

  // Handle native share
  const handleShare = async () => {
    const shareUrl = typeof window !== "undefined"
      ? `${window.location.origin}/${profile.username}`
      : "";
    const shareData = {
      title: profile.full_name || "Language Tutor",
      text: profile.tagline || "Book a lesson with me!",
      url: shareUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(shareUrl);
      }
    } catch (err) {
      // User cancelled or error - silently ignore
    }
  };

  // Handle subscription checkout
  const handleSubscribe = async (templateId: string) => {
    setSubscribingTemplateId(templateId);
    try {
      const response = await fetch("/api/stripe/subscription-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId,
          tutorUsername: profile.username,
        }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error("Failed to create subscription checkout:", data.error);
        setSubscribingTemplateId(null);
      }
    } catch (error) {
      console.error("Subscription checkout error:", error);
      setSubscribingTemplateId(null);
    }
  };

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
  const inlineBookingEnabled = booking.inlineBookingEnabled !== false;

  const renderSocialIconChips = (appearance: "default" | "inverted" = "default") => {
    const chipBorder = appearance === "inverted" ? "rgba(255,255,255,0.4)" : borderColor;
    const chipBg = appearance === "inverted" ? "rgba(255,255,255,0.15)" : cardBg;
    const chipText = appearance === "inverted" ? "#ffffff" : textSecondary;

    // Map common social platforms to icons
    const getIcon = (label: string) => {
      const l = label.toLowerCase();
      if (l.includes('mail') || l.includes('email')) return <Mail className="h-3 w-3" />;
      if (l.includes('instagram') || l.includes('insta')) return <Instagram className="h-3 w-3" />;
      if (l.includes('facebook') || l.includes('fb')) return <Facebook className="h-3 w-3" />;
      if (l.includes('twitter') || l.includes('x.com') || l === 'x') return <Twitter className="h-3 w-3" />;
      if (l.includes('youtube') || l.includes('yt')) return <Youtube className="h-3 w-3" />;
      if (l.includes('tiktok') || l.includes('tik')) return <Music2 className="h-3 w-3" />;
      if (l.includes('message') || l.includes('chat')) return <MessageCircle className="h-3 w-3" />;
      return <Link2 className="h-3 w-3" />;
    };

    return (
      <div className="flex flex-wrap gap-2">
        {socialLinks.slice(0, 4).map((link) => (
          <span
            key={link.id}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full transition-all hover:scale-110"
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
      <div className="relative" style={{ width: size + 8, height: size + 8 }}>
        {/* Soft glow behind avatar */}
        <div
          className="absolute inset-0 rounded-full blur-xl opacity-25"
          style={{ backgroundColor: theme.primary }}
        />
        <div
          className="relative overflow-hidden rounded-full shadow-xl ring-4 ring-white/90 flex items-center justify-center"
          style={{
            width: size,
            height: size,
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
      </div>
    );
  };

  const heroSection = (() => {
    const mediaBlock = heroImageUrl ? (
      <div
        className="overflow-hidden rounded-2xl"
        style={{
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
          className="grid place-items-center gap-4 p-5 text-center"
          style={{
            backgroundColor: sectionBg
          }}
        >
          <div className="flex flex-col items-center gap-3">
            {renderAvatar(96)}
            {/* Social icons - always show under avatar */}
            {socialLinks.length > 0 && (
              <div className="flex justify-center">{renderSocialIconChips()}</div>
            )}
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
          className="p-6 text-center"
          style={{
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

          {/* Social icons - always show under avatar */}
          {socialLinks.length > 0 && (
            <div className="mt-3 flex justify-center">{renderSocialIconChips()}</div>
          )}

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
        className="flex flex-col items-center p-8 md:p-10 lg:p-12 text-center"
        style={{
          backgroundColor: sectionBg
        }}
      >
        {/* Avatar with premium styling */}
        {renderAvatar(100)}

        {/* Name and tagline */}
        <h1
          className={cn(
            "mt-6 text-2xl font-bold tracking-tight leading-tight",
            isHeroTitlePlaceholder && "opacity-40"
          )}
          style={{ color: textPrimary }}
        >
          {heroTitle}
        </h1>
        <p
          className={cn(
            "mt-2 max-w-xs text-base font-medium leading-relaxed",
            isHeroSubtitlePlaceholder && "opacity-40"
          )}
          style={{ color: textSecondary }}
        >
          {heroSubtitle}
        </p>

        {/* Social icons - below name/tagline, more subtle */}
        {socialLinks.length > 0 && (
          <div className="mt-4 flex justify-center opacity-70 hover:opacity-100 transition-opacity">
            {renderSocialIconChips()}
          </div>
        )}

        {/* Trust indicator - styled pill badge */}
        <div
          className="mt-5 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium"
          style={{
            backgroundColor: `${theme.primary}15`,
            color: theme.primary
          }}
        >
          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Trial lesson available
        </div>

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
  const handleBookingClick = (event?: MouseEvent) => {
    if (inlineBookingEnabled) {
      event?.preventDefault();
      setBookingOpen(true);
      return;
    }
    if (bookingUrl) {
      window.location.href = bookingUrl;
    }
  };

  // Home page content (hero is now persistent above tabs)
  const renderHomeContent = () => (
    <>
      {pageVisibility.about && about.body ? (
        <section
          className="rounded-3xl p-5 shadow-sm text-center"
          style={{
            border: `1px solid ${borderColor}`,
            backgroundColor: sectionBg
          }}
        >
          <h2 className="text-lg font-bold tracking-tight" style={{ color: textPrimary }}>About</h2>
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
          <h2 className="text-lg font-bold tracking-tight" style={{ color: textPrimary }}>What Students Say</h2>
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

  // Helper to render subscription tier cards for a service
  const renderSubscriptionTiers = (service: ServiceLite, templates: SubscriptionTemplateLite[]) => {
    const serviceTemplates = templates.filter(t => t.serviceId === service.id);
    if (serviceTemplates.length === 0) return null;

    return (
      <div
        key={service.id}
        className="rounded-2xl p-4 text-left"
        style={{
          border: `1px solid ${borderColor}`,
          backgroundColor: cardBg
        }}
      >
        <p className="font-semibold text-center" style={{ color: textPrimary }}>{service.name}</p>
        {service.description && (
          <p className="mt-1 text-sm text-center" style={{ color: textSecondary }}>{service.description}</p>
        )}
        <div className="mt-3 grid gap-2">
          {serviceTemplates.map((template) => {
            const isSubscribing = subscribingTemplateId === template.id;
            return (
              <div
                key={template.id}
                className="flex items-center justify-between rounded-xl px-3 py-3"
                style={{
                  border: `1px solid ${borderColor}`,
                  backgroundColor: theme.background
                }}
              >
                <div className="flex flex-col gap-1">
                  <span
                    className="inline-flex w-fit rounded-full px-2 py-0.5 text-xs font-semibold"
                    style={{
                      backgroundColor: `${theme.primary}20`,
                      color: theme.primary
                    }}
                  >
                    {template.lessonsPerMonth} lessons/mo
                  </span>
                  <span className="text-sm font-semibold" style={{ color: textPrimary }}>
                    {formatCurrency(template.priceCents, template.currency)}/mo
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleSubscribe(template.id)}
                  disabled={isSubscribing}
                  className="rounded-full px-4 py-2 text-xs font-semibold text-white transition-all hover:scale-105 disabled:opacity-50"
                  style={{ backgroundColor: theme.primary }}
                >
                  {isSubscribing ? "Loading..." : "Subscribe"}
                </button>
              </div>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-center" style={{ color: textSecondary, opacity: 0.8 }}>
          Unused lessons roll over (max 1 month)
        </p>
      </div>
    );
  };

  // Services page - Lesson types and pricing
  const renderServicesPage = () => {
    const displayServices = services.length > 0 ? services : PLACEHOLDER_DEFAULTS.services;
    const isPlaceholder = services.length === 0;

    // Separate subscription services from one-off services
    const subscriptionServices = displayServices.filter(s => s.offer_type === "subscription");
    const oneOffServices = displayServices.filter(s => s.offer_type !== "subscription");

    return (
      <section
        className="rounded-3xl p-5 md:p-8 shadow-sm text-center"
        style={{
          border: `1px solid ${borderColor}`,
          backgroundColor: sectionBg
        }}
      >
        <h2 className="text-lg md:text-xl font-bold tracking-tight" style={{ color: textPrimary }}>Services & Pricing</h2>
        <p className="mt-2 text-sm" style={{ color: textSecondary }}>Choose a lesson type that fits your goals</p>

        {/* Subscription Services */}
        {subscriptionServices.length > 0 && subscriptionTemplates.length > 0 && (
          <div className="mt-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: textSecondary }}>
              Monthly Subscriptions
            </p>
            {subscriptionServices.map((service) => renderSubscriptionTiers(service, subscriptionTemplates))}
          </div>
        )}

        {/* One-off Services */}
        {oneOffServices.length > 0 && (
          <div className={subscriptionServices.length > 0 ? "mt-6" : ""}>
            {subscriptionServices.length > 0 && (
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide" style={{ color: textSecondary }}>
                Single Lessons
              </p>
            )}
            {renderLessonsContent(oneOffServices, isPlaceholder)}
          </div>
        )}

        {/* Fallback if no services */}
        {subscriptionServices.length === 0 && oneOffServices.length === 0 && (
          renderLessonsContent(displayServices, isPlaceholder)
        )}
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
          <button
            type="button"
            onClick={handleBookingClick}
            className="inline-flex items-center gap-2.5 rounded-full px-7 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:scale-[1.03]"
            style={{
              backgroundColor: theme.primary
            }}
          >
            <CalendarDays className="h-4 w-4" />
            {bookingLabel}
          </button>
        </div>
        <p className="mt-4 text-xs" style={{ color: textSecondary, opacity: 0.7 }}>
          Usually responds within 24 hours
        </p>
      </section>
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
        <h2 className="text-lg md:text-xl font-bold tracking-tight" style={{ color: textPrimary }}>Frequently Asked Questions</h2>
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
      {/* Share button - top right */}
      <button
        type="button"
        onClick={handleShare}
        className="absolute right-3 top-3 z-20 rounded-full p-1.5 transition-all opacity-40 hover:opacity-100 hover:scale-105"
        style={{ color: textPrimary }}
        aria-label="Share this page"
      >
        <Share className="h-4 w-4" />
      </button>

      {/* Persistent Hero Section */}
      {pageVisibility.hero && (
        <div className="px-4 pt-8 pb-4">
          {heroSection}

          {/* Gallery below hero */}
          {pageVisibility.gallery && galleryImages && galleryImages.length > 0 && (
            <div className="mt-4">
              <GallerySection
                images={galleryImages}
                borderColor={borderColor}
                sectionBg={sectionBg}
                theme={theme}
              />
            </div>
          )}
        </div>
      )}

      {/* Text Tab Navigation - Premium styling */}
      <div className="flex justify-center gap-8 px-4 pb-4">
        {pageNav.map((nav) => (
          <button
            key={nav.id}
            type="button"
            onClick={() => onNavigate?.(nav.id)}
            className={cn(
              "pb-2 text-sm font-semibold transition-all",
              page === nav.id
                ? "border-b-[3px]"
                : "opacity-50 hover:opacity-80"
            )}
            style={{
              color: textPrimary,
              borderColor: page === nav.id ? theme.primary : "transparent"
            }}
          >
            {nav.label}
          </button>
        ))}
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
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            {page === "home" && renderHomeContent()}
            {page === "services" && renderServicesPage()}
            {page === "faq" && renderFaqPage()}
            {page === "contact" && renderContactPage()}
          </motion.div>
        </AnimatePresence>

      </main>

      {/* Sticky bottom CTA bar - shows on all pages except Contact */}
      {page !== "contact" && (
        <div
          className="sticky bottom-0 z-30 px-4 py-3"
          style={{
            backgroundColor: theme.background
          }}
        >
          <button
            type="button"
            onClick={() => {
              if (inlineBookingEnabled) {
                setBookingOpen(true);
                return;
              }
              onNavigate?.("contact");
            }}
            className="w-full rounded-lg py-3 text-sm font-semibold text-white shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{
              backgroundColor: theme.primary
            }}
          >
            Book a class →
          </button>
        </div>
      )}

      {inlineBookingEnabled ? (
        <InlineBookingSheet
          open={bookingOpen}
          onClose={() => setBookingOpen(false)}
          username={profile.username}
          fallbackUrl={bookingUrl}
        />
      ) : null}
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
