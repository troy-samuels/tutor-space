/**
 * Profile Import Mapper
 *
 * Converts a NormalisedProfile (platform-agnostic) into the exact shape
 * needed by TutorLingua's page builder, profiles table, services, reviews,
 * and resources.
 *
 * Also includes smart defaults: archetype inference, tagline generation,
 * about section construction, and credential formatting.
 */

import type {
  NormalisedProfile,
  MappedPageBuilderData,
  MappedProfile,
  MappedSite,
  MappedService,
  MappedReview,
  MappedResource,
} from "./types";

// ── Archetype inference ──────────────────────────────────────────────
// Maps to the ARCHETYPES in wizard-context.tsx

const ARCHETYPE_RULES: Array<{
  id: string;
  keywords: RegExp;
  weight: number;
}> = [
  {
    id: "academic",
    keywords:
      /\b(ielts|toefl|toeic|dele|delf|jlpt|topik|hsk|goethe|exam|test prep|grammar|academic|literature|university|phd|master'?s|degree|certificate)\b/i,
    weight: 3,
  },
  {
    id: "professional",
    keywords:
      /\b(business|corporate|professional|interview|presentation|meeting|email writing|finance|legal|medical|executive)\b/i,
    weight: 3,
  },
  {
    id: "playful",
    keywords:
      /\b(kids|children|young learners?|fun|games|play|creative|stories|songs|cartoon)\b/i,
    weight: 3,
  },
  {
    id: "immersion",
    keywords:
      /\b(conversation|travel|culture|immersion|everyday|casual|real[- ]life|confidence|fluency|speak|talk)\b/i,
    weight: 2,
  },
  {
    id: "academic",
    keywords: /\b(beginner|intermediate|advanced|a[12]|b[12]|c[12])\b/i,
    weight: 1,
  },
];

function inferArchetype(profile: NormalisedProfile): string {
  const text = [
    profile.bio || "",
    profile.headline || "",
    ...profile.subjects,
    ...profile.languagesTaught.map((l) => l.language),
  ]
    .join(" ")
    .toLowerCase();

  const scores: Record<string, number> = {};

  for (const rule of ARCHETYPE_RULES) {
    const matches = text.match(rule.keywords);
    if (matches) {
      scores[rule.id] = (scores[rule.id] || 0) + matches.length * rule.weight;
    }
  }

  // Find highest scoring archetype
  let best = "professional"; // Safe default
  let bestScore = 0;

  for (const [id, score] of Object.entries(scores)) {
    if (score > bestScore) {
      best = id;
      bestScore = score;
    }
  }

  return best;
}

// ── Tagline builder ──────────────────────────────────────────────────

function buildTagline(profile: NormalisedProfile): string {
  // Use existing headline if it's good
  if (profile.headline && profile.headline.length >= 10) {
    // Trim to reasonable length for tagline
    return profile.headline.length > 120
      ? profile.headline.substring(0, 117) + "…"
      : profile.headline;
  }

  // Build from stats
  const parts: string[] = [];

  if (profile.languagesTaught.length > 0) {
    const primary = profile.languagesTaught[0].language;
    parts.push(`${primary} Tutor`);
  }

  if (profile.yearsExperience && profile.yearsExperience > 1) {
    parts.push(`${profile.yearsExperience}+ years experience`);
  }

  if (profile.totalStudents && profile.totalStudents > 50) {
    parts.push(
      `${profile.totalStudents.toLocaleString()} students`
    );
  }

  if (profile.rating && profile.rating >= 4.0) {
    parts.push(`${profile.rating}★`);
  }

  return parts.length > 0 ? parts.join(" · ") : "Language Tutor";
}

// ── About section builder ────────────────────────────────────────────

function buildAboutTitle(profile: NormalisedProfile): string {
  const firstName = profile.displayName.split(" ")[0] || profile.displayName;
  return `About ${firstName}`;
}

function buildAboutSubtitle(profile: NormalisedProfile): string {
  const stats: string[] = [];

  if (profile.rating) {
    stats.push(`${profile.rating}/5 rating`);
  }
  if (profile.totalLessons && profile.totalLessons > 0) {
    stats.push(
      `${profile.totalLessons.toLocaleString()} lessons taught`
    );
  }
  if (profile.totalStudents && profile.totalStudents > 0) {
    stats.push(
      `${profile.totalStudents.toLocaleString()} students`
    );
  }
  if (
    profile.reviewCount &&
    profile.reviewCount > 0 &&
    !stats.some((s) => s.includes("rating"))
  ) {
    stats.push(`${profile.reviewCount} reviews`);
  }

  return stats.join(" · ");
}

function buildAboutBody(profile: NormalisedProfile): string {
  const sections: string[] = [];

  // Main bio
  if (profile.bio) {
    sections.push(profile.bio.trim());
  }

  // Certifications
  if (profile.certifications.length > 0) {
    sections.push(
      `**Certifications:** ${profile.certifications.join(", ")}`
    );
  }

  // Education
  if (profile.education.length > 0) {
    sections.push(
      `**Education:** ${profile.education.join(", ")}`
    );
  }

  // Languages section (if multiple)
  if (profile.languagesTaught.length > 1) {
    const langs = profile.languagesTaught
      .map((l) => {
        const level = l.nativeLevel
          ? "(Native)"
          : l.proficiencyLevel
            ? `(${l.proficiencyLevel})`
            : "";
        return `${l.language} ${level}`.trim();
      })
      .join(", ");
    sections.push(`**Languages I teach:** ${langs}`);
  }

  return sections.join("\n\n");
}

// ── Bio builder (for profiles table) ─────────────────────────────────
// Shorter version for the profiles.bio field (vs the longer about_body)

function buildProfileBio(profile: NormalisedProfile): string {
  if (!profile.bio) return "";

  // Truncate to ~500 chars for the profile bio field
  const bio = profile.bio.trim();
  if (bio.length <= 500) return bio;

  // Find a good break point
  const truncated = bio.substring(0, 497);
  const lastSentence = truncated.lastIndexOf(".");
  const lastNewline = truncated.lastIndexOf("\n");
  const breakPoint = Math.max(lastSentence, lastNewline);

  return breakPoint > 200
    ? bio.substring(0, breakPoint + 1)
    : truncated + "…";
}

// ── Service mapper ───────────────────────────────────────────────────

function mapServices(profile: NormalisedProfile): MappedService[] {
  if (profile.services.length === 0) return [];

  return profile.services.map((s) => ({
    name: s.name,
    description: s.description,
    duration_minutes: s.durationMinutes,
    price: s.priceAmount,
    currency: s.currency,
    offer_type: s.offerType,
  }));
}

// ── Review mapper ────────────────────────────────────────────────────

function mapReviews(profile: NormalisedProfile): MappedReview[] {
  return profile.reviews
    .filter((r) => r.text.length >= 15) // Skip very short reviews
    .slice(0, 10) // Cap at 10 for page builder
    .map((r) => ({
      author_name: r.authorName,
      quote: r.text.length > 300 ? r.text.substring(0, 297) + "…" : r.text,
    }));
}

// ── Resource mapper (social links) ───────────────────────────────────

function mapResources(profile: NormalisedProfile): MappedResource[] {
  const resources: MappedResource[] = [];

  // Social links from profile
  for (const link of profile.socialLinks) {
    resources.push({
      label: capitalise(link.platform),
      url: link.url,
      category: "social",
    });
  }

  // Website
  if (profile.websiteUrl) {
    resources.push({
      label: "Website",
      url: profile.websiteUrl,
      category: "portfolio",
    });
  }

  // Source platform profile (useful reference)
  resources.push({
    label: capitalise(profile.platform),
    url: profile.sourceUrl,
    category: "social",
  });

  return resources;
}

// ── Main mapper ──────────────────────────────────────────────────────

export function mapToPageBuilder(
  profile: NormalisedProfile
): MappedPageBuilderData {
  const mapped: MappedPageBuilderData = {
    profile: buildMappedProfile(profile),
    site: buildMappedSite(profile),
    services: mapServices(profile),
    reviews: mapReviews(profile),
    resources: mapResources(profile),
  };

  return mapped;
}

function buildMappedProfile(
  profile: NormalisedProfile
): MappedProfile {
  return {
    full_name: profile.displayName,
    tagline: buildTagline(profile),
    bio: buildProfileBio(profile),
    avatar_url: profile.avatarUrl,
    timezone: profile.timezone,
    website_url: profile.websiteUrl,
    languages_taught: profile.languagesTaught
      .map((l) => l.language)
      .join(", "),
    intro_video_url: profile.introVideoUrl,
  };
}

function buildMappedSite(profile: NormalisedProfile): MappedSite {
  return {
    about_title: buildAboutTitle(profile),
    about_subtitle: buildAboutSubtitle(profile),
    about_body: buildAboutBody(profile),
    hero_image_url: profile.avatarUrl,
    gallery_images: profile.galleryImages,
    theme_archetype: inferArchetype(profile),
    status: "draft",
  };
}

// ── Utilities ────────────────────────────────────────────────────────

function capitalise(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ── Merge helper for user edits ──────────────────────────────────────

/**
 * Deep merge user edits onto mapped data.
 * User edits take precedence. Null/undefined values in edits are skipped.
 */
export function mergeEdits(
  base: MappedPageBuilderData,
  edits: Partial<MappedPageBuilderData>
): MappedPageBuilderData {
  return {
    profile: { ...base.profile, ...stripNulls(edits.profile || {}) },
    site: { ...base.site, ...stripNulls(edits.site || {}) },
    services: edits.services ?? base.services,
    reviews: edits.reviews ?? base.reviews,
    resources: edits.resources ?? base.resources,
  };
}

function stripNulls<T extends Record<string, unknown>>(
  obj: T
): Partial<T> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== null && value !== undefined) {
      result[key] = value;
    }
  }
  return result as Partial<T>;
}
