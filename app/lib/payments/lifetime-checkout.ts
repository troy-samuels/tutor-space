import { computeFounderPrice } from "@/lib/pricing/founder";
import { SIGNUP_CHECKOUT_FLOW } from "@/lib/services/signup-checkout";

const STRIPE_API_BASE = "https://api.stripe.com/v1";
const PRODUCT_NAME = "TutorLingua Lifetime Access";

export type LifetimeCheckoutSession = {
  id: string;
  url: string | null;
  status: string | null;
  paymentStatus: string | null;
  expiresAt: string | null;
};

type CreateLifetimeCheckoutParams = {
  successUrl: string;
  cancelUrl: string;
  userId?: string;
  customerEmail?: string;
  source?: string;
  acceptLanguage?: string | null;
  flow?: "signup";
};

type StripeCheckoutSessionResponse = {
  id: string;
  url?: string | null;
  status?: string | null;
  payment_status?: string | null;
  expires_at?: number | null;
};

function getStripeSecretKey(): string | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  return key || null;
}

function buildSessionPayload(params: CreateLifetimeCheckoutParams) {
  const price = computeFounderPrice(params.acceptLanguage);
  const body = new URLSearchParams();
  body.append("mode", "payment");
  body.append("success_url", params.successUrl);
  body.append("cancel_url", params.cancelUrl);
  body.append("line_items[0][price_data][currency]", price.currency.toLowerCase());
  body.append("line_items[0][price_data][unit_amount]", String(price.amountCents));
  body.append("line_items[0][price_data][product_data][name]", PRODUCT_NAME);
  body.append("line_items[0][quantity]", "1");

  if (params.customerEmail) {
    body.append("customer_email", params.customerEmail);
  }

  if (params.userId) {
    body.append("metadata[userId]", params.userId);
  }

  body.append("metadata[plan]", "tutor_life");

  if (params.source) {
    body.append("metadata[source]", params.source);
  }

  if (params.flow === "signup") {
    body.append("metadata[flow]", SIGNUP_CHECKOUT_FLOW);
  }

  return body;
}

function normalizeSession(data: StripeCheckoutSessionResponse): LifetimeCheckoutSession {
  return {
    id: data.id,
    url: data.url ?? null,
    status: data.status ?? null,
    paymentStatus: data.payment_status ?? null,
    expiresAt: data.expires_at ? new Date(data.expires_at * 1000).toISOString() : null,
  };
}

export function isLifetimeCheckoutExpired(expiresAt?: string | null): boolean {
  if (!expiresAt) return false;
  const parsed = new Date(expiresAt);
  if (Number.isNaN(parsed.getTime())) return false;
  return parsed.getTime() <= Date.now();
}

export async function createLifetimeCheckoutSession(
  params: CreateLifetimeCheckoutParams
): Promise<{ session: LifetimeCheckoutSession } | { error: string }> {
  const stripeKey = getStripeSecretKey();
  if (!stripeKey) {
    return { error: "Stripe not configured" };
  }

  const body = buildSessionPayload(params);

  const response = await fetch(`${STRIPE_API_BASE}/checkout/sessions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${stripeKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  const data = (await response.json()) as StripeCheckoutSessionResponse & {
    error?: { message?: string };
  };

  if (!response.ok) {
    return { error: data.error?.message || "Stripe checkout failed" };
  }

  return { session: normalizeSession(data) };
}

export async function retrieveLifetimeCheckoutSession(
  sessionId: string
): Promise<{ session: LifetimeCheckoutSession } | { error: string }> {
  const stripeKey = getStripeSecretKey();
  if (!stripeKey) {
    return { error: "Stripe not configured" };
  }

  const response = await fetch(`${STRIPE_API_BASE}/checkout/sessions/${sessionId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${stripeKey}`,
    },
  });

  const data = (await response.json()) as StripeCheckoutSessionResponse & {
    error?: { message?: string };
  };

  if (!response.ok) {
    return { error: data.error?.message || "Stripe checkout retrieval failed" };
  }

  return { session: normalizeSession(data) };
}
