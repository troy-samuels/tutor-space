import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";

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
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
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
    await adminClient
      .from("digital_product_purchases")
      .update({ download_count: purchase.download_count + 1 })
      .eq("id", purchase.id);

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

  await adminClient
    .from("digital_product_purchases")
    .update({ download_count: purchase.download_count + 1 })
    .eq("id", purchase.id);

  return NextResponse.redirect(signedUrlData.signedUrl, { status: 302 });
}
