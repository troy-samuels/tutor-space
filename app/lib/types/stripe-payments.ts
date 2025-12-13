/**
 * Stripe payment types for StudentPaymentsTab
 * Fetches real payment data from tutor's Stripe Connect account
 */

export type StripePaymentStatus =
  | "succeeded"
  | "pending"
  | "failed"
  | "refunded"
  | "partially_refunded";

export type StripePaymentRecord = {
  id: string;
  amount: number; // in cents
  currency: string;
  status: StripePaymentStatus;
  created: Date;
  description: string | null;
  receiptUrl: string | null;
  refundedAmount: number; // in cents
  metadata: Record<string, string>;
};

export type StudentStripePaymentSummary = {
  totalPaidCents: number;
  totalRefundedCents: number;
  currency: string;
  payments: StripePaymentRecord[];
  source: "stripe" | "audit"; // indicates where data came from
};
