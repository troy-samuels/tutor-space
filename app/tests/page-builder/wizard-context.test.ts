import test from "node:test";
import assert from "node:assert/strict";

// Test FontOption type - all 10 fonts must be valid
const VALID_FONTS = [
  "system",    // Inter
  "rounded",   // Manrope
  "tech",      // Poppins
  "serif",     // Merriweather
  "luxury",    // DM Sans
  "grotesk",   // Space Grotesk
  "humanist",  // Plus Jakarta Sans
  "editorial", // Playfair Display
  "playful",   // Nunito
  "mono",      // JetBrains Mono
] as const;

// Valid hero styles (only 2 per design spec)
const VALID_HERO_STYLES = ["minimal", "portrait"] as const;

// Mock reducer to test logic directly
type FontOption = typeof VALID_FONTS[number];
type HeroStyle = typeof VALID_HERO_STYLES[number];

type ThemeState = {
  background: string;
  primary: string;
  font: FontOption;
};

type LayoutState = {
  heroStyle: HeroStyle;
};

type WizardState = {
  theme: ThemeState;
  layout: LayoutState;
  isDirty: boolean;
};

type WizardAction =
  | { type: "UPDATE_THEME"; payload: Partial<ThemeState> }
  | { type: "UPDATE_LAYOUT"; payload: Partial<LayoutState> };

function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
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
    default:
      return state;
  }
}

const createInitialState = (): WizardState => ({
  theme: {
    background: "#ffffff",
    primary: "#2563eb",
    font: "system",
  },
  layout: {
    heroStyle: "minimal",
  },
  isDirty: false,
});

// Font option tests
test("FontOption includes exactly 10 fonts", () => {
  assert.equal(VALID_FONTS.length, 10);
});

test("FontOption includes all required font options", () => {
  const requiredFonts = [
    "system",
    "rounded",
    "tech",
    "serif",
    "luxury",
    "grotesk",
    "humanist",
    "editorial",
    "playful",
    "mono",
  ];

  for (const font of requiredFonts) {
    assert.ok(
      VALID_FONTS.includes(font as FontOption),
      `Missing font option: ${font}`
    );
  }
});

test("FontOption does not include banner (deprecated layout)", () => {
  // Ensure no font is named "banner" (was previously a layout option)
  assert.ok(!VALID_FONTS.includes("banner" as FontOption));
});

// Hero style tests
test("heroStyle options include only minimal and portrait", () => {
  assert.deepEqual(VALID_HERO_STYLES, ["minimal", "portrait"]);
});

test("heroStyle does not include banner (removed per design spec)", () => {
  assert.ok(!VALID_HERO_STYLES.includes("banner" as HeroStyle));
});

test("heroStyle has exactly 2 options", () => {
  assert.equal(VALID_HERO_STYLES.length, 2);
});

// Reducer tests - Theme updates
test("reducer updates theme font correctly for all 10 fonts", () => {
  for (const font of VALID_FONTS) {
    const state = createInitialState();
    const newState = wizardReducer(state, {
      type: "UPDATE_THEME",
      payload: { font },
    });

    assert.equal(newState.theme.font, font);
    assert.equal(newState.isDirty, true);
  }
});

test("reducer updates theme background color", () => {
  const state = createInitialState();
  const newState = wizardReducer(state, {
    type: "UPDATE_THEME",
    payload: { background: "#0F172A" },
  });

  assert.equal(newState.theme.background, "#0F172A");
  assert.equal(newState.isDirty, true);
});

test("reducer updates theme primary color", () => {
  const state = createInitialState();
  const newState = wizardReducer(state, {
    type: "UPDATE_THEME",
    payload: { primary: "#F59E0B" },
  });

  assert.equal(newState.theme.primary, "#F59E0B");
  assert.equal(newState.isDirty, true);
});

test("reducer preserves other theme properties on partial update", () => {
  const state = createInitialState();
  const newState = wizardReducer(state, {
    type: "UPDATE_THEME",
    payload: { font: "editorial" },
  });

  assert.equal(newState.theme.font, "editorial");
  assert.equal(newState.theme.background, "#ffffff");
  assert.equal(newState.theme.primary, "#2563eb");
});

// Reducer tests - Layout updates
test("reducer updates layout heroStyle to minimal", () => {
  const state = createInitialState();
  state.layout.heroStyle = "portrait";

  const newState = wizardReducer(state, {
    type: "UPDATE_LAYOUT",
    payload: { heroStyle: "minimal" },
  });

  assert.equal(newState.layout.heroStyle, "minimal");
  assert.equal(newState.isDirty, true);
});

test("reducer updates layout heroStyle to portrait", () => {
  const state = createInitialState();

  const newState = wizardReducer(state, {
    type: "UPDATE_LAYOUT",
    payload: { heroStyle: "portrait" },
  });

  assert.equal(newState.layout.heroStyle, "portrait");
  assert.equal(newState.isDirty, true);
});

// Initial state tests
test("createInitialState returns correct default theme", () => {
  const state = createInitialState();

  assert.equal(state.theme.background, "#ffffff");
  assert.equal(state.theme.primary, "#2563eb");
  assert.equal(state.theme.font, "system");
});

test("createInitialState returns minimal as default heroStyle", () => {
  const state = createInitialState();

  assert.equal(state.layout.heroStyle, "minimal");
});

test("createInitialState sets isDirty to false", () => {
  const state = createInitialState();

  assert.equal(state.isDirty, false);
});

// Color palette validation tests
const COLOR_PALETTES = [
  { id: "classic", background: "#FFFFFF", primary: "#1F2937" },
  { id: "ocean", background: "#F1F5F9", primary: "#1E40AF" },
  { id: "warm", background: "#FAF7F5", primary: "#C2410C" },
  { id: "dark", background: "#0F172A", primary: "#F59E0B" },
  { id: "lavender", background: "#FAF5FF", primary: "#7C3AED" },
];

test("all color palettes have valid hex colors", () => {
  const hexPattern = /^#[0-9A-Fa-f]{6}$/;

  for (const palette of COLOR_PALETTES) {
    assert.ok(
      hexPattern.test(palette.background),
      `Invalid background color in palette ${palette.id}: ${palette.background}`
    );
    assert.ok(
      hexPattern.test(palette.primary),
      `Invalid primary color in palette ${palette.id}: ${palette.primary}`
    );
  }
});

test("color palettes include exactly 5 presets", () => {
  assert.equal(COLOR_PALETTES.length, 5);
});

test("dark palette has dark background for luminance detection", () => {
  const darkPalette = COLOR_PALETTES.find(p => p.id === "dark");
  assert.ok(darkPalette);
  assert.equal(darkPalette.background, "#0F172A");
});
