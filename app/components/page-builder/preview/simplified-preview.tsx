"use client";

import { useState } from "react";
import { SitePreview, type SitePageView } from "@/components/marketing/site-preview";
import { usePageBuilderWizard } from "../wizard-context";

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

type SimplifiedPreviewProps = {
  profile: EditorProfile;
  services: ServiceLite[];
  reviews: Array<{ id?: string; author: string; quote: string }>;
};

// Map wizard font to preview font
const FONT_MAP: Record<string, string> = {
  system: "system",
  serif: "serif",
  rounded: "rounded",
  tech: "tech",
  luxury: "luxury",
};

export function SimplifiedPreview({
  profile,
  services,
  reviews,
}: SimplifiedPreviewProps) {
  const { state } = usePageBuilderWizard();
  const [previewPage, setPreviewPage] = useState<SitePageView>("home");

  const { theme, layout, content, pages } = state;

  // Filter services based on selection
  const selectedServices = services.filter((s) =>
    pages.selectedServiceIds.includes(s.id)
  );

  // Build theme settings for preview
  const previewTheme = {
    background: theme.background,
    backgroundStyle: "solid" as const,
    gradientFrom: theme.background,
    gradientTo: theme.background,
    primary: theme.primary,
    font: (FONT_MAP[theme.font] || "system") as any,
    spacing: "comfortable" as const,
  };

  // Build visibility config
  const pageVisibility = {
    about: true,
    lessons: pages.showLessons,
    booking: pages.showBooking,
    reviews: pages.showReviews,
    social: true,
    resources: false,
    contact: false,
    digital: false,
    faq: false,
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
      <div className="rounded-3xl border border-border/60 bg-background shadow-sm overflow-hidden flex flex-col h-full">
        {/* Preview header */}
        <div className="border-b border-border/60 bg-background/95 px-4 py-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Live Preview</h3>
          <span className="text-xs text-muted-foreground">
            Mobile view
          </span>
        </div>

        {/* Preview content */}
        <div className="flex-1 overflow-y-auto bg-muted/10 p-4">
          <div className="mx-auto max-w-md">
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
              socialLinks={[]}
              digitalResources={[]}
              additionalPages={{ faq: [], resources: [] }}
              booking={booking}
              showDigital={false}
              showSocialIconsHeader={pages.socialIconsHeader}
              showSocialIconsFooter={pages.socialIconsFooter}
              heroStyle={layout.heroStyle}
              lessonsStyle="cards"
              reviewsStyle="cards"
              page={previewPage}
              onNavigate={setPreviewPage}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
