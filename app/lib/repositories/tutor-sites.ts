import { SupabaseClient } from "@supabase/supabase-js";

export async function getSiteById(
  supabase: SupabaseClient,
  siteId: string,
  userId: string
) {
  return supabase.from("tutor_sites").select("*").eq("id", siteId).eq("tutor_id", userId).single();
}

export async function listChildren(supabase: SupabaseClient, siteId: string) {
  const [servicesResult, reviewsResult, resourcesResult, productsResult] = await Promise.all([
    supabase.from("tutor_site_services").select("*").eq("tutor_site_id", siteId).order("sort_order"),
    supabase.from("tutor_site_reviews").select("*").eq("tutor_site_id", siteId).order("sort_order"),
    supabase.from("tutor_site_resources").select("*").eq("tutor_site_id", siteId).order("sort_order"),
    supabase.from("tutor_site_products").select("*").eq("tutor_site_id", siteId).order("sort_order"),
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



