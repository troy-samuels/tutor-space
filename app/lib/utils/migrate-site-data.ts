"use client";

import { createSite, type TutorSiteData } from "@/lib/actions/tutor-sites";

type LocalStorageSiteData = {
  aboutTitle?: string;
  aboutSubtitle?: string;
  aboutBody?: string;
  selectedServiceIds?: string[];
  reviews?: Array<{ author: string; quote: string }>;
  theme?: {
    background: string;
    primary: string;
    font: "system" | "serif" | "mono";
    spacing: "cozy" | "comfortable" | "compact";
  };
  pageVisibility?: {
    about: boolean;
    lessons: boolean;
    reviews: boolean;
    resources: boolean;
    contact: boolean;
  };
  resourceLinks?: Array<{ id: string; label: string; url: string }>;
  contactCta?: {
    label: string;
    url: string;
  };
  reviewFormUrl?: string;
};

/**
 * Migrate localStorage site data to database
 * This is a one-time migration helper for existing users
 */
export async function migrateSiteFromLocalStorage(
  profileId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const key = `site-draft:${profileId}`;
    const saved = window.localStorage.getItem(key);

    if (!saved) {
      // No data to migrate
      return { success: true };
    }

    const parsed: LocalStorageSiteData = JSON.parse(saved);

    // Transform to database schema
    const siteData: TutorSiteData = {
      about_title: parsed.aboutTitle || null,
      about_subtitle: parsed.aboutSubtitle || null,
      about_body: parsed.aboutBody || null,
      theme_background: parsed.theme?.background || "#ffffff",
      theme_primary: parsed.theme?.primary || "#2563eb",
      theme_font: parsed.theme?.font || "system",
      theme_spacing: parsed.theme?.spacing || "comfortable",
      show_about: parsed.pageVisibility?.about ?? true,
      show_lessons: parsed.pageVisibility?.lessons ?? true,
      show_reviews: parsed.pageVisibility?.reviews ?? true,
      show_resources: parsed.pageVisibility?.resources ?? false,
      show_contact: parsed.pageVisibility?.contact ?? false,
      contact_cta_label: parsed.contactCta?.label || null,
      contact_cta_url: parsed.contactCta?.url || null,
      services: parsed.selectedServiceIds || [],
      reviews: parsed.reviews?.map((r) => ({
        author_name: r.author,
        quote: r.quote,
      })) || [],
      resources: parsed.resourceLinks?.map((r) => ({
        label: r.label,
        url: r.url,
      })) || [],
    };

    // Create the site in the database
    const result = await createSite(siteData);

    if (result.error) {
      return { success: false, error: result.error };
    }

    // Clear localStorage after successful migration
    window.localStorage.removeItem(key);

    return { success: true };
  } catch (error) {
    console.error("Error migrating site data:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Migration failed",
    };
  }
}

/**
 * Check if localStorage data exists for migration
 */
export function hasLocalStorageData(profileId: string): boolean {
  if (typeof window === "undefined") return false;
  const key = `site-draft:${profileId}`;
  return window.localStorage.getItem(key) !== null;
}
