import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/middleware/rate-limit";

type DigitalProductPurchase = {
  id: string;
  status: string;
  download_count: number;
  download_limit: number;
  products: {
    storage_path: string | null;
    fulfillment_type: string | null;
    external_url: string | null;
    tutor_id: string;
  } | null;
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  // Rate limit: 10 download attempts per token per 5 minutes
  const rateLimitResult = await rateLimit(request, {
    limit: 10,
    window: 5 * 60 * 1000, // 5 minutes
  });

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: "Too many download attempts. Please wait a few minutes and try again." },
      { status: 429 }
    );
  }

  const { token } = await params;
  const adminClient = createServiceRoleClient();

  if (!adminClient) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }

  const { data: purchase, error } = await adminClient
    .from("digital_product_purchases")
    .select(
      `
      id,
      status,
      download_count,
      download_limit,
      products:digital_products (
        storage_path,
        fulfillment_type,
        external_url,
        tutor_id
      )
    `
    )
    .eq("download_token", token)
    .single<DigitalProductPurchase>();

  if (error || !purchase) {
    return NextResponse.json({ error: "Link not found." }, { status: 404 });
  }

  if (purchase.status !== "paid") {
    return NextResponse.json({ error: "Payment pending." }, { status: 403 });
  }

  if (purchase.download_count >= purchase.download_limit) {
    return NextResponse.json({ error: "Download limit reached." }, { status: 403 });
  }

  const product = purchase.products;

  if (!product) {
    return NextResponse.json({ error: "Product missing." }, { status: 404 });
  }

  if (product.fulfillment_type === "link" && product.external_url) {
    // Use atomic increment with optimistic locking to prevent race conditions
    const { data: updated, error: updateError } = await adminClient
      .from("digital_product_purchases")
      .update({ download_count: purchase.download_count + 1 })
      .eq("id", purchase.id)
      .eq("download_count", purchase.download_count) // Optimistic lock
      .select("download_count")
      .single();

    if (updateError || !updated) {
      return NextResponse.json({ error: "Download limit reached or concurrent access detected." }, { status: 403 });
    }

    return NextResponse.redirect(product.external_url, { status: 302 });
  }

  if (!product.storage_path) {
    return NextResponse.json({ error: "File unavailable." }, { status: 404 });
  }

  const { data: signedUrlData, error: signedError } = await adminClient.storage
    .from("digital-products")
    .createSignedUrl(product.storage_path, 60 * 5); // 5 minutes

  if (signedError || !signedUrlData?.signedUrl) {
    return NextResponse.json({ error: "Unable to generate download link." }, { status: 500 });
  }

  // Use atomic increment with optimistic locking to prevent race conditions
  const { data: updated, error: updateError } = await adminClient
    .from("digital_product_purchases")
    .update({ download_count: purchase.download_count + 1 })
    .eq("id", purchase.id)
    .eq("download_count", purchase.download_count) // Optimistic lock
    .select("download_count")
    .single();

  if (updateError || !updated) {
    return NextResponse.json({ error: "Download limit reached or concurrent access detected." }, { status: 403 });
  }

  return NextResponse.redirect(signedUrlData.signedUrl, { status: 302 });
}
