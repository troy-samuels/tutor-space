import { createCheckoutSession } from "@/lib/stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import { routeStudentPayment } from "@/lib/payments/routing";
import type { ApplicationFeePolicy, TutorStripeStatus } from "@/lib/types/payments";
import { computeApplicationFee } from "@/lib/payments/fees";

export interface CreateBookingCheckoutParams {
  readonly tutorId: string;
  readonly studentId: string;
  readonly bookingId: string;
  readonly amountCents: number;
  readonly currency: string; // lowercase (usd)
  readonly serviceName: string;
  readonly serviceDescription?: string;
  readonly successUrl: string;
  readonly cancelUrl: string;
  readonly tutorStripe: TutorStripeStatus;
  readonly hasPaymentLink: boolean;
  readonly feePolicy?: ApplicationFeePolicy;
}

export async function createBookingCheckout(
  client: SupabaseClient,
  customerId: string,
  params: CreateBookingCheckoutParams
) {
  const decision = routeStudentPayment({
    tutorStripe: params.tutorStripe,
    hasPaymentLink: params.hasPaymentLink,
  });

  if (decision.route === "payment_link") {
    return { redirectUrl: "payment_link" as const };
  }

  const fee =
    decision.route === "connect_destination" && params.feePolicy
      ? computeApplicationFee(params.amountCents, params.feePolicy).applicationFeeCents
      : undefined;

  const session = await createCheckoutSession({
    customerId,
    priceAmount: params.amountCents,
    currency: params.currency,
    successUrl: params.successUrl,
    cancelUrl: params.cancelUrl,
    metadata: {
      bookingId: params.bookingId,
      userId: params.studentId,
      tutorId: params.tutorId,
    },
    lineItems: [
      {
        name: params.serviceName,
        description: params.serviceDescription,
        amount: params.amountCents,
        quantity: 1,
      },
    ],
    transferDestinationAccountId:
      decision.route === "connect_destination" ? params.tutorStripe.accountId ?? undefined : undefined,
    applicationFeeCents: fee,
  });

  return { sessionId: session.id, url: session.url };
}


