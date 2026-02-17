/**
 * Asset Re-Upload Pipeline
 *
 * External image URLs (from iTalki, Preply, etc.) can't be used long-term:
 * - Hotlink protection may block them
 * - CDN URLs expire
 * - We lose control over image optimisation
 *
 * This module downloads external images and re-uploads them to our
 * Supabase storage, returning permanent public URLs.
 */

import { createServiceRoleClient } from "@/lib/supabase/admin";
import type { MappedPageBuilderData } from "./types";

// ── Configuration ────────────────────────────────────────────────────

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const DOWNLOAD_TIMEOUT_MS = 15_000;
const ALLOWED_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

// ── Download helper ──────────────────────────────────────────────────

type DownloadResult = {
  buffer: Buffer;
  contentType: string;
  extension: string;
};

async function downloadImage(url: string): Promise<DownloadResult> {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    DOWNLOAD_TIMEOUT_MS
  );

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        Accept: "image/*",
      },
      redirect: "follow",
    });

    if (!response.ok) {
      throw new Error(`Download failed: HTTP ${response.status}`);
    }

    const contentType =
      response.headers.get("content-type") || "image/jpeg";

    // Validate content type
    const baseType = contentType.split(";")[0].trim().toLowerCase();
    if (!ALLOWED_CONTENT_TYPES.includes(baseType)) {
      throw new Error(
        `Unsupported image type: ${baseType}`
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Size check
    if (buffer.length > MAX_IMAGE_SIZE_BYTES) {
      throw new Error(
        `Image too large: ${(buffer.length / 1024 / 1024).toFixed(1)}MB`
      );
    }

    if (buffer.length === 0) {
      throw new Error("Downloaded image is empty");
    }

    // Determine extension from content type
    const ext = extFromContentType(baseType);

    return { buffer, contentType: baseType, extension: ext };
  } finally {
    clearTimeout(timeout);
  }
}

function extFromContentType(ct: string): string {
  switch (ct) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    default:
      return "jpg";
  }
}

// ── Upload helper ────────────────────────────────────────────────────

async function uploadToStorage(
  bucket: string,
  path: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  const supabase = createServiceRoleClient();

  if (!supabase) {
    throw new Error("Service role client not available — check SUPABASE_SERVICE_ROLE_KEY");
  }

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, buffer, {
      contentType,
      upsert: true,
    });

  if (error) {
    throw new Error(
      `Upload failed for ${path}: ${error.message}`
    );
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

// ── Check if URL is already on our storage ───────────────────────────

function isOurStorage(url: string): boolean {
  if (!url) return false;
  return (
    url.includes("supabase.co/storage") ||
    url.includes("supabase.in/storage")
  );
}

// ── Main re-upload function ──────────────────────────────────────────

export type AssetUploadResult = {
  mapped: MappedPageBuilderData;
  uploadedCount: number;
  failedCount: number;
  errors: string[];
};

/**
 * Downloads all external images in the mapped data and re-uploads them
 * to Supabase storage. Mutates the mapped data in place with new URLs.
 *
 * Non-critical: if an individual image fails, we log it and skip.
 * The profile can still be applied without images.
 */
export async function reUploadAssets(
  tutorId: string,
  mapped: MappedPageBuilderData
): Promise<AssetUploadResult> {
  let uploadedCount = 0;
  let failedCount = 0;
  const errors: string[] = [];
  const timestamp = Date.now();

  // ── Avatar ──────────────────────────────────────────────────

  if (mapped.profile.avatar_url && !isOurStorage(mapped.profile.avatar_url)) {
    try {
      const { buffer, contentType, extension } = await downloadImage(
        mapped.profile.avatar_url
      );

      const path = `${tutorId}/imported-avatar-${timestamp}.${extension}`;
      const newUrl = await uploadToStorage(
        "avatars",
        path,
        buffer,
        contentType
      );

      mapped.profile.avatar_url = newUrl;
      mapped.site.hero_image_url = newUrl;
      uploadedCount++;
    } catch (err) {
      const msg = `Avatar upload failed: ${err instanceof Error ? err.message : String(err)}`;
      errors.push(msg);
      failedCount++;
      // Keep original URL as fallback — better than nothing
    }
  }

  // ── Gallery images ──────────────────────────────────────────

  const newGallery: string[] = [];

  for (let i = 0; i < mapped.site.gallery_images.length; i++) {
    const url = mapped.site.gallery_images[i];

    if (!url || isOurStorage(url)) {
      newGallery.push(url);
      continue;
    }

    try {
      const { buffer, contentType, extension } = await downloadImage(url);

      const path = `${tutorId}/imported-gallery-${i}-${timestamp}.${extension}`;
      const newUrl = await uploadToStorage(
        "site-assets",
        path,
        buffer,
        contentType
      );

      newGallery.push(newUrl);
      uploadedCount++;
    } catch (err) {
      const msg = `Gallery image ${i} failed: ${err instanceof Error ? err.message : String(err)}`;
      errors.push(msg);
      failedCount++;
      // Skip failed gallery images entirely
    }
  }

  mapped.site.gallery_images = newGallery;

  return { mapped, uploadedCount, failedCount, errors };
}
