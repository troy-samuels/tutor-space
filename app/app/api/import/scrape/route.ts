/**
 * POST /api/import/scrape
 *
 * Accepts a platform URL, resolves the platform, creates a profile_imports record,
 * and kicks off the scrape + normalise pipeline.
 *
 * Returns the import ID immediately for status polling.
 *
 * Rate limit: 3 imports per user per hour (enforced via DB check).
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { resolvePlatform, PLATFORM_LABELS } from "@/lib/import/resolve-platform";
import { isSupportedForScraping, scrapeProfile } from "@/lib/import/scrapers";
import { mapToPageBuilder } from "@/lib/import/mapper";
import type { ImportStatus } from "@/lib/import/types";

// ── Rate limit check ─────────────────────────────────────────────────

const MAX_IMPORTS_PER_HOUR = 3;

async function checkRateLimit(
  tutorId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any
): Promise<boolean> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const { count } = await supabase
    .from("profile_imports")
    .select("id", { count: "exact", head: true })
    .eq("tutor_id", tutorId)
    .gte("created_at", oneHourAgo);

  return (count || 0) < MAX_IMPORTS_PER_HOUR;
}

// ── Background scrape worker ─────────────────────────────────────────

async function runScrapeAndMap(
  importId: string,
  platform: string,
  url: string,
  platformId: string
) {
  const admin = createServiceRoleClient();
  if (!admin) {
    console.error("[import/scrape] No service role client available");
    return;
  }

  try {
    // Update status to scraping
    await admin
      .from("profile_imports")
      .update({
        status: "scraping" as ImportStatus,
        last_scraped_at: new Date().toISOString(),
      })
      .eq("id", importId);

    // Run scraper
    const result = await scrapeProfile(
      platform as Parameters<typeof scrapeProfile>[0],
      url,
      platformId
    );

    if (!result.ok) {
      await admin
        .from("profile_imports")
        .update({
          status: "failed" as ImportStatus,
          error_message: result.error,
        })
        .eq("id", importId);
      return;
    }

    // Store raw + normalised data
    await admin
      .from("profile_imports")
      .update({
        status: "scraped" as ImportStatus,
        raw_data: result.raw,
        normalised_data: result.profile,
      })
      .eq("id", importId);

    // Run mapper
    const mapped = mapToPageBuilder(result.profile);

    // Update to mapped status with confirmed_data pre-populated
    await admin
      .from("profile_imports")
      .update({
        status: "mapped" as ImportStatus,
        confirmed_data: mapped,
      })
      .eq("id", importId);
  } catch (err) {
    console.error("[import/scrape] Unexpected error:", err);

    try {
      await admin
        .from("profile_imports")
        .update({
          status: "failed" as ImportStatus,
          error_message:
            err instanceof Error ? err.message : "Unknown error during scrape",
        })
        .eq("id", importId);
    } catch {
      // Don't throw on cleanup
    }
  }
}

// ── Handler ──────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "You need to be signed in to import a profile." },
        { status: 401 }
      );
    }

    // Parse body
    const body = await request.json().catch(() => null);
    const url = body?.url?.trim();

    if (!url) {
      return NextResponse.json(
        { error: "Please provide a profile URL." },
        { status: 400 }
      );
    }

    // Resolve platform
    const resolved = resolvePlatform(url);

    if (!resolved) {
      return NextResponse.json(
        {
          error:
            "We don't recognise this URL. Supported platforms: iTalki, Preply, Verbling, Cambly.",
        },
        { status: 400 }
      );
    }

    // Check scraper support
    if (!isSupportedForScraping(resolved.platform)) {
      const label = PLATFORM_LABELS[resolved.platform];
      return NextResponse.json(
        {
          error: `${label} import is coming soon. Currently supported: iTalki, Preply, Verbling.`,
        },
        { status: 400 }
      );
    }

    // Rate limit
    const withinLimit = await checkRateLimit(user.id, supabase);
    if (!withinLimit) {
      return NextResponse.json(
        {
          error:
            "You've reached the import limit. Please wait an hour before trying again.",
        },
        { status: 429 }
      );
    }

    // Check for existing import from this platform
    const { data: existing } = await supabase
      .from("profile_imports")
      .select("id, status, scrape_attempts")
      .eq("tutor_id", user.id)
      .eq("platform", resolved.platform)
      .maybeSingle();

    // If already scraping, return existing
    if (existing?.status === "scraping") {
      return NextResponse.json({
        importId: existing.id,
        platform: resolved.platform,
        platformLabel: PLATFORM_LABELS[resolved.platform],
        status: "scraping",
        message: "Import already in progress.",
      });
    }

    // Upsert import record
    const admin = createServiceRoleClient();
    if (!admin) {
      return NextResponse.json(
        { error: "Server configuration error." },
        { status: 500 }
      );
    }

    const importData = {
      tutor_id: user.id,
      platform: resolved.platform,
      platform_profile_id: resolved.id,
      source_url: resolved.canonicalUrl,
      status: "pending" as ImportStatus,
      error_message: null,
      scrape_attempts: (existing?.scrape_attempts || 0) + 1,
    };

    let importId: string;

    if (existing) {
      // Update existing
      const { data, error } = await admin
        .from("profile_imports")
        .update(importData)
        .eq("id", existing.id)
        .select("id")
        .single();

      if (error) {
        return NextResponse.json(
          { error: `Failed to start import: ${error.message}` },
          { status: 500 }
        );
      }
      importId = data.id;
    } else {
      // Insert new
      const { data, error } = await admin
        .from("profile_imports")
        .insert(importData)
        .select("id")
        .single();

      if (error) {
        return NextResponse.json(
          { error: `Failed to start import: ${error.message}` },
          { status: 500 }
        );
      }
      importId = data.id;
    }

    // Fire and forget — scrape runs in background
    runScrapeAndMap(
      importId,
      resolved.platform,
      resolved.canonicalUrl,
      resolved.id
    ).catch((err) =>
      console.error("[import/scrape] Background error:", err)
    );

    return NextResponse.json({
      importId,
      platform: resolved.platform,
      platformLabel: PLATFORM_LABELS[resolved.platform],
      status: "scraping",
      message: `Importing from ${PLATFORM_LABELS[resolved.platform]}…`,
    });
  } catch (err) {
    console.error("[import/scrape] Handler error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
