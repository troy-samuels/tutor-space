import { stripe } from "@/lib/stripe";

export type StripeServiceSyncParams = {
  stripeAccountId: string;
  serviceId: string;
  tutorId: string;
  name: string;
  description?: string | null;
  priceCents: number;
  currency: string;
  durationMinutes: number;
  offerType: string;
  isActive: boolean;
  existingProductId?: string | null;
  existingPriceId?: string | null;
  existingPriceCents?: number | null;
  existingCurrency?: string | null;
};

export type StripeServiceSyncResult = {
  stripeProductId: string | null;
  stripePriceId: string | null;
};

export function canSyncStripeConnectProducts(
  stripeAccountId: string | null | undefined
): stripeAccountId is string {
  return Boolean(process.env.STRIPE_SECRET_KEY && stripeAccountId);
}

export async function syncServiceToStripeConnect(
  params: StripeServiceSyncParams
): Promise<StripeServiceSyncResult> {
  const metadata = {
    tutor_id: params.tutorId,
    service_id: params.serviceId,
    offer_type: params.offerType,
    duration_minutes: String(params.durationMinutes),
  };

  let createdProductId: string | null = null;

  try {
    let productId = params.existingProductId ?? null;
    if (!productId) {
      const product = await stripe.products.create(
        {
          name: params.name,
          description: params.description || undefined,
          active: params.isActive,
          metadata,
        },
        { stripeAccount: params.stripeAccountId }
      );
      productId = product.id;
      createdProductId = product.id;
    }

    const normalizedCurrency = params.currency.toLowerCase();
    const existingCurrency = params.existingCurrency?.toLowerCase() ?? null;
    const existingPriceCents = params.existingPriceCents ?? null;
    const priceChanged =
      params.priceCents !== existingPriceCents || normalizedCurrency !== existingCurrency;

    let priceId = params.existingPriceId ?? null;

    if (params.priceCents <= 0) {
      if (priceId) {
        await stripe.prices.update(
          priceId,
          { active: false },
          { stripeAccount: params.stripeAccountId }
        );
      }
      priceId = null;
    } else if (!priceId || priceChanged) {
      const price = await stripe.prices.create(
        {
          currency: normalizedCurrency,
          unit_amount: params.priceCents,
          product: productId,
        },
        { stripeAccount: params.stripeAccountId }
      );
      if (priceId && priceId !== price.id) {
        await stripe.prices.update(
          priceId,
          { active: false },
          { stripeAccount: params.stripeAccountId }
        );
      }
      priceId = price.id;
      await stripe.products.update(
        productId,
        { default_price: priceId },
        { stripeAccount: params.stripeAccountId }
      );
    }

    await stripe.products.update(
      productId,
      {
        name: params.name,
        description: params.description || undefined,
        active: params.isActive,
        metadata,
      },
      { stripeAccount: params.stripeAccountId }
    );

    if (priceId) {
      await stripe.prices.update(
        priceId,
        { active: params.isActive },
        { stripeAccount: params.stripeAccountId }
      );
    }

    return { stripeProductId: productId, stripePriceId: priceId };
  } catch (error) {
    if (createdProductId) {
      try {
        await stripe.products.update(
          createdProductId,
          { active: false },
          { stripeAccount: params.stripeAccountId }
        );
      } catch (cleanupError) {
        console.error("[Stripe Connect] Failed to archive product after sync error", cleanupError);
      }
    }
    throw error;
  }
}

export async function archiveStripeServiceProduct(params: {
  stripeAccountId: string;
  stripeProductId: string | null | undefined;
  stripePriceId: string | null | undefined;
}): Promise<void> {
  if (!params.stripeProductId) {
    return;
  }

  await stripe.products.update(
    params.stripeProductId,
    { active: false },
    { stripeAccount: params.stripeAccountId }
  );

  if (params.stripePriceId) {
    await stripe.prices.update(
      params.stripePriceId,
      { active: false },
      { stripeAccount: params.stripeAccountId }
    );
  }
}
