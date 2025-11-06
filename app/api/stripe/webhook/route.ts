import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import Stripe from "stripe";

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
        const subscription = event.data.object as Stripe.Subscription;
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
  supabase: ReturnType<typeof createServiceRoleClient>
) {
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
      updated_at: new Date().toISOString(),
    })
    .eq("id", bookingId);

  if (error) {
    console.error("Failed to update booking payment status:", error);
    throw error;
  }

  console.log(`✅ Booking ${bookingId} marked as paid`);

  // TODO: Send confirmation email here
  // TODO: Create calendar event if calendar is connected
}

/**
 * Handle subscription creation or update
 * Update profile with subscription details
 */
async function handleSubscriptionUpdate(
  subscription: Stripe.Subscription,
  supabase: ReturnType<typeof createServiceRoleClient>
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
  supabase: ReturnType<typeof createServiceRoleClient>
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
