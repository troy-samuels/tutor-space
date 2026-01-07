"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { tutorSiteDataSchema } from "@/lib/validators/tutor-site";
import { track } from "@/lib/telemetry/tracker";
import {
  createSiteRow,
  softDeleteSiteProducts,
  softDeleteSiteResources,
  softDeleteSiteReviews,
  softDeleteSiteServices,
  getSiteById,
  getSiteByTutorId,
  insertSiteProducts,
  insertSiteResources,
  insertSiteReviews,
  insertSiteServices,
  listChildren,
  updateSiteRow,
} from "@/lib/repositories/tutor-sites";
import { recordAudit } from "@/lib/repositories/audit";
import {
  getTraceId,
  createRequestLogger,
  withActionLogging,
} from "@/lib/logger";
import type {
  TutorSite,
  TutorSiteData,
  TutorSiteProduct,
  TutorSiteResource,
  TutorSiteReview,
  TutorSiteService,
} from "./types";

async function buildSiteSnapshot(
  supabase: Awaited<ReturnType<typeof createClient>>,
  siteId: string,
  tutorId: string
) {
  const { data: site } = await getSiteById(supabase, siteId, tutorId);
  if (!site) {
    return null;
  }

  const children = await listChildren(supabase, siteId);

  return {
    site,
    services: children.services,
    reviews: children.reviews,
    resources: children.resources,
    products: children.products,
  };
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

  const { data: site, error } = await getSiteByTutorId(supabase, user.id);

  if (error && error.code !== "PGRST116") {
    return { error: "Failed to fetch site" };
  }

  if (!site) {
    return {
      site: null,
      services: [],
      reviews: [],
      resources: [],
      products: [],
    };
  }

  const children = await listChildren(supabase, site.id);

  return {
    site: site as TutorSite,
    services: (children.services as TutorSiteService[]) || [],
    reviews: (children.reviews as TutorSiteReview[]) || [],
    resources: (children.resources as TutorSiteResource[]) || [],
    products: (children.products as TutorSiteProduct[]) || [],
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

  // Set up structured logging
  const traceId = await getTraceId();
  const log = createRequestLogger(traceId, user.id);

  return withActionLogging("createSite", log, { hasData: !!data }, async () => {
    // Validate input (tolerant: all fields optional but types must match)
    const parsed = tutorSiteDataSchema.safeParse(data);
    if (!parsed.success) {
      return { error: "Invalid input" };
    }
    const input = parsed.data;

    const { data: site, error: siteError } = await createSiteRow(supabase, {
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
  });

  if (siteError || !site) {
    track("site_create_error", { reason: siteError?.message });
    return { error: "Failed to create site" };
  }

  if (input.services && input.services.length > 0) {
    const servicesInsert = input.services.map((serviceId, index) => ({
      tutor_site_id: site.id,
      service_id: serviceId,
      sort_order: index,
    }));

    const { error: servicesError } = await insertSiteServices(supabase, servicesInsert);
    if (servicesError) {
      track("site_create_error", { site_id: site.id, reason: servicesError.message });
      return { error: "Failed to create site" };
    }
  }

  if (input.reviews && input.reviews.length > 0) {
    const reviewsInsert = input.reviews.map((review, index) => ({
      tutor_site_id: site.id,
      author_name: review.author_name,
      quote: review.quote,
      sort_order: index,
    }));

    const { error: reviewsError } = await insertSiteReviews(supabase, reviewsInsert);
    if (reviewsError) {
      track("site_create_error", { site_id: site.id, reason: reviewsError.message });
      return { error: "Failed to create site" };
    }
  }

  if (input.resources && input.resources.length > 0) {
    const resourcesInsert = input.resources.map((resource, index) => ({
      tutor_site_id: site.id,
      label: resource.label,
      url: resource.url,
      category: resource.category ?? "social",
      sort_order: index,
    }));

    const { error: resourcesError } = await insertSiteResources(supabase, resourcesInsert);
    if (resourcesError) {
      track("site_create_error", { site_id: site.id, reason: resourcesError.message });
      return { error: "Failed to create site" };
    }
  }

  if (input.products && input.products.length > 0) {
    const productsInsert = input.products.map((productId, index) => ({
      tutor_site_id: site.id,
      product_id: productId,
      sort_order: index,
    }));

    const { error: productsError } = await insertSiteProducts(supabase, productsInsert);
    if (productsError) {
      track("site_create_error", { site_id: site.id, reason: productsError.message });
      return { error: "Failed to create site" };
    }
  }

    // Record audit log for site creation
    const adminClient = createServiceRoleClient();
    if (adminClient) {
      await recordAudit(adminClient, {
        actorId: user.id,
        targetId: site.id,
        entityType: "site",
        actionType: "site_created",
        metadata: {
          about_title: input.about_title,
          theme_archetype_id: input.theme_archetype_id,
        },
      });
    }

    revalidatePath("/pages");
    track("site_created", { site_id: site.id });
    return { success: true, site };
  });
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

  // Set up structured logging
  const traceId = await getTraceId();
  const log = createRequestLogger(traceId, user.id);

  return withActionLogging("updateSite", log, { siteId }, async () => {
    const parsed = tutorSiteDataSchema.safeParse(data);
    if (!parsed.success) {
      return { error: "Invalid input" };
    }
    const input = parsed.data;

    const beforeState = await buildSiteSnapshot(supabase, siteId, user.id);

  const { data: updatedRow, error: siteError } = await updateSiteRow(
    supabase,
    siteId,
    user.id,
    {
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
    },
    input._prev_updated_at
  );

  if (siteError) {
    track("site_update_error", { site_id: siteId, reason: siteError.message });
    return { error: "Failed to update site" };
  }
  if (!updatedRow) {
    track("site_update_conflict", { site_id: siteId });
    return { error: "Version conflict. Please refresh and try again." };
  }

  if (input.services !== undefined) {
    const { error: servicesDeleteError } = await softDeleteSiteServices(supabase, siteId);
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

      const { error: servicesError } = await insertSiteServices(supabase, servicesInsert);
      if (servicesError) {
        track("site_update_error", { site_id: siteId, reason: servicesError.message });
        return { error: "Failed to update site" };
      }
    }
  }

  if (input.reviews !== undefined) {
    const { error: reviewsDeleteError } = await softDeleteSiteReviews(supabase, siteId);
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

      const { error: reviewsError } = await insertSiteReviews(supabase, reviewsInsert);
      if (reviewsError) {
        track("site_update_error", { site_id: siteId, reason: reviewsError.message });
        return { error: "Failed to update site" };
      }
    }
  }

  if (input.resources !== undefined) {
    const { error: resourcesDeleteError } = await softDeleteSiteResources(supabase, siteId);
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

      const { error: resourcesError } = await insertSiteResources(supabase, resourcesInsert);
      if (resourcesError) {
        track("site_update_error", { site_id: siteId, reason: resourcesError.message });
        return { error: "Failed to update site" };
      }
    }
  }

  if (input.products !== undefined) {
    const { error: productsDeleteError } = await softDeleteSiteProducts(supabase, siteId);
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

      const { error: productsError } = await insertSiteProducts(supabase, productsInsert);
      if (productsError) {
        track("site_update_error", { site_id: siteId, reason: productsError.message });
        return { error: "Failed to update site" };
      }
    }
  }

    const afterState = await buildSiteSnapshot(supabase, siteId, user.id);

    // Record audit log for site update
    const adminClient = createServiceRoleClient();
    if (adminClient && beforeState && afterState) {
      await recordAudit(adminClient, {
        actorId: user.id,
        targetId: siteId,
        entityType: "site",
        actionType: "site_metadata_updated",
        beforeState,
        afterState,
      });
    }

    revalidatePath("/pages");
    track("site_updated", { site_id: siteId });
    return { success: true, updated_at: updatedRow.updated_at as string };
  });
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

  const { data: existingSite } = await getSiteById(supabase, siteId, user.id);

  if (!existingSite) {
    return createSite(data);
  }

  return updateSite(siteId, data);
}
