"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { track } from "@/lib/telemetry/tracker";
import {
  getLastVersion,
  getSiteById,
  insertVersionSnapshot,
  listChildren,
  updateSitePublishState,
  getProfileBasicsById,
  updateProfileUsername,
  getPublishedVersionPointer,
  getSiteVersionSnapshot,
} from "@/lib/repositories/tutor-sites";
import { recordAudit } from "@/lib/repositories/audit";
import {
  getTraceId,
  createRequestLogger,
  withActionLogging,
} from "@/lib/logger";
import {
  findFirstValidUsernameSlug,
  normalizeAndValidateUsernameSlug,
  normalizeUsernameSlug,
} from "@/lib/utils/username-slug";

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

  // Set up structured logging
  const traceId = await getTraceId();
  const log = createRequestLogger(traceId, user.id);

  return withActionLogging("publishSite", log, { siteId }, async () => {
    // Ensure the tutor has a clean, canonical username for the public URL.
    const { data: profileRow } = await getProfileBasicsById(supabase, user.id);

    const explicitUsername =
      profileRow?.username ||
      (user.user_metadata as any)?.user_name ||
      (user.user_metadata as any)?.username ||
      "";

    let canonicalUsername = "";

    if (explicitUsername) {
      const normalizedResult = normalizeAndValidateUsernameSlug(explicitUsername);
      if (!normalizedResult.valid) {
        return { error: normalizedResult.error || "Set a valid username before publishing." };
      }
      canonicalUsername = normalizedResult.normalized;
    } else {
      const fallbackUsername = findFirstValidUsernameSlug([
        profileRow?.full_name || "",
        user.email || "",
      ]);

      if (!fallbackUsername) {
        return { error: "Set a valid username before publishing." };
      }

      canonicalUsername = fallbackUsername;
    }

  if (normalizeUsernameSlug(profileRow?.username || "") !== canonicalUsername) {
    const { error: usernameUpdateError } = await updateProfileUsername(
      supabase,
      user.id,
      canonicalUsername
    );

    if (usernameUpdateError) {
      if ((usernameUpdateError as any).code === "23505") {
        return { error: "That username is already in use. Choose a different one before publishing." };
      }
      return { error: "Unable to set your public URL. Try again." };
    }
  }

  const { data: site, error: fetchErr } = await getSiteById(supabase, siteId, user.id);
  if (fetchErr || !site) {
    return { error: "Site not found" };
  }

  const lastVersion = await getLastVersion(supabase, siteId);
  const nextVersion = (lastVersion || 0) + 1;

  const children = await listChildren(supabase, siteId);

  const snapshot = {
    site,
    services: children.services,
    reviews: children.reviews,
    resources: children.resources,
    products: children.products,
  };

  const { error: insertErr } = await insertVersionSnapshot(
    supabase,
    siteId,
    nextVersion,
    snapshot,
    user.id
  );
  if (insertErr) {
    track("site_publish_error", { site_id: siteId, reason: insertErr.message });
    return { error: "Failed to create version snapshot" };
  }

  const { error: updateErr } = await updateSitePublishState(supabase, siteId, user.id, {
    status: "published",
    published_at: new Date().toISOString(),
    published_version: nextVersion,
  });

  if (updateErr) {
    track("site_publish_error", { site_id: siteId, reason: updateErr.message });
    return { error: "Failed to publish site" };
  }

    // Record audit log for site publish
    const adminClient = createServiceRoleClient();
    if (adminClient) {
      await recordAudit(adminClient, {
        actorId: user.id,
        targetId: siteId,
        entityType: "site",
        actionType: "site_published",
        metadata: {
          version: nextVersion,
          username: canonicalUsername,
        },
      });
    }

    revalidatePath("/pages");
    revalidatePath(`/${canonicalUsername}`);
    revalidatePath(`/page/${canonicalUsername}`);
    revalidatePath(`/bio/${canonicalUsername}`);
    revalidatePath(`/profile/${canonicalUsername}`);
    revalidatePath(`/products/${canonicalUsername}`);
    track("site_published", { site_id: siteId });
    return { success: true, username: canonicalUsername };
  });
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

  const { data: site } = await getPublishedVersionPointer(supabase, siteId);

  if (!site || site.tutor_id !== user.id) {
    return { error: "Unauthorized" };
  }
  if (!site.published_version) {
    return { error: "No published version" };
  }

  const { data: versionRow, error } = await getSiteVersionSnapshot(
    supabase,
    siteId,
    site.published_version
  );
  if (error || !versionRow) {
    return { error: "Published snapshot not found" };
  }

  return { success: true, version: versionRow.version, snapshot: versionRow.snapshot };
}
