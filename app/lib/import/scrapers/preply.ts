/**
 * Preply Profile Scraper
 *
 * Preply uses Cloudflare protection + heavy client-side rendering.
 *
 * Strategy A (primary): Extract JSON-LD structured data from server-rendered HTML.
 *   Profile pages include <script type="application/ld+json"> with:
 *   - name, description, image, aggregateRating
 *   This gets ~70% of fields.
 *
 * Strategy B (fallback): Parse meta tags + visible HTML for additional data.
 *
 * Note: Full browser-based scraping is handled separately via Clawdbot browser
 * automation for cases where JSON-LD is insufficient.
 */

import type {
  NormalisedProfile,
  NormalisedService,
  ScrapeResult,
  PlatformScraper,
} from "../types";

const REQUEST_TIMEOUT_MS = 15_000;

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-GB,en;q=0.9",
};

// ── HTML fetcher ─────────────────────────────────────────────────────

async function fetchHtml(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: HEADERS,
      signal: controller.signal,
      redirect: "follow",
    });

    const body = await response.text();

    // Detect Cloudflare challenge
    if (
      body.includes("Just a moment") ||
      body.includes("cf_chl") ||
      body.includes("Checking your browser")
    ) {
      throw new Error("CLOUDFLARE_BLOCKED");
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return body;
  } finally {
    clearTimeout(timeout);
  }
}

// ── JSON-LD extractor ────────────────────────────────────────────────

type JsonLdPerson = {
  "@type"?: string;
  name?: string;
  description?: string;
  image?: string | { url?: string };
  aggregateRating?: {
    ratingValue?: number;
    reviewCount?: number;
    bestRating?: number;
  };
  address?: {
    addressCountry?: string;
    addressLocality?: string;
  };
  jobTitle?: string;
  knowsLanguage?: string | string[];
  url?: string;
};

function extractJsonLd(html: string): JsonLdPerson | null {
  const pattern =
    /<script\s+type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(html)) !== null) {
    try {
      const data = JSON.parse(match[1]);

      // Could be an array or single object
      const items = Array.isArray(data) ? data : [data];
      for (const item of items) {
        if (
          item["@type"] === "Person" ||
          item["@type"] === "Tutor" ||
          item["@type"] === "LocalBusiness"
        ) {
          return item as JsonLdPerson;
        }
      }
    } catch {
      // Malformed JSON-LD, try next
      continue;
    }
  }

  return null;
}

// ── Meta tag extractor ───────────────────────────────────────────────

function extractMeta(html: string, property: string): string | null {
  // og: and twitter: meta tags
  const patterns = [
    new RegExp(
      `<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']`,
      "i"
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property}["']`,
      "i"
    ),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return match[1];
  }

  return null;
}

// ── Price extractor (from HTML) ──────────────────────────────────────

function extractPrices(html: string): NormalisedService[] {
  const services: NormalisedService[] = [];

  // Preply shows prices like "$12" or "From $8" in the HTML
  // Look for structured price patterns
  const pricePattern = /(?:From\s+)?\$(\d+(?:\.\d{2})?)\s*(?:\/\s*(?:(\d+)\s*min|hour|lesson))?/gi;
  let priceMatch: RegExpExecArray | null;
  const seenPrices = new Set<string>();

  while ((match = pricePattern.exec(html)) !== null) {
    const price = match[1];
    if (seenPrices.has(price)) continue;
    seenPrices.add(price);

    const priceInCents = Math.round(parseFloat(price) * 100);
    const duration = match[2] ? parseInt(match[2]) : 50; // Preply default is 50min

    if (priceInCents > 0 && priceInCents < 50000) {
      // Sanity check
      services.push({
        name:
          priceInCents < 1000
            ? "Trial Lesson"
            : `${duration}-Minute Lesson`,
        description: null,
        durationMinutes: duration,
        priceAmount: priceInCents,
        currency: "USD",
        offerType: priceInCents < 1000 ? "trial" : "one_off",
      });
    }
  }

  // Deduplicate by price
  const unique = services.filter(
    (s, i, arr) =>
      arr.findIndex((o) => o.priceAmount === s.priceAmount) === i
  );

  return unique.slice(0, 5);
}

