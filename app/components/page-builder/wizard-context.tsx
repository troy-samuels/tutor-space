"use client";

import {
  createContext,
  useContext,
  useReducer,
  useRef,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { AutoSaver } from "@/lib/utils/auto-saver";
import {
  updateSite,
  createSite,
  publishSite,
  type TutorSite,
  type TutorSiteService,
  type TutorSiteReview,
  type TutorSiteResource,
} from "@/lib/actions/tutor-sites";

// Types - Premium Typography Pairings (11 font options)
export type FontOption =
  | "system"        // Inter - Clean, Tech, Safe (body)
  | "rounded"       // Manrope - Friendly, Modern, Soft (body)
  | "luxury"        // DM Sans - High-end, Minimalist (body)
  | "grotesk"       // Space Grotesk - Trendy, Gen-Z, Bold (heading)
  | "serif"         // Playfair Display - Elegant, Magazine-style (heading)
  | "dm-serif"      // DM Serif Display - Editorial headings (heading)
  | "plus-jakarta"  // Plus Jakarta Sans - Swiss headings (heading)
  | "source-sans"   // Source Sans 3 - Ivy League body (body)
  | "spline-sans"   // Spline Sans - UI-focused headings (heading)
  | "amatic-sc"     // Amatic SC - Hand-drawn headings (heading)
  | "andika";       // Andika - Readable body (body)

export type BorderRadius = "lg" | "xl" | "2xl" | "3xl";

export type ThemeState = {
  archetypeId: ArchetypeId;
  fontPairingId: FontPairingId | null; // Independent font pairing selection
  background: string;
  cardBg: string;
  primary: string;
  textPrimary: string;
  textSecondary: string;
  border: string; // Soft-Premium border color
  font: FontOption;
  headingFont: FontOption;
  borderRadius: BorderRadius;
};

// Soft-Premium Color Palettes (Dec 2025 Standards)
// Philosophy: Kill stark white, use matte accents, high-legibility text
// Each archetype includes curated heading + body font pairing
export const ARCHETYPES = [
  {
    id: "professional",
    name: "The Executive",
    description: "Business English, Legal Spanish, Interview Prep",
    vibe: "Efficient, Clean, International",
    bannerHint: "Abstract architecture, clean office, geometric blue",
    // Cool & Precise - Inspired by Stripe, Linear, Apple
    background: "#F8FAFC",    // Cool Snow
    cardBg: "#FFFFFF",        // White
    primary: "#334155",       // Slate 700 - Matte Blue-Grey (authoritative)
    textPrimary: "#0F172A",   // Deep Slate
    textSecondary: "#64748B", // Cool Gray
    border: "#E2E8F0",        // Cool Ice
    font: "system" as FontOption,             // Inter (body)
    headingFont: "plus-jakarta" as FontOption, // Plus Jakarta Sans (heading)
    borderRadius: "lg" as BorderRadius,
  },
  {
    id: "immersion",
    name: "The Editorial",
    description: "Conversation, Travel, Cultural immersion",
    vibe: "Elegant, Warm, Human",
    bannerHint: "Street scenes, coffee shops, nature",
    // Warm & Organic - Inspired by Kinfolk, Aeon, Substack
    background: "#FBFBF9",    // Warm Alabaster
    cardBg: "#FFFFFF",        // White
    primary: "#A16207",       // Muted Gold/Ochre (expensive, earthy)
    textPrimary: "#44403C",   // Warm Charcoal
    textSecondary: "#78716C", // Stone Gray
    border: "#E7E5E4",        // Warm Stone
    font: "rounded" as FontOption,           // Manrope (body)
    headingFont: "dm-serif" as FontOption,   // DM Serif Display (heading)
    borderRadius: "3xl" as BorderRadius,
  },
  {
    id: "academic",
    name: "The Scholar",
    description: "IELTS, DELE, TOPIK, Grammar, Literature",
    vibe: "Traditional, Prestigious, Institutional",
    bannerHint: "Books, libraries, university textures",
    // Traditional & Rich - Inspired by Ivy League, NYT
    background: "#FFFCF5",    // Very Pale Cream/Vellum
    cardBg: "#FFFFFF",        // White
    primary: "#14532D",       // Deep Hunter Green (growth, education)
    textPrimary: "#1C1917",   // Soft Black (Ink)
    textSecondary: "#57534E", // Warm Grey (Pencil)
    border: "#F0EBE0",        // Paper Edge
    font: "source-sans" as FontOption,       // Source Sans 3 (body)
    headingFont: "serif" as FontOption,      // Playfair Display (heading)
    borderRadius: "xl" as BorderRadius,
  },
  {
    id: "polyglot",
    name: "The Modernist",
    description: "Pop culture, Slang, Creative methods",
    vibe: "Contemporary, Fresh, Digital-native",
    bannerHint: "Minimalist, bold typography, matte surfaces",
    // Warm Neutral - Peachy accent with dark charcoal text
    background: "#FAFAFA",    // Neutral Grey-White
    cardBg: "#FFFFFF",        // White
    primary: "#E8B59E",       // Peachy/Salmon accent
    textPrimary: "#2C2C2C",   // Dark Charcoal
    textSecondary: "#737373", // Neutral Grey
    border: "#E5E5E5",        // Soft Border
    font: "luxury" as FontOption,            // DM Sans (body)
    headingFont: "grotesk" as FontOption,    // Space Grotesk (heading)
    borderRadius: "2xl" as BorderRadius,
  },
  {
    id: "artisan",
    name: "The Artisan",
    description: "Creative methods, Kids lessons, Art & Music",
    vibe: "Handcrafted, Boutique, Personal",
    bannerHint: "Warm textures, handwritten notes, craft materials",
    // Warm & Artisanal - Inspired by Etsy, handmade brands
    background: "#F4F1F0",    // Warm Blush Cream
    cardBg: "#FFFFFF",        // White
    primary: "#BF9056",       // Bronze/Caramel (warm, inviting)
    textPrimary: "#3D3229",   // Warm Dark Brown (high contrast)
    textSecondary: "#8C7F75", // Warm Taupe Gray
    border: "#E8E2DE",        // Warm Stone Border
    font: "andika" as FontOption,            // Andika (body)
    headingFont: "amatic-sc" as FontOption,  // Amatic SC (heading)
    borderRadius: "2xl" as BorderRadius,
  },
] as const;

export type ArchetypeId = typeof ARCHETYPES[number]["id"];

// Font Pairings - Independent typography selection
export const FONT_PAIRINGS = [
  {
    id: "minimal",
    name: "Minimal",
    description: "Clean & neutral",
    headingFont: "plus-jakarta" as FontOption,
    bodyFont: "system" as FontOption,
  },
  {
    id: "literary",
    name: "Literary",
    description: "Elegant & readable",
    headingFont: "dm-serif" as FontOption,
    bodyFont: "rounded" as FontOption,
  },
  {
    id: "heritage",
    name: "Heritage",
    description: "Classic & refined",
    headingFont: "serif" as FontOption,
    bodyFont: "source-sans" as FontOption,
  },
  {
    id: "expressive",
    name: "Expressive",
    description: "Bold & modern",
    headingFont: "grotesk" as FontOption,
    bodyFont: "luxury" as FontOption,
  },
  {
    id: "interface",
    name: "Interface",
    description: "UI-focused",
    headingFont: "spline-sans" as FontOption,
    bodyFont: "system" as FontOption,
  },
  {
    id: "creative",
    name: "Creative",
    description: "Whimsical & fun",
    headingFont: "amatic-sc" as FontOption,
    bodyFont: "andika" as FontOption,
  },
] as const;

export type FontPairingId = typeof FONT_PAIRINGS[number]["id"];

// Map archetype IDs to font pairing IDs (defaults)
const ARCHETYPE_TO_FONT_PAIRING: Record<ArchetypeId, FontPairingId> = {
  professional: "minimal",
  immersion: "literary",
  academic: "heritage",
  polyglot: "expressive",
  artisan: "creative",
};

// Legacy alias for backwards compatibility during migration
export const PALETTES = ARCHETYPES;
export type PaletteId = ArchetypeId;

export type LayoutState = {
  heroStyle: "banner"; // Cultural Banner is the only hero style
};

// Helper to migrate old palette IDs to new archetype IDs
function migrateFromPalette(paletteId: string | null | undefined): ArchetypeId | null {
  if (!paletteId) return null;
  const mapping: Record<string, ArchetypeId> = {
    "classic-ink": "professional",
    "ocean-trust": "professional",
    "warm-clay": "immersion",
    "midnight-gold": "professional",
    "lavender-luxe": "polyglot",
  };
  return mapping[paletteId] || null;
}

export type ContentState = {
  title: string;
  subtitle: string;
  body: string;
  heroImageUrl: string | null;
  galleryImages: string[];
};

export type PagesState = {
  showLessons: boolean;
  showReviews: boolean;
  showBooking: boolean;
  selectedServiceIds: string[];
  pinnedReviewId: string | null;
  socialIconsHeader: boolean;
  socialIconsFooter: boolean;
};

export type FAQItem = {
  q: string;
  a: string;
};

export type WizardState = {
  // Avatar
  avatarUrl: string | null;

  // Persistence
  siteId: string | null;
  status: "draft" | "published";
  lastUpdatedAt: string | null;
  isDirty: boolean;

  // Auto-save status
  autoSaveStatus: "idle" | "saving" | "saved" | "error";
  lastSaved: Date | null;

  // Publishing
  isPublishing: boolean;

  // Section data
  theme: ThemeState;
  layout: LayoutState;
  content: ContentState;
  pages: PagesState;
  faq: FAQItem[];
};

type WizardAction =
  | { type: "UPDATE_AVATAR"; avatarUrl: string | null }
  | { type: "UPDATE_THEME"; payload: Partial<ThemeState> }
  | { type: "UPDATE_LAYOUT"; payload: Partial<LayoutState> }
  | { type: "UPDATE_CONTENT"; payload: Partial<ContentState> }
  | { type: "UPDATE_PAGES"; payload: Partial<PagesState> }
  | { type: "UPDATE_FAQ"; payload: FAQItem[] }
  | { type: "SET_SITE_ID"; siteId: string }
  | { type: "SET_STATUS"; status: "draft" | "published" }
  | { type: "SET_LAST_UPDATED"; timestamp: string }
  | { type: "SET_DIRTY"; dirty: boolean }
  | { type: "SET_AUTO_SAVE_STATUS"; status: WizardState["autoSaveStatus"] }
  | { type: "SET_LAST_SAVED"; date: Date }
  | { type: "SET_PUBLISHING"; isPublishing: boolean }
  | { type: "RESET" };

// Initial state factory
const createInitialState = (initialData?: InitialWizardData): WizardState => ({
  avatarUrl: initialData?.profile?.avatar_url || null,

  siteId: initialData?.site?.id || null,
  status: initialData?.site?.status || "draft",
  lastUpdatedAt: initialData?.site?.updated_at || null,
  isDirty: false,

  autoSaveStatus: "idle",
  lastSaved: null,

  isPublishing: false,

  theme: (() => {
    const archetypeId = (initialData?.site?.theme_archetype_id as ArchetypeId) ||
                        migrateFromPalette(initialData?.site?.theme_palette_id) ||
                        "immersion";
    // Derive fontPairingId from fonts if stored, otherwise from archetype
    const storedFont = initialData?.site?.theme_font as FontOption | undefined;
    const storedHeadingFont = initialData?.site?.theme_heading_font as FontOption | undefined;
    const derivedFontPairingId = storedFont && storedHeadingFont
      ? (FONT_PAIRINGS.find(p => p.bodyFont === storedFont && p.headingFont === storedHeadingFont)?.id ||
         ARCHETYPE_TO_FONT_PAIRING[archetypeId])
      : ARCHETYPE_TO_FONT_PAIRING[archetypeId];

    return {
      archetypeId,
      fontPairingId: derivedFontPairingId,
      background: initialData?.site?.theme_background || ARCHETYPES[1].background,
      cardBg: initialData?.site?.theme_card_bg || ARCHETYPES[1].cardBg,
      primary: initialData?.site?.theme_primary || ARCHETYPES[1].primary,
      textPrimary: initialData?.site?.theme_text_primary || ARCHETYPES[1].textPrimary,
      textSecondary: initialData?.site?.theme_text_secondary || ARCHETYPES[1].textSecondary,
      border: ARCHETYPES[1].border, // Soft-Premium border color
      font: storedFont || ARCHETYPES[1].font,
      headingFont: storedHeadingFont || ARCHETYPES[1].headingFont,
      borderRadius: (initialData?.site?.theme_border_radius as BorderRadius) || ARCHETYPES[1].borderRadius,
    };
  })(),

  layout: {
    heroStyle: "banner", // Cultural Banner is the only hero style
  },

  content: {
    title: initialData?.site?.about_title || initialData?.profile?.full_name || "",
    subtitle: initialData?.site?.about_subtitle || initialData?.profile?.tagline || "",
    body: initialData?.site?.about_body || initialData?.profile?.bio || "",
    heroImageUrl: initialData?.site?.hero_image_url || null,
    galleryImages: initialData?.site?.gallery_images || [],
  },

  pages: {
    showLessons: initialData?.site?.show_lessons ?? true,
    showReviews: initialData?.site?.show_reviews ?? true,
    showBooking: initialData?.site?.show_booking ?? true,
    selectedServiceIds:
      initialData?.services?.map((s) => s.service_id) ||
      initialData?.allServices?.map((s) => s.id) ||
      [],
    pinnedReviewId: null,
    socialIconsHeader: initialData?.site?.show_social_header_icons ?? false,
    socialIconsFooter: initialData?.site?.show_social_footer_icons ?? true,
  },

  faq: (initialData?.site?.additional_pages as { faq?: FAQItem[] })?.faq || [],
});

// Reducer
function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case "UPDATE_AVATAR":
      return {
        ...state,
        avatarUrl: action.avatarUrl,
        isDirty: true,
      };

    case "UPDATE_THEME":
      return {
        ...state,
        theme: { ...state.theme, ...action.payload },
        isDirty: true,
      };

    case "UPDATE_LAYOUT":
      return {
        ...state,
        layout: { ...state.layout, ...action.payload },
        isDirty: true,
      };

    case "UPDATE_CONTENT":
      return {
        ...state,
        content: { ...state.content, ...action.payload },
        isDirty: true,
      };

    case "UPDATE_PAGES":
      return {
        ...state,
        pages: { ...state.pages, ...action.payload },
        isDirty: true,
      };

    case "UPDATE_FAQ":
      return {
        ...state,
        faq: action.payload,
        isDirty: true,
      };

    case "SET_SITE_ID":
      return { ...state, siteId: action.siteId };

    case "SET_STATUS":
      return { ...state, status: action.status };

    case "SET_LAST_UPDATED":
      return { ...state, lastUpdatedAt: action.timestamp };

    case "SET_DIRTY":
      return { ...state, isDirty: action.dirty };

    case "SET_AUTO_SAVE_STATUS":
      return { ...state, autoSaveStatus: action.status };

    case "SET_LAST_SAVED":
      return { ...state, lastSaved: action.date };

    case "SET_PUBLISHING":
      return { ...state, isPublishing: action.isPublishing };

    case "RESET":
      return createInitialState();

    default:
      return state;
  }
}

