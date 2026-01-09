import { SupabaseClient } from "@supabase/supabase-js";
import { recordAudit, type AuditActionType } from "./audit";

export async function getSiteById(
  supabase: SupabaseClient,
  siteId: string,
  userId: string
) {
  return supabase
    .from("tutor_sites")
    .select("*")
    .eq("id", siteId)
    .eq("tutor_id", userId)
    .is("deleted_at", null)
    .single();
}

export async function listChildren(supabase: SupabaseClient, siteId: string) {
  const [servicesResult, reviewsResult, resourcesResult, productsResult] = await Promise.all([
    supabase
      .from("tutor_site_services")
      .select("*")
      .eq("tutor_site_id", siteId)
      .is("deleted_at", null)
      .order("sort_order"),
    supabase
      .from("tutor_site_reviews")
      .select("*")
      .eq("tutor_site_id", siteId)
      .is("deleted_at", null)
      .order("sort_order"),
    supabase
      .from("tutor_site_resources")
      .select("*")
      .eq("tutor_site_id", siteId)
      .is("deleted_at", null)
      .order("sort_order"),
    supabase
      .from("tutor_site_products")
      .select("*")
      .eq("tutor_site_id", siteId)
      .is("deleted_at", null)
      .order("sort_order"),
  ]);

  return {
    services: servicesResult.data || [],
    reviews: reviewsResult.data || [],
    resources: resourcesResult.data || [],
    products: productsResult.data || [],
  };
}

export async function getLastVersion(supabase: SupabaseClient, siteId: string) {
  const { data } = await supabase
    .from("tutor_site_versions")
    .select("version")
    .eq("tutor_site_id", siteId)
    .order("version", { ascending: false })
    .limit(1);
  return Array.isArray(data) && data.length > 0 ? (data[0] as any).version : 0;
}

export async function insertVersionSnapshot(
  supabase: SupabaseClient,
  siteId: string,
  version: number,
  snapshot: unknown,
  createdBy: string
) {
  return supabase.from("tutor_site_versions").insert({
    tutor_site_id: siteId,
    version,
    snapshot,
    created_by: createdBy,
  });
}

export async function getSiteByTutorId(supabase: SupabaseClient, tutorId: string) {
  return supabase
    .from("tutor_sites")
    .select("*")
    .eq("tutor_id", tutorId)
    .is("deleted_at", null)
    .maybeSingle();
}

export async function getSiteConfigByTutorId(supabase: SupabaseClient, tutorId: string) {
  return supabase
    .from("tutor_sites")
    .select("id, config, updated_at, status")
    .eq("tutor_id", tutorId)
    .is("deleted_at", null)
    .maybeSingle();
}

export async function upsertSiteConfigByTutorId(
  supabase: SupabaseClient,
  tutorId: string,
  config: unknown
) {
  return supabase
    .from("tutor_sites")
    .upsert({ tutor_id: tutorId, config }, { onConflict: "tutor_id" })
    .select("id, config, updated_at")
    .single();
}

export async function getPublishedSiteByTutorId(supabase: SupabaseClient, tutorId: string) {
  return supabase
    .from("tutor_sites")
    .select("id, config")
    .eq("tutor_id", tutorId)
    .eq("status", "published")
    .is("deleted_at", null)
    .maybeSingle();
}

export async function createSiteRow(supabase: SupabaseClient, data: Record<string, unknown>) {
  return supabase.from("tutor_sites").insert(data).select().single();
}

export async function updateSiteRow(
  supabase: SupabaseClient,
  siteId: string,
  tutorId: string,
  data: Record<string, unknown>,
  prevUpdatedAt?: string
) {
  let query = supabase
    .from("tutor_sites")
    .update(data)
    .eq("id", siteId)
    .eq("tutor_id", tutorId)
    .is("deleted_at", null);

  if (prevUpdatedAt) {
    query = query.eq("updated_at", prevUpdatedAt);
  }

  return query.select("id, updated_at").maybeSingle();
}

export async function updateSitePublishState(
  supabase: SupabaseClient,
  siteId: string,
  tutorId: string,
  data: Record<string, unknown>
) {
  return supabase
    .from("tutor_sites")
    .update(data)
    .eq("id", siteId)
    .eq("tutor_id", tutorId)
    .is("deleted_at", null);
}

/**
 * Update a site with before/after audit trail.
 * Records a snapshot of both the old and new state for compliance.
 *
 * @param supabase - Client for data operations
 * @param adminClient - Service role client for audit log (bypasses RLS)
 * @param siteId - Site to update
 * @param tutorId - Site owner
 * @param updates - Fields to update
 * @param actionType - Specific action type for audit trail
 */
