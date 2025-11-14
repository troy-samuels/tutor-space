import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import Stripe from "stripe";
import { sendDigitalProductDeliveryEmail } from "@/lib/emails/digital-products";
import { sendPaymentReceiptEmail } from "@/lib/emails/booking-emails";

type ServiceRoleClient = NonNullable<ReturnType<typeof createServiceRoleClient>>;

type BookingDetails = {
  payment_amount: number | null;
  currency: string | null;
  scheduled_at: string | null;
  timezone: string | null;
  services: {
    name: string | null;
    price_amount: number | null;
    price_currency: string | null;
  } | null;
  students: {
    full_name: string | null;
    email: string | null;
  } | null;
  tutor: {
    full_name: string | null;
  } | null;
};

type DigitalProductPurchaseDetails = {
  id: string;
  buyer_email: string;
  buyer_name: string | null;
  download_token: string;
  products: {
    title: string | null;
    tutor_id: string;
  } | null;
  tutor: {
    full_name: string | null;
  } | null;
};

type StripeSubscriptionPayload = Stripe.Subscription & {
  current_period_start: number;
  current_period_end: number;
};

/**
 * Stripe webhook handler
 * This endpoint receives events from Stripe when payments complete,
 * subscriptions update, etc.
 *
 * To test locally:
 * 1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
 * 2. Run: stripe listen --forward-to localhost:3000/api/stripe/webhook
 * 3. Use the webhook signing secret from the CLI output
 */

