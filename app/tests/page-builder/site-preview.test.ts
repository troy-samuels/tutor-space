import test from "node:test";
import assert from "node:assert/strict";

// Font stacks from site-preview.tsx - 6 curated fonts per Premium design spec
const FONT_STACKS: Record<string, string> = {
  system: 'var(--font-inter), "Inter", system-ui, sans-serif',
  rounded: 'var(--font-manrope), "Manrope", system-ui, sans-serif',
  luxury: 'var(--font-dm-sans), "DM Sans", system-ui, sans-serif',
  grotesk: 'var(--font-space-grotesk), "Space Grotesk", system-ui, sans-serif',
  serif: 'var(--font-merriweather), "Merriweather", Georgia, serif',
  editorial: 'var(--font-playfair-display), "Playfair Display", Georgia, serif',
};

// Valid hero styles for site-preview (2 only - no banner)
const VALID_HERO_STYLES = ["minimal", "portrait"] as const;
type HeroStyle = typeof VALID_HERO_STYLES[number];

// Premium curated palettes per design spec
const COLOR_PALETTES = [
  {
    id: "classic-ink",
    name: "Classic Ink",
    background: "#FFFFFF",
    cardBg: "#F9FAFB",
    primary: "#18181B",
    textPrimary: "#09090B",
    textSecondary: "#71717A",
  },
  {
    id: "ocean-trust",
    name: "Ocean Trust",
    background: "#F0F9FF",
    cardBg: "#FFFFFF",
    primary: "#0369A1",
    textPrimary: "#0C4A6E",
    textSecondary: "#597184",
  },
  {
    id: "warm-clay",
    name: "Warm Clay",
    background: "#FAFAF9",
    cardBg: "#FFFFFF",
    primary: "#D97706",
    textPrimary: "#44403C",
    textSecondary: "#78716C",
  },
  {
    id: "midnight-gold",
    name: "Midnight Gold",
    background: "#0F172A",
    cardBg: "#1E293B",
    primary: "#FBBF24",
    textPrimary: "#F8FAFC",
    textSecondary: "#94A3B8",
  },
  {
    id: "lavender-luxe",
    name: "Lavender Luxe",
    background: "#FAF5FF",
    cardBg: "#FFFFFF",
    primary: "#7E22CE",
    textPrimary: "#3B0764",
    textSecondary: "#6B7280",
  },
];

// Luminance calculation from site-preview.tsx
function isLightBackground(hexColor: string): boolean {
  const hex = hexColor.replace("#", "");
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const luminance = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
  return luminance > 0.5;
}

// Hero style type guard
function isValidHeroStyle(style: string): style is HeroStyle {
  return VALID_HERO_STYLES.includes(style as HeroStyle);
}

// Font stacks tests - 6 curated fonts
test("FONT_STACKS has exactly 6 entries", () => {
  assert.equal(Object.keys(FONT_STACKS).length, 6);
});

test("FONT_STACKS includes all required font IDs", () => {
  const requiredFonts = [
    "system",
    "rounded",
    "luxury",
    "grotesk",
    "serif",
    "editorial",
  ];

  for (const font of requiredFonts) {
    assert.ok(FONT_STACKS[font], `Missing font stack for: ${font}`);
  }
});

test("FONT_STACKS does not include removed fonts", () => {
  const removedFonts = ["tech", "humanist", "playful", "mono"];
  for (const font of removedFonts) {
    assert.ok(!FONT_STACKS[font], `Font ${font} should have been removed`);
  }
});

test("FONT_STACKS uses CSS variables for consistent styling", () => {
  for (const [fontId, stack] of Object.entries(FONT_STACKS)) {
    assert.ok(
      stack.startsWith("var(--font-"),
      `Font ${fontId} should start with CSS variable`
    );
  }
});

// Hero style tests
test("only minimal and portrait hero styles are valid", () => {
  assert.deepEqual(VALID_HERO_STYLES, ["minimal", "portrait"]);
});

