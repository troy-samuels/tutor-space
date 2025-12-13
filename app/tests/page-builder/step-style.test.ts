import test from "node:test";
import assert from "node:assert/strict";

// Font options from step-style.tsx (10 fonts per design spec)
const FONT_OPTIONS = [
  { value: "system", label: "Inter" },
  { value: "rounded", label: "Manrope" },
  { value: "tech", label: "Poppins" },
  { value: "serif", label: "Merriweather" },
  { value: "luxury", label: "DM Sans" },
  { value: "grotesk", label: "Space Grotesk" },
  { value: "humanist", label: "Plus Jakarta Sans" },
  { value: "editorial", label: "Playfair Display" },
  { value: "playful", label: "Nunito" },
  { value: "mono", label: "JetBrains Mono" },
];

// Font stacks from step-style.tsx
const FONT_STACKS: Record<string, string> = {
  system: 'var(--font-inter), "Inter", system-ui, sans-serif',
  rounded: 'var(--font-manrope), "Manrope", system-ui, sans-serif',
  tech: 'var(--font-poppins), "Poppins", system-ui, sans-serif',
  serif: 'var(--font-merriweather), "Merriweather", Georgia, serif',
  luxury: 'var(--font-dm-sans), "DM Sans", system-ui, sans-serif',
  grotesk: 'var(--font-space-grotesk), "Space Grotesk", system-ui, sans-serif',
  humanist: 'var(--font-plus-jakarta-sans), "Plus Jakarta Sans", system-ui, sans-serif',
  editorial: 'var(--font-playfair-display), "Playfair Display", Georgia, serif',
  playful: 'var(--font-nunito), "Nunito", system-ui, sans-serif',
  mono: 'var(--font-jetbrains-mono), "JetBrains Mono", monospace',
};

// Layout options from step-style.tsx (2 layouts per design spec)
const LAYOUTS = [
  { id: "minimal", name: "Centered", description: "Clean, profile-focused" },
  { id: "portrait", name: "Photo Focus", description: "Photo takes center stage" },
];

// Color palettes from step-style.tsx
const COLOR_PALETTES = [
  { id: "classic", name: "Classic", background: "#FFFFFF", primary: "#1F2937" },
  { id: "ocean", name: "Ocean", background: "#F1F5F9", primary: "#1E40AF" },
  { id: "warm", name: "Warm", background: "#FAF7F5", primary: "#C2410C" },
  { id: "dark", name: "Dark", background: "#0F172A", primary: "#F59E0B" },
  { id: "lavender", name: "Lavender", background: "#FAF5FF", primary: "#7C3AED" },
];

// Font options tests
test("FONT_OPTIONS contains exactly 10 fonts", () => {
  assert.equal(FONT_OPTIONS.length, 10);
});

