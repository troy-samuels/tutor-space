/**
 * iTalki Profile Scraper
 *
 * iTalki has a semi-public JSON API. This is the richest data source —
 * we get full profile info, courses with pricing, reviews, and video URLs.
 *
 * Endpoints:
 *   GET https://api.italki.com/api/teacher/{id}       → Full profile + courses
 *   GET https://api.italki.com/api/teacher/{id}/reviews → Student reviews
 *
 * Rate limit: ~1.5s delay between requests. No Cloudflare.
 */

import type {
  NormalisedProfile,
  NormalisedLanguage,
  NormalisedService,
  NormalisedReview,
  ScrapeResult,
  PlatformScraper,
} from "../types";

// ── iTalki API response shapes ───────────────────────────────────────

type ItalkiUserInfo = {
  user_id: number;
  nickname: string;
  avatar_url?: string;
  origin_country_id?: string;
  origin_city_name?: string;
  living_country_id?: string;
  living_city_name?: string;
  timezone?: string;
  is_pro?: boolean;
};

type ItalkiTeacherInfo = {
  about_me?: string;
  short_signature?: string;
  teaching_style?: string;
  overall_rating?: number;
  student_count?: number;
  session_count?: number;
  video_url?: string;
  teach_language?: Array<{
    language: number;
    language_name?: string;
    skill_level?: number;
  }>;
  also_speak?: Array<{
    language: number;
    language_name?: string;
    skill_level?: number;
  }>;
};

type ItalkiCourseInfo = {
  course_id?: number;
  title?: string;
  description?: string;
  lesson_type?: string; // 'trial' | 'regular' | etc.
  duration?: number; // minutes
  price_per_lesson?: number; // USD cents or raw amount (varies)
  price?: number;
  currency?: string;
};

type ItalkiTeacherStatistics = {
  finished_session?: number;
  attendance_rate?: number;
  response_rate?: number;
};

type ItalkiProfileResponse = {
  data?: {
    user_info?: ItalkiUserInfo;
    teacher_info?: ItalkiTeacherInfo;
    teacher_statistics?: ItalkiTeacherStatistics;
    course_info?: ItalkiCourseInfo[];
  };
  msg?: string;
};

type ItalkiReviewItem = {
  reviewer_name?: string;
  review_text?: string;
  star?: number;
  create_date?: string;
};

type ItalkiReviewsResponse = {
  data?: {
    reviews?: ItalkiReviewItem[];
    total_count?: number;
  };
};

// ── Constants ────────────────────────────────────────────────────────

const BASE_URL = "https://api.italki.com/api";
const REVIEW_LIMIT = 15; // Enough for page builder, avoids hammering API
const REQUEST_TIMEOUT_MS = 15_000;

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  Accept: "application/json",
  "Accept-Language": "en-GB,en;q=0.9",
};

// ── iTalki language ID → display name map (common ones) ──────────────

const ITALKI_LANGUAGE_MAP: Record<number, string> = {
  1: "English",
  2: "Chinese (Mandarin)",
  3: "Spanish",
  4: "French",
  5: "German",
  6: "Japanese",
  7: "Korean",
  8: "Italian",
  9: "Portuguese",
  10: "Russian",
  11: "Arabic",
  12: "Hindi",
  13: "Turkish",
  14: "Dutch",
  15: "Polish",
  16: "Swedish",
  17: "Greek",
  18: "Czech",
  19: "Danish",
  20: "Finnish",
  21: "Indonesian",
  22: "Thai",
  23: "Vietnamese",
  24: "Ukrainian",
  25: "Romanian",
  26: "Hebrew",
};

// ── Skill level mapping ──────────────────────────────────────────────

function mapSkillLevel(level: number | undefined): string | null {
  switch (level) {
    case 1:
      return "A1";
    case 2:
      return "A2";
    case 3:
      return "B1";
    case 4:
      return "B2";
    case 5:
      return "C1";
    case 6:
      return "C2";
    case 7:
      return "native";
    default:
      return null;
  }
}

// ── Fetch helper ─────────────────────────────────────────────────────

