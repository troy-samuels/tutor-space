import type { SiteBlockType, SiteConfig } from "@/lib/types/site";

export const DEFAULT_BLOCKS: Array<{ id: string; type: SiteBlockType; isVisible: boolean; order: number }> = [
  { id: "hero", type: "hero", isVisible: true, order: 0 },
  { id: "about", type: "about", isVisible: true, order: 1 },
  { id: "services", type: "services", isVisible: true, order: 2 },
  { id: "products", type: "products", isVisible: false, order: 3 },
  { id: "reviews", type: "reviews", isVisible: true, order: 4 },
  { id: "faq", type: "faq", isVisible: true, order: 5 },
];

export const DEFAULT_SITE_CONFIG: SiteConfig = {
  themeId: "modernist",
  hero: {
    customHeadline: "Build your Studio site in minutes.",
    posterUrl: "",
  },
  faq: [],
  blocks: DEFAULT_BLOCKS,
};

export function normalizeSiteConfig(raw: SiteConfig | null | undefined): SiteConfig {
  const base = raw ?? DEFAULT_SITE_CONFIG;
  const existing = base.blocks ?? [];
  const merged = DEFAULT_BLOCKS.map((block) => {
    const found = existing.find((b) => b.type === block.type);
    return found
      ? {
          id: found.id || block.id,
          type: found.type,
          isVisible: found.isVisible ?? block.isVisible,
          order: typeof found.order === "number" ? found.order : block.order,
        }
      : block;
  });

  return {
    themeId: base.themeId ?? DEFAULT_SITE_CONFIG.themeId,
    hero: {
      videoUrl: base.hero?.videoUrl,
      posterUrl: base.hero?.posterUrl,
      backgroundUrl: base.hero?.backgroundUrl,
      coverImage: base.hero?.coverImage,
      customHeadline: base.hero?.customHeadline ?? DEFAULT_SITE_CONFIG.hero.customHeadline,
    },
    servicesEnabled: base.servicesEnabled,
    productsEnabled: base.productsEnabled,
    bio: base.bio,
    faq: base.faq ?? [],
    blocks: merged.sort((a, b) => a.order - b.order),
  };
}