// Context types
type WizardContextValue = {
  state: WizardState;
  dispatch: React.Dispatch<WizardAction>;

  // Update actions
  updateAvatar: (avatarUrl: string | null) => void;
  updateTheme: (updates: Partial<ThemeState>) => void;
  updateLayout: (updates: Partial<LayoutState>) => void;
  updateContent: (updates: Partial<ContentState>) => void;
  updatePages: (updates: Partial<PagesState>) => void;
  updateFaq: (faq: FAQItem[]) => void;

  // Persistence actions
  saveDraft: () => Promise<void>;
  publish: () => Promise<void>;
};

const WizardContext = createContext<WizardContextValue | null>(null);

// Provider props
export type InitialWizardData = {
  site: TutorSite | null;
  services: TutorSiteService[];
  reviews: TutorSiteReview[];
  resources: TutorSiteResource[];
  profile?: {
    id: string;
    full_name: string;
    username: string;
    tagline: string;
    bio: string;
    avatar_url: string | null;
    stripe_payment_link?: string | null;
    email?: string | null;
  };
  allServices?: Array<{ id: string; name: string }>;
};

type WizardProviderProps = {
  children: ReactNode;
  initialData?: InitialWizardData;
};

// Provider
export function PageBuilderWizardProvider({ children, initialData }: WizardProviderProps) {
  const [state, dispatch] = useReducer(wizardReducer, initialData, createInitialState);
  const autoSaverRef = useRef<AutoSaver | null>(null);
  const profileRef = useRef(initialData?.profile);

  // Initialize auto-saver
  useEffect(() => {
    autoSaverRef.current = new AutoSaver({
      debounceMs: 2000,
      retries: 1,
      onSaving: () => dispatch({ type: "SET_AUTO_SAVE_STATUS", status: "saving" }),
      onSaved: () => {
        dispatch({ type: "SET_AUTO_SAVE_STATUS", status: "saved" });
        dispatch({ type: "SET_LAST_SAVED", date: new Date() });
      },
      onError: () => dispatch({ type: "SET_AUTO_SAVE_STATUS", status: "error" }),
    });
    return () => {
      autoSaverRef.current = null;
    };
  }, []);

  // Build site data for saving
  const buildSiteData = useCallback(() => {
    const profile = profileRef.current;
    return {
      about_title: state.content.title,
      about_subtitle: state.content.subtitle,
      about_body: state.content.body,
      hero_image_url: state.content.heroImageUrl,
      gallery_images: state.content.galleryImages,
      theme_archetype_id: state.theme.archetypeId,
      theme_palette_id: state.theme.archetypeId, // Legacy field for backwards compatibility
      theme_background: state.theme.background,
      theme_background_style: "solid" as const,
      theme_gradient_from: state.theme.background,
      theme_gradient_to: state.theme.background,
      theme_card_bg: state.theme.cardBg,
      theme_primary: state.theme.primary,
      theme_text_primary: state.theme.textPrimary,
      theme_text_secondary: state.theme.textSecondary,
      theme_font: state.theme.font,
      theme_heading_font: state.theme.headingFont,
      theme_border_radius: state.theme.borderRadius,
      theme_spacing: "comfortable" as const,
      hero_layout: "banner", // Cultural Banner is the only hero style
      lessons_layout: "cards" as const,
      reviews_layout: "cards" as const,
      show_about: true,
      show_lessons: state.pages.showLessons,
      show_reviews: state.pages.showReviews,
      show_booking: state.pages.showBooking,
      show_social_header_icons: state.pages.socialIconsHeader,
      show_social_footer_icons: state.pages.socialIconsFooter,
      booking_cta_label: "Book a class",
      booking_cta_url: profile?.stripe_payment_link || (profile?.username ? `/book/${profile.username}` : ""),
      booking_headline: "Ready to start?",
      booking_subcopy: "Pick a time that works for you",
      services: state.pages.selectedServiceIds,
      additional_pages: {
        faq: state.faq,
      },
      show_faq: state.faq.length > 0,
      _prev_updated_at: state.lastUpdatedAt,
    };
  }, [state]);

  // Auto-save effect
  useEffect(() => {
    if (!state.siteId || !state.isDirty) return;

    dispatch({ type: "SET_AUTO_SAVE_STATUS", status: "idle" });

    autoSaverRef.current?.trigger(async () => {
      const siteData = buildSiteData();
      try {
        const result = await updateSite(state.siteId!, siteData);
        if (result && "success" in result && result.success) {
          if ("updated_at" in result && result.updated_at) {
            dispatch({ type: "SET_LAST_UPDATED", timestamp: result.updated_at });
          }
          dispatch({ type: "SET_DIRTY", dirty: false });
          return true;
        }
        return false;
      } catch {
        return false;
      }
    });
  }, [state.siteId, state.isDirty, buildSiteData, state.theme, state.layout, state.content, state.pages, state.faq]);

  // Actions
  const updateAvatar = useCallback((avatarUrl: string | null) => {
    dispatch({ type: "UPDATE_AVATAR", avatarUrl });
  }, []);

  const updateTheme = useCallback((updates: Partial<ThemeState>) => {
    dispatch({ type: "UPDATE_THEME", payload: updates });
  }, []);

  const updateLayout = useCallback((updates: Partial<LayoutState>) => {
    dispatch({ type: "UPDATE_LAYOUT", payload: updates });
  }, []);

  const updateContent = useCallback((updates: Partial<ContentState>) => {
    dispatch({ type: "UPDATE_CONTENT", payload: updates });
  }, []);

  const updatePages = useCallback((updates: Partial<PagesState>) => {
    dispatch({ type: "UPDATE_PAGES", payload: updates });
  }, []);

  const updateFaq = useCallback((faq: FAQItem[]) => {
    dispatch({ type: "UPDATE_FAQ", payload: faq });
  }, []);

  const saveDraft = useCallback(async () => {
    const siteData = buildSiteData();

    try {
      if (state.siteId) {
        const result = await updateSite(state.siteId, siteData);
        if (result && "success" in result && result.success) {
          if ("updated_at" in result && result.updated_at) {
            dispatch({ type: "SET_LAST_UPDATED", timestamp: result.updated_at });
          }
          dispatch({ type: "SET_DIRTY", dirty: false });
        }
      } else {
        const result = await createSite(siteData);
        if (result && "success" in result && result.success && "site" in result && result.site) {
          dispatch({ type: "SET_SITE_ID", siteId: result.site.id });
          if (result.site.updated_at) {
            dispatch({ type: "SET_LAST_UPDATED", timestamp: result.site.updated_at });
          }
          dispatch({ type: "SET_DIRTY", dirty: false });
        }
      }
    } catch (error) {
      console.error("[WizardContext] Save draft error:", error);
    }
  }, [state.siteId, buildSiteData]);

  const publish = useCallback(async () => {
    dispatch({ type: "SET_PUBLISHING", isPublishing: true });

    try {
      // Ensure we have a site ID
      if (!state.siteId) {
        await saveDraft();
      }

      if (state.siteId) {
        const result = await publishSite(state.siteId);
        if (result && "success" in result && result.success) {
          dispatch({ type: "SET_STATUS", status: "published" });
        }
      }
    } catch (error) {
      console.error("[WizardContext] Publish error:", error);
    } finally {
      dispatch({ type: "SET_PUBLISHING", isPublishing: false });
    }
  }, [state.siteId, saveDraft]);

  const value: WizardContextValue = {
    state,
    dispatch,
    updateAvatar,
    updateTheme,
    updateLayout,
    updateContent,
    updatePages,
    updateFaq,
    saveDraft,
    publish,
  };

  return <WizardContext.Provider value={value}>{children}</WizardContext.Provider>;
}

// Hook
export function usePageBuilderWizard() {
  const context = useContext(WizardContext);
  if (!context) {
    throw new Error("usePageBuilderWizard must be used within a PageBuilderWizardProvider");
  }
  return context;
}

// Section labels for UI (no longer steps)
export const WIZARD_SECTIONS = [
  { id: "avatar", title: "Profile Photo", description: "Your profile picture" },
  { id: "brand", title: "Teaching Style", description: "Your archetype and colors" },
  { id: "content", title: "Content", description: "Your info and photos" },
  { id: "pages", title: "Pages", description: "What to show" },
] as const;

// Keep for backwards compatibility during transition
export const WIZARD_STEPS = WIZARD_SECTIONS;