export async function POST(req: NextRequest) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "No signature provided" },
      { status: 400 }
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  const supabase = createServiceRoleClient();

  if (!supabase) {
    console.error("Failed to create Supabase admin client");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }

  // Handle different event types
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(session, supabase);
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as StripeSubscriptionPayload;
        await handleSubscriptionUpdate(subscription, supabase);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription, supabase);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentSucceeded(invoice);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error(`Error handling webhook event ${event.type}:`, error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

/**
 * Handle successful checkout session
 * Update booking payment status when payment completes
 */
async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
  supabase: ServiceRoleClient
) {
  const productPurchaseId = session.metadata?.digital_product_purchase_id;
  if (productPurchaseId) {
    await handleDigitalProductPurchase(session, supabase, productPurchaseId);
    return;
  }

  const bookingId = session.metadata?.bookingId;
  if (!bookingId) {
    console.log("No bookingId in session metadata");
    return;
  }

  // Update booking payment status and confirm the booking
  const { error } = await supabase
    .from("bookings")
    .update({
      status: "confirmed", // Change from pending to confirmed
      payment_status: "paid",
      stripe_payment_intent_id: session.payment_intent as string,
      payment_amount:
        typeof session.amount_total === "number" ? session.amount_total : null,
      currency: session.currency?.toUpperCase() ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", bookingId);

  if (error) {
    console.error("Failed to update booking payment status:", error);
    throw error;
  }

  console.log(`✅ Booking ${bookingId} marked as paid`);

  const { data: bookingDetails } = await supabase
    .from("bookings")
    .select(
      `
        id,
        scheduled_at,
        timezone,
        payment_amount,
        currency,
        services (
          name,
          price_amount,
          price_currency
        ),
        students (
          full_name,
          email
        ),
        tutor:profiles!bookings_tutor_id_fkey (
          full_name
        )
      `
    )
    .eq("id", bookingId)
    .single<BookingDetails>();

  const studentEmail = bookingDetails?.students?.email;
  const amountCents =
    bookingDetails?.payment_amount ??
    bookingDetails?.services?.price_amount ??
    (typeof session.amount_total === "number" ? session.amount_total : 0);
  const currency =
    bookingDetails?.currency ??
    bookingDetails?.services?.price_currency ??
    session.currency?.toUpperCase() ??
    "USD";

  if (studentEmail && amountCents > 0) {
    await sendPaymentReceiptEmail({
      studentName: bookingDetails?.students?.full_name ?? "Student",
      studentEmail,
      tutorName: bookingDetails?.tutor?.full_name ?? "Your tutor",
      serviceName: bookingDetails?.services?.name ?? "Lesson",
      scheduledAt: bookingDetails?.scheduled_at ?? new Date().toISOString(),
      timezone: bookingDetails?.timezone ?? "UTC",
      amountCents,
      currency,
      paymentMethod: (session.payment_method_types?.[0] ?? "card").toUpperCase(),
      invoiceNumber:
        typeof session.invoice === "string" ? session.invoice : undefined,
    });
  }

  // TODO: Create calendar event if calendar is connected
}

async function handleDigitalProductPurchase(
  session: Stripe.Checkout.Session,
  supabase: ServiceRoleClient,
  purchaseId: string
) {
  const { data: purchase, error } = await supabase
    .from("digital_product_purchases")
    .select(
      `
      id,
      buyer_email,
      buyer_name,
      download_token,
      products:digital_products (
        title,
        tutor_id
      ),
      tutor:profiles!digital_product_purchases_tutor_id_fkey (
        full_name
      )
    `
    )
    .eq("id", purchaseId)
    .single<DigitalProductPurchaseDetails>();

  if (error || !purchase) {
    console.error("Digital product purchase not found", error);
    return;
  }

  await supabase
    .from("digital_product_purchases")
    .update({
      status: "paid",
      completed_at: new Date().toISOString(),
      stripe_session_id: session.id,
    })
    .eq("id", purchase.id);

  const downloadUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://app.tutorlingua.co"}/api/digital-products/download/${purchase.download_token}`;

  await sendDigitalProductDeliveryEmail({
    to: purchase.buyer_email,
    studentName: purchase.buyer_name,
    tutorName: purchase.tutor?.full_name || "Your tutor",
    productTitle: purchase.products?.title || "Your purchase",
    downloadUrl,
  });
}

/**
 * Handle subscription creation or update
 * Update profile with subscription details
 */
async function handleSubscriptionUpdate(
  subscription: StripeSubscriptionPayload,
  supabase: ServiceRoleClient
) {
  const customerId = subscription.customer as string;

  // Find profile by Stripe customer ID
  const { data: profile, error: findError } = await supabase
    .from("profiles")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .single();

  if (findError || !profile) {
    console.error("Profile not found for customer:", customerId);
    return;
  }

  // Determine plan from subscription
  const priceId = subscription.items.data[0]?.price.id;
  let plan = "professional";

  // Map price IDs to plans (you'll need to set these up in Stripe)
  if (priceId === process.env.STRIPE_GROWTH_PRICE_ID) {
    plan = "growth";
  } else if (priceId === process.env.STRIPE_STUDIO_PRICE_ID) {
    plan = "studio";
  }

  // Update or create subscription record
  const { error: upsertError } = await supabase
    .from("subscriptions")
    .upsert({
      profile_id: profile.id,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: customerId,
      status: subscription.status,
      price_id: priceId,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      updated_at: new Date().toISOString(),
    });

  if (upsertError) {
    console.error("Failed to upsert subscription:", upsertError);
    throw upsertError;
  }

  // Update profile plan
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ plan })
    .eq("id", profile.id);

  if (updateError) {
    console.error("Failed to update profile plan:", updateError);
    throw updateError;
  }

  console.log(`✅ Subscription updated for profile ${profile.id}: ${plan}`);
}

/**
 * Handle subscription deletion
 * Downgrade user to free plan
 */
async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
  supabase: ServiceRoleClient
) {
  const customerId = subscription.customer as string;

  // Find profile by Stripe customer ID
  const { data: profile, error: findError } = await supabase
    .from("profiles")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .single();

  if (findError || !profile) {
    console.error("Profile not found for customer:", customerId);
    return;
  }

  // Update subscription status
  const { error: updateSubError } = await supabase
    .from("subscriptions")
    .update({
      status: "canceled",
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id);

  if (updateSubError) {
    console.error("Failed to update subscription status:", updateSubError);
  }

  // Downgrade to professional (free) plan
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ plan: "professional" })
    .eq("id", profile.id);

  if (updateError) {
    console.error("Failed to downgrade profile:", updateError);
    throw updateError;
  }

  console.log(`✅ Subscription canceled for profile ${profile.id}, downgraded to professional`);
}

/**
 * Handle successful invoice payment
 * Record in invoices table if needed
 */
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log(`Invoice ${invoice.id} payment succeeded`);
  // TODO: Record in invoices table if tracking invoice history
}

/**
 * Handle failed invoice payment
 * Send notification to user
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log(`Invoice ${invoice.id} payment failed`);
  // TODO: Send email notification about failed payment
  // TODO: Update subscription status if payment fails multiple times
}
