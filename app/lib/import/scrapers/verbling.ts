/**
 * Verbling Profile Scraper
 *
 * Verbling uses Next.js. The __NEXT_DATA__ script tag contains the
 * full profile as JSON in pageProps. Simple fetch + parse.
 *
 * Fallback: extract from meta tags if __NEXT_DATA__ isn't present.
 */

import type {
  NormalisedProfile,
  NormalisedService,
  NormalisedReview,
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

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

// ── __NEXT_DATA__ extractor ──────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractNextData(html: string): any | null {
  const match = html.match(
    /<script\s+id="__NEXT_DATA__"\s+type="application\/json">([\s\S]*?)<\/script>/
  );

  if (!match?.[1]) return null;

  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

// ── Meta tag fallback ────────────────────────────────────────────────

function extractMeta(html: string, property: string): string | null {
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
    const m = html.match(pattern);
    if (m?.[1]) return m[1];
  }

  return null;
}

// ── Normaliser ───────────────────────────────────────────────────────

function normaliseVerblingProfile(
  profileId: string,
  sourceUrl: string,
  html: string
): NormalisedProfile {
  const nextData = extractNextData(html);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const teacher: any =
    nextData?.props?.pageProps?.teacher ||
    nextData?.props?.pageProps?.tutor ||
    null;

  if (teacher) {
    return normaliseFromNextData(profileId, sourceUrl, teacher);
  }

  // Fallback to meta tags
  return normaliseFromMeta(profileId, sourceUrl, html);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normaliseFromNextData(
  profileId: string,
  sourceUrl: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  teacher: any
): NormalisedProfile {
  const displayName =
    teacher.name || teacher.displayName || teacher.first_name || `Verbling Tutor`;

  // Languages
  const languagesTaught = (
    teacher.languages_taught ||
    teacher.teach_languages ||
    []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ).map((l: any) => ({
    language: l.name || l.language || String(l),
    nativeLevel: l.native === true || l.level === "native",
    proficiencyLevel: l.level || null,
  }));

  // Services
  const services: NormalisedService[] = [];
  const hourlyRate = teacher.price || teacher.hourlyRate || teacher.hourly_rate;
  if (hourlyRate) {
    const priceInCents =
      hourlyRate < 100 ? Math.round(hourlyRate * 100) : hourlyRate;
    services.push({
      name: "60-Minute Lesson",
      description: null,
      durationMinutes: 60,
      priceAmount: priceInCents,
      currency: "USD",
      offerType: "one_off",
    });
  }

  if (teacher.trial_price || teacher.trialPrice) {
    const trialPrice = teacher.trial_price || teacher.trialPrice;
    const trialCents =
      trialPrice < 100 ? Math.round(trialPrice * 100) : trialPrice;
    services.unshift({
      name: "Trial Lesson",
      description: null,
      durationMinutes: 30,
      priceAmount: trialCents,
      currency: "USD",
      offerType: "trial",
    });
  }

  // Reviews
  const reviews: NormalisedReview[] = (teacher.reviews || [])
    .slice(0, 15)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((r: any) => r.text || r.body || r.comment)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((r: any) => ({
      authorName: r.reviewer_name || r.student_name || r.author || "Student",
      text: (r.text || r.body || r.comment || "").trim(),
      rating: r.rating ?? r.star ?? null,
      date: r.created_at || r.date || null,
    }));

  return {
    displayName,
    headline: teacher.headline || teacher.tagline || null,
    bio: teacher.about || teacher.description || teacher.bio || null,
    avatarUrl: teacher.avatar_url || teacher.photo || teacher.image || null,

    languagesTaught,
    subjects: [],

    rating: teacher.rating ?? teacher.average_rating ?? null,
    reviewCount:
      teacher.review_count ?? teacher.numReviews ?? reviews.length,
    totalStudents:
      teacher.student_count ?? teacher.numStudents ?? null,
    totalLessons:
      teacher.lesson_count ?? teacher.numLessons ?? null,
    reviews,

    services,

    introVideoUrl: teacher.video_url || teacher.intro_video || null,
    galleryImages: [],

    certifications: teacher.certifications || [],
    education: teacher.education || [],
    yearsExperience: teacher.years_experience || null,

    timezone: teacher.timezone || null,
    country: teacher.country || null,
    city: teacher.city || null,

    websiteUrl: null,
    socialLinks: [],

    platform: "verbling",
    platformProfileId: profileId,
    sourceUrl,
    scrapedAt: new Date().toISOString(),
  };
}

function normaliseFromMeta(
  profileId: string,
  sourceUrl: string,
  html: string
): NormalisedProfile {
  const ogTitle = extractMeta(html, "og:title");
  const ogDescription = extractMeta(html, "og:description");
  const ogImage = extractMeta(html, "og:image");

  return {
    displayName: ogTitle
      ? ogTitle.replace(/\s*[-|–].*$/, "").trim()
      : `Verbling Tutor`,
    headline: null,
    bio: ogDescription || null,
    avatarUrl: ogImage || null,

    languagesTaught: [],
    subjects: [],

    rating: null,
    reviewCount: null,
    totalStudents: null,
    totalLessons: null,
    reviews: [],

    services: [],

    introVideoUrl: null,
    galleryImages: [],

    certifications: [],
    education: [],
    yearsExperience: null,

    timezone: null,
    country: null,
    city: null,

    websiteUrl: null,
    socialLinks: [],

    platform: "verbling",
    platformProfileId: profileId,
    sourceUrl,
    scrapedAt: new Date().toISOString(),
  };
}

// ── Public scraper ───────────────────────────────────────────────────

export const verblingScraper: PlatformScraper = {
  platform: "verbling",

  async scrape(url: string, platformId: string): Promise<ScrapeResult> {
    try {
      const html = await fetchHtml(url);

      const profile = normaliseVerblingProfile(platformId, url, html);

      // Check if we got meaningful data
      const hasData =
        profile.displayName !== "Verbling Tutor" || profile.bio;
      if (!hasData) {
        return {
          ok: false,
          error:
            "Could not extract profile data from Verbling. The page structure may have changed.",
          retryable: false,
        };
      }

      return {
        ok: true,
        profile,
        raw: {
          hasNextData: !!extractNextData(html),
          htmlLength: html.length,
        },
      };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : String(err);

      return {
        ok: false,
        error: `Verbling scrape failed: ${message}`,
        retryable:
          message.includes("429") ||
          message.includes("503") ||
          message.includes("Timeout"),
      };
    }
  },
};
