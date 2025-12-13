import test from "node:test";
import assert from "node:assert/strict";

/**
 * Integration tests for the Page Builder wizard flow.
 * These tests verify state transitions and data flow between components.
 */

// Types matching wizard-context.tsx
type FontOption =
  | "system"
  | "rounded"
  | "tech"
  | "serif"
  | "luxury"
  | "grotesk"
  | "humanist"
  | "editorial"
  | "playful"
  | "mono";

type HeroStyle = "minimal" | "portrait";

type ThemeState = {
  background: string;
  primary: string;
  font: FontOption;
};

type LayoutState = {
  heroStyle: HeroStyle;
};

type ContentState = {
  title: string;
  subtitle: string;
  body: string;
  heroImageUrl: string | null;
  galleryImages: string[];
};

type PagesState = {
  showLessons: boolean;
  showReviews: boolean;
  showBooking: boolean;
  selectedServiceIds: string[];
  pinnedReviewId: string | null;
  socialIconsHeader: boolean;
  socialIconsFooter: boolean;
};

type FAQItem = {
  q: string;
  a: string;
};

type WizardState = {
  avatarUrl: string | null;
  siteId: string | null;
  status: "draft" | "published";
  lastUpdatedAt: string | null;
  isDirty: boolean;
  autoSaveStatus: "idle" | "saving" | "saved" | "error";
  lastSaved: Date | null;
  isPublishing: boolean;
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

// Complete reducer implementation matching wizard-context.tsx
function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case "UPDATE_AVATAR":
      return { ...state, avatarUrl: action.avatarUrl, isDirty: true };
    case "UPDATE_THEME":
      return { ...state, theme: { ...state.theme, ...action.payload }, isDirty: true };
    case "UPDATE_LAYOUT":
      return { ...state, layout: { ...state.layout, ...action.payload }, isDirty: true };
    case "UPDATE_CONTENT":
      return { ...state, content: { ...state.content, ...action.payload }, isDirty: true };
    case "UPDATE_PAGES":
      return { ...state, pages: { ...state.pages, ...action.payload }, isDirty: true };
    case "UPDATE_FAQ":
      return { ...state, faq: action.payload, isDirty: true };
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

function createInitialState(): WizardState {
  return {
    avatarUrl: null,
    siteId: null,
    status: "draft",
    lastUpdatedAt: null,
    isDirty: false,
    autoSaveStatus: "idle",
    lastSaved: null,
    isPublishing: false,
    theme: {
      background: "#ffffff",
      primary: "#2563eb",
      font: "system",
    },
    layout: {
      heroStyle: "minimal",
    },
    content: {
      title: "",
      subtitle: "",
      body: "",
      heroImageUrl: null,
      galleryImages: [],
    },
    pages: {
      showLessons: true,
      showReviews: true,
      showBooking: true,
      selectedServiceIds: [],
      pinnedReviewId: null,
      socialIconsHeader: false,
      socialIconsFooter: true,
    },
    faq: [],
  };
}

// Simulate actions helper (for sequence testing)
function applyActions(initialState: WizardState, actions: WizardAction[]): WizardState {
  return actions.reduce((state, action) => wizardReducer(state, action), initialState);
}

// Build site data helper (mirrors wizard-context.tsx buildSiteData)
function buildSiteData(state: WizardState, profile?: { username?: string; stripe_payment_link?: string }) {
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
    additional_pages: {
      faq: state.faq,
    },
    show_faq: state.faq.length > 0,
    _prev_updated_at: state.lastUpdatedAt,
  };
}

// ==========================================
// Complete Wizard Flow Tests
// ==========================================

