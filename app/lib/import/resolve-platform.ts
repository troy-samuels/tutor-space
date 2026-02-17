/**
 * Platform URL Resolver
 *
 * Takes a raw URL string and identifies the platform + profile ID.
 * Handles messy input: trailing slashes, query params, mobile URLs, locale prefixes.
 */

import type { Platform } from "./types";

export type ResolvedPlatform = {
  platform: Platform;
  id: string;
  canonicalUrl: string;
};

// ── Pattern registry ─────────────────────────────────────────────────
// Each platform has one or more URL patterns.
// Capture group 1 = profile ID (or slug).

type PlatformPattern = {
  platform: Platform;
  pattern: RegExp;
  buildCanonical: (id: string) => string;
};

const PATTERNS: PlatformPattern[] = [
  // iTalki: italki.com/en/teacher/5606369 or italki.com/teacher/5606369
  {
    platform: "italki",
    pattern: /italki\.com\/(?:[a-z]{2}\/)?teacher\/(\d+)/i,
    buildCanonical: (id) => `https://www.italki.com/en/teacher/${id}`,
  },

  // Preply: preply.com/en/tutor/123456 or preply.com/en/tutor/john-smith-123456
  {
    platform: "preply",
    pattern: /preply\.com\/[a-z]{2}\/tutor\/(?:[a-z0-9-]+-)?(\d+)/i,
    buildCanonical: (id) => `https://preply.com/en/tutor/${id}`,
  },
  // Preply fallback: slug-only URLs (preply.com/en/tutor/john-smith)
  {
    platform: "preply",
    pattern: /preply\.com\/[a-z]{2}\/tutor\/([a-zA-Z0-9_-]+)/i,
    buildCanonical: (id) => `https://preply.com/en/tutor/${id}`,
  },

  // Verbling: verbling.com/teachers/username
  {
    platform: "verbling",
    pattern: /verbling\.com\/teachers\/([a-zA-Z0-9_-]+)/i,
    buildCanonical: (id) => `https://www.verbling.com/teachers/${id}`,
  },

  // Cambly: cambly.com/en/tutor/Username
  {
    platform: "cambly",
    pattern: /cambly\.com\/[a-z]{2}\/tutor\/([a-zA-Z0-9_-]+)/i,
    buildCanonical: (id) => `https://www.cambly.com/en/tutor/${id}`,
  },

  // Wyzant: wyzant.com/Tutors/FL/Miami/12345678 or wyzant.com/Tutors/Username
  {
    platform: "wyzant",
    pattern: /wyzant\.com\/Tutors\/(?:[A-Z]{2}\/[^/]+\/)?([a-zA-Z0-9_-]+)/i,
    buildCanonical: (id) => `https://www.wyzant.com/Tutors/${id}`,
  },

  // Superprof: superprof.co.uk/lessons/english/london/john.html or superprof.com/.../username
  {
    platform: "superprof",
    pattern: /superprof\.[a-z.]+\/(?:[^/]+\/)+([a-zA-Z0-9_.-]+?)(?:\.html)?$/i,
    buildCanonical: (id) => `https://www.superprof.co.uk/${id}`,
  },
];

// ── Human-readable platform labels ───────────────────────────────────

export const PLATFORM_LABELS: Record<Platform, string> = {
  italki: "iTalki",
  preply: "Preply",
  verbling: "Verbling",
  cambly: "Cambly",
  wyzant: "Wyzant",
  superprof: "Superprof",
};

export const SUPPORTED_DOMAINS = [
  "italki.com",
  "preply.com",
  "verbling.com",
  "cambly.com",
  "wyzant.com",
  "superprof.*",
];

// ── Resolver ─────────────────────────────────────────────────────────

export function resolvePlatform(rawUrl: string): ResolvedPlatform | null {
  // Clean input
  const url = rawUrl
    .trim()
    .replace(/\/$/, "") // trailing slash
    .replace(/[?#].*$/, ""); // strip query/fragment

  for (const { platform, pattern, buildCanonical } of PATTERNS) {
    const match = url.match(pattern);
    if (match && match[1]) {
      const id = match[1];
      return {
        platform,
        id,
        canonicalUrl: buildCanonical(id),
      };
    }
  }

  return null;
}

/**
 * Quick check: does this string look like it could be a tutor platform URL?
 * Used for real-time input validation (before full resolution).
 */
export function looksLikePlatformUrl(input: string): boolean {
  const trimmed = input.trim().toLowerCase();
  return (
    trimmed.includes("italki.com") ||
    trimmed.includes("preply.com") ||
    trimmed.includes("verbling.com") ||
    trimmed.includes("cambly.com") ||
    trimmed.includes("wyzant.com") ||
    trimmed.includes("superprof.")
  );
}
