/**
 * Scraper Factory
 *
 * Routes scrape requests to the correct platform-specific scraper.
 * Each scraper returns a normalised profile or an error.
 */

import type { Platform, ScrapeResult, PlatformScraper } from "../types";
import { italkiScraper } from "./italki";
import { preplyScraper } from "./preply";
import { verblingScraper } from "./verbling";

// ── Registry ─────────────────────────────────────────────────────────

const SCRAPERS: Record<string, PlatformScraper> = {
  italki: italkiScraper,
  preply: preplyScraper,
  verbling: verblingScraper,
  // cambly, wyzant, superprof — to be added in Sprint 3/4
};

// ── Public API ───────────────────────────────────────────────────────

export function getScraper(platform: Platform): PlatformScraper | null {
  return SCRAPERS[platform] || null;
}

export function isSupportedForScraping(platform: Platform): boolean {
  return platform in SCRAPERS;
}

export async function scrapeProfile(
  platform: Platform,
  url: string,
  platformId: string
): Promise<ScrapeResult> {
  const scraper = SCRAPERS[platform];

  if (!scraper) {
    return {
      ok: false,
      error: `Platform "${platform}" is not yet supported for import. Supported: ${Object.keys(SCRAPERS).join(", ")}`,
      retryable: false,
    };
  }

  return scraper.scrape(url, platformId);
}

export { italkiScraper, preplyScraper, verblingScraper };