test("complete wizard flow: fresh start to publish", () => {
  let state = createInitialState();

  // Step 1: Set avatar
  state = wizardReducer(state, { type: "UPDATE_AVATAR", avatarUrl: "https://example.com/avatar.jpg" });
  assert.equal(state.avatarUrl, "https://example.com/avatar.jpg");
  assert.equal(state.isDirty, true);

  // Step 2: Set theme (colors and font)
  state = wizardReducer(state, {
    type: "UPDATE_THEME",
    payload: { background: "#0F172A", primary: "#F59E0B", font: "editorial" },
  });
  assert.equal(state.theme.background, "#0F172A");
  assert.equal(state.theme.primary, "#F59E0B");
  assert.equal(state.theme.font, "editorial");

  // Step 3: Set layout
  state = wizardReducer(state, {
    type: "UPDATE_LAYOUT",
    payload: { heroStyle: "portrait" },
  });
  assert.equal(state.layout.heroStyle, "portrait");

  // Step 4: Set content
  state = wizardReducer(state, {
    type: "UPDATE_CONTENT",
    payload: {
      title: "Maria Garcia",
      subtitle: "Spanish Language Tutor",
      body: "I help students learn conversational Spanish",
      heroImageUrl: "https://example.com/hero.jpg",
    },
  });
  assert.equal(state.content.title, "Maria Garcia");
  assert.equal(state.content.subtitle, "Spanish Language Tutor");

  // Step 5: Configure pages
  state = wizardReducer(state, {
    type: "UPDATE_PAGES",
    payload: {
      showLessons: true,
      showReviews: true,
      showBooking: true,
      selectedServiceIds: ["service-1", "service-2"],
    },
  });
  assert.deepEqual(state.pages.selectedServiceIds, ["service-1", "service-2"]);

  // Step 6: Add FAQ
  state = wizardReducer(state, {
    type: "UPDATE_FAQ",
    payload: [
      { q: "How long are lessons?", a: "50 minutes each" },
      { q: "What levels do you teach?", a: "Beginner to advanced" },
    ],
  });
  assert.equal(state.faq.length, 2);

  // Simulate save (sets siteId)
  state = wizardReducer(state, { type: "SET_SITE_ID", siteId: "site-123" });
  state = wizardReducer(state, { type: "SET_DIRTY", dirty: false });
  assert.equal(state.siteId, "site-123");
  assert.equal(state.isDirty, false);

  // Simulate publish
  state = wizardReducer(state, { type: "SET_PUBLISHING", isPublishing: true });
  assert.equal(state.isPublishing, true);

  state = wizardReducer(state, { type: "SET_STATUS", status: "published" });
  state = wizardReducer(state, { type: "SET_PUBLISHING", isPublishing: false });
  assert.equal(state.status, "published");
  assert.equal(state.isPublishing, false);
});

test("wizard flow: editing existing site", () => {
  // Start with existing data
  let state = createInitialState();
  state = {
    ...state,
    siteId: "existing-site-456",
    status: "published",
    lastUpdatedAt: "2024-01-15T10:00:00Z",
    theme: { background: "#FFFFFF", primary: "#1F2937", font: "system" },
    layout: { heroStyle: "minimal" },
    content: { title: "John Doe", subtitle: "English Tutor", body: "Hello", heroImageUrl: null, galleryImages: [] },
  };

  // Make edits
  state = wizardReducer(state, {
    type: "UPDATE_THEME",
    payload: { font: "grotesk" },
  });

  state = wizardReducer(state, {
    type: "UPDATE_LAYOUT",
    payload: { heroStyle: "portrait" },
  });

  // Verify changes
  assert.equal(state.theme.font, "grotesk");
  assert.equal(state.layout.heroStyle, "portrait");
  assert.equal(state.isDirty, true);
  assert.equal(state.siteId, "existing-site-456"); // Site ID preserved
});

