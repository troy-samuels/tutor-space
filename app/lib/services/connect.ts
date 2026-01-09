import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import { extractTutorStripeStatus } from "@/lib/payments/connect-status";
import { setStripeAccountId, updateStripeStatus } from "@/lib/repositories/profiles";

export type StripeConnectPrefill = {
  email?: string | null;
  fullName?: string | null;
  bio?: string | null;
  tagline?: string | null;
  websiteUrl?: string | null;
};

const DEFAULT_PRODUCT_DESCRIPTION = "Language tutoring services";

export function buildExpressAccountParams(
  tutorId: string,
  prefill?: StripeConnectPrefill
): Stripe.AccountCreateParams {
  const fullName = prefill?.fullName?.trim() ?? "";
  const nameParts = fullName ? fullName.split(/\s+/) : [];
  const firstName = nameParts[0] || undefined;
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : undefined;

  const accountParams: Stripe.AccountCreateParams = {
    type: "express",
    email: prefill?.email ?? undefined,
    business_profile: {
      name: fullName || undefined,
      product_description:
        prefill?.bio || prefill?.tagline || DEFAULT_PRODUCT_DESCRIPTION,
      url: prefill?.websiteUrl || undefined,
    },
    individual: {
      email: prefill?.email ?? undefined,
      first_name: firstName,
      last_name: lastName,
    },
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    metadata: {
      tutor_id: tutorId,
    },
  };

  // Remove undefined fields Stripe rejects while keeping explicit nulls.
  return JSON.parse(JSON.stringify(accountParams)) as Stripe.AccountCreateParams;
}

export async function createExpressAccount(
  tutorId: string,
  client: SupabaseClient,
  prefill?: StripeConnectPrefill
) {
  const accountParams = buildExpressAccountParams(tutorId, prefill);
  const account = await stripe.accounts.create(accountParams);
  await setStripeAccountId(client, tutorId, account.id);
  // Initial status snapshot
  await updateStripeStatus(client, tutorId, extractTutorStripeStatus(account as unknown as Record<string, unknown>));
  return account.id;
}

export async function createAccountLink(accountId: string, refreshUrl: string, returnUrl: string) {
  const link = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: "account_onboarding",
  });
  return link.url;
}

export async function createDashboardLoginLink(accountId: string) {
  const link = await stripe.accounts.createLoginLink(accountId);
  return link.url;
}

export async function refreshAccountStatus(tutorId: string, accountId: string, client: SupabaseClient) {
  const account = await stripe.accounts.retrieve(accountId);
  await updateStripeStatus(client, tutorId, extractTutorStripeStatus(account as unknown as Record<string, unknown>));
}
