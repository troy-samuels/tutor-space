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

// Types
export type FontOption = "system" | "serif" | "rounded" | "tech" | "luxury";

export type ThemeState = {
  background: string;
  primary: string;
  font: FontOption;
};

export type LayoutState = {
  heroStyle: "minimal" | "portrait" | "banner";
};

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

export type WizardState = {
  // Navigation
  currentStep: number;
  completedSteps: number[];
  hasCompletedFirstPass: boolean;

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

  // Step data
  theme: ThemeState;
  layout: LayoutState;
  content: ContentState;
  pages: PagesState;
};

type WizardAction =
  | { type: "GO_TO_STEP"; step: number }
  | { type: "NEXT_STEP" }
  | { type: "PREV_STEP" }
  | { type: "MARK_STEP_COMPLETE"; step: number }
  | { type: "SET_FIRST_PASS_COMPLETE" }
  | { type: "UPDATE_THEME"; payload: Partial<ThemeState> }
  | { type: "UPDATE_LAYOUT"; payload: Partial<LayoutState> }
  | { type: "UPDATE_CONTENT"; payload: Partial<ContentState> }
  | { type: "UPDATE_PAGES"; payload: Partial<PagesState> }
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
  currentStep: 0,
  completedSteps: [],
  hasCompletedFirstPass: !!initialData?.site,

  siteId: initialData?.site?.id || null,
  status: initialData?.site?.status || "draft",
  lastUpdatedAt: initialData?.site?.updated_at || null,
  isDirty: false,

  autoSaveStatus: "idle",
  lastSaved: null,

  isPublishing: false,

  theme: {
    background: initialData?.site?.theme_background || "#ffffff",
    primary: initialData?.site?.theme_primary || "#2563eb",
    font: (initialData?.site?.theme_font as FontOption) || "system",
  },

  layout: {
    heroStyle: (initialData?.site?.hero_layout as LayoutState["heroStyle"]) || "minimal",
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
    pinnedReviewId: null, // Will be fetched from DB once migration is applied
    socialIconsHeader: initialData?.site?.show_social_header_icons ?? false,
    socialIconsFooter: initialData?.site?.show_social_footer_icons ?? true,
  },
});

// Reducer
function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case "GO_TO_STEP": {
      // Only allow going to step if first pass is complete or going backwards
      if (!state.hasCompletedFirstPass && action.step > state.currentStep) {
        // Must complete current step first
        return state;
      }
      return { ...state, currentStep: action.step };
    }

    case "NEXT_STEP": {
      const nextStep = Math.min(state.currentStep + 1, 3); // 4 steps (0-3)
      const newCompleted = state.completedSteps.includes(state.currentStep)
        ? state.completedSteps
        : [...state.completedSteps, state.currentStep];

      const hasCompletedFirstPass =
        state.hasCompletedFirstPass || (nextStep === 3 && newCompleted.length >= 3);

      return {
        ...state,
        currentStep: nextStep,
        completedSteps: newCompleted,
        hasCompletedFirstPass,
      };
    }

    case "PREV_STEP":
      return {
        ...state,
        currentStep: Math.max(state.currentStep - 1, 0),
      };

    case "MARK_STEP_COMPLETE": {
      if (state.completedSteps.includes(action.step)) return state;
      return {
        ...state,
        completedSteps: [...state.completedSteps, action.step],
      };
    }

    case "SET_FIRST_PASS_COMPLETE":
      return { ...state, hasCompletedFirstPass: true };

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

  // Navigation actions
  goToStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  canGoToStep: (step: number) => boolean;

  // Update actions
  updateTheme: (updates: Partial<ThemeState>) => void;
  updateLayout: (updates: Partial<LayoutState>) => void;
  updateContent: (updates: Partial<ContentState>) => void;
  updatePages: (updates: Partial<PagesState>) => void;

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
      theme_background: state.theme.background,
      theme_background_style: "solid" as const,
      theme_gradient_from: state.theme.background,
      theme_gradient_to: state.theme.background,
      theme_primary: state.theme.primary,
      theme_font: state.theme.font,
      theme_spacing: "comfortable" as const,
      hero_layout: state.layout.heroStyle,
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
  }, [state.siteId, state.isDirty, buildSiteData, state.theme, state.layout, state.content, state.pages]);

  // Actions
  const goToStep = useCallback(
    (step: number) => {
      if (step < 0 || step > 3) return;
      if (!state.hasCompletedFirstPass && step > state.currentStep) return;
      dispatch({ type: "GO_TO_STEP", step });
    },
    [state.hasCompletedFirstPass, state.currentStep]
  );

  const nextStep = useCallback(() => {
    dispatch({ type: "NEXT_STEP" });
  }, []);

  const prevStep = useCallback(() => {
    dispatch({ type: "PREV_STEP" });
  }, []);

  const canGoToStep = useCallback(
    (step: number) => {
      if (step < 0 || step > 3) return false;
      if (state.hasCompletedFirstPass) return true;
      return step <= state.currentStep;
    },
    [state.hasCompletedFirstPass, state.currentStep]
  );

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
    goToStep,
    nextStep,
    prevStep,
    canGoToStep,
    updateTheme,
    updateLayout,
    updateContent,
    updatePages,
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

// Step labels for UI
export const WIZARD_STEPS = [
  { id: 0, title: "Brand", description: "Choose your colors and fonts" },
  { id: 1, title: "Layout", description: "Pick how your page looks" },
  { id: 2, title: "Content", description: "Add your info and photos" },
  { id: 3, title: "Pages", description: "Configure what to show" },
] as const;