test("wizard flow: auto-save status transitions", () => {
  let state = createInitialState();
  state = wizardReducer(state, { type: "SET_SITE_ID", siteId: "site-789" });

  // Make change
  state = wizardReducer(state, { type: "UPDATE_THEME", payload: { font: "mono" } });
  assert.equal(state.isDirty, true);
  assert.equal(state.autoSaveStatus, "idle");

  // Auto-save starts
  state = wizardReducer(state, { type: "SET_AUTO_SAVE_STATUS", status: "saving" });
  assert.equal(state.autoSaveStatus, "saving");

  // Auto-save completes
  state = wizardReducer(state, { type: "SET_AUTO_SAVE_STATUS", status: "saved" });
  state = wizardReducer(state, { type: "SET_LAST_SAVED", date: new Date() });
  state = wizardReducer(state, { type: "SET_DIRTY", dirty: false });
  assert.equal(state.autoSaveStatus, "saved");
  assert.ok(state.lastSaved);
  assert.equal(state.isDirty, false);
});

test("wizard flow: auto-save error recovery", () => {
  let state = createInitialState();
  state = wizardReducer(state, { type: "SET_SITE_ID", siteId: "site-error" });

  // Make change
  state = wizardReducer(state, { type: "UPDATE_CONTENT", payload: { title: "Test" } });
  state = wizardReducer(state, { type: "SET_AUTO_SAVE_STATUS", status: "saving" });

  // Save fails
  state = wizardReducer(state, { type: "SET_AUTO_SAVE_STATUS", status: "error" });
  assert.equal(state.autoSaveStatus, "error");
  assert.equal(state.isDirty, true); // Still dirty since save failed

  // Retry and succeed
  state = wizardReducer(state, { type: "SET_AUTO_SAVE_STATUS", status: "saving" });
  state = wizardReducer(state, { type: "SET_AUTO_SAVE_STATUS", status: "saved" });
  state = wizardReducer(state, { type: "SET_DIRTY", dirty: false });
  assert.equal(state.autoSaveStatus, "saved");
  assert.equal(state.isDirty, false);
});

test("wizard flow: RESET action clears all state", () => {
  let state = createInitialState();

  // Populate state
  state = wizardReducer(state, { type: "UPDATE_AVATAR", avatarUrl: "avatar.jpg" });
  state = wizardReducer(state, { type: "UPDATE_THEME", payload: { font: "editorial", background: "#000" } });
  state = wizardReducer(state, { type: "UPDATE_LAYOUT", payload: { heroStyle: "portrait" } });
  state = wizardReducer(state, { type: "UPDATE_CONTENT", payload: { title: "Test Title" } });
  state = wizardReducer(state, { type: "SET_SITE_ID", siteId: "site-to-reset" });
  state = wizardReducer(state, { type: "SET_STATUS", status: "published" });

  // Reset
  state = wizardReducer(state, { type: "RESET" });

  // Verify all back to defaults
  const fresh = createInitialState();
  assert.deepEqual(state, fresh);
});

// ==========================================
// Data Flow Tests
// ==========================================

test("buildSiteData generates correct output for minimal layout", () => {
  const state = createInitialState();
  state.content.title = "Test Tutor";
  state.content.subtitle = "Language Expert";
  state.theme.background = "#FFFFFF";
  state.theme.primary = "#1F2937";
  state.theme.font = "system";
  state.layout.heroStyle = "minimal";
  state.pages.selectedServiceIds = ["svc-1"];
  state.faq = [{ q: "Test?", a: "Yes" }];

  const data = buildSiteData(state, { username: "testtutor" });

  assert.equal(data.about_title, "Test Tutor");
  assert.equal(data.about_subtitle, "Language Expert");
  assert.equal(data.theme_background, "#FFFFFF");
  assert.equal(data.theme_primary, "#1F2937");
  assert.equal(data.theme_font, "system");
  assert.equal(data.hero_layout, "minimal");
  assert.deepEqual(data.services, ["svc-1"]);
  assert.equal(data.show_faq, true);
  assert.equal(data.booking_cta_url, "/book/testtutor");
});

