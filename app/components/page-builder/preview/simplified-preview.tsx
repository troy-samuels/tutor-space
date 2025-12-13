"use client";

import { useState } from "react";
import { SitePreview, type SitePageView } from "@/components/marketing/site-preview";
import { usePageBuilderWizard } from "../wizard-context";
import { parseLanguagesWithFlags } from "@/lib/utils/language-flags";

// Placeholder social links shown as examples until tutor adds their handles
const PLACEHOLDER_SOCIAL_LINKS = [
  { id: "instagram", label: "Instagram", url: "#" },
  { id: "facebook", label: "Facebook", url: "#" },
  { id: "twitter", label: "X", url: "#" },
  { id: "youtube", label: "YouTube", url: "#" },
];

type EditorProfile = {
  id: string;
  full_name: string;
  username: string;
  tagline: string;
  bio: string;
  avatar_url: string | null;
  stripe_payment_link?: string | null;
  languages_taught?: string | string[] | null;
};

type ServiceLite = {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number | null;
  price: number | null;
  currency: string | null;
};

type SimplifiedPreviewProps = {
  profile: EditorProfile;
  services: ServiceLite[];
  reviews: Array<{ id?: string; author: string; quote: string }>;
};

// Map wizard font to preview font - 6 curated fonts per Premium design spec
const FONT_MAP: Record<string, string> = {
  system: "system",
  rounded: "rounded",
  luxury: "luxury",
  grotesk: "grotesk",
  serif: "serif",
  editorial: "editorial",
};

export function SimplifiedPreview({
  profile,
  services,
  reviews,
}: SimplifiedPreviewProps) {
  const { state } = usePageBuilderWizard();
  const [previewPage, setPreviewPage] = useState<SitePageView>("home");

  const { theme, content, pages, faq } = state;

  // Filter services based on selection
  const selectedServices = services.filter((s) =>
    pages.selectedServiceIds.includes(s.id)
  );

  // Parse languages from profile for Cultural Banner
  const languages = parseLanguagesWithFlags(profile.languages_taught);

  // Build theme settings for preview
  const previewTheme = {
    background: theme.background,
    backgroundStyle: "solid" as const,
    gradientFrom: theme.background,
    gradientTo: theme.background,
    primary: theme.primary,
    cardBg: theme.cardBg,
    textPrimary: theme.textPrimary,
    textSecondary: theme.textSecondary,
    font: (FONT_MAP[theme.font] || "system") as any,
    spacing: "comfortable" as const,
  };

  // Build visibility config
  const pageVisibility = {
    hero: true,
    gallery: true,
    about: true,
    lessons: pages.showLessons,
    booking: pages.showBooking,
    reviews: pages.showReviews,
    social: true,
    resources: false,
    contact: false,
    digital: false,
    faq: faq.length > 0,
  };

  // Build about section
  const about = {
    title: content.title || profile.full_name,
    subtitle: content.subtitle || profile.tagline,
    body: content.body || profile.bio,
  };

  // Build booking config
  const booking = {
    headline: "Ready to start?",
    subcopy: "Pick a time that works for you",
    ctaLabel: "Book a class",
    ctaUrl:
      profile.stripe_payment_link ||
      (profile.username ? `/book/${profile.username}` : ""),
  };

  return (
    <div className="lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)] lg:self-start">
      <div className="relative flex justify-center">
        {/* Subtle glow behind device */}
        <div className="absolute inset-0 bg-gradient-to-b from-muted/20 to-transparent blur-2xl -z-10 opacity-50" />

        {/* Device frame */}
        <div className="bg-background rounded-[2.5rem] shadow-lg shadow-black/10 ring-1 ring-border/40 overflow-hidden">
          {/* Notch */}
          <div className="h-5 bg-foreground/5 flex justify-center items-end pb-1">
            <div className="w-16 h-3 bg-foreground/20 rounded-full" />
          </div>

          {/* Content */}
          <div className="w-[320px] h-[568px] overflow-y-auto">
            <SitePreview
              profile={profile}
              about={about}
              services={selectedServices}
              reviews={reviews}
              theme={previewTheme}
              pageVisibility={pageVisibility}
              heroImageUrl={content.heroImageUrl}
              galleryImages={content.galleryImages}
              contactCTA={null}
              socialLinks={PLACEHOLDER_SOCIAL_LINKS}
              digitalResources={[]}
              additionalPages={{ faq, resources: [] }}
              booking={booking}
              showDigital={false}
              showSocialIconsHeader={pages.socialIconsHeader}
              showSocialIconsFooter={pages.socialIconsFooter}
              heroStyle="banner"
              lessonsStyle="cards"
              reviewsStyle="cards"
              page={previewPage}
              onNavigate={setPreviewPage}
              // Cultural Banner props
              languages={languages}
              borderRadius={theme.borderRadius}
              headingFont={theme.headingFont}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