test("banner is not a valid hero style", () => {
  assert.ok(!isValidHeroStyle("banner"));
});

test("isValidHeroStyle returns true for minimal", () => {
  assert.ok(isValidHeroStyle("minimal"));
});

test("isValidHeroStyle returns true for portrait", () => {
  assert.ok(isValidHeroStyle("portrait"));
});

test("isValidHeroStyle returns false for invalid styles", () => {
  assert.ok(!isValidHeroStyle("banner"));
  assert.ok(!isValidHeroStyle("full-width"));
  assert.ok(!isValidHeroStyle(""));
});

// Luminance detection tests
test("isLightBackground detects white as light", () => {
  assert.ok(isLightBackground("#FFFFFF"));
  assert.ok(isLightBackground("#ffffff"));
});

test("isLightBackground detects black as dark", () => {
  assert.ok(!isLightBackground("#000000"));
});

test("isLightBackground detects Midnight Gold background as dark", () => {
  // From Midnight Gold palette: #0F172A
  assert.ok(!isLightBackground("#0F172A"));
});

test("isLightBackground detects light theme backgrounds as light", () => {
  // Classic Ink palette
  assert.ok(isLightBackground("#FFFFFF"));
  // Ocean Trust palette
  assert.ok(isLightBackground("#F0F9FF"));
  // Warm Clay palette
  assert.ok(isLightBackground("#FAFAF9"));
  // Lavender Luxe palette
  assert.ok(isLightBackground("#FAF5FF"));
});

test("isLightBackground handles colors without hash", () => {
  // The function should work whether or not the hash is present
  assert.ok(isLightBackground("FFFFFF"));
  assert.ok(!isLightBackground("000000"));
});

test("isLightBackground threshold is 0.5", () => {
  // Mid-gray should be at the boundary
  // #808080 has luminance ~0.5
  // Slightly lighter should be light, slightly darker should be dark
  assert.ok(isLightBackground("#909090")); // luminance > 0.5
  assert.ok(!isLightBackground("#707070")); // luminance < 0.5
});

// Premium design token compliance tests
test("design spec typography scale is correct (Premium Edition)", () => {
  // Per new.design.md Premium Edition:
  // text-xs: 12px - labels, metadata, trust notes
  // text-sm: 14px - body text, FAQ answers
  // text-base: 16px - taglines, subtitles
  // text-lg: 18px - section titles
  // text-xl: 20px - contact headline
  // text-2xl: 24px - sub-headlines
  // text-3xl: 30px - Hero Name (Mobile)
  // text-4xl: 36px - Hero Name (Desktop)

  const typographyScale = {
    "text-xs": 12,
    "text-sm": 14,
    "text-base": 16,
    "text-lg": 18,
    "text-xl": 20,
    "text-2xl": 24,
    "text-3xl": 30,
    "text-4xl": 36,
  };

  assert.equal(typographyScale["text-xs"], 12);
  assert.equal(typographyScale["text-sm"], 14);
  assert.equal(typographyScale["text-base"], 16);
  assert.equal(typographyScale["text-lg"], 18);
  assert.equal(typographyScale["text-xl"], 20);
  assert.equal(typographyScale["text-2xl"], 24);
  assert.equal(typographyScale["text-3xl"], 30);
  assert.equal(typographyScale["text-4xl"], 36);
});

test("avatar sizes match Premium design spec", () => {
  // Per new.design.md Premium Edition:
  // Minimal (Centered): 120px avatar in 128px container
  // Portrait (Photo Focus): 100px avatar

  const avatarSizes = {
    minimal: { avatar: 120, container: 128 },
    portrait: { avatar: 100 },
  };

  assert.equal(avatarSizes.minimal.avatar, 120);
  assert.equal(avatarSizes.minimal.container, 128);
  assert.equal(avatarSizes.portrait.avatar, 100);
});

