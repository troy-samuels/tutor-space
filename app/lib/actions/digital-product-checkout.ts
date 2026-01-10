"use server";

import { randomBytes } from "crypto";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { calculateCommission } from "@/lib/repositories/marketplace";

type BuyDigitalProductResult = { url?: string; error?: string };

export async function buyDigitalProduct(productId: string): Promise<BuyDigitalProductResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return { error: "Sign in to purchase." };
  }
  const normalizedEmail = user.email.trim().toLowerCase();
  if (!normalizedEmail) {
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

  // Use repository for commission calculation (single source of truth)
  const commission = await calculateCommission(admin, product.tutor_id, product.price_cents);
  const applicationFeeAmount = commission.platformFeeCents;

  const { data: existingPurchase } = await admin
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
        return { url: existingSession.url };
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
          await admin
            .from("digital_product_purchases")
            .insert({
              product_id: product.id,
              tutor_id: product.tutor_id,
              buyer_email: normalizedEmail,
              buyer_name: user.user_metadata?.full_name ?? null,
              download_limit: 3,
              download_count: 0,
              download_token: randomBytes(32).toString("hex"),
              status: "pending",
            })
            .select("id")
            .single()
        ).data;

  if (!purchase?.id) {
    return { error: "Unable to create purchase." };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.tutorlingua.co";
  const successUrl = `${appUrl}/student/library?purchase_success=true`;
  const cancelUrl = `${appUrl}/student/library?purchase_canceled=1`;

  const idempotencyKey = `digital-product:${purchase.id}`;
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: normalizedEmail,
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
  }, { idempotencyKey });

  await admin
    .from("digital_product_purchases")
    .update({ stripe_session_id: session.id })
    .eq("id", purchase.id);

  return { url: session.url ?? undefined };
}
