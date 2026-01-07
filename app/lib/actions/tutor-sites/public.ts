"use server";

import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { normalizeSiteConfig } from "@/lib/site/site-config";
import { normalizeUsernameSlug } from "@/lib/utils/username-slug";
import { getNextAvailableSlot } from "@/lib/availability/next-slot";
import {
  getPublicProfileByUsername,
  getPublishedSiteByTutorId,
  listActiveServicesForTutor,
  listProductsForTutor,
  listSiteReviewsForPublic,
} from "@/lib/repositories/tutor-sites";
import type { SiteConfig } from "@/lib/types/site";
import type { TutorSiteStatus } from "./types";
import type { ServiceRecord } from "@/lib/types/service";
import type { DigitalProductRecord } from "@/lib/types/digital-product";

/**
 * Fetch public-facing site data (profile, config, services, products, reviews) by username with next available slot.
 */
export async function getPublicSiteData(username: string) {
  const supabase = await createClient();
  const rawLower = String(username ?? "").trim().toLowerCase();
  const normalizedUsername = normalizeUsernameSlug(username) || rawLower;

  let profileResult = await getPublicProfileByUsername(supabase, normalizedUsername);

  if (!profileResult.data && rawLower && rawLower !== normalizedUsername) {
    profileResult = await getPublicProfileByUsername(supabase, rawLower);
  }

  const profile = profileResult.data;
  if (profileResult.error || !profile) {
    return notFound();
  }

  const { data: siteRow } = await getPublishedSiteByTutorId(supabase, profile.id);

  if (!siteRow?.id) {
    return notFound();
  }

  const config = normalizeSiteConfig(siteRow.config as SiteConfig | null);

  const blockVisibility = new Map(config.blocks.map((b) => [b.type, b.isVisible !== false] as const));
  const showServices = blockVisibility.get("services") ?? true;
  const showProducts = blockVisibility.get("products") ?? true;
  const showReviews = blockVisibility.get("reviews") ?? true;

  const { data: services } = await listActiveServicesForTutor(supabase, profile.id);

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

  const { data: products } = await listProductsForTutor(supabase, profile.id);

  const productsEnabled = config.productsEnabled ? new Set(config.productsEnabled) : null;
  const visibleProducts = showProducts
    ? ((products as DigitalProductRecord[] | null) ?? []).filter(
        (product) => !productsEnabled || productsEnabled.has(product.id)
      )
    : [];

  const { data: reviews } = await listSiteReviewsForPublic(supabase, siteRow.id);

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
