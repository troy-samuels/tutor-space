"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Check,
  Clock,
  Save,
  Rocket,
  Palette,
  Eye,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { SitePreview, type SitePageView } from "@/components/marketing/site-preview";
import { cn } from "@/lib/utils";
import { FlowProgress } from "@/components/flows/FlowProgress";
import {
  updateSite,
  publishSite,
  createSite,
  uploadHeroImage,
  getPublishedSnapshot,
  type TutorSite,
  type TutorSiteService,
  type TutorSiteReview,
  type TutorSiteResource,
} from "@/lib/actions/tutor-sites";
import { AutoSaver } from "@/lib/utils/auto-saver";

type EditorProfile = {
  id: string;
  full_name: string;
  username: string;
  tagline: string;
  bio: string;
  avatar_url: string | null;
  email?: string | null;
  stripe_payment_link?: string | null;
  instagram_handle?: string | null;
  tiktok_handle?: string | null;
  facebook_handle?: string | null;
  x_handle?: string | null;
  website_url?: string | null;
};

type ServiceLite = {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number | null;
  price: number | null;
  currency: string | null;
};

type InitialSiteData = {
  site: TutorSite | null;
  services: TutorSiteService[];
  reviews: TutorSiteReview[];
  resources: TutorSiteResource[];
} | null;

type SiteEditorProps = {
  profile: EditorProfile;
  services: ServiceLite[];
  initialSiteData: InitialSiteData;
};

type FontOption =
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
  font: FontOption;
  spacing: "cozy" | "comfortable" | "compact";
};

type HeroStyle = "minimal" | "portrait"; // Centered or Photo Focus
type LessonsStyle = "cards" | "list";
type ReviewsStyle = "cards" | "highlight";

type Template = {
  id: string;
  name: string;
  description: string;
  settings: {
    background: string;
    backgroundStyle: "solid" | "gradient";
    gradientFrom?: string;
    gradientTo?: string;
    primary: string;
    font: FontOption;
    spacing: "cozy" | "comfortable" | "compact";
    heroStyle: HeroStyle;
    lessonsStyle: LessonsStyle;
    reviewsStyle: ReviewsStyle;
  };
};

// 5 Complete Templates - Research-backed two-tone combinations
const TEMPLATES: Template[] = [
  {
    id: "classic-ink",
    name: "Classic Ink",
    description: "Timeless black and white, clean and professional",
    settings: {
      background: "#FFFFFF",
      backgroundStyle: "solid",
      primary: "#1F2937",
      font: "system",
      spacing: "comfortable",
      heroStyle: "minimal",
      lessonsStyle: "cards",
      reviewsStyle: "cards",
    },
  },
  {
    id: "ocean-trust",
    name: "Ocean Trust",
    description: "Professional blue tones, trustworthy and calm",
    settings: {
      background: "#F1F5F9",
      backgroundStyle: "solid",
      primary: "#1E40AF",
      font: "system",
      spacing: "comfortable",
      heroStyle: "portrait",
      lessonsStyle: "cards",
      reviewsStyle: "cards",
    },
  },
  {
    id: "warm-terracotta",
    name: "Warm Terracotta",
    description: "Inviting warmth with approachable energy",
    settings: {
      background: "#FAF7F5",
      backgroundStyle: "solid",
      primary: "#C2410C",
      font: "rounded",
      spacing: "cozy",
      heroStyle: "portrait",
      lessonsStyle: "list",
      reviewsStyle: "highlight",
    },
  },
  {
    id: "midnight-gold",
    name: "Midnight Gold",
    description: "Bold dark elegance with golden accents",
    settings: {
      backgroundStyle: "solid",
      background: "#0F172A",
      gradientFrom: "#0F172A",
      gradientTo: "#0F172A",
      primary: "#F59E0B",
      font: "tech",
      spacing: "compact",
      heroStyle: "minimal",
      lessonsStyle: "cards",
      reviewsStyle: "cards",
    },
  },
  {
    id: "lavender-luxe",
    name: "Lavender Luxe",
    description: "Creative and sophisticated with purple tones",
    settings: {
      background: "#FAF5FF",
      backgroundStyle: "solid",
      primary: "#7C3AED",
      font: "luxury",
      spacing: "comfortable",
      heroStyle: "minimal",
      lessonsStyle: "list",
      reviewsStyle: "cards",
    },
  },
];

