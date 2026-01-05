import { stripe } from "@/lib/stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import { insertPaymentsAudit } from "@/lib/repositories/payments";
import { updateRefundStatus } from "@/lib/repositories/refunds";
import { sendRefundReceiptEmail } from "@/lib/emails/ops-emails";
import { recordAudit } from "@/lib/repositories/audit";

type RefundBookingRow = {
  scheduled_at: string | null;
  students?: { full_name: string | null; email: string | null } | Array<{ full_name: string | null; email: string | null }> | null;
  services?: { name: string | null } | Array<{ name: string | null }> | null;
  profiles?: { full_name: string | null } | Array<{ full_name: string | null }> | null;
};

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

  // Record audit log for refund issued
  await recordAudit(params.client, {
    actorId: params.adminUserId,
    targetId: params.bookingId ?? params.paymentsAuditId ?? null,
    entityType: "booking",
    actionType: "update_status",
    metadata: {
      action: "refund_issued",
      refund_id: refund.id,
      payment_intent_id: params.paymentIntentId,
      amount_cents: params.amountCents ?? refund.amount,
      currency: params.currency,
      refund_request_id: params.refundRequestId ?? null,
    },
  });

  try {
    let studentEmail: string | null | undefined;
    let studentName = "Student";
    let tutorName = "Your tutor";
    let serviceName: string | null | undefined;
    let scheduledAt: string | null | undefined;

    if (params.bookingId) {
      const { data: booking } = await params.client
        .from("bookings")
        .select(
          `
          scheduled_at,
          students(full_name, email),
          services(name),
          profiles!bookings_tutor_id_fkey(full_name)
        `
        )
        .eq("id", params.bookingId)
        .maybeSingle<RefundBookingRow>();

      if (booking) {
        const student = Array.isArray(booking.students) ? booking.students[0] : booking.students;
        studentEmail = student?.email;
        studentName = student?.full_name || studentName;
        const tutorProfile = Array.isArray(booking.profiles)
          ? booking.profiles[0]
          : booking.profiles;
        tutorName = tutorProfile?.full_name || tutorName;
        const serviceRecord = Array.isArray(booking.services)
          ? booking.services[0]
          : booking.services;
        serviceName = serviceRecord?.name;
        scheduledAt = booking.scheduled_at;
      }
    }

    if (!studentEmail && params.studentId) {
      const { data: studentRow } = await params.client
        .from("students")
        .select("email, first_name, full_name")
        .eq("id", params.studentId)
        .maybeSingle();
      studentEmail = studentRow?.email ?? studentEmail;
      studentName = studentRow?.full_name || studentRow?.first_name || studentName;
    }

    if (!tutorName && params.tutorId) {
      const { data: tutor } = await params.client
        .from("profiles")
        .select("full_name")
        .eq("id", params.tutorId)
        .maybeSingle();
      tutorName = tutor?.full_name || tutorName;
    }

    await sendRefundReceiptEmail({
      studentEmail,
      studentName,
      tutorName,
      amountCents: params.amountCents ?? refund.amount,
      currency: params.currency,
      serviceName,
      scheduledAt,
      refundId: refund.id,
    });
  } catch (emailError) {
    console.error("[Refunds] Failed to send refund email", emailError);
  }

  return refund.id;
}
