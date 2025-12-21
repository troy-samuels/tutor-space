import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
// IMPORTANT: Hardcoded to stable Stripe API version - do NOT use env override
// The version 2025-12-15.clover causes connection errors, use 2024-12-18.acacia
const stripeApiVersion = "2024-12-18.acacia";

if (!stripeSecretKey) {
  console.warn(
    "[Stripe] STRIPE_SECRET_KEY is not set. Billing features will be disabled until it is configured."
  );
}

const stripeClient = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: stripeApiVersion as Stripe.LatestApiVersion,
      typescript: true,
    })
  : null;

const missingStripeError = () =>
  new Error(
    "Stripe is not configured. Set STRIPE_SECRET_KEY in your environment to enable billing."
  );

// Export a proxy so existing call sites get a clear error when Stripe is not configured,
// without failing at module load time during local development or CI.
export const stripe =
  (stripeClient as Stripe | null) ??
  (new Proxy(
    {},
    {
      get: () => {
        throw missingStripeError();
      },
      apply: () => {
        throw missingStripeError();
      },
    }
  ) as Stripe);

/**
 * Get or create a Stripe customer for a user
 */
export async function getOrCreateStripeCustomer(params: {
  userId: string;
  email: string;
  name?: string;
  metadata?: Record<string, string>;
}): Promise<Stripe.Customer> {
  const { userId, email, name, metadata } = params;

  const normalizedMetadata: Record<string, string> = {
    userId,
    ...(metadata ?? {}),
  };

  const existingCustomers = await stripe.customers.list({
    email,
    limit: 10,
  });

  const matchedCustomer =
    existingCustomers.data.find((customer) => {
      const meta = customer.metadata || {};

      if (meta.userId && meta.userId === userId) {
        return true;
      }

      if (metadata?.profileId && meta.profileId === metadata.profileId) {
        return true;
      }

      return false;
    }) ?? existingCustomers.data[0];

  if (matchedCustomer) {
    const updatedMetadata = {
      ...matchedCustomer.metadata,
      ...normalizedMetadata,
    };

    const hasMetadataChanges = Object.entries(normalizedMetadata).some(
      ([key, value]) => matchedCustomer.metadata?.[key] !== value
    );

    if (hasMetadataChanges) {
      await stripe.customers.update(matchedCustomer.id, {
        metadata: updatedMetadata,
      });
    }

    return matchedCustomer;
  }

  // Create new customer
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: normalizedMetadata,
  });

  return customer;
}

/**
 * Create a checkout session for a one-time payment (booking)
 */
export async function createCheckoutSession(params: {
  customerId: string;
  priceAmount: number; // in cents
  currency?: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
  lineItems?: Array<{
    name: string;
    description?: string;
    amount: number;
    quantity?: number;
  }>;
  transferDestinationAccountId?: string; // Stripe Connect destination
  applicationFeeCents?: number; // platform fee (in cents)
  idempotencyKey?: string; // Prevents duplicate checkout sessions
}): Promise<Stripe.Checkout.Session> {
  const {
    customerId,
    priceAmount,
    currency = "usd",
    successUrl,
    cancelUrl,
    metadata,
    lineItems,
    transferDestinationAccountId,
    applicationFeeCents,
    idempotencyKey,
  } = params;

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "payment",
    payment_method_types: ["card"],
    line_items: lineItems
      ? lineItems.map((item) => ({
          price_data: {
            currency,
            product_data: {
              name: item.name,
              description: item.description,
            },
            unit_amount: item.amount,
          },
          quantity: item.quantity || 1,
        }))
      : [
          {
            price_data: {
              currency,
              product_data: {
                name: "Booking Payment",
              },
              unit_amount: priceAmount,
            },
            quantity: 1,
          },
        ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata,
    payment_intent_data:
      transferDestinationAccountId != null || applicationFeeCents != null
        ? {
            transfer_data:
              transferDestinationAccountId != null
                ? { destination: transferDestinationAccountId }
                : undefined,
            application_fee_amount: applicationFeeCents ?? undefined,
          }
        : undefined,
  }, idempotencyKey ? { idempotencyKey } : undefined);

  return session;
}

/**
 * Create a subscription for the all-access plan
 */
export async function createSubscription(params: {
  customerId: string;
  priceId: string;
  metadata?: Record<string, string>;
}): Promise<Stripe.Subscription> {
  const { customerId, priceId, metadata } = params;

  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    metadata,
    payment_behavior: "default_incomplete",
    payment_settings: { save_default_payment_method: "on_subscription" },
    expand: ["latest_invoice.payment_intent"],
  });

  return subscription;
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  const subscription = await stripe.subscriptions.cancel(subscriptionId);
  return subscription;
}

