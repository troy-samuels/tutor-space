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

export type StripePackageSyncParams = {
  stripeAccountId: string;
  packageId: string;
  tutorId: string;
  serviceId: string | null;
  serviceName: string;
  packageName: string;
  priceCents: number;
  currency: string;
  sessionCount: number;
  isActive: boolean;
  existingProductId?: string | null;
  existingPriceId?: string | null;
  existingPriceCents?: number | null;
  existingCurrency?: string | null;
};

export type StripePackageSyncResult = {
  stripeProductId: string | null;
  stripePriceId: string | null;
};

export async function syncPackageToStripeConnect(
  params: StripePackageSyncParams
): Promise<StripePackageSyncResult> {
  const logPrefix = `[Stripe Package Sync] packageId=${params.packageId} tutorId=${params.tutorId} accountId=${params.stripeAccountId}`;

  const metadata = {
    tutor_id: params.tutorId,
    package_id: params.packageId,
    service_id: params.serviceId ?? "",
    session_count: String(params.sessionCount),
    type: "session_package",
  };

  let createdProductId: string | null = null;

  try {
    // Reuse existing product or create new one
    let productId = params.existingProductId ?? null;
    if (!productId) {
      console.log(`${logPrefix} action=create_product`);
      const product = await stripe.products.create(
        {
          name: `${params.serviceName} - ${params.packageName}`,
          active: params.isActive,
          metadata,
        },
        {
          stripeAccount: params.stripeAccountId,
          idempotencyKey: `pkg:${params.packageId}:product:${params.tutorId}`,
        }
      );
      productId = product.id;
      createdProductId = product.id;
      console.log(`${logPrefix} action=product_created productId=${productId}`);
    }

    const normalizedCurrency = params.currency.toLowerCase();
    const existingCurrency = params.existingCurrency?.toLowerCase() ?? null;
    const existingPriceCents = params.existingPriceCents ?? null;
    const priceChanged =
      params.priceCents !== existingPriceCents || normalizedCurrency !== existingCurrency;

    let priceId = params.existingPriceId ?? null;

    // If price is $0 or less, deactivate existing price and keep product in sync
    if (params.priceCents <= 0) {
      if (priceId) {
        try {
          await stripe.prices.update(
            priceId,
            { active: false },
            { stripeAccount: params.stripeAccountId }
          );
          console.log(`${logPrefix} action=deactivate_price priceId=${priceId}`);
        } catch (error: unknown) {
          const stripeError = error as { code?: string };
          if (stripeError.code !== "resource_missing") throw error;
          console.warn(`${logPrefix} action=skip_deactivate_price priceId=${priceId} reason=resource_missing`);
          priceId = null;
        }
      }
      // Update product metadata/name and active status (even for free/inactive packages)
      await stripe.products.update(
        productId,
        {
          name: `${params.serviceName} - ${params.packageName}`,
          active: params.isActive,
          metadata,
        },
        { stripeAccount: params.stripeAccountId }
      );
      console.log(`${logPrefix} action=update_product price=none productId=${productId}`);
      return { stripeProductId: productId, stripePriceId: null };
    }

    // Create new price if needed
    if (!priceId || priceChanged) {
      console.log(`${logPrefix} action=create_price amount=${params.priceCents} currency=${normalizedCurrency}`);
      const price = await stripe.prices.create(
        {
          currency: normalizedCurrency,
          unit_amount: params.priceCents,
          product: productId,
        },
        {
          stripeAccount: params.stripeAccountId,
          idempotencyKey: `pkg:${params.packageId}:price:${params.priceCents}:${normalizedCurrency}`,
        }
      );

      // Deactivate old price if it existed and is different
      if (priceId && priceId !== price.id) {
        try {
          await stripe.prices.update(
            priceId,
            { active: false },
            { stripeAccount: params.stripeAccountId }
          );
          console.log(`${logPrefix} action=deactivate_old_price priceId=${priceId}`);
        } catch (error: unknown) {
          const stripeError = error as { code?: string };
          if (stripeError.code !== "resource_missing") throw error;
          console.warn(`${logPrefix} action=skip_deactivate_old_price priceId=${priceId} reason=resource_missing`);
        }
      }

      priceId = price.id;
      console.log(`${logPrefix} action=price_created priceId=${priceId}`);

      // Set as default price on product
      await stripe.products.update(
        productId,
        { default_price: priceId },
        { stripeAccount: params.stripeAccountId }
      );
    }

    // Sync product active status and metadata
    await stripe.products.update(
      productId,
      {
        name: `${params.serviceName} - ${params.packageName}`,
        active: params.isActive,
        metadata,
      },
      { stripeAccount: params.stripeAccountId }
    );

    // Sync price active status
    if (priceId) {
      try {
        await stripe.prices.update(
          priceId,
          { active: params.isActive },
          { stripeAccount: params.stripeAccountId }
        );
      } catch (error: unknown) {
        const stripeError = error as { code?: string };
        if (stripeError.code !== "resource_missing") throw error;
        console.warn(`${logPrefix} action=skip_sync_price_status priceId=${priceId} reason=resource_missing`);
        priceId = null;
      }
    }

    console.log(`${logPrefix} action=sync_complete productId=${productId} priceId=${priceId}`);
    return { stripeProductId: productId, stripePriceId: priceId };
  } catch (error) {
    // Cleanup: archive product if we just created it
    if (createdProductId) {
      try {
        await stripe.products.update(
          createdProductId,
          { active: false },
          { stripeAccount: params.stripeAccountId }
        );
        console.log(`${logPrefix} action=cleanup_created_product productId=${createdProductId}`);
      } catch (cleanupError) {
        console.error(`${logPrefix} action=cleanup_failed productId=${createdProductId}`, cleanupError);
      }
    }
    console.error(`${logPrefix} action=sync_failed`, error);
    throw error;
  }
}

export async function archiveStripePackageProduct(params: {
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
