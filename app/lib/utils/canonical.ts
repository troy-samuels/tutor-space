/**
 * Canonical URL utilities for SEO
 * Ensures consistent, absolute canonical URLs across all pages
 */

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://tutorlingua.co";

/**
 * Generate an absolute canonical URL for a given path
 * @param path - The path (with or without leading slash)
 * @returns Absolute canonical URL
 */
export function getCanonicalUrl(path: string): string {
  // Ensure path starts with /
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  // Remove trailing slash (except for root)
  const cleanPath = normalizedPath === "/" ? "/" : normalizedPath.replace(/\/$/, "");
  return `${BASE_URL}${cleanPath}`;
}

/**
 * Generate canonical URL for tutor profile pages
 */
export function getTutorCanonicalUrl(
  username: string,
  pageType: "site" | "profile" | "bio" | "book" | "products" | "reviews"
): string {
  switch (pageType) {
    case "site":
      return getCanonicalUrl(`/${username}`);
    case "profile":
      return getCanonicalUrl(`/profile/${username}`);
    case "bio":
      return getCanonicalUrl(`/bio/${username}`);
    case "book":
      return getCanonicalUrl(`/book/${username}`);
    case "products":
      return getCanonicalUrl(`/products/${username}`);
    case "reviews":
      return getCanonicalUrl(`/${username}/reviews`);
    default:
      return getCanonicalUrl(`/${username}`);
  }
}

/**
 * Generate canonical URL for blog posts
 */
export function getBlogCanonicalUrl(slug: string, locale: string = "en"): string {
  if (locale === "en") {
    return getCanonicalUrl(`/blog/${slug}`);
  }
  return getCanonicalUrl(`/${locale}/blog/${slug}`);
}

/**
 * Get base URL for the application
 */
export function getBaseUrl(): string {
  return BASE_URL;
}
