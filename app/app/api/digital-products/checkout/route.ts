import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";
import { RateLimiters } from "@/lib/middleware/rate-limit";

export async function POST(request: NextRequest) {
  // SECURITY: Rate limit public checkout endpoint
  const rateLimitResult = await RateLimiters.booking(request);
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: rateLimitResult.error }, { status: 429 });
  }

  const body = await request.json();
  const { productId, buyerEmail, buyerName, tutorUsername } = body ?? {};

  if (!productId || !buyerEmail) {
    return NextResponse.json({ error: "Product and email required." }, { status: 400 });
  }
  const normalizedEmail = String(buyerEmail).trim().toLowerCase();
  if (!normalizedEmail) {
    return NextResponse.json({ error: "Product and email required." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: product, error } = await supabase
    .from("digital_products")
    .select("id, tutor_id, title, price_cents, currency, stripe_price_id, published, slug")
    .eq("id", productId)
    .single();

  if (error || !product || !product.published) {
    return NextResponse.json({ error: "Product not available." }, { status: 404 });
  }

  if (!product.stripe_price_id) {
    return NextResponse.json({ error: "Product not ready for checkout." }, { status: 400 });
  }

  const adminClient = createServiceRoleClient();
  if (!adminClient) {
    return NextResponse.json({ error: "Server configuration error." }, { status: 500 });
  }

  // Generate a secure download token for the purchase
  const downloadToken = randomBytes(32).toString("hex");

  const { data: existingPurchase } = await adminClient
    .from("digital_product_purchases")
    .select("id, stripe_session_id, created_at")
    .eq("product_id", product.id)
    .eq("buyer_email", normalizedEmail)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingPurchase?.stripe_session_id) {
    try {
      const existingSession = await stripe.checkout.sessions.retrieve(
        existingPurchase.stripe_session_id
      );
      if (existingSession.status === "open" && existingSession.url) {
        return NextResponse.json({ url: existingSession.url });
      }
    } catch (error) {
      console.warn("[Digital Products] Failed to reuse checkout session", error);
    }
  }

  const reusePurchaseId =
    existingPurchase && !existingPurchase.stripe_session_id ? existingPurchase.id : null;

  const purchase =
    reusePurchaseId
      ? { id: reusePurchaseId }
      : (
          await adminClient
            .from("digital_product_purchases")
            .insert({
              product_id: product.id,
              tutor_id: product.tutor_id,
              buyer_email: normalizedEmail,
              buyer_name: buyerName ?? null,
              download_limit: 3,
              download_count: 0,
              download_token: downloadToken,
              status: "pending",
            })
            .select("id")
            .single()
        ).data;

  if (!purchase?.id) {
    return NextResponse.json({ error: "Unable to create purchase." }, { status: 500 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.tutorlingua.co";
  const successUrl = `${appUrl}/products/${tutorUsername}?success=1`;
  const cancelUrl = `${appUrl}/products/${tutorUsername}?canceled=1`;

  const idempotencyKey = `digital-product:${purchase.id}`;
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    customer_email: normalizedEmail,
    allow_promotion_codes: true,
    line_items: [
      {
        price: product.stripe_price_id,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      digital_product_id: product.id,
      digital_product_purchase_id: purchase.id,
    },
  }, { idempotencyKey });

  await adminClient
    .from("digital_product_purchases")
    .update({ stripe_session_id: session.id })
    .eq("id", purchase.id);

  return NextResponse.json({ url: session.url });
}
