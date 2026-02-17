/**
 * POST /api/import/apply
 *
 * Takes confirmed (optionally edited) mapped data and writes it to:
 * - profiles table (name, tagline, bio, avatar, languages, etc.)
 * - tutor_sites table (about section, theme, hero image)
 * - services table (lesson packages)
 * - tutor_site_reviews (imported reviews)
 * - tutor_site_resources (social links)
 *
 * Also re-uploads external images to Supabase storage.
 * Then redirects user to the page builder with everything pre-filled.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { reUploadAssets } from "@/lib/import/assets";
import { mergeEdits } from "@/lib/import/mapper";
import type { MappedPageBuilderData, ImportStatus } from "@/lib/import/types";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => null);
    const importId = body?.importId;
    const edits = body?.edits as Partial<MappedPageBuilderData> | undefined;

    if (!importId) {
      return NextResponse.json(
        { error: "Missing import ID." },
        { status: 400 }
      );
    }

    // Fetch import record
    const { data: record, error: fetchError } = await supabase
      .from("profile_imports")
      .select("id, status, confirmed_data, platform")
      .eq("id", importId)
      .single();

    if (fetchError || !record) {
      return NextResponse.json(
        { error: "Import not found." },
        { status: 404 }
      );
    }

    if (record.status !== "mapped") {
      return NextResponse.json(
        {
          error: `Cannot apply import with status "${record.status}". Expected "mapped".`,
        },
        { status: 400 }
      );
    }

    const baseMapped = record.confirmed_data as MappedPageBuilderData;
    if (!baseMapped?.profile) {
      return NextResponse.json(
        { error: "No mapped data found for this import." },
        { status: 400 }
      );
    }

    // Merge user edits (if any)
    let mapped = edits ? mergeEdits(baseMapped, edits) : baseMapped;

    // Get admin client for writes
    const admin = createServiceRoleClient();
    if (!admin) {
      return NextResponse.json(
        { error: "Server configuration error." },
        { status: 500 }
      );
    }

    // ── Re-upload external assets ────────────────────────────────

    const assetResult = await reUploadAssets(user.id, mapped);
    mapped = assetResult.mapped;

    // ── Write to profiles ────────────────────────────────────────

    const profileUpdate: Record<string, unknown> = {};

    // Only update non-empty fields (don't overwrite existing data with blanks)
    if (mapped.profile.full_name)
      profileUpdate.full_name = mapped.profile.full_name;
    if (mapped.profile.tagline)
      profileUpdate.tagline = mapped.profile.tagline;
    if (mapped.profile.bio)
      profileUpdate.bio = mapped.profile.bio;
    if (mapped.profile.avatar_url)
      profileUpdate.avatar_url = mapped.profile.avatar_url;
    if (mapped.profile.timezone)
      profileUpdate.timezone = mapped.profile.timezone;
    if (mapped.profile.website_url)
      profileUpdate.website_url = mapped.profile.website_url;
    if (mapped.profile.languages_taught)
      profileUpdate.languages_taught = mapped.profile.languages_taught;

    if (Object.keys(profileUpdate).length > 0) {
      const { error: profileError } = await admin
        .from("profiles")
        .update(profileUpdate)
        .eq("id", user.id);

      if (profileError) {
        console.error("[import/apply] Profile update error:", profileError);
      }
    }

    // ── Upsert tutor_site ────────────────────────────────────────

    const siteData = {
      tutor_id: user.id,
      about_title: mapped.site.about_title,
      about_subtitle: mapped.site.about_subtitle,
      about_body: mapped.site.about_body,
      hero_image_url: mapped.site.hero_image_url,
      gallery_images: mapped.site.gallery_images,
      status: "draft",
    };

    // Check if site already exists
    const { data: existingSite } = await admin
      .from("tutor_sites")
      .select("id")
      .eq("tutor_id", user.id)
      .maybeSingle();

    let siteId: string;

    if (existingSite) {
      // Update existing — only overwrite about fields, don't clobber theme etc.
      const { error: siteError } = await admin
        .from("tutor_sites")
        .update({
          about_title: siteData.about_title,
          about_subtitle: siteData.about_subtitle,
          about_body: siteData.about_body,
          hero_image_url: siteData.hero_image_url,
          gallery_images: siteData.gallery_images,
        })
        .eq("id", existingSite.id);

      if (siteError) {
        console.error("[import/apply] Site update error:", siteError);
      }
      siteId = existingSite.id;
    } else {
      // Create new
      const { data: newSite, error: siteError } = await admin
        .from("tutor_sites")
        .insert(siteData)
        .select("id")
        .single();

      if (siteError || !newSite) {
        console.error("[import/apply] Site create error:", siteError);
        return NextResponse.json(
          { error: "Failed to create your page." },
          { status: 500 }
        );
      }
      siteId = newSite.id;
    }

    // ── Insert services ──────────────────────────────────────────

    let servicesCreated = 0;

    if (mapped.services.length > 0) {
      for (const service of mapped.services) {
        const { error: serviceError } = await admin
          .from("services")
          .insert({
            tutor_id: user.id,
            name: service.name,
            description: service.description,
            duration_minutes: service.duration_minutes,
            price: service.price,
            currency: service.currency,
            offer_type: service.offer_type,
            is_active: true,
          });

        if (!serviceError) {
          servicesCreated++;
        } else {
          console.warn("[import/apply] Service insert error:", serviceError.message);
        }
      }
    }

    // ── Insert reviews ───────────────────────────────────────────

    let reviewsCreated = 0;

    if (mapped.reviews.length > 0) {
      for (let i = 0; i < mapped.reviews.length; i++) {
        const review = mapped.reviews[i];
        const { error: reviewError } = await admin
          .from("tutor_site_reviews")
          .insert({
            tutor_site_id: siteId,
            author_name: review.author_name,
            quote: review.quote,
            sort_order: i,
          });

        if (!reviewError) {
          reviewsCreated++;
        }
      }
    }

    // ── Insert resources (social links) ──────────────────────────

    let resourcesCreated = 0;

    if (mapped.resources.length > 0) {
      for (let i = 0; i < mapped.resources.length; i++) {
        const resource = mapped.resources[i];
        const { error: resourceError } = await admin
          .from("tutor_site_resources")
          .insert({
            tutor_site_id: siteId,
            label: resource.label,
            url: resource.url,
            category: resource.category,
            sort_order: i,
          });

        if (!resourceError) {
          resourcesCreated++;
        }
      }
    }

    // ── Mark import as applied ───────────────────────────────────

    await admin
      .from("profile_imports")
      .update({
        status: "applied" as ImportStatus,
        confirmed_data: mapped,
      })
      .eq("id", importId);

    // ── Response ─────────────────────────────────────────────────

    return NextResponse.json({
      success: true,
      siteId,
      summary: {
        profileUpdated: Object.keys(profileUpdate).length > 0,
        servicesCreated,
        reviewsCreated,
        resourcesCreated,
        imagesUploaded: assetResult.uploadedCount,
        imagesFailed: assetResult.failedCount,
      },
      message: "Profile imported successfully! Your page is ready to review.",
    });
  } catch (err) {
    console.error("[import/apply] Error:", err);
    return NextResponse.json(
      { error: "Something went wrong while applying the import." },
      { status: 500 }
    );
  }
}
