export type ServicePricingValidationResult =
  | { success: true; priceCents: number; currency: string }
  | { success: false; error: string };

export function validateServicePricing(options: {
  servicePriceCents: number;
  serviceCurrency: string;
  serviceDurationMinutes: number;
  requestedAmount?: number;
  requestedCurrency?: string;
  requestedDuration?: number;
}): ServicePricingValidationResult {
  const {
    servicePriceCents,
    serviceCurrency,
    serviceDurationMinutes,
    requestedAmount,
    requestedCurrency,
    requestedDuration,
  } = options;

  if (!Number.isFinite(servicePriceCents) || servicePriceCents <= 0) {
    return { success: false, error: "Service price is not configured" };
  }

  if (
    typeof requestedDuration === "number" &&
    requestedDuration !== serviceDurationMinutes
  ) {
    return {
      success: false,
      error: "Selected duration does not match service settings",
    };
  }

  if (requestedCurrency) {
    const requested = requestedCurrency.toUpperCase();
    const service = serviceCurrency.toUpperCase();
    if (requested !== service) {
      return {
        success: false,
        error: "Invalid currency for this service",
      };
    }
  }

  if (
    typeof requestedAmount === "number" &&
    requestedAmount !== servicePriceCents
  ) {
    return {
      success: false,
      error: "Invalid price for this service",
    };
  }

  return {
    success: true,
    priceCents: servicePriceCents,
    currency: serviceCurrency.toUpperCase(),
  };
}
