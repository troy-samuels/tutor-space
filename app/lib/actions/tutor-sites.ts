"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type TutorSiteStatus = "draft" | "published";

export type TutorSite = {
  id: string;
  tutor_id: string;
  about_title: string | null;
  about_subtitle: string | null;
  about_body: string | null;
  theme_background: string;
  theme_primary: string;
  theme_font: string;
  theme_spacing: string;
  show_about: boolean;
  show_lessons: boolean;
  show_reviews: boolean;
  show_resources: boolean;
  show_contact: boolean;
  contact_cta_label: string | null;
  contact_cta_url: string | null;
  status: TutorSiteStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type TutorSiteService = {
  id: string;
  tutor_site_id: string;
  service_id: string;
  sort_order: number;
};

export type TutorSiteReview = {
  id: string;
  tutor_site_id: string;
  author_name: string;
  quote: string;
  sort_order: number;
};

export type TutorSiteResource = {
  id: string;
  tutor_site_id: string;
  label: string;
  url: string;
  sort_order: number;
};

export type TutorSiteData = {
  about_title?: string | null;
  about_subtitle?: string | null;
  about_body?: string | null;
  theme_background?: string;
  theme_primary?: string;
  theme_font?: string;
  theme_spacing?: string;
  show_about?: boolean;
  show_lessons?: boolean;
  show_reviews?: boolean;
  show_resources?: boolean;
  show_contact?: boolean;
  contact_cta_label?: string | null;
  contact_cta_url?: string | null;
  services?: string[]; // Array of service IDs
  reviews?: Array<{ author_name: string; quote: string }>;
  resources?: Array<{ label: string; url: string }>;
};

/**
 * Get or create tutor site for the authenticated user
 */
export async function getSite() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Fetch existing site or return defaults
  const { data: site, error } = await supabase
    .from("tutor_sites")
    .select("*")
    .eq("tutor_id", user.id)
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116 = no rows returned
    return { error: "Failed to fetch site" };
  }

  // If no site exists, return default structure
  if (!site) {
    return {
      site: null,
      services: [],
      reviews: [],
      resources: [],
    };
  }

  // Fetch related data
  const [servicesResult, reviewsResult, resourcesResult] = await Promise.all([
    supabase
      .from("tutor_site_services")
      .select("*")
      .eq("tutor_site_id", site.id)
      .order("sort_order"),
    supabase
      .from("tutor_site_reviews")
      .select("*")
      .eq("tutor_site_id", site.id)
      .order("sort_order"),
    supabase
      .from("tutor_site_resources")
      .select("*")
      .eq("tutor_site_id", site.id)
      .order("sort_order"),
  ]);

  return {
    site: site as TutorSite,
    services: (servicesResult.data as TutorSiteService[]) || [],
    reviews: (reviewsResult.data as TutorSiteReview[]) || [],
    resources: (resourcesResult.data as TutorSiteResource[]) || [],
  };
}

/**
 * Create a new tutor site
 */
export async function createSite(data: TutorSiteData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Insert main site record
  const { data: site, error: siteError } = await supabase
    .from("tutor_sites")
    .insert({
      tutor_id: user.id,
      about_title: data.about_title,
      about_subtitle: data.about_subtitle,
      about_body: data.about_body,
      theme_background: data.theme_background || "#ffffff",
      theme_primary: data.theme_primary || "#2563eb",
      theme_font: data.theme_font || "system",
      theme_spacing: data.theme_spacing || "comfortable",
      show_about: data.show_about ?? true,
      show_lessons: data.show_lessons ?? true,
      show_reviews: data.show_reviews ?? true,
      show_resources: data.show_resources ?? false,
      show_contact: data.show_contact ?? false,
      contact_cta_label: data.contact_cta_label,
      contact_cta_url: data.contact_cta_url,
      status: "draft",
    })
    .select()
    .single();

  if (siteError || !site) {
    return { error: "Failed to create site" };
  }

  // Insert services
  if (data.services && data.services.length > 0) {
    const servicesInsert = data.services.map((serviceId, index) => ({
      tutor_site_id: site.id,
      service_id: serviceId,
      sort_order: index,
    }));

    await supabase.from("tutor_site_services").insert(servicesInsert);
  }

  // Insert reviews
  if (data.reviews && data.reviews.length > 0) {
    const reviewsInsert = data.reviews.map((review, index) => ({
      tutor_site_id: site.id,
      author_name: review.author_name,
      quote: review.quote,
      sort_order: index,
    }));

    await supabase.from("tutor_site_reviews").insert(reviewsInsert);
  }

  // Insert resources
  if (data.resources && data.resources.length > 0) {
    const resourcesInsert = data.resources.map((resource, index) => ({
      tutor_site_id: site.id,
      label: resource.label,
      url: resource.url,
      sort_order: index,
    }));

    await supabase.from("tutor_site_resources").insert(resourcesInsert);
  }

  revalidatePath("/pages");
  return { success: true, site };
}