export async function updateSiteWithAudit(
  supabase: SupabaseClient,
  adminClient: SupabaseClient,
  siteId: string,
  tutorId: string,
  updates: Record<string, unknown>,
  actionType: AuditActionType = "update"
): Promise<{ success: boolean; error?: string }> {
  // 1. Fetch before state
  const { data: beforeState, error: beforeError } = await supabase
    .from("tutor_sites")
    .select("*")
    .eq("id", siteId)
    .eq("tutor_id", tutorId)
    .is("deleted_at", null)
    .single();

  if (beforeError) {
    return { success: false, error: beforeError.message };
  }

  // 2. Apply update
  const { data: afterState, error: updateError } = await supabase
    .from("tutor_sites")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", siteId)
    .eq("tutor_id", tutorId)
    .is("deleted_at", null)
    .select()
    .single();

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  // 3. Record audit with before/after snapshots
  await recordAudit(adminClient, {
    actorId: tutorId,
    targetId: siteId,
    entityType: "site",
    actionType,
    beforeState: beforeState as Record<string, unknown>,
    afterState: afterState as Record<string, unknown>,
  });

  return { success: true };
}

export async function listSiteServices(supabase: SupabaseClient, siteId: string) {
  return supabase
    .from("tutor_site_services")
    .select("*")
    .eq("tutor_site_id", siteId)
    .is("deleted_at", null)
    .order("sort_order");
}

export async function listSiteReviews(supabase: SupabaseClient, siteId: string) {
  return supabase
    .from("tutor_site_reviews")
    .select("*")
    .eq("tutor_site_id", siteId)
    .is("deleted_at", null)
    .order("sort_order");
}

export async function listSiteResources(supabase: SupabaseClient, siteId: string) {
  return supabase
    .from("tutor_site_resources")
    .select("*")
    .eq("tutor_site_id", siteId)
    .is("deleted_at", null)
    .order("sort_order");
}

export async function listSiteProducts(supabase: SupabaseClient, siteId: string) {
  return supabase
    .from("tutor_site_products")
    .select("*")
    .eq("tutor_site_id", siteId)
    .is("deleted_at", null)
    .order("sort_order");
}

/**
 * Soft delete all services for a site.
 */
export async function softDeleteSiteServices(supabase: SupabaseClient, siteId: string) {
  return supabase
    .from("tutor_site_services")
    .update({ deleted_at: new Date().toISOString() })
    .eq("tutor_site_id", siteId)
    .is("deleted_at", null);
}

/**
 * Soft delete all reviews for a site.
 */
export async function softDeleteSiteReviews(supabase: SupabaseClient, siteId: string) {
  return supabase
    .from("tutor_site_reviews")
    .update({ deleted_at: new Date().toISOString() })
    .eq("tutor_site_id", siteId)
    .is("deleted_at", null);
}

/**
 * Soft delete all resources for a site.
 */
export async function softDeleteSiteResources(supabase: SupabaseClient, siteId: string) {
  return supabase
    .from("tutor_site_resources")
    .update({ deleted_at: new Date().toISOString() })
    .eq("tutor_site_id", siteId)
    .is("deleted_at", null);
}

/**
 * Soft delete a site resource by setting deleted_at timestamp.
 * Includes ownership check via tutor_site_id.
 */
export async function softDeleteSiteResource(
  supabase: SupabaseClient,
  resourceId: string,
  siteId: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from("tutor_site_resources")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", resourceId)
    .eq("tutor_site_id", siteId)
    .is("deleted_at", null);

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}

/**
 * Restore a soft-deleted site resource.
 */
export async function restoreSiteResource(
  supabase: SupabaseClient,
  resourceId: string,
  siteId: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from("tutor_site_resources")
    .update({ deleted_at: null })
    .eq("id", resourceId)
    .eq("tutor_site_id", siteId);

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}

/**
 * Soft delete all products for a site.
 */
export async function softDeleteSiteProducts(supabase: SupabaseClient, siteId: string) {
  return supabase
    .from("tutor_site_products")
    .update({ deleted_at: new Date().toISOString() })
    .eq("tutor_site_id", siteId)
    .is("deleted_at", null);
}

export async function insertSiteServices(
  supabase: SupabaseClient,
  rows: Array<{ tutor_site_id: string; service_id: string; sort_order: number }>
) {
  return supabase.from("tutor_site_services").insert(rows);
}

export async function insertSiteReviews(
  supabase: SupabaseClient,
  rows: Array<{ tutor_site_id: string; author_name: string; quote: string; sort_order: number }>
) {
  return supabase.from("tutor_site_reviews").insert(rows);
}

export async function countSiteReviewsBySiteId(supabase: SupabaseClient, siteId: string) {
  return supabase
    .from("tutor_site_reviews")
    .select("id", { count: "exact", head: true })
    .eq("tutor_site_id", siteId);
}

export async function insertTutorSiteReview(
  supabase: SupabaseClient,
  data: {
    tutor_site_id: string;
    author_name: string;
    quote: string;
    sort_order: number;
    student_id?: string | null;
    review_id?: string | null;
    rating?: number | null;
  }
) {
  return supabase.from("tutor_site_reviews").insert(data);
}

