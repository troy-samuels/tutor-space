import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import Stripe from "stripe";
import { sendDigitalProductDeliveryEmail } from "@/lib/emails/digital-products";
import { sendPaymentReceiptEmail, sendTutorBookingNotificationEmail, sendPaymentFailedEmail } from "@/lib/emails/booking-emails";
import { mapPriceIdToPlan } from "@/lib/payments/subscriptions";
import { getFounderPlanName } from "@/lib/pricing/founder";
import { createCalendarEventForBooking } from "@/lib/calendar/busy-windows";

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
    email: string | null;
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

  // IDEMPOTENCY CHECK: Prevent duplicate event processing
  // This is critical for preventing double charges, duplicate emails, etc.
  const { data: existingEvent } = await supabase
    .from("processed_stripe_events")
    .select("event_id")
    .eq("event_id", event.id)
    .single();

  if (existingEvent) {
    console.log(`⚠️ Event ${event.id} already processed, skipping (idempotency)`);
    return NextResponse.json({ received: true, duplicate: true });
  }

  // Mark event as being processed BEFORE handling to prevent race conditions
  const { error: insertError } = await supabase
    .from("processed_stripe_events")
    .insert({
      event_id: event.id,
      event_type: event.type,
      processed_at: new Date().toISOString(),
      metadata: { livemode: event.livemode },
    });

  if (insertError) {
    // If insert fails due to unique constraint, another worker got it first
    if (insertError.code === "23505") {
      console.log(`⚠️ Event ${event.id} being processed by another worker`);
      return NextResponse.json({ received: true, duplicate: true });
    }
    console.error("Failed to mark event as processing:", insertError);
    // Continue anyway - better to potentially double-process than to drop events
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
        await handleInvoicePaymentSucceeded(invoice, supabase);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice, supabase);
        break;
      }

      case "account.updated": {
        const account = event.data.object as Stripe.Account;
        await handleAccountUpdated(account, supabase);
        break;
      }

      case "account.application.deauthorized": {
        // This event contains an Application object with the account ID
        const application = event.data.object as { account?: string };
        if (application.account) {
          await handleAccountDeauthorized(application.account, supabase);
        }
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
  // Founder lifetime purchase (one-time)
  const isFounderLifetime = session.metadata?.plan === getFounderPlanName();
  const profileIdFromMetadata = session.metadata?.userId;

  if (isFounderLifetime && profileIdFromMetadata) {
    const { error } = await supabase
      .from("profiles")
      .update({
        plan: getFounderPlanName(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", profileIdFromMetadata);

    if (error) {
      console.error("Failed to mark founder lifetime purchase:", error);
      throw error;
    }

    console.log(`✅ Founder lifetime purchased for profile ${profileIdFromMetadata}`);
    return;
  }

  // Handle lifetime purchase for users without an account yet
  // Check customer_email from session or metadata
  if (isFounderLifetime && !profileIdFromMetadata) {
    const customerEmail = session.customer_email || session.metadata?.customer_email;

    if (customerEmail) {
      // First check if a profile with this email already exists
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", customerEmail.toLowerCase())
        .single();

      if (existingProfile) {
        // Update existing profile
        const { error } = await supabase
          .from("profiles")
          .update({
            plan: getFounderPlanName(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingProfile.id);

        if (error) {
          console.error("Failed to update lifetime purchase for existing profile:", error);
          throw error;
        }
        console.log(`✅ Founder lifetime purchased for existing profile ${existingProfile.id}`);
      } else {
        // Store the purchase for linking when user signs up
        const { error } = await supabase
          .from("lifetime_purchases")
          .upsert({
            email: customerEmail.toLowerCase(),
            stripe_session_id: session.id,
            stripe_customer_id: session.customer as string,
            amount_paid: session.amount_total,
            currency: session.currency,
            purchased_at: new Date().toISOString(),
            claimed: false,
          }, {
            onConflict: "email",
          });

        if (error) {
          console.error("Failed to store lifetime purchase:", error);
          // Don't throw - the payment succeeded, we just couldn't store it
        }
        console.log(`✅ Founder lifetime purchase stored for ${customerEmail}`);
      }
    }
    return;
  }

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

  // PAYMENT VERIFICATION: Verify payment actually succeeded before marking as paid
  // This prevents marking bookings as paid when payment actually failed
  if (session.payment_intent) {
    const paymentIntent = await stripe.paymentIntents.retrieve(
      session.payment_intent as string
    );

    if (paymentIntent.status !== "succeeded") {
      console.error(
        `⚠️ Payment intent ${paymentIntent.id} status is ${paymentIntent.status}, not succeeded. Skipping booking update.`
      );
      return;
    }
    console.log(`✅ Payment verified: ${paymentIntent.id} status = succeeded`);
  }

  // Check if booking is already confirmed (idempotency at booking level)
  const { data: existingBooking } = await supabase
    .from("bookings")
    .select("status, payment_status")
    .eq("id", bookingId)
    .single();

  if (existingBooking?.payment_status === "paid") {
    console.log(`⚠️ Booking ${bookingId} already marked as paid, skipping update`);
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

  // If this was a Connect payment, record it in the payments audit
  if (session.payment_intent && session.metadata?.tutorId) {
    // Get the payment intent to check for destination charges
    const paymentIntent = await stripe.paymentIntents.retrieve(
      session.payment_intent as string
    );

    const metadata = session.metadata as Record<string, string> | null;
    const studentProfileId =
      metadata?.studentProfileId ||
      metadata?.studentId ||
      null;

    let auditStudentId: string | null = null;
    if (studentProfileId) {
      const { data: studentProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", studentProfileId)
        .single();

      if (studentProfile?.id) {
        auditStudentId = studentProfile.id;
      }
    }

    if (paymentIntent.transfer_data?.destination) {
      const { error: auditError } = await supabase
        .from("payments_audit")
        .insert({
          tutor_id: session.metadata.tutorId,
          student_id: auditStudentId,
          booking_id: bookingId,
          amount_cents: session.amount_total || 0,
          currency: session.currency || "usd",
          application_fee_cents: paymentIntent.application_fee_amount || 0,
          net_amount_cents: (session.amount_total || 0) - (paymentIntent.application_fee_amount || 0),
          stripe_payment_intent_id: session.payment_intent as string,
          stripe_charge_id: paymentIntent.latest_charge as string | null,
          destination_account_id: paymentIntent.transfer_data.destination as string,
          payment_type: "booking",
          created_at: new Date().toISOString(),
        });

      if (auditError) {
        console.error("Failed to create payment audit record:", auditError);
      } else {
        console.log(`✅ Payment audit recorded for booking ${bookingId}`);
      }
    }
  }

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
          full_name,
          email
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

  // Send payment notification to tutor if it was a Connect payment
  const tutorEmail = bookingDetails?.tutor?.email;
  if (tutorEmail && amountCents > 0 && session.metadata?.tutorId) {
    await sendPaymentReceiptEmail({
      studentName: bookingDetails?.tutor?.full_name ?? "Tutor",
      studentEmail: tutorEmail,
      tutorName: bookingDetails?.tutor?.full_name ?? "Your tutor",
      serviceName: bookingDetails?.services?.name ?? "Lesson",
      scheduledAt: bookingDetails?.scheduled_at ?? new Date().toISOString(),
      timezone: bookingDetails?.timezone ?? "UTC",
      amountCents,
      currency,
      paymentMethod: "STRIPE",
      notes: `Payment received from ${bookingDetails?.students?.full_name ?? "student"} via Stripe Connect. Funds will be available in your Stripe account according to your payout schedule.`,
    });
  }

  // Notify tutor of successful payment
  const tutorNotifyEmail = bookingDetails?.tutor?.email;
  const tutorName = bookingDetails?.tutor?.full_name ?? "Tutor";
  if (tutorNotifyEmail && amountCents > 0) {
    await sendTutorBookingNotificationEmail({
      tutorName,
      tutorEmail: tutorNotifyEmail,
      studentName: bookingDetails?.students?.full_name ?? "Student",
      studentEmail: studentEmail ?? "",
      serviceName: bookingDetails?.services?.name ?? "Lesson",
      scheduledAt: bookingDetails?.scheduled_at ?? new Date().toISOString(),
      durationMinutes: 60,
      timezone: bookingDetails?.timezone ?? "UTC",
      amount: amountCents,
      currency,
      notes: undefined,
      dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://app.tutorlingua.co"}/bookings`,
    });
  }

  // Create calendar event on tutor's connected calendar(s)
  const tutorId = session.metadata?.tutorId;
  if (tutorId && bookingDetails?.scheduled_at) {
    // Calculate event end time using service duration or default to 60 minutes
    const startDate = new Date(bookingDetails.scheduled_at);
    const durationMinutes = 60; // Default, could be fetched from service if available
    const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);

    createCalendarEventForBooking({
      tutorId,
      title: `${bookingDetails?.services?.name ?? "Lesson"} with ${bookingDetails?.students?.full_name ?? "Student"}`,
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      description: `TutorLingua booking - ${bookingDetails?.services?.name ?? "Lesson"}\nStudent: ${bookingDetails?.students?.full_name ?? "Unknown"}\nBooking ID: ${bookingId}`,
      studentEmail: bookingDetails?.students?.email ?? undefined,
      timezone: bookingDetails?.timezone ?? "UTC",
    }).catch((err) => {
      // Don't fail the webhook if calendar creation fails
      console.error("[Webhook] Failed to create calendar event:", err);
    });
  }
}

type DigitalProductPurchaseWithProduct = DigitalProductPurchaseDetails & {
  products: {
    id: string;
    title: string | null;
    tutor_id: string;
  } | null;
};

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

  // ============================================
  // MARKETPLACE COMMISSION CAPTURE
  // Tiered: 15% until $500 lifetime sales, then 10%
  // ============================================
  if (purchase.products?.tutor_id && session.amount_total) {
    const tutorId = purchase.products.tutor_id;
    const grossAmount = session.amount_total;

    // Get tutor's lifetime sales to determine commission tier
    const { data: salesData } = await supabase
      .from("marketplace_transactions")
      .select("gross_amount_cents")
      .eq("tutor_id", tutorId)
      .eq("status", "completed");

    const lifetimeSales = salesData?.reduce(
      (sum, t) => sum + (t.gross_amount_cents || 0),
      0
    ) || 0;

    // Tiered commission: 15% until $500 (50000 cents), then 10%
    const commissionRate = lifetimeSales >= 50000 ? 0.10 : 0.15;
    const platformCommission = Math.round(grossAmount * commissionRate);
    const netAmount = grossAmount - platformCommission;

    // Record the marketplace transaction
    const { error: transactionError } = await supabase
      .from("marketplace_transactions")
      .insert({
        purchase_id: purchase.id,
        product_id: purchase.products.id,
        tutor_id: tutorId,
        gross_amount_cents: grossAmount,
        platform_commission_cents: platformCommission,
        net_amount_cents: netAmount,
        commission_rate: commissionRate,
        stripe_payment_intent_id: session.payment_intent as string,
        status: "completed",
      });

    if (transactionError) {
      console.error("Failed to record marketplace transaction:", transactionError);
      // Don't throw - the payment succeeded, we just couldn't track commission
    } else {
      console.log(
        `✅ Marketplace commission recorded: $${(grossAmount / 100).toFixed(2)} gross, ` +
        `${(commissionRate * 100).toFixed(0)}% rate ($${(platformCommission / 100).toFixed(2)}), ` +
        `$${(netAmount / 100).toFixed(2)} net to tutor`
      );
    }

    // Update product sales stats
    const { error: statsError } = await supabase.rpc("increment_product_sales", {
      p_product_id: purchase.products.id,
      p_amount: grossAmount,
    });

    if (statsError) {
      console.error("Failed to update product sales stats:", statsError);
    }
  }
  // ============================================

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

  // Check if this is an AI Practice subscription (student subscription)
  if (subscription.metadata?.type === "ai_practice") {
    await handleAIPracticeSubscriptionUpdate(subscription, supabase);
    return;
  }

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

  const priceId = subscription.items.data[0]?.price.id;
  const plan = mapPriceIdToPlan(priceId);

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
 * Keep plan at founder_lifetime (single tier) but mark subscription canceled
 */
async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
  supabase: ServiceRoleClient
) {
  // Check if this is an AI Practice subscription
  if (subscription.metadata?.type === "ai_practice") {
    await handleAIPracticeSubscriptionDeleted(subscription, supabase);
    return;
  }

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

  const fallbackPlan = "founder_lifetime";

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ plan: fallbackPlan })
    .eq("id", profile.id);

  if (updateError) {
    console.error("Failed to downgrade profile:", updateError);
    throw updateError;
  }

  console.log(`✅ Subscription canceled for profile ${profile.id}, plan set to ${fallbackPlan}`);
}

/**
 * Handle successful invoice payment
 * Update subscription status and extend access period
 */
async function handleInvoicePaymentSucceeded(
  invoice: Stripe.Invoice,
  supabase: ServiceRoleClient
) {
  console.log(`Invoice ${invoice.id} payment succeeded`);

  // Get subscription ID from parent.subscription_details
  const subscriptionDetails = invoice.parent?.subscription_details;
  const subscriptionId = subscriptionDetails
    ? (typeof subscriptionDetails.subscription === "string"
        ? subscriptionDetails.subscription
        : subscriptionDetails.subscription?.id)
    : null;

  // Only process subscription invoices
  if (!subscriptionId) {
    console.log(`Invoice ${invoice.id} is not a subscription invoice, skipping`);
    return;
  }

  const customerId = invoice.customer as string;
  if (!customerId) {
    console.log("No customer ID in invoice, skipping");
    return;
  }

  // Find profile by Stripe customer ID
  const { data: profile, error: findError } = await supabase
    .from("profiles")
    .select("id, email, full_name")
    .eq("stripe_customer_id", customerId)
    .single();

  if (findError || !profile) {
    console.error("Profile not found for customer:", customerId);
    return;
  }

  // Update subscription status to active (in case it was past_due)
  const { error: updateError } = await supabase
    .from("subscriptions")
    .update({
      status: "active",
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscriptionId);

  if (updateError) {
    console.error("Failed to update subscription status:", updateError);
  }

  // Reset any failed payment counters if we have them
  await supabase
    .from("profiles")
    .update({
      payment_failed_count: 0,
      last_payment_failure_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", profile.id);

  console.log(`Invoice ${invoice.id} processed - subscription ${subscriptionId} renewed for profile ${profile.id}`);
}

/**
 * Handle failed invoice payment
 * Send notification to user and update subscription status
 */
async function handleInvoicePaymentFailed(
  invoice: Stripe.Invoice,
  supabase: ServiceRoleClient
) {
  console.log(`Invoice ${invoice.id} payment failed`);

  // Get subscription ID from parent.subscription_details
  const subscriptionDetails = invoice.parent?.subscription_details;
  const subscriptionId = subscriptionDetails
    ? (typeof subscriptionDetails.subscription === "string"
        ? subscriptionDetails.subscription
        : subscriptionDetails.subscription?.id)
    : null;

  // Only process subscription invoices
  if (!subscriptionId) {
    console.log(`Invoice ${invoice.id} is not a subscription invoice, skipping`);
    return;
  }

  const customerId = invoice.customer as string;
  if (!customerId) {
    console.log("No customer ID in invoice, skipping");
    return;
  }

  // Find profile by Stripe customer ID
  const { data: profile, error: findError } = await supabase
    .from("profiles")
    .select("id, email, full_name, payment_failed_count")
    .eq("stripe_customer_id", customerId)
    .single();

  if (findError || !profile) {
    console.error("Profile not found for customer:", customerId);
    return;
  }

  // Increment failed payment count
  const failedCount = (profile.payment_failed_count || 0) + 1;

  // Update profile with failure info
  await supabase
    .from("profiles")
    .update({
      payment_failed_count: failedCount,
      last_payment_failure_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", profile.id);

  // Update subscription status to past_due
  const { error: updateError } = await supabase
    .from("subscriptions")
    .update({
      status: "past_due",
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscriptionId);

  if (updateError) {
    console.error("Failed to update subscription status:", updateError);
  }

  // Format amount for display
  let amountDue = "N/A";
  if (invoice.amount_due && invoice.currency) {
    try {
      amountDue = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: invoice.currency,
      }).format(invoice.amount_due / 100);
    } catch {
      amountDue = `${invoice.currency.toUpperCase()} ${(invoice.amount_due / 100).toFixed(2)}`;
    }
  }

  // Get plan name from subscription
  let planName = "Your subscription";
  if (subscriptionId) {
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const priceId = subscription.items.data[0]?.price.id;
      if (priceId) {
        planName = mapPriceIdToPlan(priceId);
        // Capitalize first letter
        planName = planName.charAt(0).toUpperCase() + planName.slice(1);
      }
    } catch (err) {
      console.error("Failed to retrieve subscription for plan name:", err);
    }
  }

  // Calculate next retry date (Stripe typically retries in 3-5 days)
  const nextRetryDate = invoice.next_payment_attempt
    ? new Date(invoice.next_payment_attempt * 1000).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      })
    : undefined;

  // Send email notification about failed payment
  if (profile.email) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.tutorlingua.co";
    const updatePaymentUrl = `${baseUrl}/settings/billing`;

    await sendPaymentFailedEmail({
      userEmail: profile.email,
      userName: profile.full_name || "there",
      planName,
      amountDue,
      nextRetryDate,
      updatePaymentUrl,
    });

    console.log(`Payment failed email sent to ${profile.email}`);
  }

  // If payment has failed multiple times, consider downgrading
  if (failedCount >= 3) {
    console.log(`Profile ${profile.id} has ${failedCount} failed payments - may need manual intervention`);
    // Could implement automatic downgrade here if desired
  }

  console.log(`Invoice ${invoice.id} failure processed for profile ${profile.id} (failure count: ${failedCount})`);
}

/**
 * Handle Stripe Connect account updates
 * Update tutor's capability flags when their account status changes
 */
async function handleAccountUpdated(
  account: Stripe.Account,
  supabase: ServiceRoleClient
) {
  if (!account.id) {
    console.error("No account ID in webhook payload");
    return;
  }

  // Extract the status from the account
  const chargesEnabled = account.charges_enabled ?? false;
  const payoutsEnabled = account.payouts_enabled ?? false;
  const requirements = account.requirements;

  // Determine onboarding status
  let onboardingStatus: "pending" | "completed" | "restricted" = "pending";
  if (chargesEnabled && payoutsEnabled) {
    onboardingStatus = "completed";
  } else if (requirements?.disabled_reason) {
    onboardingStatus = "restricted";
  }

  // Update the profile with the latest Connect status
  const { error } = await supabase
    .from("profiles")
    .update({
      stripe_charges_enabled: chargesEnabled,
      stripe_payouts_enabled: payoutsEnabled,
      stripe_onboarding_status: onboardingStatus,
      stripe_default_currency: account.default_currency || null,
      stripe_country: account.country || null,
      stripe_last_capability_check_at: new Date().toISOString(),
      stripe_disabled_reason: requirements?.disabled_reason || null,
      stripe_currently_due: requirements?.currently_due || null,
      stripe_eventually_due: requirements?.eventually_due || null,
      stripe_past_due: requirements?.past_due || null,
      stripe_pending_verification: requirements?.pending_verification || null,
      stripe_details_submitted: account.details_submitted ?? false,
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_account_id", account.id);

  if (error) {
    console.error("Failed to update Connect status:", error);
    throw error;
  }

  console.log(
    `✅ Updated Connect account ${account.id}: charges=${chargesEnabled}, payouts=${payoutsEnabled}, status=${onboardingStatus}`
  );
}

/**
 * Handle Stripe Connect account deauthorization
 * Mark the tutor's account as restricted when they disconnect from the platform
 */
async function handleAccountDeauthorized(
  accountId: string,
  supabase: ServiceRoleClient
) {
  console.log(`Stripe Connect account ${accountId} deauthorized`);

  const { error } = await supabase
    .from("profiles")
    .update({
      stripe_charges_enabled: false,
      stripe_payouts_enabled: false,
      stripe_onboarding_status: "restricted",
      stripe_disabled_reason: "account_deauthorized",
      stripe_last_capability_check_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_account_id", accountId);

  if (error) {
    console.error("Failed to update deauthorized account:", error);
    throw error;
  }

  console.log(`✅ Account ${accountId} marked as deauthorized`);
}

/**
 * Handle AI Practice subscription updates (student subscriptions)
 * Updates the student's ai_practice_enabled status
 */
async function handleAIPracticeSubscriptionUpdate(
  subscription: StripeSubscriptionPayload,
  supabase: ServiceRoleClient
) {
  const studentId = subscription.metadata?.studentId;
  const tutorId = subscription.metadata?.tutorId;

  if (!studentId) {
    console.error("No studentId in AI Practice subscription metadata");
    return;
  }

  const isActive = subscription.status === "active" || subscription.status === "trialing";

  const { error } = await supabase
    .from("students")
    .update({
      ai_practice_enabled: isActive,
      ai_practice_subscription_id: subscription.id,
      ai_practice_current_period_end: new Date(
        subscription.current_period_end * 1000
      ).toISOString(),
    })
    .eq("id", studentId);

  if (error) {
    console.error("Failed to update AI Practice subscription:", error);
    throw error;
  }

  console.log(
    `✅ AI Practice subscription ${isActive ? "activated" : "updated"} for student ${studentId}`
  );
}

/**
 * Handle AI Practice subscription cancellation
 * Disables AI practice for the student
 */
async function handleAIPracticeSubscriptionDeleted(
  subscription: Stripe.Subscription,
  supabase: ServiceRoleClient
) {
  const studentId = subscription.metadata?.studentId;

  if (!studentId) {
    console.error("No studentId in AI Practice subscription metadata");
    return;
  }

  const { error } = await supabase
    .from("students")
    .update({
      ai_practice_enabled: false,
    })
    .eq("id", studentId);

  if (error) {
    console.error("Failed to disable AI Practice subscription:", error);
    throw error;
  }

  console.log(`✅ AI Practice subscription canceled for student ${studentId}`);
}