/**
 * Update existing tutor site
 */
export async function updateSite(siteId: string, data: TutorSiteData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Update main site record
  const { error: siteError } = await supabase
    .from("tutor_sites")
    .update({
      about_title: data.about_title,
      about_subtitle: data.about_subtitle,
      about_body: data.about_body,
      theme_background: data.theme_background,
      theme_primary: data.theme_primary,
      theme_font: data.theme_font,
      theme_spacing: data.theme_spacing,
      show_about: data.show_about,
      show_lessons: data.show_lessons,
      show_reviews: data.show_reviews,
      show_resources: data.show_resources,
      show_contact: data.show_contact,
      contact_cta_label: data.contact_cta_label,
      contact_cta_url: data.contact_cta_url,
    })
    .eq("id", siteId)
    .eq("tutor_id", user.id);

  if (siteError) {
    return { error: "Failed to update site" };
  }

  // Update services - delete all and re-insert
  if (data.services !== undefined) {
    await supabase.from("tutor_site_services").delete().eq("tutor_site_id", siteId);

    if (data.services.length > 0) {
      const servicesInsert = data.services.map((serviceId, index) => ({
        tutor_site_id: siteId,
        service_id: serviceId,
        sort_order: index,
      }));

      await supabase.from("tutor_site_services").insert(servicesInsert);
    }
  }

  // Update reviews - delete all and re-insert
  if (data.reviews !== undefined) {
    await supabase.from("tutor_site_reviews").delete().eq("tutor_site_id", siteId);

    if (data.reviews.length > 0) {
      const reviewsInsert = data.reviews.map((review, index) => ({
        tutor_site_id: siteId,
        author_name: review.author_name,
        quote: review.quote,
        sort_order: index,
      }));

      await supabase.from("tutor_site_reviews").insert(reviewsInsert);
    }
  }

  // Update resources - delete all and re-insert
  if (data.resources !== undefined) {
    await supabase.from("tutor_site_resources").delete().eq("tutor_site_id", siteId);

    if (data.resources.length > 0) {
      const resourcesInsert = data.resources.map((resource, index) => ({
        tutor_site_id: siteId,
        label: resource.label,
        url: resource.url,
        sort_order: index,
      }));

      await supabase.from("tutor_site_resources").insert(resourcesInsert);
    }
  }

  revalidatePath("/pages");
  return { success: true };
}

/**
 * Publish tutor site (make it live)
 */
export async function publishSite(siteId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("tutor_sites")
    .update({
      status: "published",
      published_at: new Date().toISOString(),
    })
    .eq("id", siteId)
    .eq("tutor_id", user.id);

  if (error) {
    return { error: "Failed to publish site" };
  }

  revalidatePath("/pages");
  revalidatePath(`/site/${user.id}`); // Revalidate public site if it exists
  return { success: true };
}

/**
 * Save site as draft
 */
export async function saveDraft(siteId: string, data: TutorSiteData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // If site doesn't exist, create it
  const { data: existingSite } = await supabase
    .from("tutor_sites")
    .select("id")
    .eq("id", siteId)
    .single();

  if (!existingSite) {
    return createSite(data);
  }

  // Otherwise update it
  return updateSite(siteId, data);
}
