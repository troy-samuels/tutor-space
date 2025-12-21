"use server";

import { Buffer } from "node:buffer";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { tutorSiteDataSchema } from "@/lib/validators/tutor-site";
import { track } from "@/lib/telemetry/tracker";
import { getSiteById, listChildren, getLastVersion, insertVersionSnapshot } from "@/lib/repositories/tutor-sites";
import { SiteConfig } from "@/lib/types/site";
import { notFound } from "next/navigation";
import { getNextAvailableSlot } from "@/lib/availability/next-slot";
import { ServiceRecord } from "@/lib/types/service";
import { DigitalProductRecord } from "@/lib/types/digital-product";
import { normalizeAndValidateUsernameSlug, normalizeUsernameSlug } from "@/lib/utils/username-slug";
import { normalizeSiteConfig } from "@/lib/site/site-config";

export type TutorSiteStatus = "draft" | "published";

export type TutorSite = {
  id: string;
  tutor_id: string;
  about_title: string | null;
  about_subtitle: string | null;
  about_body: string | null;
  hero_image_url: string | null;
  gallery_images: string[] | null;
  theme_palette_id: string | null;
  theme_archetype_id: string | null; // NEW: Teaching archetype ID
  theme_background: string;
  theme_background_style: string | null;
  theme_gradient_from: string | null;
  theme_gradient_to: string | null;
  theme_card_bg: string | null;
  theme_primary: string;
  theme_text_primary: string | null;
  theme_text_secondary: string | null;
  theme_font: string;
  theme_heading_font: string | null; // NEW: For Academic archetype
  theme_border_radius: string | null; // NEW: lg | xl | 2xl | 3xl
  theme_spacing: string;
  hero_layout: string | null;
  lessons_layout: string | null;
  reviews_layout: string | null;
  booking_headline: string | null;
  booking_subcopy: string | null;
  booking_cta_label: string | null;
  booking_cta_url: string | null;
  show_about: boolean;
  show_lessons: boolean;
  show_booking: boolean | null;
  show_reviews: boolean;
  show_social_page: boolean | null;
  show_resources: boolean;
  show_contact: boolean;
  show_digital: boolean | null;
  show_faq: boolean | null;
  show_social_links: boolean | null;
  show_social_header_icons: boolean | null;
  show_social_footer_icons: boolean | null;
  contact_cta_label: string | null;
  contact_cta_url: string | null;
  additional_pages: AdditionalPages | null;
  config: SiteConfig | null;
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
  student_id?: string | null;
  review_id?: string | null;
  rating?: number | null;
};

export type TutorSiteResource = {
  id: string;
  tutor_site_id: string;
  label: string;
  url: string;
  category: string | null;
  sort_order: number;
};

export type TutorSiteProduct = {
  id: string;
  tutor_site_id: string;
  product_id: string;
  sort_order: number;
};

export type AdditionalPages = {
  faq?: Array<{ q: string; a: string }>;
  resources?: Array<{ title: string; url: string; description?: string }>;
};

export type TutorSiteData = {
  about_title?: string | null;
  about_subtitle?: string | null;
  about_body?: string | null;
  hero_image_url?: string | null;
  gallery_images?: string[];
  theme_palette_id?: string;
  theme_archetype_id?: string; // NEW: Teaching archetype ID
  theme_background?: string;
  theme_background_style?: string;
  theme_gradient_from?: string;
  theme_gradient_to?: string;
  theme_card_bg?: string;
  theme_primary?: string;
  theme_text_primary?: string;
  theme_text_secondary?: string;
  theme_font?: string;
  theme_heading_font?: string; // NEW: For Academic archetype
  theme_border_radius?: string; // NEW: lg | xl | 2xl | 3xl
  theme_spacing?: string;
  hero_layout?: string;
  lessons_layout?: string;
  reviews_layout?: string;
  booking_headline?: string | null;
  booking_subcopy?: string | null;
  booking_cta_label?: string | null;
  booking_cta_url?: string | null;
  show_hero?: boolean;
  show_gallery?: boolean;
  show_about?: boolean;
  show_lessons?: boolean;
  show_booking?: boolean;
  show_reviews?: boolean;
  show_social_page?: boolean;
  show_resources?: boolean;
  show_contact?: boolean;
  show_digital?: boolean;
  show_faq?: boolean;
  show_social_links?: boolean;
  show_social_header_icons?: boolean;
  show_social_footer_icons?: boolean;
  contact_cta_label?: string | null;
  contact_cta_url?: string | null;
  additional_pages?: AdditionalPages;
  services?: string[]; // Array of service IDs
  reviews?: Array<{ author_name: string; quote: string }>;
  resources?: Array<{ label: string; url: string; category?: string }>;
  products?: string[]; // Array of product IDs
};

