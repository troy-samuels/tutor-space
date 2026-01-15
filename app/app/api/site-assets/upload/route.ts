import { Buffer } from "node:buffer";
import { NextRequest, NextResponse } from "next/server";
import { badRequest, internalError, unauthorized } from "@/lib/api/error-responses";
import { createClient } from "@/lib/supabase/server";

const SITE_MEDIA_BUCKET = "site-media";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File) || file.size === 0) {
      return badRequest("Select an image to upload.");
    }

    if (!file.type.startsWith("image/")) {
      return badRequest("Only image files are supported.");
    }

    if (file.size > 5 * 1024 * 1024) {
      return badRequest("Image must be 5MB or smaller.");
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return unauthorized("You must be signed in.");
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const extension = file.name.split(".").pop() ?? "png";
    const path = `${user.id}/site/${Date.now()}-${Math.random().toString(16).slice(2)}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from(SITE_MEDIA_BUCKET)
      .upload(path, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error("[SiteAssetUpload]", uploadError);
      return internalError("We couldn't upload that image. Try again.");
    }

    const { data: publicUrlData } = supabase.storage.from(SITE_MEDIA_BUCKET).getPublicUrl(path);
    if (!publicUrlData?.publicUrl) {
      return internalError("Unable to get uploaded image URL.");
    }

    return NextResponse.json({ url: publicUrlData.publicUrl });
  } catch (error) {
    console.error("[SiteAssetUpload] exception", error);
    return internalError("Failed to upload image.");
  }
}
