export type ThemeArchetype = "professional" | "immersion" | "academic" | "polyglot" | "modernist" | "naturalist";

export type SiteThemeDefinition = {
  fontHeading: string;
  fontBody: string;
  bgPage: string;
  radiusCard: string;
  accentColor: string;
};

export const SITE_THEMES: Record<ThemeArchetype, SiteThemeDefinition> = {
  professional: {
    fontHeading: "'Plus Jakarta Sans', sans-serif",
    fontBody: "'Inter', sans-serif",
    bgPage: "#FFFFFF",
    radiusCard: "0.5rem",
    accentColor: "#0F172A",
  },
  immersion: {
    fontHeading: "'DM Serif Display', serif",
    fontBody: "'Manrope', sans-serif",
    bgPage: "#FDF8F5",
    radiusCard: "1.5rem",
    accentColor: "#D36135",
  },
  academic: {
    fontHeading: "'Merriweather', serif",
    fontBody: "'Source Sans 3', sans-serif",
    bgPage: "#F5F5F4",
    radiusCard: "0.75rem",
    accentColor: "#44403C",
  },
  polyglot: {
    fontHeading: "'Space Grotesk', sans-serif",
    fontBody: "'DM Sans', sans-serif",
    bgPage: "#FAFAFA",
    radiusCard: "1rem",
    accentColor: "#000000",
  },
  modernist: {
    fontHeading: "'Inter', sans-serif",
    fontBody: "'Manrope', sans-serif",
    bgPage: "#FFFFFF",
    radiusCard: "1.5rem",
    accentColor: "#D36135",
  },
  naturalist: {
    fontHeading: "'DM Serif Display', serif",
    fontBody: "'Manrope', sans-serif",
    bgPage: "#F7F2EC",
    radiusCard: "1.25rem",
    accentColor: "#3E5641",
  },
};

export type SiteThemeId = keyof typeof SITE_THEMES;
