import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { randomUUID } from "crypto";
import { stripe } from "@/lib/stripe";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import Stripe from "stripe";
import { validateWebhookConfig } from "@/lib/stripe/webhook-config";
import { recordSystemEvent, recordSystemMetric, shouldSample } from "@/lib/monitoring";

// Import utility functions
import {
  claimStripeEvent,
  markStripeEventProcessed,
  markStripeEventFailed,
} from "./utils/event-claim";
import type { StripeSubscriptionPayload } from "./utils/types";

// Import handlers
import { handleLifetimePurchase } from "./handlers/lifetime-purchase";
import { handleDigitalProductCheckout } from "./handlers/digital-product";
import { handleSignupCheckout, handleCheckoutSessionExpired } from "./handlers/signup-checkout";
import { handleBookingPayment, handleCheckoutSessionAsyncPaymentFailed } from "./handlers/booking-payment";
import {
  handleSubscriptionUpdate,
  handleSubscriptionDeleted,
  handleInvoicePaymentSucceeded,
  handleInvoicePaymentFailed,
  handleAccountUpdated,
  handleAccountDeauthorized,
} from "./handlers/subscription";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

  // Validate webhook configuration
  const config = validateWebhookConfig();

  if (!config.isConfigured || !config.platformSecret) {
    const errorMessages = config.issues
      .filter((i) => i.severity === "error")
      .map((i) => i.message)
      .join("; ");
    console.error(`[Stripe Webhook] Configuration error: ${errorMessages}`);
    void recordSystemEvent({
      source: "stripe_webhook",
      message: "Webhook not configured",
      meta: { correlationId, issues: config.issues },
    });
    // 503 tells Stripe to retry (configuration issue, not permanent failure)
    return NextResponse.json(
      {
        error: "webhook_not_configured",
        correlationId,
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }

  let event: Stripe.Event;

  // Verify webhook signature with the configured secret
  try {
    event = stripe.webhooks.constructEvent(body, signature, config.platformSecret);
    console.log(`[Stripe Webhook] Received: ${event.type} (${event.id}), livemode=${event.livemode}`);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error(`[Stripe Webhook] Signature verification failed (${correlationId}):`, errorMessage);
    void recordSystemEvent({
      source: "stripe_webhook",
      message: "Signature verification failed",
      meta: {
        correlationId,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      },
    });
    // 400 tells Stripe NOT to retry (signature mismatch is permanent for this event)
    return NextResponse.json(
      {
        error: "signature_verification_failed",
        correlationId,
        timestamp: new Date().toISOString(),
      },
      { status: 400 }
    );
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

  // Track processing start time for duration metrics
  const processingStartTime = Date.now();

  try {
    const { duplicate } = await claimStripeEvent(event, supabase, correlationId);

    if (duplicate) {
      console.log(`[Stripe Webhook] Duplicate event ${event.id}, skipping`);
      return NextResponse.json({
        received: true,
        duplicate: true,
        correlationId,
      });
    }
  } catch (idempotencyError) {
    console.error(`[Stripe Webhook] Failed to claim event (${correlationId}):`, idempotencyError);
    void recordSystemEvent({
      source: "stripe_webhook",
      message: "Failed to claim event for processing",
      meta: { correlationId, eventId: event.id, error: String(idempotencyError) },
    });
    return NextResponse.json(
      {
        error: "claim_failed",
        correlationId,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }

  console.log(`[Stripe Webhook] Processing: ${event.type} (${correlationId})`);

  // Handle different event types
  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(session, supabase);
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        // Includes tutor plans, legacy AI practice plans, and student practice
        // Unlimited/Solo subscriptions (metadata.type=student_practice_subscription).
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
        // Handles tutor subscription retries plus student practice downgrades.
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

      case "checkout.session.async_payment_failed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionAsyncPaymentFailed(session, supabase);
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    const processingDurationMs = Date.now() - processingStartTime;
    await markStripeEventProcessed(event, supabase, processingDurationMs);

    console.log(`[Stripe Webhook] Completed: ${event.type} in ${processingDurationMs}ms (${correlationId})`);

    void recordSystemMetric({
      metric: `stripe_webhook:${event.type}`,
      value: 1,
      sampleRate: 0.1,
    });

    return NextResponse.json({
      received: true,
      correlationId,
      eventType: event.type,
      processingTimeMs: processingDurationMs,
    });
  } catch (error) {
    const processingDurationMs = Date.now() - processingStartTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[Stripe Webhook] Failed: ${event.type} - ${errorMessage} (${correlationId})`);
    await markStripeEventFailed(event, supabase, error);
    void recordSystemEvent({
      source: "stripe_webhook",
      message: `Error handling event ${event.type}`,
      meta: { correlationId, eventId: event.id, error: errorMessage, durationMs: processingDurationMs },
    });
    return NextResponse.json(
      {
        error: "handler_failed",
        correlationId,
        eventType: event.type,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * Handle successful checkout session.
 * Delegates to appropriate handler based on session metadata.
 */
async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
  supabase: NonNullable<ReturnType<typeof createServiceRoleClient>>
): Promise<void> {
  // Try handlers in order of specificity
  if (await handleLifetimePurchase(session, supabase)) return;
  if (await handleDigitalProductCheckout(session, supabase)) return;
  if (await handleSignupCheckout(session, supabase)) return;

  // Default to booking payment
  await handleBookingPayment(session, supabase);
}