/**
 * Create a billing portal session
 */
export async function createBillingPortalSession(params: {
  customerId: string;
  returnUrl: string;
  configurationId?: string;
}): Promise<Stripe.BillingPortal.Session> {
  const { customerId, returnUrl, configurationId } = params;
  const resolvedConfigurationId =
    configurationId ?? process.env.STRIPE_BILLING_PORTAL_CONFIGURATION_ID ?? undefined;

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
    ...(resolvedConfigurationId ? { configuration: resolvedConfigurationId } : {}),
  });

  return session;
}

/**
 * Retrieve a checkout session
 */
export async function getCheckoutSession(
  sessionId: string
): Promise<Stripe.Checkout.Session> {
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  return session;
}

/**
 * Retrieve a subscription
 */
export async function getSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  return subscription;
}

/**
 * List all prices for products (useful for plan selection)
 */
export async function listPrices(): Promise<Stripe.Price[]> {
  const prices = await stripe.prices.list({
    active: true,
    expand: ["data.product"],
  });
  return prices.data;
}

/**
 * Create a payment intent (alternative to checkout sessions)
 */
export async function createPaymentIntent(params: {
  amount: number;
  currency?: string;
  customerId?: string;
  metadata?: Record<string, string>;
}): Promise<Stripe.PaymentIntent> {
  const { amount, currency = "usd", customerId, metadata } = params;

  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency,
    customer: customerId,
    metadata,
    automatic_payment_methods: {
      enabled: true,
    },
  });

  return paymentIntent;
}

/**
 * Get customer's active subscriptions in parallel with customer lookup
 */
export async function getCustomerWithSubscriptions(params: {
  userId: string;
  email: string;
  name?: string;
}): Promise<{
  customer: Stripe.Customer;
  subscriptions: Stripe.Subscription[];
}> {
  const { userId, email, name } = params;

  // Get or create customer first
  const customer = await getOrCreateStripeCustomer({ userId, email, name });

  // Then get subscriptions
  const subscriptions = await stripe.subscriptions.list({
    customer: customer.id,
    status: "active",
    limit: 10,
  });

  return {
    customer,
    subscriptions: subscriptions.data,
  };
}

/**
 * Update a subscription with proper proration handling
 */
export async function updateSubscription(params: {
  subscriptionId: string;
  priceId: string;
  prorationBehavior?: "create_prorations" | "none" | "always_invoice";
  billingCycleAnchor?: "now" | "unchanged";
  metadata?: Record<string, string>;
}): Promise<Stripe.Subscription> {
  const {
    subscriptionId,
    priceId,
    prorationBehavior = "create_prorations",
    billingCycleAnchor,
    metadata,
  } = params;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const currentItem = subscription.items.data[0];

  if (!currentItem) {
    throw new Error("No subscription item found");
  }

  const updateParams: Stripe.SubscriptionUpdateParams = {
    items: [{ id: currentItem.id, price: priceId }],
    proration_behavior: prorationBehavior,
  };

  if (billingCycleAnchor) {
    updateParams.billing_cycle_anchor = billingCycleAnchor;
  }

  if (metadata) {
    updateParams.metadata = {
      ...subscription.metadata,
      ...metadata,
    };
  }

  return stripe.subscriptions.update(subscriptionId, updateParams);
}

/**
 * Cancel a subscription at period end (safe cancellation)
 */
export async function cancelSubscriptionAtPeriodEnd(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  return stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });
}

/**
 * Create a checkout session for subscription with flexible options
 */
export async function createSubscriptionCheckoutSession(params: {
  customerId: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  trialDays?: number;
  metadata?: Record<string, string>;
  allowPromotionCodes?: boolean;
}): Promise<Stripe.Checkout.Session> {
  const {
    customerId,
    priceId,
    successUrl,
    cancelUrl,
    trialDays,
    metadata,
    allowPromotionCodes = false,
  } = params;

  return stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_collection: "always",
    success_url: successUrl,
    cancel_url: cancelUrl,
    allow_promotion_codes: allowPromotionCodes,
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: trialDays ? { trial_period_days: trialDays } : undefined,
    metadata,
  });
}

/**
 * Create a one-time payment checkout session (for lifetime plans)
 */
export async function createOneTimeCheckoutSession(params: {
  customerId: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}): Promise<Stripe.Checkout.Session> {
  const { customerId, priceId, successUrl, cancelUrl, metadata } = params;

  return stripe.checkout.sessions.create({
    customer: customerId,
    mode: "payment",
    payment_method_types: ["card"],
    success_url: successUrl,
    cancel_url: cancelUrl,
    line_items: [{ price: priceId, quantity: 1 }],
    metadata,
  });
}