const HERO_IMAGE_BUCKET = "site-assets";

/**
 * Insert or update the JSON-based site configuration for the authenticated tutor.
 */
export async function upsertSiteConfig(config: SiteConfig) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { data, error } = await supabase
    .from("tutor_sites")
    .upsert(
      {
        tutor_id: user.id,
        config,
      },
      { onConflict: "tutor_id" }
    )
    .select("id, config, updated_at")
    .single();

  if (error || !data) {
    track("site_config_upsert_error", { reason: error?.message });
    return { error: "Failed to save site configuration" };
  }

  revalidatePath("/pages");
  revalidatePath(`/site/${user.id}`);
  track("site_config_upserted", { site_id: data.id });

  return { success: true, siteId: data.id, config: data.config as SiteConfig };
}

/**
 * Fetch public-facing site data (profile, config, services, products, reviews) by username with next available slot.
 */
export async function getPublicSiteData(username: string) {
  const supabase = await createClient();
  const rawLower = String(username ?? "").trim().toLowerCase();
  const normalizedUsername = normalizeUsernameSlug(username) || rawLower;

  let profileResult = await supabase
    .from("public_profiles")
    .select("id, username, full_name, avatar_url, bio, tagline, languages_taught, timezone")
    .eq("username", normalizedUsername)
    .maybeSingle();

  if (!profileResult.data && rawLower && rawLower !== normalizedUsername) {
    profileResult = await supabase
      .from("public_profiles")
      .select("id, username, full_name, avatar_url, bio, tagline, languages_taught, timezone")
      .eq("username", rawLower)
      .maybeSingle();
  }

  const profile = profileResult.data;
  if (profileResult.error || !profile) {
    return notFound();
  }

  const { data: siteRow } = await supabase
    .from("tutor_sites")
    .select("id, config")
    .eq("tutor_id", profile.id)
    .eq("status", "published")
    .maybeSingle();

  if (!siteRow?.id) {
    return notFound();
  }

  const config = normalizeSiteConfig(siteRow.config as SiteConfig | null);

  const blockVisibility = new Map(config.blocks.map((b) => [b.type, b.isVisible !== false] as const));
  const showServices = blockVisibility.get("services") ?? true;
  const showProducts = blockVisibility.get("products") ?? true;
  const showReviews = blockVisibility.get("reviews") ?? true;

  const { data: services } = await supabase
    .from("services")
    .select("id, name, description, duration_minutes, price_amount, price, currency, price_currency, is_active, offer_type")
    .eq("tutor_id", profile.id)
    .eq("is_active", true)
    .order("price_amount", { ascending: true });

  const servicesEnabled = config.servicesEnabled ? new Set(config.servicesEnabled) : null;
  const visibleServices = showServices
    ? ((services as ServiceRecord[] | null) ?? [])
        .filter((service) => !servicesEnabled || servicesEnabled.has(service.id))
        .map((service) => ({
          ...service,
          price: (service.price_amount ?? service.price ?? 0) as number,
          currency: (service.price_currency ?? service.currency ?? null) as string | null,
        }))
    : [];

  const { data: products } = await supabase
    .from("digital_products")
    .select("id, title, description, price_cents, currency, published, is_active")
    .eq("tutor_id", profile.id)
    .eq("published", true)
    .order("price_cents", { ascending: true });

  const productsEnabled = config.productsEnabled ? new Set(config.productsEnabled) : null;
  const visibleProducts = showProducts
    ? ((products as DigitalProductRecord[] | null) ?? []).filter(
        (product) => !productsEnabled || productsEnabled.has(product.id)
      )
    : [];

  const { data: reviews } = await supabase
    .from("tutor_site_reviews")
    .select("author_name, quote, rating, sort_order")
    .eq("tutor_site_id", siteRow.id)
    .order("sort_order", { ascending: true });

  const nextSlot = await getNextAvailableSlot(profile.id, (profile as any).timezone || "UTC");

  return {
    profile,
    site: {
      id: siteRow.id,
      tutor_id: profile.id,
      status: "published" as TutorSiteStatus,
      config,
    },
    services: visibleServices,
    products: visibleProducts,
    reviews:
      showReviews
        ? ((reviews as Array<{ author_name: string; quote: string; rating?: number | null }> | null) ?? []).map(
            (r) => ({
              author: r.author_name,
              quote: r.quote,
              rating: (r as any).rating,
            })
          )
        : [],
    nextSlot,
  };
}


