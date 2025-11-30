import { stripe } from "@/lib/stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import { extractTutorStripeStatus } from "@/lib/payments/connect-status";
import { setStripeAccountId, updateStripeStatus } from "@/lib/repositories/profiles";

export async function createExpressAccount(tutorId: string, client: SupabaseClient) {
  const account = await stripe.accounts.create({
    type: "express",
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
  });
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


