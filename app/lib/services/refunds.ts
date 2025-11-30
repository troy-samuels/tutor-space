import { stripe } from "@/lib/stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import { insertPaymentsAudit } from "@/lib/repositories/payments";
import { updateRefundStatus } from "@/lib/repositories/refunds";

export async function issueRefundForPaymentIntent(params: {
  client: SupabaseClient;
  tutorId: string;
  studentId?: string | null;
  bookingId?: string | null;
  paymentsAuditId?: string | null;
  paymentIntentId: string;
  amountCents?: number; // optional partial refund
  currency: string;
  refundRequestId?: string | null;
  adminUserId: string;
}) {
  const refund = await stripe.refunds.create({
    payment_intent: params.paymentIntentId,
    amount: params.amountCents,
  });

  await insertPaymentsAudit(params.client, {
    tutorId: params.tutorId,
    studentId: params.studentId ?? null,
    bookingId: params.bookingId ?? null,
    digitalProductPurchaseId: null,
    amountCents: -(params.amountCents ?? refund.amount),
    currency: params.currency,
    applicationFeeCents: 0,
    netAmountCents: -(params.amountCents ?? refund.amount),
    stripePaymentIntentId: params.paymentIntentId,
    stripeChargeId: refund.charge as string | null,
    destinationAccountId: null,
    paymentType: "booking",
  });

  if (params.refundRequestId) {
    await updateRefundStatus(params.client, params.refundRequestId, "processed", params.adminUserId);
  }

  return refund.id;
}