// ── Normaliser ───────────────────────────────────────────────────────
// Variable needed for regex exec loop
let match: RegExpExecArray | null;

function normalisePreplyProfile(
  profileId: string,
  sourceUrl: string,
  html: string
): NormalisedProfile {
  const jsonLd = extractJsonLd(html);
  const ogTitle = extractMeta(html, "og:title");
  const ogDescription = extractMeta(html, "og:description");
  const ogImage = extractMeta(html, "og:image");

  // Name: prefer JSON-LD, fall back to og:title
  const displayName =
    jsonLd?.name ||
    (ogTitle ? ogTitle.replace(/\s*[-|].*$/, "").trim() : null) ||
    `Preply Tutor ${profileId}`;

  // Bio
  const bio =
    jsonLd?.description || ogDescription || null;

  // Avatar
  let avatarUrl: string | null = null;
  if (jsonLd?.image) {
    avatarUrl =
      typeof jsonLd.image === "string"
        ? jsonLd.image
        : jsonLd.image.url || null;
  }
  if (!avatarUrl) avatarUrl = ogImage || null;

  // Rating
  const rating = jsonLd?.aggregateRating?.ratingValue ?? null;
  const reviewCount = jsonLd?.aggregateRating?.reviewCount ?? null;

  // Country
  const country = jsonLd?.address?.addressCountry ?? null;
  const city = jsonLd?.address?.addressLocality ?? null;

  // Headline
  const headline = jsonLd?.jobTitle || null;

  // Languages
  const languagesTaught = [];
  if (jsonLd?.knowsLanguage) {
    const langs = Array.isArray(jsonLd.knowsLanguage)
      ? jsonLd.knowsLanguage
      : [jsonLd.knowsLanguage];
    for (const lang of langs) {
      languagesTaught.push({
        language: lang,
        nativeLevel: false,
        proficiencyLevel: null,
      });
    }
  }

  // Services from price extraction
  const services = extractPrices(html);

  return {
    displayName,
    headline,
    bio,
    avatarUrl,

    languagesTaught,
    subjects: [],

    rating,
    reviewCount,
    totalStudents: null,
    totalLessons: null,
    reviews: [], // Preply doesn't expose reviews in HTML easily

    services,

    introVideoUrl: null,
    galleryImages: [],

    certifications: [],
    education: [],
    yearsExperience: null,

    timezone: null,
    country,
    city,

    websiteUrl: null,
    socialLinks: [],

    platform: "preply",
    platformProfileId: profileId,
    sourceUrl,
    scrapedAt: new Date().toISOString(),
  };
}

// ── Public scraper ───────────────────────────────────────────────────

export const preplyScraper: PlatformScraper = {
  platform: "preply",

  async scrape(url: string, platformId: string): Promise<ScrapeResult> {
    try {
      const html = await fetchHtml(url);

      const profile = normalisePreplyProfile(platformId, url, html);

      // Check if we got meaningful data
      const hasData = profile.displayName !== `Preply Tutor ${platformId}` || profile.bio;
      if (!hasData) {
        return {
          ok: false,
          error:
            "Could not extract profile data from Preply. The page may require browser rendering.",
          retryable: true,
        };
      }

      return {
        ok: true,
        profile,
        raw: {
          jsonLd: extractJsonLd(html),
          ogTitle: extractMeta(html, "og:title"),
          ogDescription: extractMeta(html, "og:description"),
          htmlLength: html.length,
        },
      };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : String(err);

      if (message === "CLOUDFLARE_BLOCKED") {
        return {
          ok: false,
          error:
            "Preply is protected by Cloudflare. Try again in a few minutes, or we can import manually.",
          retryable: true,
        };
      }

      return {
        ok: false,
        error: `Preply scrape failed: ${message}`,
        retryable:
          message.includes("429") ||
          message.includes("503") ||
          message.includes("Timeout"),
      };
    }
  },
};
