import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { randomUUID } from "crypto";
import { stripe } from "@/lib/stripe";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import Stripe from "stripe";
import { sendDigitalProductDeliveryEmail } from "@/lib/emails/digital-products";
import { sendPaymentReceiptEmail, sendTutorBookingNotificationEmail, sendPaymentFailedEmail } from "@/lib/emails/booking-emails";
import { mapPriceIdToPlan, getPlanDbTier } from "@/lib/payments/subscriptions";
import { createCalendarEventForBooking } from "@/lib/calendar/busy-windows";
// AI Practice constants removed - freemium model uses RPC for period creation
import { recordSystemEvent, recordSystemMetric, shouldSample } from "@/lib/monitoring";
import { sendLessonSubscriptionEmails } from "@/lib/emails/ops-emails";
import { SIGNUP_CHECKOUT_FLOW } from "@/lib/services/signup-checkout";

type ServiceRoleClient = NonNullable<ReturnType<typeof createServiceRoleClient>>;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type BookingDetails = {
  payment_amount: number | null;
  currency: string | null;
  scheduled_at: string | null;
  timezone: string | null;
  services: {
    name: string | null;
    price_amount: number | null;
    price_currency: string | null;
    duration_minutes: number | null;
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

type LessonSubscriptionContext = {
  studentEmail?: string | null;
  studentName: string;
  tutorEmail?: string | null;
  tutorName: string;
  lessonsPerMonth?: number | null;
  planName: string;
  periodEnd?: string | null;
};

type LessonSubscriptionRow = {
  current_period_end: string | null;
  student?: { full_name: string | null; email: string | null } | { full_name: string | null; email: string | null }[] | null;
  tutor?: { full_name: string | null; email: string | null } | { full_name: string | null; email: string | null }[] | null;
  template?:
    | {
        lessons_per_month: number | null;
        service?: { name: string | null } | { name: string | null }[] | null;
      }
    | Array<{
        lessons_per_month: number | null;
        service?: { name: string | null } | { name: string | null }[] | null;
      }>
    | null;
};

async function claimStripeEvent(
  event: Stripe.Event,
  supabase: ServiceRoleClient
) {
  const { data: existingEvent, error: existingError } = await supabase
    .from("processed_stripe_events")
    .select("event_id")
    .eq("event_id", event.id)
    .maybeSingle();

  if (existingEvent) {
    return { duplicate: true };
  }

  // Only ignore the "no rows" error; anything else should bubble so Stripe retries
  if (existingError && existingError.code !== "PGRST116") {
    throw existingError;
  }

  const { error: insertError } = await supabase
    .from("processed_stripe_events")
    .insert({
      event_id: event.id,
      event_type: event.type,
      processed_at: new Date().toISOString(),
      metadata: { livemode: event.livemode },
    });

  if (insertError?.code === "23505") {
    return { duplicate: true };
  }

  if (insertError) {
    throw insertError;
  }

  return { duplicate: false };
}

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
  const correlationId = randomUUID();
  const sampleRate = Number(process.env.STRIPE_WEBHOOK_LOG_SAMPLE_RATE ?? "0.05");
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    void recordSystemEvent({
      source: "stripe_webhook",
      message: "Missing stripe-signature header",
      meta: { correlationId },
    });
    return NextResponse.json(
      { error: "No signature provided" },
      { status: 400 }
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const connectWebhookSecret = process.env.STRIPE_CONNECT_WEBHOOK_SECRET;

  if (!webhookSecret && !connectWebhookSecret) {
    console.error("Stripe webhook secrets are not set");
    void recordSystemEvent({
      source: "stripe_webhook",
      message: "Stripe webhook secrets are not set",
      meta: { correlationId },
    });
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  let event: Stripe.Event;

  // Try main webhook secret first, then Connect webhook secret
  // This handles both Account events (payments) and Connect events (tutor onboarding)
  try {
    if (webhookSecret) {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } else if (connectWebhookSecret) {
      event = stripe.webhooks.constructEvent(body, signature, connectWebhookSecret);
      console.log("Event verified with Connect webhook secret");
    } else {
      throw new Error("Stripe webhook secrets are not configured");
    }
  } catch (err) {
    // If main secret fails and we have a Connect secret, try that
    if (webhookSecret && connectWebhookSecret) {
      try {
        event = stripe.webhooks.constructEvent(body, signature, connectWebhookSecret);
        console.log("Event verified with Connect webhook secret");
      } catch (connectErr) {
        console.error("Webhook signature verification failed with both secrets:", {
          primaryError: err,
          connectError: connectErr,
        });
        void recordSystemEvent({
          source: "stripe_webhook",
          message: "Signature verification failed",
          meta: { correlationId, primaryError: String(err), connectError: String(connectErr) },
        });
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 400 }
        );
      }
    } else {
      console.error("Webhook signature verification failed:", err);
      void recordSystemEvent({
        source: "stripe_webhook",
        message: "Signature verification failed",
        meta: { correlationId, error: String(err) },
      });
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }
  }

  const supabase = createServiceRoleClient();

  if (!supabase) {
    console.error("Failed to create Supabase admin client");
    void recordSystemEvent({
      source: "stripe_webhook",
      message: "Failed to create Supabase admin client",
      meta: { correlationId },
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }

  if (shouldSample(sampleRate)) {
    void recordSystemMetric({
      metric: "stripe_webhook_received",
      value: 1,
      sampleRate,
    });
  }

  try {
    const { duplicate } = await claimStripeEvent(event, supabase);

    if (duplicate) {
      console.log(`⚠️ Event ${event.id} already processed, skipping (idempotency)`);
      return NextResponse.json({ received: true, duplicate: true });
    }
  } catch (idempotencyError) {
    console.error("Failed to claim Stripe event for processing:", idempotencyError);
    void recordSystemEvent({
      source: "stripe_webhook",
      message: "Failed to claim event for processing",
      meta: { correlationId, eventId: event.id, error: String(idempotencyError) },
    });
    return NextResponse.json(
      { error: "Could not claim event" },
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

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionExpired(session, supabase);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    void recordSystemMetric({
      metric: `stripe_webhook:${event.type}`,
      value: 1,
      sampleRate: 0.1,
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error(`Error handling webhook event ${event.type}:`, error);
    void recordSystemEvent({
      source: "stripe_webhook",
      message: `Error handling event ${event.type}`,
      meta: { correlationId, eventId: event.id, error: String(error) },
    });
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
  // Pro lifetime purchase (one-time)
  const lifetimePlan = "tutor_life";
  const legacyLifetimePlan = "founder_lifetime";
  const isLifetime =
    session.metadata?.plan === lifetimePlan || session.metadata?.plan === legacyLifetimePlan;
  const profileIdFromMetadata = session.metadata?.userId;

  if (isLifetime && profileIdFromMetadata) {
    const planToApply = (session.metadata?.plan ?? lifetimePlan) as string;
    const tierToApply = getPlanDbTier(planToApply as any);
    const { error } = await supabase
      .from("profiles")
      .update({
        plan: planToApply,
        tier: tierToApply,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profileIdFromMetadata);

    if (error) {
      console.error("Failed to mark founder lifetime purchase:", error);
      throw error;
    }

    if (session.metadata?.flow === SIGNUP_CHECKOUT_FLOW) {
      const { error: signupCheckoutError } = await supabase
        .from("profiles")
        .update({
          signup_checkout_session_id: session.id,
          signup_checkout_status: "complete",
          signup_checkout_plan: planToApply,
          signup_checkout_completed_at: new Date().toISOString(),
          signup_checkout_expires_at: session.expires_at
            ? new Date(session.expires_at * 1000).toISOString()
            : null,
        })
        .eq("id", profileIdFromMetadata);

      if (signupCheckoutError) {
        console.error("Failed to update lifetime signup checkout status:", signupCheckoutError);
      }
    }

    console.log(`✅ Lifetime purchased for profile ${profileIdFromMetadata} (${planToApply})`);
    return;
  }

  // Handle lifetime purchase for users without an account yet
  // Check customer_email from session or metadata
  if (isLifetime && !profileIdFromMetadata) {
    const customerEmail = session.customer_email || session.metadata?.customer_email;
    const acquisitionSource = session.metadata?.source || "unknown";

    if (customerEmail) {
      // First check if a profile with this email already exists
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", customerEmail.toLowerCase())
        .single();

      if (existingProfile) {
        // Update existing profile
        const planToApply = (session.metadata?.plan ?? lifetimePlan) as string;
        const tierToApply = getPlanDbTier(planToApply as any);
        const { error } = await supabase
          .from("profiles")
          .update({
            plan: planToApply,
            tier: tierToApply,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingProfile.id);

        if (error) {
          console.error("Failed to update lifetime purchase for existing profile:", error);
          throw error;
        }
        console.log(
          `✅ Lifetime purchased for existing profile ${existingProfile.id} (${planToApply}) (source: ${acquisitionSource})`
        );
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
            source: acquisitionSource,
            purchased_at: new Date().toISOString(),
            claimed: false,
          }, {
            onConflict: "email",
          });

        if (error) {
          console.error("Failed to store lifetime purchase:", error);
          // Don't throw - the payment succeeded, we just couldn't store it
        }
        console.log(`✅ Lifetime purchase stored for ${customerEmail} (source: ${acquisitionSource})`);
      }
    }
    return;
  }

  const productPurchaseId = session.metadata?.digital_product_purchase_id;
  if (productPurchaseId) {
    await handleDigitalProductPurchase(session, supabase, productPurchaseId);
    return;
  }

  const signupFlow = session.metadata?.flow === SIGNUP_CHECKOUT_FLOW;
  const signupUserId = session.metadata?.userId;
  if (signupFlow && signupUserId) {
    const updatePayload: Record<string, any> = {
      signup_checkout_session_id: session.id,
      signup_checkout_status: "complete",
      signup_checkout_plan: session.metadata?.plan ?? null,
      signup_checkout_completed_at: new Date().toISOString(),
      signup_checkout_expires_at: session.expires_at
        ? new Date(session.expires_at * 1000).toISOString()
        : null,
    };

    if (typeof session.customer === "string") {
      updatePayload.stripe_customer_id = session.customer;
    }

    const { error } = await supabase
      .from("profiles")
      .update(updatePayload)
      .eq("id", signupUserId);

    if (error) {
      console.error("Failed to update signup checkout status:", error);
    } else {
      void recordSystemMetric({
        metric: "signup_checkout:completed",
        value: 1,
        sampleRate: 0.25,
      });
    }
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
  const { data: existingBooking, error: bookingFetchError } = await supabase
    .from("bookings")
    .select("status, payment_status, stripe_payment_intent_id")
    .eq("id", bookingId)
    .maybeSingle();

  if (bookingFetchError) {
    console.error(`Failed to fetch booking ${bookingId}:`, bookingFetchError);
    throw bookingFetchError;
  }

  if (!existingBooking) {
    console.error(`Booking ${bookingId} not found, skipping update`);
    return;
  }

  if (
    existingBooking.payment_status === "paid" ||
    (session.payment_intent &&
      existingBooking.stripe_payment_intent_id === session.payment_intent)
  ) {
    console.log(`⚠️ Booking ${bookingId} already marked as paid for this payment, skipping update`);
    return;
  }

  // Update booking payment status and confirm the booking (guarded update)
  const { data: updatedBooking, error: updateError } = await supabase
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
    .eq("id", bookingId)
    .neq("payment_status", "paid")
    .select("id")
    .single();

  if (updateError) {
    // If no rows were updated, another handler beat us to it
    if (updateError.code === "PGRST116") {
      console.log(`⚠️ Booking ${bookingId} already marked as paid by another process, skipping side-effects`);
      return;
    }
    console.error("Failed to update booking payment status:", updateError);
    throw updateError;
  }

  if (!updatedBooking) {
    console.log(`⚠️ Booking ${bookingId} update returned no rows, skipping side-effects`);
    return;
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
          price_currency,
          duration_minutes
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
    const startDate = new Date(bookingDetails.scheduled_at);
    const durationMinutes =
      bookingDetails?.services?.duration_minutes && bookingDetails.services.duration_minutes > 0
        ? bookingDetails.services.duration_minutes
        : 60;

    if (!Number.isNaN(startDate.getTime())) {
      const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);
      const descriptionLines = [
        `TutorLingua booking - ${bookingDetails?.services?.name ?? "Lesson"}`,
        `Student: ${bookingDetails?.students?.full_name ?? "Unknown"}`,
        `Booking ID: ${bookingId}`,
      ];

      createCalendarEventForBooking({
        tutorId,
        bookingId,
        title: `${bookingDetails?.services?.name ?? "Lesson"} with ${bookingDetails?.students?.full_name ?? "Student"}`,
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        description: descriptionLines.join("\n"),
        studentEmail: bookingDetails?.students?.email ?? undefined,
        timezone: bookingDetails?.timezone ?? "UTC",
      }).catch((err) => {
        // Don't fail the webhook if calendar creation fails
        console.error("[Webhook] Failed to create calendar event:", err);
      });
    }
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

  // Add to student library if metadata indicates digital download
  if (session.metadata?.product_type === "digital_download" && session.metadata?.studentUserId && purchase.products?.id) {
    try {
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
    } catch (libraryInsertError) {
      console.error("Unexpected error inserting student library item", libraryInsertError);
    }
  }

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
  // Handles both legacy "ai_practice" and new "ai_practice_blocks" freemium model
  if (subscription.metadata?.type === "ai_practice" || subscription.metadata?.type === "ai_practice_blocks") {
    await handleAIPracticeSubscriptionUpdate(subscription, supabase);
    return;
  }

  // Check if this is a Lesson subscription (student subscription)
  if (subscription.metadata?.type === "lesson_subscription") {
    await handleLessonSubscriptionUpdate(subscription, supabase);
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
  let plan = mapPriceIdToPlan(priceId);

  // If subscription is paused (trial ended without payment), downgrade to professional
  if (subscription.status === "paused") {
    plan = "professional";
    console.log(`[Webhook] Subscription paused for profile ${profile.id}, downgrading to professional`);
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

  // Update profile plan and tier
  const tier = getPlanDbTier(plan); // Maps to DB enum: 'standard' | 'studio'
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ plan, tier })
    .eq("id", profile.id);

  if (updateError) {
    console.error("Failed to update profile plan:", updateError);
    throw updateError;
  }

  console.log(`✅ Subscription updated for profile ${profile.id}: ${plan} (tier: ${tier})`);
}

/**
 * Handle subscription deletion
 * Mark subscription canceled and revoke access unless the tutor has lifetime access.
 */
async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
  supabase: ServiceRoleClient
) {
  // Check if this is an AI Practice subscription
  // Handles both legacy "ai_practice" and new "ai_practice_blocks" freemium model
  if (subscription.metadata?.type === "ai_practice" || subscription.metadata?.type === "ai_practice_blocks") {
    await handleAIPracticeSubscriptionDeleted(subscription, supabase);
    return;
  }

  // Check if this is a Lesson subscription
  if (subscription.metadata?.type === "lesson_subscription") {
    await handleLessonSubscriptionDeleted(subscription, supabase);
    return;
  }

  const customerId = subscription.customer as string;

  // Find profile by Stripe customer ID
  const { data: profile, error: findError } = await supabase
    .from("profiles")
    .select("id, plan")
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

  // Lifetime access should never be downgraded by subscription cancellation.
  if (profile.plan === "tutor_life" || profile.plan === "founder_lifetime") {
    // Ensure tier is consistent with the preserved plan (e.g., prevent lingering Studio tier from prior subscriptions).
    const { error: tierError } = await supabase
      .from("profiles")
      .update({ tier: getPlanDbTier(profile.plan as any) })
      .eq("id", profile.id);
    if (tierError) {
      console.error("Failed to reconcile tier for lifetime profile:", tierError);
    }
    console.log(`✅ Subscription canceled for profile ${profile.id}, lifetime plan preserved (${profile.plan})`);
    return;
  }

  const fallbackPlan = "professional";

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ plan: fallbackPlan, tier: "standard" })
    .eq("id", profile.id);

  if (updateError) {
    console.error("Failed to downgrade profile:", updateError);
    throw updateError;
  }

  console.log(`✅ Subscription canceled for profile ${profile.id}, plan set to ${fallbackPlan}, tier reset to standard`);
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
 * Handle expired checkout sessions
 * Updates signup checkout status when a session expires without completion
 */
async function handleCheckoutSessionExpired(
  session: Stripe.Checkout.Session,
  supabase: ServiceRoleClient
) {
  const signupFlow = session.metadata?.flow === SIGNUP_CHECKOUT_FLOW;
  const signupUserId = session.metadata?.userId;

  if (!signupFlow || !signupUserId) {
    // Not a signup checkout session, ignore
    return;
  }

  // Update the profile to mark the checkout as expired
  const { error } = await supabase
    .from("profiles")
    .update({
      signup_checkout_status: "expired",
      signup_checkout_expires_at: new Date().toISOString(),
    })
    .eq("id", signupUserId)
    .eq("signup_checkout_session_id", session.id); // Only update if this is their current session

  if (error) {
    console.error("Failed to mark signup checkout as expired:", error);
    // Don't throw - this is non-critical
    return;
  }

  void recordSystemMetric({
    metric: "signup_checkout:expired",
    value: 1,
    sampleRate: 0.25,
  });

  console.log(`✅ Signup checkout session ${session.id} marked as expired for user ${signupUserId}`);
}

/**
 * Handle AI Practice subscription updates (student subscriptions)
 *
 * FREEMIUM MODEL:
 * - Legacy "ai_practice" type: Full subscription (base + blocks), sets ai_practice_enabled
 * - New "ai_practice_blocks" type: Blocks-only subscription, doesn't touch ai_practice_enabled
 *   (free tier is controlled by ai_practice_free_tier_enabled flag)
 */
async function handleAIPracticeSubscriptionUpdate(
  subscription: StripeSubscriptionPayload,
  supabase: ServiceRoleClient
) {
  const studentId = subscription.metadata?.studentId;
  const tutorId = subscription.metadata?.tutorId;
  const isBlocksOnly = subscription.metadata?.is_blocks_only === "true" ||
                       subscription.metadata?.type === "ai_practice_blocks";

  if (!studentId) {
    console.error("No studentId in AI Practice subscription metadata");
    return;
  }

  const isActive = subscription.status === "active" || subscription.status === "trialing";

  // Find the metered subscription item (block price)
  const meteredItem = subscription.items.data.find(
    (item) => item.price.recurring?.usage_type === "metered"
  );

  if (isBlocksOnly) {
    // FREEMIUM MODEL: Blocks-only subscription
    // Only update the block subscription item, don't touch ai_practice_enabled
    // (free tier access is controlled by ai_practice_free_tier_enabled)
    const { error } = await supabase
      .from("students")
      .update({
        ai_practice_block_subscription_item_id: isActive ? (meteredItem?.id || null) : null,
        // Keep ai_practice_enabled unchanged - it's controlled by free tier
      })
      .eq("id", studentId);

    if (error) {
      console.error("Failed to update AI Practice blocks subscription:", error);
      throw error;
    }

    // For blocks-only, we use the freemium RPC to get/create period
    // The period was already created when free tier was enabled
    if (isActive && tutorId) {
      // Update existing period to link to this subscription for tracking
      const { error: periodError } = await supabase
        .from("practice_usage_periods")
        .update({
          stripe_subscription_id: subscription.id,
          is_free_tier: false, // Now has paid blocks subscription
        })
        .eq("student_id", studentId)
        .gte("period_end", new Date().toISOString());

      if (periodError) {
        console.error("Failed to link subscription to usage period:", periodError);
        // Don't throw - subscription update succeeded
      }
    }

    console.log(
      `✅ AI Practice blocks subscription ${isActive ? "activated" : "updated"} for student ${studentId} (freemium model)`
    );
  } else {
    // LEGACY MODEL: Full subscription with base + blocks
    const { error } = await supabase
      .from("students")
      .update({
        ai_practice_enabled: isActive,
        ai_practice_subscription_id: subscription.id,
        ai_practice_current_period_end: new Date(
          subscription.current_period_end * 1000
        ).toISOString(),
        ai_practice_block_subscription_item_id: meteredItem?.id || null,
      })
      .eq("id", studentId);

    if (error) {
      console.error("Failed to update AI Practice subscription:", error);
      throw error;
    }

    // Create or update usage period for the new billing cycle (legacy model)
    if (isActive && tutorId) {
      const periodStart = new Date(subscription.current_period_start * 1000);
      const periodEnd = new Date(subscription.current_period_end * 1000);

      // Check if period already exists
      const { data: existingPeriod } = await supabase
        .from("practice_usage_periods")
        .select("id")
        .eq("student_id", studentId)
        .eq("subscription_id", subscription.id)
        .eq("period_start", periodStart.toISOString())
        .maybeSingle();

      if (!existingPeriod) {
        // Create new usage period with reset usage (legacy pricing)
        const { error: periodError } = await supabase
          .from("practice_usage_periods")
          .insert({
            student_id: studentId,
            tutor_id: tutorId,
            subscription_id: subscription.id,
            period_start: periodStart.toISOString(),
            period_end: periodEnd.toISOString(),
            audio_seconds_used: 0,
            text_turns_used: 0,
            blocks_consumed: 0,
            is_free_tier: false,
            current_tier_price_cents: 800, // Legacy $8 base price
          });

        if (periodError) {
          console.error("Failed to create usage period:", periodError);
          // Don't throw - subscription update succeeded
        } else {
          console.log(`✅ Created new usage period for student ${studentId} (legacy model)`);
        }
      }
    }

    console.log(
      `✅ AI Practice subscription ${isActive ? "activated" : "updated"} for student ${studentId} (legacy model)`
    );
  }
}

/**
 * Handle AI Practice subscription cancellation
 *
 * FREEMIUM MODEL:
 * - Legacy "ai_practice" type: Disables ai_practice_enabled entirely
 * - New "ai_practice_blocks" type: Only clears block subscription item,
 *   keeps free tier access (ai_practice_enabled unchanged, student reverts to free tier)
 */
async function handleAIPracticeSubscriptionDeleted(
  subscription: Stripe.Subscription,
  supabase: ServiceRoleClient
) {
  const studentId = subscription.metadata?.studentId;
  const isBlocksOnly = subscription.metadata?.is_blocks_only === "true" ||
                       subscription.metadata?.type === "ai_practice_blocks";

  if (!studentId) {
    console.error("No studentId in AI Practice subscription metadata");
    return;
  }

  if (isBlocksOnly) {
    // FREEMIUM MODEL: Blocks-only subscription canceled
    // Only clear the block subscription item, keep free tier access
    const { error } = await supabase
      .from("students")
      .update({
        ai_practice_block_subscription_item_id: null,
        // ai_practice_enabled stays unchanged - free tier still active
      })
      .eq("id", studentId);

    if (error) {
      console.error("Failed to clear AI Practice blocks subscription:", error);
      throw error;
    }

    // Mark current period as free tier again
    const { error: periodError } = await supabase
      .from("practice_usage_periods")
      .update({
        is_free_tier: true,
        stripe_subscription_id: null,
      })
      .eq("student_id", studentId)
      .gte("period_end", new Date().toISOString());

    if (periodError) {
      console.error("Failed to update usage period to free tier:", periodError);
      // Don't throw - subscription cleanup succeeded
    }

    console.log(`✅ AI Practice blocks subscription canceled for student ${studentId} (reverted to free tier)`);
  } else {
    // LEGACY MODEL: Full subscription canceled, disable access entirely
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

    console.log(`✅ AI Practice subscription canceled for student ${studentId} (legacy model)`);
  }
}

/**
 * Handle Lesson subscription updates (student lesson subscriptions)
 * Updates the subscription status and creates/updates allowance periods
 */
async function handleLessonSubscriptionUpdate(
  subscription: StripeSubscriptionPayload,
  supabase: ServiceRoleClient
) {
  const studentId = subscription.metadata?.studentId;
  const tutorId = subscription.metadata?.tutorId;
  const templateId = subscription.metadata?.templateId;

  if (!studentId || !tutorId || !templateId) {
    console.error("Missing metadata in lesson subscription:", subscription.metadata);
    return;
  }

  const isActive = subscription.status === "active" || subscription.status === "trialing";
  const periodStart = new Date(subscription.current_period_start * 1000);
  const periodEnd = new Date(subscription.current_period_end * 1000);

  // Check if subscription record exists
  const { data: existingSub } = await supabase
    .from("lesson_subscriptions")
    .select("id")
    .eq("stripe_subscription_id", subscription.id)
    .maybeSingle();

  if (existingSub) {
    // Update existing subscription
    const { error: updateError } = await supabase
      .from("lesson_subscriptions")
      .update({
        status: subscription.status,
        current_period_start: periodStart.toISOString(),
        current_period_end: periodEnd.toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingSub.id);

    if (updateError) {
      console.error("Failed to update lesson subscription:", updateError);
      throw updateError;
    }

    // Process rollover if this is a renewal (new period)
    if (isActive) {
      await supabase.rpc("process_subscription_rollover", {
        p_subscription_id: existingSub.id,
        p_new_period_start: periodStart.toISOString(),
        p_new_period_end: periodEnd.toISOString(),
      });
    }

    const context = await loadLessonSubscriptionContext(supabase, existingSub.id);
    if (context) {
      await sendLessonSubscriptionEmails({
        studentEmail: context.studentEmail,
        studentName: context.studentName,
        tutorEmail: context.tutorEmail,
        tutorName: context.tutorName,
        status: subscription.cancel_at_period_end
          ? "cancellation_scheduled"
          : "renewed",
        planName: context.planName,
        lessonsPerMonth: context.lessonsPerMonth,
        periodEnd: context.periodEnd,
        manageUrl: process.env.NEXT_PUBLIC_APP_URL
          ? `${process.env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, "")}/student/subscriptions`
          : undefined,
      });
    }
  } else {
    // Create new subscription record
    const { data: newSub, error: insertError } = await supabase
      .from("lesson_subscriptions")
      .insert({
        template_id: templateId,
        student_id: studentId,
        tutor_id: tutorId,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: subscription.customer as string,
        status: subscription.status,
        current_period_start: periodStart.toISOString(),
        current_period_end: periodEnd.toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Failed to create lesson subscription:", insertError);
      throw insertError;
    }

    // Get template to know lessons_per_month
    const { data: template } = await supabase
      .from("lesson_subscription_templates")
      .select("lessons_per_month")
      .eq("id", templateId)
      .single();

    // Create initial allowance period
    if (newSub && template) {
      const { error: periodError } = await supabase
        .from("lesson_allowance_periods")
        .insert({
          subscription_id: newSub.id,
          period_start: periodStart.toISOString(),
          period_end: periodEnd.toISOString(),
          lessons_allocated: template.lessons_per_month,
          lessons_rolled_over: 0,
          lessons_used: 0,
          is_current: true,
        });

      if (periodError) {
        console.error("Failed to create allowance period:", periodError);
        // Don't throw - subscription was created successfully
      }
    }

    const context = await loadLessonSubscriptionContext(supabase, newSub?.id || "");
    if (context) {
      await sendLessonSubscriptionEmails({
        studentEmail: context.studentEmail,
        studentName: context.studentName,
        tutorEmail: context.tutorEmail,
        tutorName: context.tutorName,
        status: "activated",
        planName: context.planName,
        lessonsPerMonth: context.lessonsPerMonth,
        periodEnd: context.periodEnd,
        manageUrl: process.env.NEXT_PUBLIC_APP_URL
          ? `${process.env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, "")}/student/subscriptions`
          : undefined,
      });
    }
  }

  console.log(
    `✅ Lesson subscription ${isActive ? "activated" : "updated"} for student ${studentId}`
  );
}

async function loadLessonSubscriptionContext(
  supabase: ServiceRoleClient,
  subscriptionId: string
): Promise<LessonSubscriptionContext | null> {
  const { data } = await supabase
    .from("lesson_subscriptions")
    .select(
      `
        id,
        current_period_end,
        student:students(full_name, email),
        tutor:profiles(full_name, email),
        template:lesson_subscription_templates (
          lessons_per_month,
          service:services(name)
        )
      `
    )
    .eq("id", subscriptionId)
    .maybeSingle<LessonSubscriptionRow>();

  if (!data) return null;

  const student = Array.isArray(data.student) ? data.student[0] : data.student;
  const tutor = Array.isArray(data.tutor) ? data.tutor[0] : data.tutor;
  const template = Array.isArray(data.template) ? data.template[0] : data.template;
  const service = template?.service;
  const serviceRecord = Array.isArray(service) ? service[0] : service;
  const serviceName = serviceRecord?.name ?? null;

  return {
    studentEmail: student?.email ?? null,
    studentName: student?.full_name || "Student",
    tutorEmail: tutor?.email ?? null,
    tutorName: tutor?.full_name || "Tutor",
    lessonsPerMonth: template?.lessons_per_month ?? null,
    planName: serviceName ? `${serviceName} subscription` : "Lesson subscription",
    periodEnd: data.current_period_end,
  };
}

/**
 * Handle Lesson subscription cancellation
 * Marks the subscription as canceled but allows using remaining credits
 */
async function handleLessonSubscriptionDeleted(
  subscription: Stripe.Subscription,
  supabase: ServiceRoleClient
) {
  const { error } = await supabase
    .from("lesson_subscriptions")
    .update({
      status: "canceled",
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id);

  if (error) {
    console.error("Failed to mark lesson subscription as canceled:", error);
    throw error;
  }

  // Finalize the current period
  const { data: sub } = await supabase
    .from("lesson_subscriptions")
    .select("id")
    .eq("stripe_subscription_id", subscription.id)
    .single();

  if (sub) {
    await supabase
      .from("lesson_allowance_periods")
      .update({
        is_current: false,
        finalized_at: new Date().toISOString(),
      })
      .eq("subscription_id", sub.id)
      .eq("is_current", true);

    const context = await loadLessonSubscriptionContext(supabase, sub.id);
    if (context) {
      await sendLessonSubscriptionEmails({
        studentEmail: context.studentEmail,
        studentName: context.studentName,
        tutorEmail: context.tutorEmail,
        tutorName: context.tutorName,
        status: "canceled",
        planName: context.planName,
        lessonsPerMonth: context.lessonsPerMonth,
        periodEnd: context.periodEnd,
        manageUrl: process.env.NEXT_PUBLIC_APP_URL
          ? `${process.env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, "")}/student/subscriptions`
          : undefined,
      });
    }
  }

  console.log(`✅ Lesson subscription canceled: ${subscription.id}`);
}
