import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import type { ServiceRoleClient, DigitalProductPurchaseWithProduct } from "../utils/types";
import { sendDigitalProductDeliveryEmail } from "@/lib/emails/digital-products";
import { markPurchasePaid, recordMarketplaceSale } from "@/lib/repositories/marketplace";

/**
 * Handles digital product checkout sessions.
 * Returns true if the session was a digital product checkout and was handled.
 */
export async function handleDigitalProductCheckout(
  session: Stripe.Checkout.Session,
  supabase: ServiceRoleClient
): Promise<boolean> {
  const productPurchaseId = session.metadata?.digital_product_purchase_id;
  if (!productPurchaseId) return false;
  await handleDigitalProductPurchase(session, supabase, productPurchaseId);
  return true;
}

async function handleDigitalProductPurchase(
  session: Stripe.Checkout.Session,
  supabase: ServiceRoleClient,
  purchaseId: string
): Promise<void> {
  const { data: purchase, error } = await supabase
    .from("digital_product_purchases")
    .select(
      `
      id,
      buyer_email,
      buyer_name,
      download_token,
      products:digital_products (
        id,
        title,
        tutor_id
      ),
      tutor:profiles!digital_product_purchases_tutor_id_fkey (
        full_name
      )
    `
    )
    .eq("id", purchaseId)
    .single<DigitalProductPurchaseWithProduct>();

  if (error || !purchase) {
    console.error("Digital product purchase not found", error);
    throw new Error(`Purchase ${purchaseId} not found - triggering Stripe retry`);
  }

  // Verify payment intent succeeded before fulfilling (same pattern as booking handler)
  if (session.payment_intent) {
    const paymentIntent = await stripe.paymentIntents.retrieve(
      session.payment_intent as string
    );
    if (paymentIntent.status !== "succeeded") {
      console.error(
        `Payment intent ${paymentIntent.id} status is ${paymentIntent.status}, skipping fulfillment`
      );
      return;
    }
  }

  // ============================================
  // ATOMIC SALE RECORDING
  // Uses repository functions for atomicity and consistency
  // ============================================

  // Mark purchase as paid atomically via RPC
  await markPurchasePaid(supabase, purchase.id, session.id);

  // Record sale atomically (commission calc + transaction insert + stats update in one RPC)
  if (purchase.products?.tutor_id && session.amount_total) {
    try {
      const result = await recordMarketplaceSale(supabase, {
        purchaseId: purchase.id,
        productId: purchase.products.id,
        tutorId: purchase.products.tutor_id,
        grossAmountCents: session.amount_total,
        stripePaymentIntentId: session.payment_intent as string,
      });

      console.log(
        `✅ Marketplace sale recorded atomically: $${(session.amount_total / 100).toFixed(2)} gross, ` +
        `${(result.commissionRate * 100).toFixed(0)}% rate ($${(result.platformCommissionCents / 100).toFixed(2)}), ` +
        `$${(result.netAmountCents / 100).toFixed(2)} net to tutor`
      );
    } catch (err) {
      console.error("Failed to record marketplace sale:", err);
      // Don't throw - payment succeeded, we just couldn't track commission
    }
  }
  // ============================================

  const downloadUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://app.tutorlingua.co"}/api/digital-products/download/${purchase.download_token}`;

  // Add to student library if metadata indicates digital download
  if (session.metadata?.product_type === "digital_download" && session.metadata?.studentUserId && purchase.products?.id) {
    try {
      // Check for existing library item to prevent duplicates on webhook retry
      const { data: existingItem } = await supabase
        .from("student_library_items")
        .select("id")
        .eq("digital_product_purchase_id", purchase.id)
        .maybeSingle();

      if (existingItem) {
        console.log(`Student library item already exists for purchase ${purchase.id}, skipping`);
      } else {
        // Find student record for this user, if available
        const { data: studentRecord } = await supabase
          .from("students")
          .select("id")
          .eq("user_id", session.metadata.studentUserId)
          .maybeSingle();

        const studentId = studentRecord?.id ?? null;

        const insertPayload: Record<string, any> = {
          product_id: purchase.products.id,
          digital_product_purchase_id: purchase.id,
        };
        if (studentId) {
          insertPayload.student_id = studentId;
        }
        if (session.metadata.studentUserId) {
          insertPayload.student_user_id = session.metadata.studentUserId;
        }

        const { error: libraryError } = await supabase
          .from("student_library_items")
          .insert(insertPayload);

        if (libraryError) {
          console.error("Failed to insert student library item", libraryError);
        }
      }
    } catch (libraryInsertError) {
      console.error("Unexpected error inserting student library item", libraryInsertError);
    }
  }

  try {
    await sendDigitalProductDeliveryEmail({
      to: purchase.buyer_email,
      studentName: purchase.buyer_name,
      tutorName: purchase.tutor?.full_name || "Your tutor",
      productTitle: purchase.products?.title || "Your purchase",
      downloadUrl,
    });
  } catch (err) {
    console.error("Failed to send digital product delivery email:", err);
  }
}
