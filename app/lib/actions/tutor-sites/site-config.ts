"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { track } from "@/lib/telemetry/tracker";
import { upsertSiteConfigByTutorId } from "@/lib/repositories/tutor-sites";
import type { SiteConfig } from "@/lib/types/site";

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

  const { data, error } = await upsertSiteConfigByTutorId(supabase, user.id, config);

  if (error || !data) {
    track("site_config_upsert_error", { reason: error?.message });
    return { error: "Failed to save site configuration" };
  }

  revalidatePath("/pages");
  revalidatePath(`/site/${user.id}`);
  track("site_config_upserted", { site_id: data.id });

  return { success: true, siteId: data.id, config: data.config as SiteConfig };
}