test("buildSiteData generates correct output for portrait layout", () => {
  const state = createInitialState();
  state.layout.heroStyle = "portrait";
  state.theme.font = "editorial";
  state.faq = []; // No FAQ

  const data = buildSiteData(state);

  assert.equal(data.hero_layout, "portrait");
  assert.equal(data.theme_font, "editorial");
  assert.equal(data.show_faq, false);
});

test("buildSiteData uses stripe_payment_link when available", () => {
  const state = createInitialState();
  const data = buildSiteData(state, {
    username: "testuser",
    stripe_payment_link: "https://stripe.com/pay/xxx",
  });

  assert.equal(data.booking_cta_url, "https://stripe.com/pay/xxx");
});

test("buildSiteData handles all 10 fonts correctly", () => {
  const fonts: FontOption[] = [
    "system", "rounded", "tech", "serif", "luxury",
    "grotesk", "humanist", "editorial", "playful", "mono",
  ];

  for (const font of fonts) {
    const state = createInitialState();
    state.theme.font = font;
    const data = buildSiteData(state);
    assert.equal(data.theme_font, font);
  }
});

test("buildSiteData only allows minimal or portrait hero_layout", () => {
  const validLayouts: HeroStyle[] = ["minimal", "portrait"];

  for (const layout of validLayouts) {
    const state = createInitialState();
    state.layout.heroStyle = layout;
    const data = buildSiteData(state);
    assert.equal(data.hero_layout, layout);
  }
});

// ==========================================
// Sequential Action Tests
// ==========================================

test("multiple rapid theme changes produce correct final state", () => {
  const actions: WizardAction[] = [
    { type: "UPDATE_THEME", payload: { font: "rounded" } },
    { type: "UPDATE_THEME", payload: { background: "#000" } },
    { type: "UPDATE_THEME", payload: { primary: "#fff" } },
    { type: "UPDATE_THEME", payload: { font: "mono" } },
    { type: "UPDATE_THEME", payload: { font: "editorial" } },
  ];

  const finalState = applyActions(createInitialState(), actions);

  assert.equal(finalState.theme.font, "editorial");
  assert.equal(finalState.theme.background, "#000");
  assert.equal(finalState.theme.primary, "#fff");
});

test("layout toggle between minimal and portrait", () => {
  const actions: WizardAction[] = [
    { type: "UPDATE_LAYOUT", payload: { heroStyle: "portrait" } },
    { type: "UPDATE_LAYOUT", payload: { heroStyle: "minimal" } },
    { type: "UPDATE_LAYOUT", payload: { heroStyle: "portrait" } },
  ];

  const finalState = applyActions(createInitialState(), actions);
  assert.equal(finalState.layout.heroStyle, "portrait");
});

test("content updates preserve unrelated fields", () => {
  const actions: WizardAction[] = [
    { type: "UPDATE_CONTENT", payload: { title: "First Title" } },
    { type: "UPDATE_CONTENT", payload: { subtitle: "First Subtitle" } },
    { type: "UPDATE_CONTENT", payload: { body: "Body text" } },
    { type: "UPDATE_CONTENT", payload: { title: "Updated Title" } },
  ];

  const finalState = applyActions(createInitialState(), actions);

  assert.equal(finalState.content.title, "Updated Title");
  assert.equal(finalState.content.subtitle, "First Subtitle");
  assert.equal(finalState.content.body, "Body text");
});

test("FAQ updates replace entire array", () => {
  const actions: WizardAction[] = [
    { type: "UPDATE_FAQ", payload: [{ q: "Q1", a: "A1" }] },
    { type: "UPDATE_FAQ", payload: [{ q: "Q2", a: "A2" }, { q: "Q3", a: "A3" }] },
  ];

  const finalState = applyActions(createInitialState(), actions);

  assert.equal(finalState.faq.length, 2);
  assert.equal(finalState.faq[0].q, "Q2");
  assert.equal(finalState.faq[1].q, "Q3");
});

// ==========================================
// Pages Configuration Tests
// ==========================================