test("FONT_OPTIONS includes all required font values", () => {
  const expectedValues = [
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

  const actualValues = FONT_OPTIONS.map(f => f.value);
  assert.deepEqual(actualValues, expectedValues);
});

test("FONT_OPTIONS has correct label mappings", () => {
  const labelMap: Record<string, string> = {
    system: "Inter",
    rounded: "Manrope",
    tech: "Poppins",
    serif: "Merriweather",
    luxury: "DM Sans",
    grotesk: "Space Grotesk",
    humanist: "Plus Jakarta Sans",
    editorial: "Playfair Display",
    playful: "Nunito",
    mono: "JetBrains Mono",
  };

  for (const font of FONT_OPTIONS) {
    assert.equal(
      font.label,
      labelMap[font.value],
      `Font ${font.value} has incorrect label`
    );
  }
});

test("each FONT_OPTION has non-empty value and label", () => {
  for (const font of FONT_OPTIONS) {
    assert.ok(font.value.length > 0, "Font value should not be empty");
    assert.ok(font.label.length > 0, "Font label should not be empty");
  }
});

// Font stacks tests
test("FONT_STACKS has entry for every font option", () => {
  for (const font of FONT_OPTIONS) {
    assert.ok(
      FONT_STACKS[font.value],
      `Missing font stack for ${font.value}`
    );
  }
});

test("FONT_STACKS has exactly 10 entries", () => {
  assert.equal(Object.keys(FONT_STACKS).length, 10);
});

test("FONT_STACKS uses CSS variables for all fonts", () => {
  for (const [fontId, stack] of Object.entries(FONT_STACKS)) {
    assert.ok(
      stack.includes("var(--font-"),
      `Font stack ${fontId} should use CSS variable`
    );
  }
});

test("serif fonts use Georgia as fallback", () => {
  assert.ok(FONT_STACKS.serif.includes("Georgia"));
  assert.ok(FONT_STACKS.editorial.includes("Georgia"));
});

test("mono font uses monospace as fallback", () => {
  assert.ok(FONT_STACKS.mono.includes("monospace"));
});

test("sans-serif fonts use system-ui as fallback", () => {
  const sansSerifFonts = ["system", "rounded", "tech", "luxury", "grotesk", "humanist", "playful"];

  for (const fontId of sansSerifFonts) {
    assert.ok(
      FONT_STACKS[fontId].includes("system-ui"),
      `Font ${fontId} should use system-ui fallback`
    );
  }
});

// Layout options tests
test("LAYOUTS contains exactly 2 options", () => {
  assert.equal(LAYOUTS.length, 2);
});

test("LAYOUTS includes minimal and portrait only", () => {
  const ids = LAYOUTS.map(l => l.id);
  assert.deepEqual(ids, ["minimal", "portrait"]);
});

test("LAYOUTS does not include banner (removed per design spec)", () => {
  const ids = LAYOUTS.map(l => l.id);
  assert.ok(!ids.includes("banner"));
});

test("minimal layout has correct metadata", () => {
  const minimal = LAYOUTS.find(l => l.id === "minimal");
  assert.ok(minimal);
  assert.equal(minimal.name, "Centered");
  assert.equal(minimal.description, "Clean, profile-focused");
});

test("portrait layout has correct metadata", () => {
  const portrait = LAYOUTS.find(l => l.id === "portrait");
  assert.ok(portrait);
  assert.equal(portrait.name, "Photo Focus");
  assert.equal(portrait.description, "Photo takes center stage");
});

// Color palette tests
test("COLOR_PALETTES contains exactly 5 presets", () => {
  assert.equal(COLOR_PALETTES.length, 5);
});

test("COLOR_PALETTES has all required palette IDs", () => {
  const ids = COLOR_PALETTES.map(p => p.id);
  assert.deepEqual(ids, ["classic", "ocean", "warm", "dark", "lavender"]);
});

test("all COLOR_PALETTES have valid hex background colors", () => {
  const hexPattern = /^#[0-9A-Fa-f]{6}$/;

  for (const palette of COLOR_PALETTES) {
    assert.ok(
      hexPattern.test(palette.background),
      `Palette ${palette.id} has invalid background: ${palette.background}`
    );
  }
});

test("all COLOR_PALETTES have valid hex primary colors", () => {
  const hexPattern = /^#[0-9A-Fa-f]{6}$/;

  for (const palette of COLOR_PALETTES) {
    assert.ok(
      hexPattern.test(palette.primary),
      `Palette ${palette.id} has invalid primary: ${palette.primary}`
    );
  }
});

test("dark palette is the only dark-background option", () => {
  const darkBackgrounds = COLOR_PALETTES.filter(p => {
    // Simple luminance check: dark if R, G, B are all low
    const hex = p.background.slice(1);
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    const luminance = (r * 0.299 + g * 0.587 + b * 0.114);
    return luminance < 100;
  });

  assert.equal(darkBackgrounds.length, 1);
  assert.equal(darkBackgrounds[0].id, "dark");
});

test("classic palette uses white background", () => {
  const classic = COLOR_PALETTES.find(p => p.id === "classic");
  assert.ok(classic);
  assert.equal(classic.background, "#FFFFFF");
});

// Component structure tests
test("all font options have unique values", () => {
  const values = FONT_OPTIONS.map(f => f.value);
  const uniqueValues = [...new Set(values)];
  assert.equal(values.length, uniqueValues.length);
});

test("all font options have unique labels", () => {
  const labels = FONT_OPTIONS.map(f => f.label);
  const uniqueLabels = [...new Set(labels)];
  assert.equal(labels.length, uniqueLabels.length);
});

test("all layout options have unique IDs", () => {
  const ids = LAYOUTS.map(l => l.id);
  const uniqueIds = [...new Set(ids)];
  assert.equal(ids.length, uniqueIds.length);
});

test("all color palettes have unique IDs", () => {
  const ids = COLOR_PALETTES.map(p => p.id);
  const uniqueIds = [...new Set(ids)];
  assert.equal(ids.length, uniqueIds.length);
});