export async function getTutorSiteReviewByReviewId(
  supabase: SupabaseClient,
  reviewId: string
) {
  return supabase
    .from("tutor_site_reviews")
    .select("author_name")
    .eq("review_id", reviewId)
    .maybeSingle();
}

export async function updateTutorSiteReviewByReviewId(
  supabase: SupabaseClient,
  reviewId: string,
  data: { author_name?: string; quote?: string; rating?: number | null }
) {
  return supabase.from("tutor_site_reviews").update(data).eq("review_id", reviewId);
}

export async function insertSiteResources(
  supabase: SupabaseClient,
  rows: Array<{ tutor_site_id: string; label: string; url: string; category: string | null; sort_order: number }>
) {
  return supabase.from("tutor_site_resources").insert(rows);
}

export async function insertSiteProducts(
  supabase: SupabaseClient,
  rows: Array<{ tutor_site_id: string; product_id: string; sort_order: number }>
) {
  return supabase.from("tutor_site_products").insert(rows);
}

export async function listActiveServicesForTutor(supabase: SupabaseClient, tutorId: string) {
  return supabase
    .from("services")
    .select(
      "id, name, description, duration_minutes, price_amount, price, currency, price_currency, is_active, offer_type"
    )
    .eq("tutor_id", tutorId)
    .eq("is_active", true)
    .is("deleted_at", null)
    .order("price_amount", { ascending: true });
}

export async function listProductsForTutor(supabase: SupabaseClient, tutorId: string) {
  return supabase
    .from("digital_products")
    .select("id, title, description, price_cents, currency, published, is_active")
    .eq("tutor_id", tutorId)
    .eq("published", true)
    .order("price_cents", { ascending: true });
}

export async function listSiteReviewsForPublic(supabase: SupabaseClient, siteId: string) {
  return supabase
    .from("tutor_site_reviews")
    .select("author_name, quote, rating, sort_order")
    .eq("tutor_site_id", siteId)
    .order("sort_order", { ascending: true });
}

export async function getProfileBasicsById(supabase: SupabaseClient, tutorId: string) {
  return supabase.from("profiles").select("username, full_name").eq("id", tutorId).maybeSingle();
}

export async function updateProfileUsername(
  supabase: SupabaseClient,
  tutorId: string,
  username: string
) {
  return supabase.from("profiles").update({ username }).eq("id", tutorId);
}

export async function getPublishedVersionPointer(supabase: SupabaseClient, siteId: string) {
  return supabase
    .from("tutor_sites")
    .select("published_version, tutor_id")
    .eq("id", siteId)
    .is("deleted_at", null)
    .single();
}

export async function getSiteVersionSnapshot(
  supabase: SupabaseClient,
  siteId: string,
  version: number
) {
  return supabase
    .from("tutor_site_versions")
    .select("version, snapshot")
    .eq("tutor_site_id", siteId)
    .eq("version", version)
    .single();
}

export async function listPublishedSitesWithProfiles(supabase: SupabaseClient) {
  return supabase
    .from("tutor_sites")
    .select("tutor_id, updated_at, profiles!inner(username)")
    .eq("status", "published")
    .is("deleted_at", null);
}

export async function getPublicProfileByUsername(supabase: SupabaseClient, username: string) {
  return supabase
    .from("public_profiles")
    .select(
      "id, username, full_name, avatar_url, bio, tagline, languages_taught, timezone, instagram_handle, tiktok_handle, facebook_handle, x_handle, website_url, created_at"
    )
    .eq("username", username)
    .maybeSingle();
}

export async function getPublicProfileByUsernameWithEmail(supabase: SupabaseClient, username: string) {
  return supabase
    .from("public_profiles")
    .select(
      "id, full_name, username, tagline, bio, avatar_url, email, stripe_payment_link, languages_taught, instagram_handle, tiktok_handle, facebook_handle, x_handle, website_url"
    )
    .eq("username", username)
    .single();
}

export async function listSiteServicesBySiteId(supabase: SupabaseClient, siteId: string) {
  return supabase.from("tutor_site_services").select("service_id").eq("tutor_site_id", siteId);
}

export async function listSiteReviewsForPublicPage(supabase: SupabaseClient, siteId: string) {
  return supabase
    .from("tutor_site_reviews")
    .select("author_name, quote, rating")
    .eq("tutor_site_id", siteId)
    .order("sort_order");
}

export async function listSiteResourcesForPublicPage(supabase: SupabaseClient, siteId: string) {
  return supabase
    .from("tutor_site_resources")
    .select("id, label, url")
    .eq("tutor_site_id", siteId)
    .is("deleted_at", null);
}

export async function getTutorSiteByTutorIdAndStatus(
  supabase: SupabaseClient,
  tutorId: string,
  status: string
) {
  return supabase
    .from("tutor_sites")
    .select("*")
    .eq("tutor_id", tutorId)
    .eq("status", status)
    .is("deleted_at", null)
    .single();
}
