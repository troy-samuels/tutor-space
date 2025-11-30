"use server";

import { createClient } from "@/lib/supabase/server";
import { getOrCreateStripeCustomer, createCheckoutSession, createBillingPortalSession } from "@/lib/stripe";

/**
 * Create or update Stripe customer for the current user
 * Call this after user signs up or from settings page
 */
export async function syncStripeCustomer() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "Not authenticated" };
  }

  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, stripe_customer_id, full_name, email")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return { error: "Profile not found" };
  }

  // If customer already exists, return it
  if (profile.stripe_customer_id) {
    return { success: true, customerId: profile.stripe_customer_id };
  }

  try {
    // Create Stripe customer
    const customer = await getOrCreateStripeCustomer({
      userId: user.id,
      email: profile.email || user.email || "",
      name: profile.full_name || undefined,
      metadata: {
        profileId: profile.id,
      },
    });

    // Update profile with stripe_customer_id
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ stripe_customer_id: customer.id })
      .eq("id", user.id);

    if (updateError) {
      console.error("Failed to update profile with Stripe customer ID:", updateError);
      return { error: "Failed to save Stripe customer ID" };
    }

    return { success: true, customerId: customer.id };
  } catch (error) {
    console.error("Error creating Stripe customer:", error);
    return { error: "Failed to create Stripe customer" };
  }
}

/**
 * Create a checkout session for a booking payment
 */
export async function createBookingCheckoutSession(params: {
  bookingId: string;
  amount?: number;
  serviceName?: string;
  serviceDescription?: string;
}) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "Not authenticated" };
  }

  // Get user profile with stripe_customer_id
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return { error: "Profile not found" };
  }

  // Ensure customer exists
  let customerId = profile.stripe_customer_id;
  if (!customerId) {
    const syncResult = await syncStripeCustomer();
    if (syncResult.error || !syncResult.customerId) {
      return { error: "Failed to create Stripe customer" };
    }
    customerId = syncResult.customerId;
  }

  const { data: bookingRecord, error: bookingError } = await supabase
    .from("bookings")
    .select(
      `
        id,
        tutor_id,
        payment_amount,
        currency,
        services (
          name,
          description
        )
      `
    )
    .eq("id", params.bookingId)
    .eq("tutor_id", user.id)
    .single();

  if (bookingError || !bookingRecord) {
    return { error: "Booking not found" };
  }

  if (!bookingRecord.payment_amount || bookingRecord.payment_amount <= 0) {
    return { error: "Booking does not have a payment amount" };
  }

  const amountCents = bookingRecord.payment_amount;
  const currency = (bookingRecord.currency || "USD").toLowerCase();
  const serviceData = Array.isArray(bookingRecord.services)
    ? bookingRecord.services[0]
    : bookingRecord.services;
  const serviceName =
    serviceData?.name || params.serviceName || "Booking Payment";
  const serviceDescription =
    serviceData?.description || params.serviceDescription;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  try {
    const session = await createCheckoutSession({
      customerId,
      priceAmount: amountCents,
      currency,
      successUrl: `${baseUrl}/bookings/${params.bookingId}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${baseUrl}/bookings/${params.bookingId}/cancelled`,
      metadata: {
        bookingId: params.bookingId,
        userId: user.id,
      },
      lineItems: [
        {
          name: serviceName,
          description: serviceDescription,
          amount: amountCents,
          quantity: 1,
        },
      ],
    });

    return { success: true, sessionId: session.id, url: session.url };
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return { error: "Failed to create checkout session" };
  }
}

/**
 * Create billing portal session for managing subscriptions
 */
export async function createBillingPortal() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "Not authenticated" };
  }

  // Get user profile with stripe_customer_id
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  if (profileError || !profile || !profile.stripe_customer_id) {
    return { error: "No Stripe customer found" };
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  try {
    const session = await createBillingPortalSession({
      customerId: profile.stripe_customer_id,
      returnUrl: `${baseUrl}/settings/billing`,
    });

    return { success: true, url: session.url };
  } catch (error) {
    console.error("Error creating billing portal session:", error);
    return { error: "Failed to create billing portal session" };
  }
}
