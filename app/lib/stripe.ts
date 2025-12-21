import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripeApiVersion = process.env.STRIPE_API_VERSION || "2024-10-17";

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
