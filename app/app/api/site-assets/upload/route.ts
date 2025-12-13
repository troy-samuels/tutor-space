import { Buffer } from "node:buffer";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const SITE_MEDIA_BUCKET = "site-media";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "Select an image to upload." }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only image files are supported." }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Image must be 5MB or smaller." }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
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
      return NextResponse.json({ error: "We couldn't upload that image. Try again." }, { status: 500 });
    }

    const { data: publicUrlData } = supabase.storage.from(SITE_MEDIA_BUCKET).getPublicUrl(path);
    if (!publicUrlData?.publicUrl) {
      return NextResponse.json({ error: "Unable to get uploaded image URL." }, { status: 500 });
    }

    return NextResponse.json({ url: publicUrlData.publicUrl });
  } catch (error) {
    console.error("[SiteAssetUpload] exception", error);
    return NextResponse.json({ error: "Failed to upload image." }, { status: 500 });
  }
}