/**
 * Upload hero image to Supabase Storage
 */
export async function uploadHeroImage(file: File) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  try {
    // Convert file to array buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Create unique file path
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const path = `${user.id}/hero/${Date.now()}.${fileExtension}`;

    // Upload to storage
    const { error } = await supabase.storage
      .from(HERO_IMAGE_BUCKET)
      .upload(path, buffer, {
        contentType: file.type || "image/jpeg",
        upsert: true,
      });

    if (error) {
      console.error("[TutorSites] Upload error:", error);
      return { error: "Failed to upload image" };
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from(HERO_IMAGE_BUCKET)
      .getPublicUrl(path);

    return { success: true, url: publicUrlData.publicUrl };
  } catch (error) {
    console.error("[TutorSites] Upload exception:", error);
    return { error: "Failed to upload image" };
  }
}

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
      products: [],
    };
  }

  // Fetch related data
  const [servicesResult, reviewsResult, resourcesResult, productsResult] = await Promise.all([
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
    supabase
      .from("tutor_site_products")
      .select("*")
      .eq("tutor_site_id", site.id)
      .order("sort_order"),
  ]);

  return {
    site: site as TutorSite,
    services: (servicesResult.data as TutorSiteService[]) || [],
    reviews: (reviewsResult.data as TutorSiteReview[]) || [],
    resources: (resourcesResult.data as TutorSiteResource[]) || [],
    products: (productsResult.data as TutorSiteProduct[]) || [],
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

  // Validate input (tolerant: all fields optional but types must match)
  const parsed = tutorSiteDataSchema.safeParse(data);
  if (!parsed.success) {
    return { error: "Invalid input" };
  }
  const input = parsed.data;

  // Insert main site record
  const { data: site, error: siteError } = await supabase
    .from("tutor_sites")
    .insert({
      tutor_id: user.id,
      about_title: input.about_title,
      about_subtitle: input.about_subtitle,
      about_body: input.about_body,
      hero_image_url: input.hero_image_url || null,
      gallery_images: input.gallery_images || [],
      theme_archetype_id: input.theme_archetype_id || "immersion",
      theme_background: input.theme_background || "#ffffff",
      theme_background_style: input.theme_background_style || "solid",
      theme_gradient_from: input.theme_gradient_from || "#f8fafc",
      theme_gradient_to: input.theme_gradient_to || "#ffffff",
      theme_card_bg: input.theme_card_bg || "#ffffff",
      theme_primary: input.theme_primary || "#2563eb",
      theme_text_primary: input.theme_text_primary || "#0a0a0a",
      theme_text_secondary: input.theme_text_secondary || "#666666",
      theme_font: input.theme_font || "system",
      theme_heading_font: input.theme_heading_font || input.theme_font || "system",
      theme_border_radius: input.theme_border_radius || "3xl",
      theme_spacing: input.theme_spacing || "comfortable",
      hero_layout: input.hero_layout || "banner",
      lessons_layout: input.lessons_layout || "cards",
      reviews_layout: input.reviews_layout || "cards",
      booking_headline: input.booking_headline,
      booking_subcopy: input.booking_subcopy,
      booking_cta_label: input.booking_cta_label,
      booking_cta_url: input.booking_cta_url,
      show_about: input.show_about ?? true,
      show_lessons: input.show_lessons ?? true,
      show_booking: input.show_booking ?? true,
      show_reviews: input.show_reviews ?? true,
      show_social_page: input.show_social_page ?? true,
      show_resources: input.show_resources ?? false,
      show_contact: input.show_contact ?? false,
      show_digital: input.show_digital ?? false,
      show_faq: input.show_faq ?? false,
      show_social_links: input.show_social_links ?? true,
      show_social_header_icons: input.show_social_header_icons ?? true,
      show_social_footer_icons: input.show_social_footer_icons ?? true,
      contact_cta_label: input.contact_cta_label,
      contact_cta_url: input.contact_cta_url,
      additional_pages: input.additional_pages || { faq: [], resources: [] },
      status: "draft",
    })
    .select()
    .single();

  if (siteError || !site) {
    track("site_create_error", { reason: siteError?.message });
    return { error: "Failed to create site" };
  }

  // Insert services
  if (input.services && input.services.length > 0) {
    const servicesInsert = input.services.map((serviceId, index) => ({
      tutor_site_id: site.id,
      service_id: serviceId,
      sort_order: index,
    }));

    const { error: servicesError } = await supabase.from("tutor_site_services").insert(servicesInsert);
    if (servicesError) {
      track("site_create_error", { site_id: site.id, reason: servicesError.message });
      return { error: "Failed to create site" };
    }
  }

  // Insert reviews
  if (input.reviews && input.reviews.length > 0) {
    const reviewsInsert = input.reviews.map((review, index) => ({
      tutor_site_id: site.id,
      author_name: review.author_name,
      quote: review.quote,
      sort_order: index,
    }));

    const { error: reviewsError } = await supabase.from("tutor_site_reviews").insert(reviewsInsert);
    if (reviewsError) {
      track("site_create_error", { site_id: site.id, reason: reviewsError.message });
      return { error: "Failed to create site" };
    }
  }

  // Insert resources
  if (input.resources && input.resources.length > 0) {
    const resourcesInsert = input.resources.map((resource, index) => ({
      tutor_site_id: site.id,
      label: resource.label,
      url: resource.url,
      category: resource.category ?? "social",
      sort_order: index,
    }));

    const { error: resourcesError } = await supabase.from("tutor_site_resources").insert(resourcesInsert);
    if (resourcesError) {
      track("site_create_error", { site_id: site.id, reason: resourcesError.message });
      return { error: "Failed to create site" };
    }
  }

  // Insert products
  if (input.products && input.products.length > 0) {
    const productsInsert = input.products.map((productId, index) => ({
      tutor_site_id: site.id,
      product_id: productId,
      sort_order: index,
    }));

    const { error: productsError } = await supabase.from("tutor_site_products").insert(productsInsert);
    if (productsError) {
      track("site_create_error", { site_id: site.id, reason: productsError.message });
      return { error: "Failed to create site" };
    }
  }

  revalidatePath("/pages");
  track("site_created", { site_id: site.id });
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

  // Validate input
  const parsed = tutorSiteDataSchema.safeParse(data);
  if (!parsed.success) {
    return { error: "Invalid input" };
  }
  const input = parsed.data;

  // Update main site record
  let query = supabase
    .from("tutor_sites")
    .update({
      about_title: input.about_title,
      about_subtitle: input.about_subtitle,
      about_body: input.about_body,
      hero_image_url: input.hero_image_url,
      gallery_images: input.gallery_images,
      theme_archetype_id: input.theme_archetype_id,
      theme_background: input.theme_background,
      theme_background_style: input.theme_background_style,
      theme_gradient_from: input.theme_gradient_from,
      theme_gradient_to: input.theme_gradient_to,
      theme_card_bg: input.theme_card_bg,
      theme_primary: input.theme_primary,
      theme_text_primary: input.theme_text_primary,
      theme_text_secondary: input.theme_text_secondary,
      theme_font: input.theme_font,
      theme_heading_font: input.theme_heading_font,
      theme_border_radius: input.theme_border_radius,
      theme_spacing: input.theme_spacing,
      hero_layout: input.hero_layout,
      lessons_layout: input.lessons_layout,
      reviews_layout: input.reviews_layout,
      booking_headline: input.booking_headline,
      booking_subcopy: input.booking_subcopy,
      booking_cta_label: input.booking_cta_label,
      booking_cta_url: input.booking_cta_url,
      show_about: input.show_about,
      show_lessons: input.show_lessons,
      show_booking: input.show_booking,
      show_reviews: input.show_reviews,
      show_social_page: input.show_social_page,
      show_resources: input.show_resources,
      show_contact: input.show_contact,
      show_digital: input.show_digital,
      show_faq: input.show_faq,
      show_social_links: input.show_social_links,
      show_social_header_icons: input.show_social_header_icons,
      show_social_footer_icons: input.show_social_footer_icons,
      contact_cta_label: input.contact_cta_label,
      contact_cta_url: input.contact_cta_url,
      additional_pages: input.additional_pages,
    })
    .eq("id", siteId)
    .eq("tutor_id", user.id);
  if (input._prev_updated_at) {
    query = query.eq("updated_at", input._prev_updated_at);
  }
  const { data: updatedRow, error: siteError } = await query.select("id, updated_at").maybeSingle();

  if (siteError) {
    track("site_update_error", { site_id: siteId, reason: siteError.message });
    return { error: "Failed to update site" };
  }
  if (!updatedRow) {
    track("site_update_conflict", { site_id: siteId });
    return { error: "Version conflict. Please refresh and try again." };
  }

  // Update services - delete all and re-insert
  if (input.services !== undefined) {
    const { error: servicesDeleteError } = await supabase
      .from("tutor_site_services")
      .delete()
      .eq("tutor_site_id", siteId);
    if (servicesDeleteError) {
      track("site_update_error", { site_id: siteId, reason: servicesDeleteError.message });
      return { error: "Failed to update site" };
    }

    if (input.services.length > 0) {
      const servicesInsert = input.services.map((serviceId, index) => ({
        tutor_site_id: siteId,
        service_id: serviceId,
        sort_order: index,
      }));

      const { error: servicesError } = await supabase.from("tutor_site_services").insert(servicesInsert);
      if (servicesError) {
        track("site_update_error", { site_id: siteId, reason: servicesError.message });
        return { error: "Failed to update site" };
      }
    }
  }

  // Update reviews - delete all and re-insert
  if (input.reviews !== undefined) {
    const { error: reviewsDeleteError } = await supabase
      .from("tutor_site_reviews")
      .delete()
      .eq("tutor_site_id", siteId);
    if (reviewsDeleteError) {
      track("site_update_error", { site_id: siteId, reason: reviewsDeleteError.message });
      return { error: "Failed to update site" };
    }

    if (input.reviews.length > 0) {
      const reviewsInsert = input.reviews.map((review, index) => ({
        tutor_site_id: siteId,
        author_name: review.author_name,
        quote: review.quote,
        sort_order: index,
      }));

      const { error: reviewsError } = await supabase.from("tutor_site_reviews").insert(reviewsInsert);
      if (reviewsError) {
        track("site_update_error", { site_id: siteId, reason: reviewsError.message });
        return { error: "Failed to update site" };
      }
    }
  }

  // Update resources - delete all and re-insert
  if (input.resources !== undefined) {
    const { error: resourcesDeleteError } = await supabase
      .from("tutor_site_resources")
      .delete()
      .eq("tutor_site_id", siteId);
    if (resourcesDeleteError) {
      track("site_update_error", { site_id: siteId, reason: resourcesDeleteError.message });
      return { error: "Failed to update site" };
    }

    if (input.resources.length > 0) {
      const resourcesInsert = input.resources.map((resource, index) => ({
        tutor_site_id: siteId,
        label: resource.label,
        url: resource.url,
        category: resource.category ?? "social",
        sort_order: index,
      }));

      const { error: resourcesError } = await supabase.from("tutor_site_resources").insert(resourcesInsert);
      if (resourcesError) {
        track("site_update_error", { site_id: siteId, reason: resourcesError.message });
        return { error: "Failed to update site" };
      }
    }
  }

  // Update products - delete all and re-insert
  if (input.products !== undefined) {
    const { error: productsDeleteError } = await supabase
      .from("tutor_site_products")
      .delete()
      .eq("tutor_site_id", siteId);
    if (productsDeleteError) {
      track("site_update_error", { site_id: siteId, reason: productsDeleteError.message });
      return { error: "Failed to update site" };
    }

    if (input.products.length > 0) {
      const productsInsert = input.products.map((productId, index) => ({
        tutor_site_id: siteId,
        product_id: productId,
        sort_order: index,
      }));

      const { error: productsError } = await supabase.from("tutor_site_products").insert(productsInsert);
      if (productsError) {
        track("site_update_error", { site_id: siteId, reason: productsError.message });
        return { error: "Failed to update site" };
      }
    }
  }

  revalidatePath("/pages");
  track("site_updated", { site_id: siteId });
  return { success: true, updated_at: updatedRow.updated_at as string };
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

  // Ensure the tutor has a clean, canonical username for the public URL.
  const { data: profileRow } = await supabase
    .from("profiles")
    .select("username, full_name")
    .eq("id", user.id)
    .maybeSingle<{ username: string | null; full_name: string | null }>();

  const usernameCandidate =
    profileRow?.username ||
    (user.user_metadata as any)?.user_name ||
    (user.user_metadata as any)?.username ||
    profileRow?.full_name ||
    user.email ||
    "";

  const normalizedResult = normalizeAndValidateUsernameSlug(usernameCandidate);
  if (!normalizedResult.valid) {
    return { error: normalizedResult.error || "Set a valid username before publishing." };
  }

  const canonicalUsername = normalizedResult.normalized;

  if (normalizeUsernameSlug(profileRow?.username || "") !== canonicalUsername) {
    const { error: usernameUpdateError } = await supabase
      .from("profiles")
      .update({ username: canonicalUsername })
      .eq("id", user.id);

    if (usernameUpdateError) {
      if ((usernameUpdateError as any).code === "23505") {
        return { error: "That username is already in use. Choose a different one before publishing." };
      }
      return { error: "Unable to set your public URL. Try again." };
    }
  }

  // Fetch current site ensuring ownership
  const { data: site, error: fetchErr } = await getSiteById(supabase, siteId, user.id);
  if (fetchErr || !site) {
    return { error: "Site not found" };
  }

  // Determine next version
  const lastVersion = await getLastVersion(supabase, siteId);
  const nextVersion = (lastVersion || 0) + 1;

  // Build snapshot from current data + related lists
  const children = await listChildren(supabase, siteId);

  const snapshot = {
    site,
    services: children.services,
    reviews: children.reviews,
    resources: children.resources,
    products: children.products,
  };

  // Insert version snapshot
  const { error: insertErr } = await insertVersionSnapshot(supabase, siteId, nextVersion, snapshot, user.id);
  if (insertErr) {
    track("site_publish_error", { site_id: siteId, reason: insertErr.message });
    return { error: "Failed to create version snapshot" };
  }

  // Update published version pointer
  const { error: updateErr } = await supabase
    .from("tutor_sites")
    .update({
      status: "published",
      published_at: new Date().toISOString(),
      published_version: nextVersion,
    })
    .eq("id", siteId)
    .eq("tutor_id", user.id);

  if (updateErr) {
    track("site_publish_error", { site_id: siteId, reason: updateErr.message });
    return { error: "Failed to publish site" };
  }

  revalidatePath("/pages");
  revalidatePath(`/${canonicalUsername}`);
  revalidatePath(`/page/${canonicalUsername}`);
  revalidatePath(`/bio/${canonicalUsername}`);
  revalidatePath(`/profile/${canonicalUsername}`);
  revalidatePath(`/products/${canonicalUsername}`);
  track("site_published", { site_id: siteId });
  return { success: true, username: canonicalUsername };
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

/**
 * Get published snapshot for preview
 */
export async function getPublishedSnapshot(siteId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Fetch pointer
  const { data: site } = await supabase
    .from("tutor_sites")
    .select("published_version,tutor_id")
    .eq("id", siteId)
    .single();

  if (!site || site.tutor_id !== user.id) {
    return { error: "Unauthorized" };
  }
  if (!site.published_version) {
    return { error: "No published version" };
  }

  const { data: versionRow, error } = await supabase
    .from("tutor_site_versions")
    .select("version, snapshot")
    .eq("tutor_site_id", siteId)
    .eq("version", site.published_version)
    .single();
  if (error || !versionRow) {
    return { error: "Published snapshot not found" };
  }

  return { success: true, version: versionRow.version, snapshot: versionRow.snapshot };
}
