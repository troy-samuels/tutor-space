"use server";

import { randomBytes } from "crypto";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";

type BuyDigitalProductResult = { url?: string; error?: string };

export async function buyDigitalProduct(productId: string): Promise<BuyDigitalProductResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return { error: "Sign in to purchase." };
  }

  const { data: product, error: productError } = await supabase
    .from("digital_products")
    .select("id, tutor_id, title, price_cents, currency, stripe_price_id, published, slug")
    .eq("id", productId)
    .single();

  if (productError || !product || !product.published) {
    return { error: "Product not available." };
  }
  if (!product.stripe_price_id || !product.price_cents) {
    return { error: "Product not ready for checkout." };
  }

  const admin = createServiceRoleClient();
  if (!admin) {
    return { error: "Server configuration error." };
  }

  const { data: tutorProfile } = await admin
    .from("profiles")
    .select("stripe_account_id")
    .eq("id", product.tutor_id)
    .single();

  if (!tutorProfile?.stripe_account_id) {
    return { error: "Tutor is not ready to receive payments." };
  }

  const { data: sales } = await admin
    .from("marketplace_transactions")
    .select("gross_amount_cents")
    .eq("tutor_id", product.tutor_id)
    .eq("status", "completed");

  const lifetimeSales = sales?.reduce((sum, row) => sum + (row.gross_amount_cents || 0), 0) ?? 0;
  const commissionRate = lifetimeSales >= 50000 ? 0.10 : 0.15;
  const applicationFeeAmount = Math.round(product.price_cents * commissionRate);

  const downloadToken = randomBytes(32).toString("hex");
  const { data: purchase, error: insertError } = await admin
    .from("digital_product_purchases")
    .insert({
      product_id: product.id,
      tutor_id: product.tutor_id,
      buyer_email: user.email,
      buyer_name: user.user_metadata?.full_name ?? null,
      download_limit: 3,
      download_count: 0,
      download_token: downloadToken,
      status: "pending",
    })
    .select("id")
    .single();

  if (insertError || !purchase) {
    return { error: "Unable to create purchase." };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.tutorlingua.co";
  const successUrl = `${appUrl}/student/library?purchase_success=true`;
  const cancelUrl = `${appUrl}/student/library?purchase_canceled=1`;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: user.email,
    line_items: [{ price: product.stripe_price_id, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    payment_intent_data: {
      application_fee_amount: applicationFeeAmount,
      transfer_data: {
        destination: tutorProfile.stripe_account_id,
      },
    },
    metadata: {
      digital_product_purchase_id: purchase.id,
      product_type: "digital_download",
      tutorId: product.tutor_id,
      studentUserId: user.id,
      productId: product.id,
    },
  });

  await admin
    .from("digital_product_purchases")
    .update({ stripe_session_id: session.id })
    .eq("id", purchase.id);

  return { url: session.url ?? undefined };
}
