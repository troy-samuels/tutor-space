export type SiteTheme = "professional" | "immersion" | "academic" | "polyglot" | "modernist" | "naturalist";

export type SiteBlockType = "hero" | "about" | "services" | "products" | "reviews" | "faq";

export type FAQItem = {
  q: string;  // Question (max 240 chars)
  a: string;  // Answer (max 2000 chars)
};

export interface SiteConfig {
  themeId: SiteTheme;
  bio?: string;
  location?: string; // e.g., "Barcelona, Spain"
  yearsExperience?: number; // e.g., 5
  faq?: FAQItem[];
  hero: {
    videoUrl?: string; // Optional "Living Portrait"
    posterUrl?: string; // Fallback image (from profile avatar usually)
    backgroundUrl?: string; // Optional cover background image
    coverImage?: string; // Top banner image (3:1 aspect, 1500x500px)
    customHeadline?: string;
  };
  servicesEnabled?: string[];
  productsEnabled?: string[];
  blocks: {
    id: string;
    type: SiteBlockType;
    isVisible: boolean;
    order: number;
  }[];
}
