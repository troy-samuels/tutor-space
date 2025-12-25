"use server";

import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import type {
  StripePaymentRecord,
  StripePaymentStatus,
  StudentStripePaymentSummary,
} from "@/lib/types/stripe-payments";

type GetStudentStripePaymentsResult = {
  data: StudentStripePaymentSummary | null;
  error: string | null;
};

/**
 * Fetches payment data for a specific student from the tutor's Stripe Connect account.
 * Falls back to payments_audit table if Stripe Connect is not set up.
 */
export async function getStudentStripePayments(
  studentId: string
): Promise<GetStudentStripePaymentsResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: "Unauthorized" };
  }

  // Verify student belongs to this tutor and get student details
  const { data: student } = await supabase
    .from("students")
    .select("id, email, full_name, user_id")
    .eq("id", studentId)
    .eq("tutor_id", user.id)
    .single();

  if (!student) {
    return { data: null, error: "Student not found" };
  }

  const studentProfileId = student.user_id ?? null;

  // Get tutor's Stripe Connect account
  const { data: tutorProfile } = await supabase
    .from("profiles")
    .select("stripe_account_id, stripe_charges_enabled, stripe_default_currency")
    .eq("id", user.id)
    .single();

  // If Stripe Connect is not set up or not enabled, fall back to audit table
  if (!tutorProfile?.stripe_account_id || !tutorProfile.stripe_charges_enabled) {
    return getPaymentsFromAuditTable(studentProfileId, user.id, supabase);
  }

  try {
    // Fetch charges from the connected account
    const charges = await stripe.charges.list(
      { limit: 100 },
      { stripeAccount: tutorProfile.stripe_account_id }
    );

    // Filter charges that belong to this student
    const studentEmail = student.email?.toLowerCase();
    const studentCharges = charges.data.filter((charge) => {
      const meta = charge.metadata || {};
      // Match by studentRecordId in metadata
      if (meta.studentRecordId === studentId || meta.studentId === studentId) {
        return true;
      }
      // Match by email
      if (studentEmail && charge.receipt_email?.toLowerCase() === studentEmail) {
        return true;
      }
      // Match by billing email
      if (
        studentEmail &&
        charge.billing_details?.email?.toLowerCase() === studentEmail
      ) {
        return true;
      }
      return false;
    });

    // Transform charges to our format
    const payments = studentCharges.map((charge) =>
      mapStripeChargeToPaymentRecord(charge)
    );

    // Sort by date (newest first)
    payments.sort((a, b) => b.created.getTime() - a.created.getTime());

    // Calculate totals
    const totalPaidCents = payments
      .filter((p) => p.status === "succeeded" || p.status === "partially_refunded")
      .reduce((sum, p) => sum + p.amount - p.refundedAmount, 0);

    const totalRefundedCents = payments.reduce(
      (sum, p) => sum + p.refundedAmount,
      0
    );

    const currency =
      payments[0]?.currency?.toUpperCase() ||
      tutorProfile.stripe_default_currency?.toUpperCase() ||
      "USD";

    return {
      data: {
        totalPaidCents,
        totalRefundedCents,
        currency,
        payments,
        source: "stripe",
      },
      error: null,
    };
  } catch (err) {
    console.error("[getStudentStripePayments] Stripe API error:", err);
    // Fall back to audit table on error
    return getPaymentsFromAuditTable(studentProfileId, user.id, supabase);
  }
}

/**
 * Maps a Stripe Charge object to our StripePaymentRecord type
 */
function mapStripeChargeToPaymentRecord(charge: Stripe.Charge): StripePaymentRecord {
  let status: StripePaymentStatus = "pending";

  if (charge.refunded) {
    status = "refunded";
  } else if (charge.amount_refunded > 0) {
    status = "partially_refunded";
  } else if (charge.status === "succeeded") {
    status = "succeeded";
  } else if (charge.status === "failed") {
    status = "failed";
  } else if (charge.status === "pending") {
    status = "pending";
  }

  return {
    id: charge.id,
    amount: charge.amount,
    currency: charge.currency.toUpperCase(),
    status,
    created: new Date(charge.created * 1000),
    description: charge.description || (charge.metadata?.serviceName ?? null),
    receiptUrl: charge.receipt_url ?? null,
    refundedAmount: charge.amount_refunded,
    metadata: (charge.metadata as Record<string, string>) || {},
  };
}

/**
 * Fallback: Fetches payment data from the payments_audit table
 * Used when Stripe Connect is not set up or API call fails
 */
async function getPaymentsFromAuditTable(
  studentProfileId: string | null,
  tutorId: string,
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<GetStudentStripePaymentsResult> {
  if (!studentProfileId) {
    return {
      data: {
        totalPaidCents: 0,
        totalRefundedCents: 0,
        currency: "USD",
        payments: [],
        source: "audit",
      },
      error: null,
    };
  }

  const { data: auditRecords, error } = await supabase
    .from("payments_audit")
    .select(
      "id, amount_cents, currency, stripe_charge_id, stripe_payment_intent_id, created_at"
    )
    .eq("tutor_id", tutorId)
    .eq("student_id", studentProfileId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("[getPaymentsFromAuditTable] Database error:", error);
    return { data: null, error: "Failed to fetch payment data" };
  }

  const payments: StripePaymentRecord[] = (auditRecords ?? []).map((record) => ({
    id: record.stripe_charge_id || record.id,
    amount: record.amount_cents,
    currency: record.currency?.toUpperCase() || "USD",
    status: "succeeded" as StripePaymentStatus, // Audit table only has successful payments
    created: new Date(record.created_at),
    description: null,
    receiptUrl: null, // No receipt URL in audit table
    refundedAmount: 0,
    metadata: {},
  }));

  const totalPaidCents = payments.reduce((sum, p) => sum + p.amount, 0);
  const currency = payments[0]?.currency || "USD";

  return {
    data: {
      totalPaidCents,
      totalRefundedCents: 0,
      currency,
      payments,
      source: "audit",
    },
    error: null,
  };
}