test("pages configuration toggles work independently", () => {
  let state = createInitialState();

  // Toggle off lessons
  state = wizardReducer(state, { type: "UPDATE_PAGES", payload: { showLessons: false } });
  assert.equal(state.pages.showLessons, false);
  assert.equal(state.pages.showReviews, true); // Unchanged
  assert.equal(state.pages.showBooking, true); // Unchanged

  // Toggle off reviews
  state = wizardReducer(state, { type: "UPDATE_PAGES", payload: { showReviews: false } });
  assert.equal(state.pages.showLessons, false);
  assert.equal(state.pages.showReviews, false);
  assert.equal(state.pages.showBooking, true);

  // Toggle lessons back on
  state = wizardReducer(state, { type: "UPDATE_PAGES", payload: { showLessons: true } });
  assert.equal(state.pages.showLessons, true);
  assert.equal(state.pages.showReviews, false);
});

test("social icons can be configured for header and footer independently", () => {
  let state = createInitialState();

  // Default: header off, footer on
  assert.equal(state.pages.socialIconsHeader, false);
  assert.equal(state.pages.socialIconsFooter, true);

  // Enable header
  state = wizardReducer(state, { type: "UPDATE_PAGES", payload: { socialIconsHeader: true } });
  assert.equal(state.pages.socialIconsHeader, true);
  assert.equal(state.pages.socialIconsFooter, true);

  // Disable footer
  state = wizardReducer(state, { type: "UPDATE_PAGES", payload: { socialIconsFooter: false } });
  assert.equal(state.pages.socialIconsHeader, true);
  assert.equal(state.pages.socialIconsFooter, false);
});

test("service selection updates correctly", () => {
  let state = createInitialState();

  // Add services
  state = wizardReducer(state, {
    type: "UPDATE_PAGES",
    payload: { selectedServiceIds: ["svc-1", "svc-2", "svc-3"] },
  });
  assert.deepEqual(state.pages.selectedServiceIds, ["svc-1", "svc-2", "svc-3"]);

  // Remove one service
  state = wizardReducer(state, {
    type: "UPDATE_PAGES",
    payload: { selectedServiceIds: ["svc-1", "svc-3"] },
  });
  assert.deepEqual(state.pages.selectedServiceIds, ["svc-1", "svc-3"]);

  // Clear all services
  state = wizardReducer(state, {
    type: "UPDATE_PAGES",
    payload: { selectedServiceIds: [] },
  });
  assert.deepEqual(state.pages.selectedServiceIds, []);
});

// ==========================================
// Gallery Images Tests
// ==========================================

test("gallery images can be added", () => {
  let state = createInitialState();

  state = wizardReducer(state, {
    type: "UPDATE_CONTENT",
    payload: { galleryImages: ["img1.jpg", "img2.jpg"] },
  });

  assert.deepEqual(state.content.galleryImages, ["img1.jpg", "img2.jpg"]);
});

test("gallery images can be reordered", () => {
  let state = createInitialState();

  state = wizardReducer(state, {
    type: "UPDATE_CONTENT",
    payload: { galleryImages: ["img1.jpg", "img2.jpg", "img3.jpg"] },
  });

  // Reorder
  state = wizardReducer(state, {
    type: "UPDATE_CONTENT",
    payload: { galleryImages: ["img3.jpg", "img1.jpg", "img2.jpg"] },
  });

  assert.deepEqual(state.content.galleryImages, ["img3.jpg", "img1.jpg", "img2.jpg"]);
});

test("gallery images can be removed", () => {
  let state = createInitialState();

  state = wizardReducer(state, {
    type: "UPDATE_CONTENT",
    payload: { galleryImages: ["img1.jpg", "img2.jpg", "img3.jpg"] },
  });

  // Remove middle image
  state = wizardReducer(state, {
    type: "UPDATE_CONTENT",
    payload: { galleryImages: ["img1.jpg", "img3.jpg"] },
  });

  assert.deepEqual(state.content.galleryImages, ["img1.jpg", "img3.jpg"]);
});
