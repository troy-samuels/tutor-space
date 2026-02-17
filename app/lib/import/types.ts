/**
 * Profile Import Engine — Normalised Schema
 *
 * Every platform scraper outputs this universal intermediate format.
 * The mapper then converts it into TutorLingua's page builder data model.
 *
 * Design principle: capture everything, map selectively.
 */

// ── Supported platforms ──────────────────────────────────────────────

export const PLATFORMS = [
  "italki",
  "preply",
  "verbling",
  "cambly",
  "wyzant",
  "superprof",
] as const;

export type Platform = (typeof PLATFORMS)[number];

// ── Import status state machine ──────────────────────────────────────

export const IMPORT_STATUSES = [
  "pending",
  "scraping",
  "scraped",
  "mapped",
  "applied",
  "failed",
] as const;

export type ImportStatus = (typeof IMPORT_STATUSES)[number];

// ── Normalised profile (platform-agnostic) ───────────────────────────

export type NormalisedProfile = {
  // Identity
  displayName: string;
  headline: string | null;
  bio: string | null;
  avatarUrl: string | null;

  // Teaching
  languagesTaught: NormalisedLanguage[];
  subjects: string[];

  // Social proof
  rating: number | null;
  reviewCount: number | null;
  totalStudents: number | null;
  totalLessons: number | null;
  reviews: NormalisedReview[];

  // Services / pricing
  services: NormalisedService[];

  // Media
  introVideoUrl: string | null;
  galleryImages: string[];

  // Credentials
  certifications: string[];
  education: string[];
  yearsExperience: number | null;

  // Location
  timezone: string | null;
  country: string | null;
  city: string | null;

  // Links
  websiteUrl: string | null;
  socialLinks: NormalisedSocialLink[];

  // Source metadata (always set by scraper)
  platform: Platform;
  platformProfileId: string;
  sourceUrl: string;
  scrapedAt: string; // ISO 8601
};

export type NormalisedLanguage = {
  language: string; // Display name (e.g. "Spanish") or ISO 639-1
  nativeLevel: boolean;
  proficiencyLevel: string | null; // 'native' | 'C2' | 'C1' | 'B2' | 'B1' | 'A2' | 'A1'
};

export type NormalisedReview = {
  authorName: string;
  text: string;
  rating: number | null; // 0–5
  date: string | null; // ISO date
};

export type NormalisedService = {
  name: string;
  description: string | null;
  durationMinutes: number;
  priceAmount: number; // Lowest denomination (cents for USD/EUR/GBP)
  currency: string; // ISO 4217
  offerType: "trial" | "one_off" | "lesson_block" | "subscription";
};

export type NormalisedSocialLink = {
  platform: string; // 'youtube' | 'instagram' | 'tiktok' | 'linkedin' | 'website' | etc.
  url: string;
};

// ── DB record shape (matches profile_imports table) ──────────────────

export type ProfileImportRecord = {
  id: string;
  tutor_id: string;
  platform: Platform;
  platform_profile_id: string | null;
  source_url: string;
  status: ImportStatus;
  error_message: string | null;
  scrape_attempts: number;
  last_scraped_at: string | null;
  raw_data: Record<string, unknown>;
  normalised_data: NormalisedProfile | Record<string, never>;
  confirmed_data: MappedPageBuilderData | null;
  created_at: string;
  updated_at: string;
};

// ── Mapped output (ready for page builder) ───────────────────────────

export type MappedPageBuilderData = {
  profile: MappedProfile;
  site: MappedSite;
  services: MappedService[];
  reviews: MappedReview[];
  resources: MappedResource[];
};

export type MappedProfile = {
  full_name: string;
  tagline: string;
  bio: string;
  avatar_url: string | null;
  timezone: string | null;
  website_url: string | null;
  languages_taught: string; // comma-separated
  intro_video_url: string | null;
};

export type MappedSite = {
  about_title: string;
  about_subtitle: string;
  about_body: string;
  hero_image_url: string | null;
  gallery_images: string[];
  theme_archetype: string;
  status: "draft";
};

export type MappedService = {
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number;
  currency: string;
  offer_type: "trial" | "one_off" | "lesson_block" | "subscription";
};

export type MappedReview = {
  author_name: string;
  quote: string;
};

export type MappedResource = {
  label: string;
  url: string;
  category: "social" | "portfolio";
};

// ── Scraper interface ────────────────────────────────────────────────

export type ScrapeResult =
  | { ok: true; profile: NormalisedProfile; raw: Record<string, unknown> }
  | { ok: false; error: string; retryable: boolean };

export type PlatformScraper = {
  platform: Platform;
  scrape(url: string, platformId: string): Promise<ScrapeResult>;
};