const getTemplateSwatches = (settings: Template["settings"]) => {
  const primary = settings.primary ?? "#2563eb";
  const secondary =
    settings.backgroundStyle === "gradient"
      ? settings.gradientTo || settings.gradientFrom || settings.background || "#f5f5f5"
      : settings.background || settings.gradientFrom || "#f5f5f5";
  return { primary, secondary };
};

// Modern Google Fonts for 2024-2025
const FONT_OPTIONS: Array<{ value: FontOption; label: string }> = [
  { value: "system", label: "Inter" },
  { value: "rounded", label: "Manrope" },
  { value: "tech", label: "Poppins" },
  { value: "serif", label: "Lato" },
  { value: "luxury", label: "DM Sans" },
  { value: "grotesk", label: "Space Grotesk" },
  { value: "humanist", label: "Plus Jakarta" },
  { value: "editorial", label: "Playfair Display" },
  { value: "playful", label: "Nunito" },
  { value: "mono", label: "JetBrains Mono" },
];

export function SiteEditor({
  profile,
  services,
  initialSiteData,
}: SiteEditorProps) {
  const [previewPage, setPreviewPage] = useState<SitePageView>("home");
  const [previewMode, setPreviewMode] = useState<"draft" | "published">("draft");
  const [publishedPreview, setPublishedPreview] = useState<any | null>(null);
  const [siteId, setSiteId] = useState<string | null>(initialSiteData?.site?.id || null);
  const [status, setStatus] = useState<"draft" | "published">(initialSiteData?.site?.status || "draft");
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(
    (initialSiteData?.site as any)?.updated_at || null
  );

  // Selected template
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  // Core content
  const [aboutTitle, setAboutTitle] = useState(initialSiteData?.site?.about_title || profile.full_name || "");
  const [aboutSubtitle, setAboutSubtitle] = useState(initialSiteData?.site?.about_subtitle || profile.tagline || "");
  const [aboutBody, setAboutBody] = useState(initialSiteData?.site?.about_body || profile.bio || "");

  // Hero image
  const [heroImageUrl, setHeroImageUrl] = useState<string | null>(
    (initialSiteData?.site as any)?.hero_image_url || null
  );
  const [heroUploadError, setHeroUploadError] = useState<string | null>(null);
  const [isHeroUploading, startHeroUpload] = useTransition();

  // Services selection (all selected by default)
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>(
    initialSiteData?.services?.map((s) => s.service_id) ?? services.map((s) => s.id)
  );

  // Reviews
  const [reviews] = useState<Array<{ author: string; quote: string }>>(
    initialSiteData?.reviews?.map((r) => ({ author: r.author_name, quote: r.quote })) ?? []
  );

  // Theme controls (from template or existing site)
  const [theme, setTheme] = useState<ThemeSettings>({
    background: initialSiteData?.site?.theme_background || "#ffffff",
    backgroundStyle:
      (initialSiteData?.site?.theme_background_style as ThemeSettings["backgroundStyle"]) || "solid",
    gradientFrom: initialSiteData?.site?.theme_gradient_from || "#f8fafc",
    gradientTo: initialSiteData?.site?.theme_gradient_to || "#ffffff",
    primary: initialSiteData?.site?.theme_primary || "#2563eb",
    font: (initialSiteData?.site?.theme_font as ThemeSettings["font"]) || "system",
    spacing: (initialSiteData?.site?.theme_spacing as ThemeSettings["spacing"]) || "comfortable",
  });

  const [heroStyle, setHeroStyle] = useState<HeroStyle>(
    (initialSiteData?.site?.hero_layout as HeroStyle) || "minimal"
  );
  const [lessonsStyle, setLessonsStyle] = useState<LessonsStyle>(
    (initialSiteData?.site?.lessons_layout as LessonsStyle) || "cards"
  );
  const [reviewsStyle, setReviewsStyle] = useState<ReviewsStyle>(
    (initialSiteData?.site?.reviews_layout as ReviewsStyle) || "cards"
  );

  // Consolidated visibility toggles
  const [visibility, setVisibility] = useState({
    hero: (initialSiteData?.site as any)?.show_hero ?? true,
    gallery: (initialSiteData?.site as any)?.show_gallery ?? true,
    about: initialSiteData?.site?.show_about ?? true,
    lessons: initialSiteData?.site?.show_lessons ?? true,
    reviews: initialSiteData?.site?.show_reviews ?? (reviews.length > 0),
    booking: initialSiteData?.site?.show_booking ?? true,
    social: (initialSiteData?.site as any)?.show_social_page ?? true,
    faq: initialSiteData?.site?.show_faq ?? false,
    contact: initialSiteData?.site?.show_contact ?? false,
    resources: initialSiteData?.site?.show_resources ?? false,
  });

  // Customization unlock
  const [showCustomization, setShowCustomization] = useState(false);

  // Section visibility panel toggle
  const [showSectionSettings, setShowSectionSettings] = useState(false);

  // Social links from resources + profile handles
  const profileSocialLinks = [
    profile.instagram_handle
      ? {
          id: `profile-instagram-${profile.id}`,
          label: "Instagram",
          url: `https://instagram.com/${profile.instagram_handle.replace(/^@/, "")}`,
        }
      : null,
    profile.tiktok_handle
      ? {
          id: `profile-tiktok-${profile.id}`,
          label: "TikTok",
          url: `https://tiktok.com/@${profile.tiktok_handle.replace(/^@/, "")}`,
        }
      : null,
    profile.facebook_handle
      ? {
          id: `profile-facebook-${profile.id}`,
          label: "Facebook",
          url: `https://facebook.com/${profile.facebook_handle.replace(/^@/, "")}`,
        }
      : null,
    profile.x_handle
      ? {
          id: `profile-x-${profile.id}`,
          label: "X",
          url: `https://x.com/${profile.x_handle.replace(/^@/, "")}`,
        }
      : null,
    profile.website_url
      ? {
          id: `profile-website-${profile.id}`,
          label: "Website",
          url: profile.website_url.startsWith("http")
            ? profile.website_url
            : `https://${profile.website_url}`,
        }
      : null,
  ].filter(Boolean) as Array<{ id: string; label: string; url: string }>;

  const resourceLinks = [
    ...(initialSiteData?.resources?.map((r) => ({
      id: r.id,
      label: r.label,
      url: r.url,
    })) ?? []),
    ...profileSocialLinks,
  ];

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplateId(template.id);
    setTheme({
      background: template.settings.background,
      backgroundStyle: template.settings.backgroundStyle,
      gradientFrom: template.settings.gradientFrom || template.settings.background,
      gradientTo: template.settings.gradientTo || template.settings.background,
      primary: template.settings.primary,
      font: template.settings.font,
      spacing: template.settings.spacing,
    });
    setHeroStyle(template.settings.heroStyle);
    setLessonsStyle(template.settings.lessonsStyle);
    setReviewsStyle(template.settings.reviewsStyle);
  };

  const handleHeroFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Simple validation
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setHeroUploadError("Please upload a JPG, PNG, or WebP image");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setHeroUploadError("Image must be smaller than 5MB");
      return;
    }

    setHeroUploadError(null);

    // Create object URL for immediate preview
    const objectUrl = URL.createObjectURL(file);
    setHeroImageUrl(objectUrl);

    // Upload to storage
    startHeroUpload(async () => {
      const result = await uploadHeroImage(file);
      if ("error" in result) {
        setHeroUploadError(result.error || "Failed to upload image");
        setHeroImageUrl(null);
      } else if (result.url) {
        // Update with the permanent URL
        setHeroImageUrl(result.url);
      }
    });
  };

  // Auto-save with debouncing
  const autoSaverRef = useRef<AutoSaver | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  useEffect(() => {
    autoSaverRef.current = new AutoSaver({
      debounceMs: 2000,
      retries: 1,
      onSaving: () => setAutoSaveStatus("saving"),
      onSaved: () => {
        setAutoSaveStatus("saved");
        setLastSaved(new Date());
      },
      onError: () => setAutoSaveStatus("error"),
    });
    return () => {
      autoSaverRef.current = null;
    };
  }, []);

  useEffect(() => {
    // Skip auto-save on initial mount
    if (!siteId) return;

    setAutoSaveStatus("idle");

    autoSaverRef.current?.trigger(async () => {
      const siteData: any = {
        about_title: aboutTitle,
        about_subtitle: aboutSubtitle,
        about_body: aboutBody,
        hero_image_url: heroImageUrl,
        show_about: visibility.about,
        show_lessons: visibility.lessons,
        show_reviews: visibility.reviews,
        show_booking: visibility.booking,
        show_social_page: visibility.social,
        theme_background: theme.background,
        theme_background_style: theme.backgroundStyle,
        theme_gradient_from: theme.gradientFrom,
        theme_gradient_to: theme.gradientTo,
        theme_primary: theme.primary,
        theme_font: theme.font,
        theme_spacing: theme.spacing,
        hero_layout: heroStyle,
        lessons_layout: lessonsStyle,
        reviews_layout: reviewsStyle,
        booking_cta_label: "Book a class",
        booking_cta_url: profile.stripe_payment_link || (profile.username ? `/book/${profile.username}` : ""),
        booking_headline: "Ready to start?",
        booking_subcopy: "Pick a time that works for you",
        show_contact: false,
        show_digital: false,
        contact_cta_label: "Email me",
        contact_cta_url: profile.email ? `mailto:${profile.email}` : "",
      };
      if (lastUpdatedAt) {
        siteData._prev_updated_at = lastUpdatedAt;
      }
      try {
        const result: any = await updateSite(siteId, siteData);
        if (result?.success) {
          if (result.updated_at) setLastUpdatedAt(result.updated_at);
          return true;
        }
        return false;
      } catch {
        return false;
      }
    });

    return;
  }, [
    aboutTitle,
    aboutSubtitle,
    aboutBody,
    heroImageUrl,
    theme,
    visibility,
    selectedServiceIds,
    heroStyle,
    lessonsStyle,
    reviewsStyle,
    siteId,
    lastUpdatedAt,
    profile.stripe_payment_link,
    profile.username,
    profile.email,
  ]);

  const handleSaveDraft = async () => {
    setIsSaving(true);
    setSaveMessage(null);

    const siteData: any = {
      about_title: aboutTitle,
      about_subtitle: aboutSubtitle,
      about_body: aboutBody,
      hero_image_url: heroImageUrl,
      show_hero: visibility.hero,
      show_gallery: visibility.gallery,
      show_about: visibility.about,
      show_lessons: visibility.lessons,
      show_reviews: visibility.reviews,
      show_booking: visibility.booking,
      show_social_page: visibility.social,
      show_faq: visibility.faq,
      show_contact: visibility.contact,
      show_resources: visibility.resources,
      theme_background: theme.background,
      theme_background_style: theme.backgroundStyle,
      theme_gradient_from: theme.gradientFrom,
      theme_gradient_to: theme.gradientTo,
      theme_primary: theme.primary,
      theme_font: theme.font,
      theme_spacing: theme.spacing,
      hero_layout: heroStyle,
      lessons_layout: lessonsStyle,
      reviews_layout: reviewsStyle,
      booking_cta_label: "Book a class",
      booking_cta_url: profile.stripe_payment_link || (profile.username ? `/book/${profile.username}` : ""),
      booking_headline: "Ready to start?",
      booking_subcopy: "Pick a time that works for you",
      show_digital: false,
      contact_cta_label: "Email me",
      contact_cta_url: profile.email ? `mailto:${profile.email}` : "",
    };
    if (lastUpdatedAt) {
      siteData._prev_updated_at = lastUpdatedAt;
    }

    try {
      if (siteId) {
        const result: any = await updateSite(siteId, siteData);
        if (result.success) {
          if (result.updated_at) setLastUpdatedAt(result.updated_at);
          setSaveMessage("Draft saved");
          setTimeout(() => setSaveMessage(null), 3000);
        }
      } else {
        const result: any = await createSite(siteData);
        if (result.success && result.site) {
          setSiteId(result.site.id);
          if (result.site.updated_at) setLastUpdatedAt(result.site.updated_at);
          setSaveMessage("Draft saved");
          setTimeout(() => setSaveMessage(null), 3000);
        }
      }
    } catch {
      setSaveMessage("Failed to save draft");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!siteId) {
      await handleSaveDraft();
      return;
    }

    setIsPublishing(true);
    setSaveMessage(null);

    try {
      const result = await publishSite(siteId);
      if (result.success) {
        setStatus("published");
        setSaveMessage("Site published!");
        setTimeout(() => setSaveMessage(null), 3000);
      }
    } catch {
      setSaveMessage("Failed to publish");
    } finally {
      setIsPublishing(false);
    }
  };

  const selectedServices = services.filter((s) => selectedServiceIds.includes(s.id));
  const pageSteps = [
    {
      id: "brand",
      title: "Brand basics",
      helper: "Headline, tagline, and about copy",
      complete: Boolean(aboutTitle.trim() && aboutSubtitle.trim() && aboutBody.trim()),
    },
    {
      id: "offers",
      title: "Offers & booking",
      helper: "Select services and keep booking enabled",
      complete: selectedServiceIds.length > 0 && visibility.booking,
    },
    {
      id: "publish",
      title: "Publish",
      helper: "Save a draft and go live",
      complete: status === "published",
    },
  ];
  const completedPageSteps = pageSteps.filter((step) => step.complete).length;
  const activePageStep = Math.min(completedPageSteps, pageSteps.length - 1);

  // Load published snapshot when toggled
  useEffect(() => {
    (async () => {
      if (previewMode !== "published" || !siteId) {
        setPublishedPreview(null);
        return;
      }
      const result = await getPublishedSnapshot(siteId);
      if ((result as any)?.success) {
        setPublishedPreview((result as any).snapshot);
      } else {
        setPublishedPreview(null);
      }
    })();
  }, [previewMode, siteId]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-border/60 bg-background/90 p-4 shadow-sm backdrop-blur">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-foreground">Pages Builder</h1>
          {status === "published" ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              <Check className="h-3.5 w-3.5" />
              Published
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
              <Clock className="h-3.5 w-3.5" />
              Draft
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {autoSaveStatus === "saving" ? (
            <span className="text-xs text-muted-foreground">Saving...</span>
          ) : autoSaveStatus === "saved" ? (
            <span className="text-xs text-emerald-600">Saved {lastSaved ? `at ${lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ""}</span>
          ) : autoSaveStatus === "error" ? (
            <span className="text-xs text-red-600">Error saving</span>
          ) : saveMessage ? (
            <span className="text-sm text-muted-foreground">{saveMessage}</span>
          ) : null}
          <Button onClick={handleSaveDraft} disabled={isSaving} variant="outline" size="sm">
            <Save className="h-4 w-4 mr-1.5" />
            {isSaving ? "Saving..." : "Save Draft"}
          </Button>
          <Button onClick={handlePublish} disabled={isPublishing || isSaving} size="sm">
            <Rocket className="h-4 w-4 mr-1.5" />
            {isPublishing ? "Publishing..." : "Publish Site"}
          </Button>
        </div>
      </div>

      <section className="rounded-3xl border border-border/60 bg-background/90 p-5 shadow-sm backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-foreground">Guided page flow</h2>
            <p className="text-xs text-muted-foreground">
              Move through sections like onboarding—brand, offers, then publish.
            </p>
          </div>
          <span className="text-xs font-semibold text-muted-foreground">
            {completedPageSteps}/{pageSteps.length} done
          </span>
        </div>
        <div className="mt-3">
          <FlowProgress
            steps={pageSteps.map(({ id, title, helper }) => ({ id, title, helper }))}
            activeIndex={activePageStep}
          />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.4fr)] lg:items-start">
        {/* Editor */}
        <div className="space-y-6">
          {/* Section 1: Choose Template */}
          <section className="rounded-3xl border border-border/60 bg-background/90 p-6 shadow-sm backdrop-blur">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Choose a Template
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Pick a complete design. You can customize colors and fonts after.
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {TEMPLATES.map((template) => {
                const swatches = getTemplateSwatches(template.settings);
                return (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => handleTemplateSelect(template)}
                    className={cn(
                      "rounded-2xl border p-4 text-left transition",
                      selectedTemplateId === template.id
                        ? "border-primary bg-primary/10 ring-2 ring-primary"
                        : "border-border/60 bg-background/50 hover:border-primary/50"
                    )}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <p className="font-semibold text-foreground">{template.name}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{template.description}</p>
                      </div>
                      {selectedTemplateId === template.id ? (
                        <Check className="h-5 w-5 text-primary flex-shrink-0 ml-2" />
                      ) : null}
                    </div>
                    <div className="flex items-center">
                      <span
                        className="block h-6 w-6 rounded-full border-2 border-white shadow-sm"
                        style={{ backgroundColor: swatches.secondary }}
                        aria-hidden="true"
                      />
                      <span
                        className="block -ml-2 h-6 w-6 rounded-full border-2 border-white shadow-sm"
                        style={{ backgroundColor: swatches.primary }}
                        aria-hidden="true"
                      />
                    </div>
                  </button>
                );
              })}
            </div>

            {selectedTemplateId ? (
              <div className="mt-4 pt-4 border-t border-border/40">
                <button
                  type="button"
                  onClick={() => setShowCustomization(!showCustomization)}
                  className="flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
                >
                  <Palette className="h-4 w-4" />
                  Customize colors & fonts
                  {showCustomization ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>

                {showCustomization ? (
                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground">
                        Accent Color
                      </label>
                      <Input
                        type="color"
                        value={theme.primary}
                        onChange={(e) => setTheme({ ...theme, primary: e.target.value })}
                        className="h-10 w-full"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-muted-foreground">Font</label>
                      <select
                        value={theme.font}
                        onChange={(e) =>
                          setTheme({ ...theme, font: e.target.value as FontOption })
                        }
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                      >
                        {FONT_OPTIONS.map((font) => (
                          <option key={font.value} value={font.value}>
                            {font.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </section>

          {/* Section 2: Your Information */}
          <section className="rounded-3xl border border-border/60 bg-background/90 p-6 shadow-sm backdrop-blur">
            <h2 className="text-base font-semibold text-foreground">Your Information</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Add your details. Fields are pre-filled from your profile.
            </p>

            <div className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Title</label>
                <Input
                  value={aboutTitle}
                  onChange={(e) => setAboutTitle(e.target.value)}
                  placeholder="Your name or business name"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground">Tagline</label>
                <Input
                  value={aboutSubtitle}
                  onChange={(e) => setAboutSubtitle(e.target.value)}
                  placeholder="What you teach or your specialty"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground">About</label>
                <textarea
                  rows={5}
                  value={aboutBody}
                  onChange={(e) => setAboutBody(e.target.value)}
                  placeholder="Tell students about your teaching approach..."
                  className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm leading-relaxed shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground">
                  Hero Photo (Optional)
                </label>
                <Input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleHeroFileChange}
                  disabled={isHeroUploading}
                />
                {heroUploadError ? (
                  <p className="mt-1 text-xs text-red-600">{heroUploadError}</p>
                ) : null}
                {heroImageUrl ? (
                  <div className="mt-2 relative inline-block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={heroImageUrl}
                      alt="Hero"
                      className="h-20 w-20 rounded-lg object-cover"
                    />
                  </div>
                ) : null}
              </div>
            </div>
          </section>

          {/* Section 3: Section Visibility (Collapsible) */}
          <section className="rounded-3xl border border-border/60 bg-background/90 p-6 shadow-sm backdrop-blur">
            <button
              type="button"
              onClick={() => setShowSectionSettings(!showSectionSettings)}
              className="flex w-full items-center justify-between text-left"
            >
              <div>
                <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Section Visibility
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Choose which sections appear on your page
                </p>
              </div>
              {showSectionSettings ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              )}
            </button>

            {showSectionSettings && (
              <div className="mt-4 space-y-2">
                {/* Hero */}
                <label className="flex items-center justify-between rounded-lg border border-border/60 bg-background/50 px-4 py-3">
                  <span className="text-sm font-medium text-foreground">Hero section</span>
                  <input
                    type="checkbox"
                    checked={visibility.hero}
                    onChange={(e) => setVisibility({ ...visibility, hero: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                </label>

                {/* Gallery */}
                <label className="flex items-center justify-between rounded-lg border border-border/60 bg-background/50 px-4 py-3">
                  <span className="text-sm font-medium text-foreground">Gallery</span>
                  <input
                    type="checkbox"
                    checked={visibility.gallery}
                    onChange={(e) => setVisibility({ ...visibility, gallery: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                </label>

                {/* About */}
                <label className="flex items-center justify-between rounded-lg border border-border/60 bg-background/50 px-4 py-3">
                  <span className="text-sm font-medium text-foreground">About section</span>
                  <input
                    type="checkbox"
                    checked={visibility.about}
                    onChange={(e) => setVisibility({ ...visibility, about: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                </label>

                {/* Lessons */}
                <label className="flex items-center justify-between rounded-lg border border-border/60 bg-background/50 px-4 py-3">
                  <span className="text-sm font-medium text-foreground">
                    Lessons ({selectedServices.length} selected)
                  </span>
                  <input
                    type="checkbox"
                    checked={visibility.lessons}
                    onChange={(e) => setVisibility({ ...visibility, lessons: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                </label>

                {visibility.lessons && (
                  <div className="ml-4 space-y-2 pl-4 border-l-2 border-primary/20">
                    {services.map((service) => (
                      <label key={service.id} className="flex items-start gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={selectedServiceIds.includes(service.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedServiceIds([...selectedServiceIds, service.id]);
                            } else {
                              setSelectedServiceIds(
                                selectedServiceIds.filter((id) => id !== service.id)
                              );
                            }
                          }}
                          className="mt-0.5 h-4 w-4 rounded border-gray-300"
                        />
                        <span className="text-foreground">{service.name}</span>
                      </label>
                    ))}
                  </div>
                )}

                {/* Testimonials */}
                <label className="flex items-center justify-between rounded-lg border border-border/60 bg-background/50 px-4 py-3">
                  <span className="text-sm font-medium text-foreground">
                    Testimonials ({reviews.length} reviews)
                  </span>
                  <input
                    type="checkbox"
                    checked={visibility.reviews}
                    onChange={(e) => setVisibility({ ...visibility, reviews: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                </label>

                {/* Booking */}
                <label className="flex items-center justify-between rounded-lg border border-border/60 bg-background/50 px-4 py-3">
                  <span className="text-sm font-medium text-foreground">Booking page</span>
                  <input
                    type="checkbox"
                    checked={visibility.booking}
                    onChange={(e) => setVisibility({ ...visibility, booking: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                </label>

                {/* Social links */}
                <label className="flex items-center justify-between rounded-lg border border-border/60 bg-background/50 px-4 py-3">
                  <span className="text-sm font-medium text-foreground">
                    Social links (from profile)
                  </span>
                  <input
                    type="checkbox"
                    checked={visibility.social}
                    onChange={(e) => setVisibility({ ...visibility, social: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                </label>

                {/* FAQ */}
                <label className="flex items-center justify-between rounded-lg border border-border/60 bg-background/50 px-4 py-3">
                  <span className="text-sm font-medium text-foreground">FAQ page</span>
                  <input
                    type="checkbox"
                    checked={visibility.faq}
                    onChange={(e) => setVisibility({ ...visibility, faq: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                </label>

                {/* Contact */}
                <label className="flex items-center justify-between rounded-lg border border-border/60 bg-background/50 px-4 py-3">
                  <span className="text-sm font-medium text-foreground">Contact page</span>
                  <input
                    type="checkbox"
                    checked={visibility.contact}
                    onChange={(e) => setVisibility({ ...visibility, contact: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                </label>

                {/* Resources */}
                <label className="flex items-center justify-between rounded-lg border border-border/60 bg-background/50 px-4 py-3">
                  <span className="text-sm font-medium text-foreground">Resources</span>
                  <input
                    type="checkbox"
                    checked={visibility.resources}
                    onChange={(e) => setVisibility({ ...visibility, resources: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                </label>
              </div>
            )}
          </section>
        </div>

        {/* Preview */}
        <div className="lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)] lg:self-start">
          <div className="rounded-3xl border border-border/60 bg-background/90 shadow-sm backdrop-blur overflow-hidden flex flex-col h-full">
            <div className="border-b border-border/60 bg-background/95 px-4 py-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Mobile Preview</h3>
              <div className="inline-flex rounded-full border border-border/60 p-0.5">
                <button
                  type="button"
                  onClick={() => setPreviewMode("draft")}
                  className={cn(
                    "px-2 py-1 text-xs font-semibold rounded-full",
                    previewMode === "draft" ? "bg-primary text-white" : "text-muted-foreground"
                  )}
                >
                  Draft
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode("published")}
                  className={cn(
                    "px-2 py-1 text-xs font-semibold rounded-full",
                    previewMode === "published" ? "bg-primary text-white" : "text-muted-foreground"
                  )}
                  disabled={!siteId}
                  aria-disabled={!siteId}
                  title={!siteId ? "Publish or save first to enable" : undefined}
                >
                  Published
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto bg-gradient-to-b from-muted/30 to-muted/10 p-4 flex items-start justify-center">
              {/* Mobile device frame */}
              <div className="relative w-[320px] h-[568px] rounded-[2.5rem] bg-background shadow-2xl ring-1 ring-border/50 overflow-hidden flex flex-col">
                {/* Scrollable content area */}
                <div className="flex-1 overflow-y-auto overscroll-contain">
              {previewMode === "published" && !publishedPreview ? (
                <div className="text-center text-sm text-muted-foreground py-8">
                  {siteId ? "No published version yet." : "Create and publish a site to see the published preview."}
                </div>
              ) : (
                <SitePreview
                  profile={profile}
                  about={{
                    title: previewMode === "published" ? (publishedPreview?.site?.about_title ?? aboutTitle) : aboutTitle,
                    subtitle: previewMode === "published" ? (publishedPreview?.site?.about_subtitle ?? aboutSubtitle) : aboutSubtitle,
                    body: previewMode === "published" ? (publishedPreview?.site?.about_body ?? aboutBody) : aboutBody,
                  }}
                  services={selectedServices}
                  reviews={reviews}
                  theme={
                    previewMode === "published" && publishedPreview?.site
                      ? {
                          background: publishedPreview.site.theme_background || theme.background,
                          backgroundStyle: (publishedPreview.site.theme_background_style as any) || theme.backgroundStyle,
                          gradientFrom: publishedPreview.site.theme_gradient_from || theme.gradientFrom,
                          gradientTo: publishedPreview.site.theme_gradient_to || theme.gradientTo,
                          primary: publishedPreview.site.theme_primary || theme.primary,
                          font: (publishedPreview.site.theme_font as any) || theme.font,
                          spacing: (publishedPreview.site.theme_spacing as any) || theme.spacing,
                        }
                      : theme
                  }
                  pageVisibility={{
                    hero: previewMode === "published" ? ((publishedPreview?.site as any)?.show_hero ?? true) : visibility.hero,
                    gallery: previewMode === "published" ? ((publishedPreview?.site as any)?.show_gallery ?? true) : visibility.gallery,
                    about: previewMode === "published" ? !!publishedPreview?.site?.show_about : visibility.about,
                    lessons: previewMode === "published" ? !!publishedPreview?.site?.show_lessons : visibility.lessons,
                    booking: previewMode === "published" ? !!publishedPreview?.site?.show_booking : visibility.booking,
                    reviews: previewMode === "published" ? !!publishedPreview?.site?.show_reviews : visibility.reviews,
                    social: previewMode === "published" ? !!publishedPreview?.site?.show_social_page : visibility.social,
                    contact: previewMode === "published" ? !!publishedPreview?.site?.show_contact : visibility.contact,
                    digital: false,
                    faq: previewMode === "published" ? !!publishedPreview?.site?.show_faq : visibility.faq,
                    resources: previewMode === "published" ? !!publishedPreview?.site?.show_resources : visibility.resources,
                  }}
                  heroImageUrl={previewMode === "published" ? (publishedPreview?.site?.hero_image_url ?? heroImageUrl) : heroImageUrl}
                  galleryImages={[]}
                  contactCTA={null}
                  socialLinks={resourceLinks}
                  digitalResources={[]}
                  additionalPages={{ faq: [], resources: [] }}
                  booking={{
                    headline: "Ready to start?",
                    subcopy: "Pick a time that works for you",
                    ctaLabel: "Book a class",
                    ctaUrl:
                      profile.stripe_payment_link ||
                      (profile.username ? `/book/${profile.username}` : ""),
                  }}
                  showDigital={false}
                  showSocialIconsHeader={false}
                  showSocialIconsFooter={true}
                  heroStyle={previewMode === "published" ? ((publishedPreview?.site?.hero_layout as any) || heroStyle) : heroStyle}
                  lessonsStyle={previewMode === "published" ? ((publishedPreview?.site?.lessons_layout as any) || lessonsStyle) : lessonsStyle}
                  reviewsStyle={previewMode === "published" ? ((publishedPreview?.site?.reviews_layout as any) || reviewsStyle) : reviewsStyle}
                  page={previewPage}
                  onNavigate={setPreviewPage}
                />
              )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
