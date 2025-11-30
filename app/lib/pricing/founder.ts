const DEFAULT_LIMIT = 10;
const BASE_PRICE_GBP = 99;

type FounderPrice = {
  amount: number; // whole currency units, e.g. 129
  amountCents: number;
  currency: string;
  display: string;
};

type CurrencyMapping = {
  currency: string;
  rate: number;
};

const COUNTRY_RATES: Record<string, CurrencyMapping> = {
  GB: { currency: "GBP", rate: 1 },
  IE: { currency: "EUR", rate: 1.15 },
  FR: { currency: "EUR", rate: 1.15 },
  DE: { currency: "EUR", rate: 1.15 },
  ES: { currency: "EUR", rate: 1.15 },
  IT: { currency: "EUR", rate: 1.15 },
  NL: { currency: "EUR", rate: 1.15 },
  BE: { currency: "EUR", rate: 1.15 },
  PT: { currency: "EUR", rate: 1.15 },
  US: { currency: "USD", rate: 1.3 },
  CA: { currency: "CAD", rate: 1.7 },
  AU: { currency: "AUD", rate: 1.85 },
  NZ: { currency: "NZD", rate: 2 },
  SG: { currency: "SGD", rate: 1.75 },
  IN: { currency: "INR", rate: 105 },
  BR: { currency: "BRL", rate: 6.5 },
  MX: { currency: "MXN", rate: 22 },
};

function parseRegionFromAcceptLanguage(acceptLanguage: string | null | undefined): string | null {
  if (!acceptLanguage) return null;
  const first = acceptLanguage.split(",")[0]?.trim();
  if (!first) return null;
  const match = first.match(/-([A-Z]{2})$/i);
  return match ? match[1].toUpperCase() : null;
}

function roundToNearestNine(amount: number): number {
  const lower = Math.floor(amount / 10) * 10 + 9;
  const upper = Math.ceil(amount / 10) * 10 - 1;
  if (Math.abs(amount - lower) <= Math.abs(amount - upper)) return lower;
  return upper;
}

export function computeFounderPrice(
  acceptLanguage?: string | null,
  countryOverride?: string | null
): FounderPrice {
  const country = countryOverride || parseRegionFromAcceptLanguage(acceptLanguage) || "US";
  const mapping = COUNTRY_RATES[country] ?? COUNTRY_RATES.US;
  const rawPrice = BASE_PRICE_GBP * mapping.rate;
  const price = roundToNearestNine(rawPrice);
  const amount = Math.max(9, price);
  const formatter = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: mapping.currency,
    maximumFractionDigits: 0,
  });

  return {
    amount,
    amountCents: amount * 100,
    currency: mapping.currency,
    display: formatter.format(amount),
  };
}

export function getFounderOfferLimit(): number {
  const raw = process.env.FOUNDER_OFFER_LIMIT;
  const parsed = raw ? Number.parseInt(raw, 10) : DEFAULT_LIMIT;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_LIMIT;
}

export function getFounderPlanName(): "founder_lifetime" {
  return "founder_lifetime";
}