async function fetchJson<T>(url: string): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: HEADERS,
      signal: controller.signal,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(
        `HTTP ${response.status}: ${text.substring(0, 200)}`
      );
    }

    return (await response.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Profile fetcher ──────────────────────────────────────────────────

async function fetchProfile(
  profileId: string
): Promise<ItalkiProfileResponse> {
  return fetchJson<ItalkiProfileResponse>(
    `${BASE_URL}/teacher/${profileId}`
  );
}

// ── Reviews fetcher ──────────────────────────────────────────────────

async function fetchReviews(
  profileId: string
): Promise<ItalkiReviewsResponse> {
  return fetchJson<ItalkiReviewsResponse>(
    `${BASE_URL}/teacher/${profileId}/reviews?page=1&page_size=${REVIEW_LIMIT}`
  );
}

// ── Normaliser ───────────────────────────────────────────────────────

function normaliseProfile(
  profileId: string,
  sourceUrl: string,
  profileData: ItalkiProfileResponse,
  reviewsData: ItalkiReviewsResponse
): NormalisedProfile {
  const ui = profileData.data?.user_info;
  const ti = profileData.data?.teacher_info;
  const ts = profileData.data?.teacher_statistics;
  const courses = profileData.data?.course_info || [];

  if (!ui) {
    throw new Error("No user_info in iTalki response");
  }

  // Languages taught
  const languagesTaught: NormalisedLanguage[] = (
    ti?.teach_language || []
  ).map((lang) => ({
    language:
      lang.language_name ||
      ITALKI_LANGUAGE_MAP[lang.language] ||
      `Language ${lang.language}`,
    nativeLevel: lang.skill_level === 7,
    proficiencyLevel: mapSkillLevel(lang.skill_level),
  }));

  // Services from course_info
  const services: NormalisedService[] = courses
    .filter((c) => c.price_per_lesson || c.price)
    .map((course) => {
      const rawPrice = course.price_per_lesson || course.price || 0;
      // iTalki prices are in USD cents already for most endpoints
      const priceInCents =
        rawPrice < 100 ? Math.round(rawPrice * 100) : rawPrice;

      const isTrialLike =
        course.lesson_type === "trial" ||
        (course.title || "").toLowerCase().includes("trial") ||
        (course.duration && course.duration <= 30 && priceInCents < 1000);

      return {
        name: course.title || inferServiceName(course),
        description: course.description || null,
        durationMinutes: course.duration || 60,
        priceAmount: priceInCents,
        currency: course.currency || "USD",
        offerType: isTrialLike
          ? ("trial" as const)
          : ("one_off" as const),
      };
    });

  // Reviews
  const reviews: NormalisedReview[] = (
    reviewsData.data?.reviews || []
  )
    .filter((r) => r.review_text && r.review_text.trim().length > 10)
    .map((r) => ({
      authorName: r.reviewer_name || "Student",
      text: r.review_text!.trim(),
      rating: r.star ?? null,
      date: r.create_date || null,
    }));

  // Video URL — normalise YouTube URLs
  let introVideoUrl = ti?.video_url || null;
  if (introVideoUrl && !introVideoUrl.startsWith("http")) {
    introVideoUrl = `https://www.youtube.com/watch?v=${introVideoUrl}`;
  }

  // Build headline from short_signature or teaching style
  const headline =
    ti?.short_signature ||
    (ti?.teaching_style
      ? ti.teaching_style.substring(0, 120)
      : null);

  return {
    displayName: ui.nickname || `Teacher ${profileId}`,
    headline,
    bio: ti?.about_me || null,
    avatarUrl: ui.avatar_url || null,

    languagesTaught,
    subjects: extractSubjects(ti?.about_me, ti?.short_signature),

    rating: ti?.overall_rating ?? null,
    reviewCount: reviewsData.data?.total_count ?? reviews.length,
    totalStudents: ti?.student_count ?? null,
    totalLessons:
      ti?.session_count ?? ts?.finished_session ?? null,
    reviews,

    services,

    introVideoUrl,
    galleryImages: [],

    certifications: [],
    education: [],
    yearsExperience: null,

    timezone: ui.timezone || null,
    country: ui.living_country_id || ui.origin_country_id || null,
    city: ui.living_city_name || ui.origin_city_name || null,

    websiteUrl: null,
    socialLinks: introVideoUrl
      ? [{ platform: "youtube", url: introVideoUrl }]
      : [],

    platform: "italki",
    platformProfileId: String(ui.user_id || profileId),
    sourceUrl,
    scrapedAt: new Date().toISOString(),
  };
}

// ── Helpers ──────────────────────────────────────────────────────────

function inferServiceName(course: ItalkiCourseInfo): string {
  if (course.lesson_type === "trial") return "Trial Lesson";
  if (course.duration && course.duration <= 30) return "30-Minute Lesson";
  if (course.duration && course.duration === 45) return "45-Minute Lesson";
  return "60-Minute Lesson";
}

/**
 * Extract teaching subjects from bio/headline text.
 * Looks for common language teaching specialisations.
 */
function extractSubjects(
  bio: string | undefined,
  headline: string | undefined
): string[] {
  const text = `${bio || ""} ${headline || ""}`.toLowerCase();
  const subjects: string[] = [];

  const SUBJECT_PATTERNS: [RegExp, string][] = [
    [/\bielts\b/i, "IELTS"],
    [/\btoefl\b/i, "TOEFL"],
    [/\btoeic\b/i, "TOEIC"],
    [/\bdele\b/i, "DELE"],
    [/\bdelf\b/i, "DELF"],
    [/\bjlpt\b/i, "JLPT"],
    [/\btopik\b/i, "TOPIK"],
    [/\bhsk\b/i, "HSK"],
    [/\bgoethe\b/i, "Goethe"],
    [/business\s+(?:english|spanish|french|german|chinese|japanese)/i, "Business Language"],
    [/\bconversation\b/i, "Conversation"],
    [/\bgrammar\b/i, "Grammar"],
    [/\bpronunciation\b/i, "Pronunciation"],
    [/\bwriting\b/i, "Writing"],
    [/\breading\b/i, "Reading"],
    [/\bkids?\b|\bchildren\b|\byoung learners?\b/i, "Kids/Young Learners"],
    [/\bbeginner/i, "Beginners"],
    [/\badvanced\b/i, "Advanced"],
    [/\binterview prep/i, "Interview Prep"],
    [/\bacademic/i, "Academic"],
    [/\btravel\b/i, "Travel"],
    [/\bmedical\b/i, "Medical"],
    [/\blegal\b/i, "Legal"],
  ];

  for (const [pattern, label] of SUBJECT_PATTERNS) {
    if (pattern.test(text) && !subjects.includes(label)) {
      subjects.push(label);
    }
  }

  return subjects;
}

// ── Public scraper ───────────────────────────────────────────────────

export const italkiScraper: PlatformScraper = {
  platform: "italki",

  async scrape(url: string, platformId: string): Promise<ScrapeResult> {
    try {
      // Fetch profile
      const profileData = await fetchProfile(platformId);

      if (!profileData.data?.user_info) {
        return {
          ok: false,
          error: `iTalki profile ${platformId} not found or returned empty data`,
          retryable: false,
        };
      }

      // Brief delay before fetching reviews (be polite)
      await sleep(1500);

      // Fetch reviews
      let reviewsData: ItalkiReviewsResponse = { data: { reviews: [] } };
      try {
        reviewsData = await fetchReviews(platformId);
      } catch {
        // Reviews are non-critical — continue without them
        console.warn(
          `[iTalki scraper] Failed to fetch reviews for ${platformId}, continuing`
        );
      }

      // Normalise
      const profile = normaliseProfile(
        platformId,
        url,
        profileData,
        reviewsData
      );

      return {
        ok: true,
        profile,
        raw: {
          profile: profileData.data,
          reviews: reviewsData.data,
        },
      };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : String(err);
      const retryable =
        message.includes("429") ||
        message.includes("503") ||
        message.includes("Timeout") ||
        message.includes("ECONNRESET");

      return {
        ok: false,
        error: `iTalki scrape failed: ${message}`,
        retryable,
      };
    }
  },
};