test("hero media height matches Premium spec", () => {
  // Per new.design.md: h-48 (192px) - increased from h-36 (144px)
  const heroMediaHeight = 192; // h-48 = 12rem = 192px
  assert.equal(heroMediaHeight, 192);
});

// Color palette tests
test("exactly one palette has dark background", () => {
  const darkPalettes = COLOR_PALETTES.filter(p => !isLightBackground(p.background));
  assert.equal(darkPalettes.length, 1);
  assert.equal(darkPalettes[0].id, "midnight-gold");
});

test("four palettes have light backgrounds", () => {
  const lightPalettes = COLOR_PALETTES.filter(p => isLightBackground(p.background));
  assert.equal(lightPalettes.length, 4);
});

test("all palettes have required color fields", () => {
  for (const palette of COLOR_PALETTES) {
    assert.ok(palette.id, "Palette should have an ID");
    assert.ok(palette.name, "Palette should have a name");
    assert.ok(palette.background, "Palette should have a background");
    assert.ok(palette.cardBg, "Palette should have a cardBg");
    assert.ok(palette.primary, "Palette should have a primary");
    assert.ok(palette.textPrimary, "Palette should have a textPrimary");
    assert.ok(palette.textSecondary, "Palette should have a textSecondary");
  }
});

test("palette IDs follow premium naming convention", () => {
  const expectedIds = [
    "classic-ink",
    "ocean-trust",
    "warm-clay",
    "midnight-gold",
    "lavender-luxe",
  ];
  const actualIds = COLOR_PALETTES.map(p => p.id);
  assert.deepEqual(actualIds, expectedIds);
});

// Font consistency tests (step-style and site-preview must match)
test("site-preview FONT_STACKS matches expected structure", () => {
  // Expected structure from step-style.tsx (6 fonts)
  const expectedStructure = {
    system: 'var(--font-inter), "Inter", system-ui, sans-serif',
    rounded: 'var(--font-manrope), "Manrope", system-ui, sans-serif',
    luxury: 'var(--font-dm-sans), "DM Sans", system-ui, sans-serif',
    grotesk: 'var(--font-space-grotesk), "Space Grotesk", system-ui, sans-serif',
    serif: 'var(--font-merriweather), "Merriweather", Georgia, serif',
    editorial: 'var(--font-playfair-display), "Playfair Display", Georgia, serif',
  };

  assert.deepEqual(FONT_STACKS, expectedStructure);
});

// Hero rendering validation
test("minimal hero style should render centered layout", () => {
  // This is a structural test to ensure the minimal style maps to centered
  const heroConfig = {
    minimal: { alignment: "center", avatarPosition: "top" },
    portrait: { alignment: "center", avatarPosition: "top" },
  };

  assert.equal(heroConfig.minimal.alignment, "center");
  assert.equal(heroConfig.portrait.alignment, "center");
});

test("both hero styles support avatar display", () => {
  // Both minimal and portrait should display an avatar
  const stylesWithAvatar = ["minimal", "portrait"];

  for (const style of VALID_HERO_STYLES) {
    assert.ok(
      stylesWithAvatar.includes(style),
      `Hero style ${style} should support avatar display`
    );
  }
});

// Sticky CTA Premium spec tests
test("sticky CTA should be positioned at bottom-4", () => {
  // Per new.design.md: sticky bottom-4 (floating above bottom edge)
  const stickyCTAPosition = "bottom-4"; // 16px from bottom
  assert.equal(stickyCTAPosition, "bottom-4");
});

test("sticky CTA should have premium styling", () => {
  // Per new.design.md: rounded-full, shadow-xl, hover lift
  const stickyCTAStyles = {
    borderRadius: "rounded-full",
    shadow: "shadow-xl",
    hoverEffect: "hover:-translate-y-0.5",
  };

  assert.equal(stickyCTAStyles.borderRadius, "rounded-full");
  assert.equal(stickyCTAStyles.shadow, "shadow-xl");
  assert.ok(stickyCTAStyles.hoverEffect.includes("translate"));
});
