"use server";

import { sendEmail } from "@/lib/email/send";
import type { SendEmailParams } from "@/lib/email/types";
import {
  BookingConfirmationEmail,
  BookingConfirmationEmailText,
} from "@/emails/booking-confirmation";
import {
  TutorBookingNotificationEmail,
  TutorBookingNotificationEmailText,
} from "@/emails/tutor-booking-notification";
import {
  TutorBookingConfirmedEmail,
  TutorBookingConfirmedEmailText,
} from "@/emails/tutor-booking-confirmed";
import {
  BookingCancelledEmail,
  BookingCancelledEmailText,
} from "@/emails/booking-cancelled";
import {
  PaymentReceiptEmail,
  PaymentReceiptEmailText,
} from "@/emails/payment-receipt";
import {
  TutorPaymentReceivedEmail,
  TutorPaymentReceivedEmailText,
} from "@/emails/tutor-payment-received";
import {
  PaymentFailedEmail,
  PaymentFailedEmailText,
} from "@/emails/payment-failed";
import {
  BookingPaymentRequestEmail,
  BookingPaymentRequestEmailText,
} from "@/emails/booking-payment-request";

interface SendBookingConfirmationParams {
  bookingId?: string;
  studentName: string;
  studentEmail: string;
  tutorName: string;
  tutorEmail: string;
  serviceName: string;
  scheduledAt: string;
  durationMinutes: number;
  timezone: string;
  amount: number;
  currency: string;
  confirmationStatus?: "confirmed" | "pending";
  paymentStatus?: "paid" | "unpaid";
  paymentInstructions?: {
    general?: string;
    venmoHandle?: string;
    paypalEmail?: string;
    zellePhone?: string;
    stripePaymentLink?: string;
    customPaymentUrl?: string;
  };
  meetingUrl?: string;
  meetingProvider?: string;
  customVideoName?: string;
}

/**
 * Send booking confirmation email to student with payment instructions
 */
export async function sendBookingConfirmationEmail(
  params: SendBookingConfirmationParams
) {
  try {
    const emailType = "booking_confirmation";
    const html = BookingConfirmationEmail({
      studentName: params.studentName,
      tutorName: params.tutorName,
      tutorEmail: params.tutorEmail,
      serviceName: params.serviceName,
      scheduledAt: params.scheduledAt,
      durationMinutes: params.durationMinutes,
      timezone: params.timezone,
      amount: params.amount,
      currency: params.currency,
      confirmationStatus: params.confirmationStatus,
      paymentStatus: params.paymentStatus,
      paymentInstructions: params.paymentInstructions,
      meetingUrl: params.meetingUrl,
      meetingProvider: params.meetingProvider,
      customVideoName: params.customVideoName,
    });

    const text = BookingConfirmationEmailText({
      studentName: params.studentName,
      tutorName: params.tutorName,
      tutorEmail: params.tutorEmail,
      serviceName: params.serviceName,
      scheduledAt: params.scheduledAt,
      durationMinutes: params.durationMinutes,
      timezone: params.timezone,
      amount: params.amount,
      currency: params.currency,
      confirmationStatus: params.confirmationStatus,
      paymentStatus: params.paymentStatus,
      paymentInstructions: params.paymentInstructions,
      meetingUrl: params.meetingUrl,
      meetingProvider: params.meetingProvider,
      customVideoName: params.customVideoName,
    });

    const subject = params.confirmationStatus === "pending"
      ? `Payment needed to confirm ${params.serviceName} with ${params.tutorName}`
      : `Booking Confirmed - ${params.serviceName} with ${params.tutorName}`;

    return await sendWithRetry({
      to: params.studentEmail,
      subject,
      html,
      text,
      category: emailType,
      idempotencyKey: buildIdempotencyKey(emailType, params.bookingId, params.studentEmail),
      metadata: {
        bookingId: params.bookingId,
        emailType,
      },
    });
  } catch (error) {
    console.error("Error sending booking confirmation email:", error);
    return { success: false, suppressed: [], error: "Failed to send email" };
  }
}

interface SendTutorNotificationParams {
  bookingId?: string;
  tutorName: string;
  tutorEmail: string;
  studentName: string;
  studentEmail: string;
  studentPhone?: string;
  serviceName: string;
  scheduledAt: string;
  durationMinutes: number;
  timezone: string;
  amount: number;
  currency: string;
  notes?: string;
  dashboardUrl?: string;
}

/**
 * Send booking notification email to tutor
 */
export async function sendTutorBookingNotificationEmail(
  params: SendTutorNotificationParams
) {
  try {
    const emailType = "booking_request_tutor";
    const html = TutorBookingNotificationEmail({
      tutorName: params.tutorName,
      studentName: params.studentName,
      studentEmail: params.studentEmail,
      studentPhone: params.studentPhone,
      serviceName: params.serviceName,
      scheduledAt: params.scheduledAt,
      durationMinutes: params.durationMinutes,
      timezone: params.timezone,
      amount: params.amount,
      currency: params.currency,
      notes: params.notes,
      dashboardUrl: params.dashboardUrl,
    });

    const text = TutorBookingNotificationEmailText({
      tutorName: params.tutorName,
      studentName: params.studentName,
      studentEmail: params.studentEmail,
      studentPhone: params.studentPhone,
      serviceName: params.serviceName,
      scheduledAt: params.scheduledAt,
      durationMinutes: params.durationMinutes,
      timezone: params.timezone,
      amount: params.amount,
      currency: params.currency,
      notes: params.notes,
      dashboardUrl: params.dashboardUrl,
    });

    return await sendWithRetry({
      to: params.tutorEmail,
      subject: `New Booking Request from ${params.studentName}`,
      html,
      text,
      category: emailType,
      idempotencyKey: buildIdempotencyKey(emailType, params.bookingId, params.tutorEmail),
      metadata: {
        bookingId: params.bookingId,
        emailType,
      },
    });
  } catch (error) {
    console.error("Error sending tutor notification email:", error);
    return { success: false, suppressed: [], error: "Failed to send email" };
  }
}

interface SendTutorBookingConfirmedParams {
  bookingId?: string;
  tutorName: string;
  tutorEmail: string;
  studentName: string;
  studentEmail: string;
  studentPhone?: string;
  serviceName: string;
  scheduledAt: string;
  durationMinutes: number;
  timezone: string;
  amount: number;
  currency: string;
  notes?: string;
  meetingUrl?: string;
  meetingProvider?: string;
  customVideoName?: string;
  dashboardUrl?: string;
  paymentStatusLabel?: string;
}

/**
 * Send booking confirmed email to tutor
 */
export async function sendTutorBookingConfirmedEmail(
  params: SendTutorBookingConfirmedParams
) {
  try {
    const emailType = "booking_confirmed_tutor";
    const html = TutorBookingConfirmedEmail({
      tutorName: params.tutorName,
      studentName: params.studentName,
      studentEmail: params.studentEmail,
      studentPhone: params.studentPhone,
      serviceName: params.serviceName,
      scheduledAt: params.scheduledAt,
      durationMinutes: params.durationMinutes,
      timezone: params.timezone,
      amount: params.amount,
      currency: params.currency,
      notes: params.notes,
      meetingUrl: params.meetingUrl,
      meetingProvider: params.meetingProvider,
      customVideoName: params.customVideoName,
      dashboardUrl: params.dashboardUrl,
      paymentStatusLabel: params.paymentStatusLabel,
    });

    const text = TutorBookingConfirmedEmailText({
      tutorName: params.tutorName,
      studentName: params.studentName,
      studentEmail: params.studentEmail,
      studentPhone: params.studentPhone,
      serviceName: params.serviceName,
      scheduledAt: params.scheduledAt,
      durationMinutes: params.durationMinutes,
      timezone: params.timezone,
      amount: params.amount,
      currency: params.currency,
      notes: params.notes,
      meetingUrl: params.meetingUrl,
      meetingProvider: params.meetingProvider,
      customVideoName: params.customVideoName,
      dashboardUrl: params.dashboardUrl,
      paymentStatusLabel: params.paymentStatusLabel,
    });

    return await sendWithRetry({
      to: params.tutorEmail,
      subject: `Booking confirmed: ${params.studentName}`,
      html,
      text,
      category: emailType,
      idempotencyKey: buildIdempotencyKey(emailType, params.bookingId, params.tutorEmail),
      metadata: {
        bookingId: params.bookingId,
        emailType,
      },
    });
  } catch (error) {
    console.error("Error sending tutor booking confirmed email:", error);
    return { success: false, suppressed: [], error: "Failed to send email" };
  }
}

type SendBookingCancelledParams = {
  bookingId?: string;
  studentName: string;
  studentEmail: string;
  tutorName: string;
  serviceName: string;
  scheduledAt: string;
  timezone: string;
  reason?: string;
  rescheduleUrl?: string;
};

export async function sendBookingCancelledEmail(params: SendBookingCancelledParams) {
  try {
    const emailType = "booking_cancelled";
    const html = BookingCancelledEmail({
      studentName: params.studentName,
      tutorName: params.tutorName,
      serviceName: params.serviceName,
      scheduledAt: params.scheduledAt,
      timezone: params.timezone,
      reason: params.reason,
      rescheduleUrl: params.rescheduleUrl,
    });

    const text = BookingCancelledEmailText({
      studentName: params.studentName,
      tutorName: params.tutorName,
      serviceName: params.serviceName,
      scheduledAt: params.scheduledAt,
      timezone: params.timezone,
      reason: params.reason,
      rescheduleUrl: params.rescheduleUrl,
    });

    await sendWithRetry({
      to: params.studentEmail,
      subject: `Lesson cancelled - ${params.serviceName}`,
      html,
      text,
      category: emailType,
      idempotencyKey: buildIdempotencyKey(emailType, params.bookingId, params.studentEmail),
      metadata: {
        bookingId: params.bookingId,
        emailType,
      },
    });
  } catch (error) {
    console.error("Error sending booking cancelled email:", error);
  }
}

type SendPaymentReceiptParams = {
  bookingId?: string;
  studentName: string;
  studentEmail: string;
  tutorName: string;
  serviceName: string;
  scheduledAt: string;
  timezone: string;
  amountCents: number;
  currency: string;
  paymentMethod: string;
  invoiceNumber?: string;
  invoiceUrl?: string;
  notes?: string;
};

export async function sendPaymentReceiptEmail(params: SendPaymentReceiptParams) {
  try {
    const emailType = "payment_receipt";
    const html = PaymentReceiptEmail({
      studentName: params.studentName,
      tutorName: params.tutorName,
      serviceName: params.serviceName,
      scheduledAt: params.scheduledAt,
      timezone: params.timezone,
      amount: params.amountCents,
      currency: params.currency,
      paymentMethod: params.paymentMethod,
      invoiceNumber: params.invoiceNumber,
      invoiceUrl: params.invoiceUrl,
      notes: params.notes,
    });

    const text = PaymentReceiptEmailText({
      studentName: params.studentName,
      tutorName: params.tutorName,
      serviceName: params.serviceName,
      scheduledAt: params.scheduledAt,
      timezone: params.timezone,
      amount: params.amountCents,
      currency: params.currency,
      paymentMethod: params.paymentMethod,
      invoiceNumber: params.invoiceNumber,
      invoiceUrl: params.invoiceUrl,
      notes: params.notes,
    });

    await sendWithRetry({
      to: params.studentEmail,
      subject: `Payment receipt - ${params.serviceName}`,
      html,
      text,
      category: emailType,
      idempotencyKey: buildIdempotencyKey(emailType, params.bookingId, params.studentEmail),
      metadata: {
        bookingId: params.bookingId,
        emailType,
      },
    });
  } catch (error) {
    console.error("Error sending payment receipt email:", error);
  }
}

type SendTutorPaymentReceivedParams = {
  bookingId?: string;
  tutorName: string;
  tutorEmail: string;
  studentName: string;
  serviceName: string;
  scheduledAt: string;
  timezone: string;
  amountCents: number;
  currency: string;
  paymentMethod: string;
  notes?: string;
  dashboardUrl?: string;
};

export async function sendTutorPaymentReceivedEmail(params: SendTutorPaymentReceivedParams) {
  try {
    const emailType = "payment_received_tutor";
    const html = TutorPaymentReceivedEmail({
      tutorName: params.tutorName,
      studentName: params.studentName,
      serviceName: params.serviceName,
      scheduledAt: params.scheduledAt,
      timezone: params.timezone,
      amountCents: params.amountCents,
      currency: params.currency,
      paymentMethod: params.paymentMethod,
      notes: params.notes,
      dashboardUrl: params.dashboardUrl,
    });

    const text = TutorPaymentReceivedEmailText({
      tutorName: params.tutorName,
      studentName: params.studentName,
      serviceName: params.serviceName,
      scheduledAt: params.scheduledAt,
      timezone: params.timezone,
      amountCents: params.amountCents,
      currency: params.currency,
      paymentMethod: params.paymentMethod,
      notes: params.notes,
      dashboardUrl: params.dashboardUrl,
    });

    return await sendWithRetry({
      to: params.tutorEmail,
      subject: `Payment received: ${params.studentName}`,
      html,
      text,
      category: emailType,
      idempotencyKey: buildIdempotencyKey(emailType, params.bookingId, params.tutorEmail),
      metadata: {
        bookingId: params.bookingId,
        emailType,
      },
    });
  } catch (error) {
    console.error("Error sending tutor payment received email:", error);
    return { success: false, suppressed: [], error: "Failed to send email" };
  }
}

type SendPaymentFailedParams = {
  bookingId?: string;
  userEmail: string;
  userName: string;
  planName: string;
  amountDue: string;
  nextRetryDate?: string;
  updatePaymentUrl: string;
};

/**
 * Send payment failed notification email to user
 */
export async function sendPaymentFailedEmail(params: SendPaymentFailedParams) {
  try {
    const emailType = "payment_failed";
    const html = PaymentFailedEmail({
      userName: params.userName,
      planName: params.planName,
      amountDue: params.amountDue,
      nextRetryDate: params.nextRetryDate,
      updatePaymentUrl: params.updatePaymentUrl,
    });

    const text = PaymentFailedEmailText({
      userName: params.userName,
      planName: params.planName,
      amountDue: params.amountDue,
      nextRetryDate: params.nextRetryDate,
      updatePaymentUrl: params.updatePaymentUrl,
    });

    return await sendWithRetry({
      to: params.userEmail,
      subject: `Action required: Payment failed for ${params.planName}`,
      html,
      text,
      category: emailType,
      idempotencyKey: buildIdempotencyKey(emailType, params.bookingId, params.userEmail),
      metadata: {
        bookingId: params.bookingId,
        emailType,
      },
    });
  } catch (error) {
    console.error("Error sending payment failed email:", error);
    return { success: false, suppressed: [], error: "Failed to send email" };
  }
}

type SendBookingPaymentRequestParams = {
  bookingId?: string;
  studentName: string;
  studentEmail: string;
  tutorName: string;
  tutorEmail: string;
  serviceName: string;
  scheduledAt: string;
  durationMinutes: number;
  timezone: string;
  amount: number;
  currency: string;
  paymentUrl: string;
};

/**
 * Send payment request email to student for a tutor-initiated booking
 */
export async function sendBookingPaymentRequestEmail(params: SendBookingPaymentRequestParams) {
  try {
    const emailType = "booking_payment_request";
    const html = BookingPaymentRequestEmail({
      studentName: params.studentName,
      tutorName: params.tutorName,
      tutorEmail: params.tutorEmail,
      serviceName: params.serviceName,
      scheduledAt: params.scheduledAt,
      durationMinutes: params.durationMinutes,
      timezone: params.timezone,
      amount: params.amount,
      currency: params.currency,
      paymentUrl: params.paymentUrl,
    });

    const text = BookingPaymentRequestEmailText({
      studentName: params.studentName,
      tutorName: params.tutorName,
      tutorEmail: params.tutorEmail,
      serviceName: params.serviceName,
      scheduledAt: params.scheduledAt,
      durationMinutes: params.durationMinutes,
      timezone: params.timezone,
      amount: params.amount,
      currency: params.currency,
      paymentUrl: params.paymentUrl,
    });

    return await sendWithRetry({
      to: params.studentEmail,
      subject: `Complete your booking with ${params.tutorName} - ${params.serviceName}`,
      html,
      text,
      category: emailType,
      idempotencyKey: buildIdempotencyKey(emailType, params.bookingId, params.studentEmail),
      metadata: {
        bookingId: params.bookingId,
        emailType,
      },
    });
  } catch (error) {
    console.error("Error sending booking payment request email:", error);
    return { success: false, suppressed: [], error: "Failed to send email" };
  }
}

function buildIdempotencyKey(emailType: string, bookingId?: string, recipient?: string) {
  if (!bookingId) return undefined;
  const normalizedRecipient = recipient?.trim().toLowerCase() ?? "unknown";
  return `${emailType}:${bookingId}:${normalizedRecipient}`;
}

async function sendWithRetry(params: SendEmailParams) {
  const maxAttempts = 2;
  let lastResult: Awaited<ReturnType<typeof sendEmail>> | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const result = await sendEmail(params);
    lastResult = result;
    if (result.success || ("skipped" in result && result.skipped)) {
      return result;
    }
    if (attempt < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }

  return lastResult ?? { success: false, suppressed: [], error: "Failed to send email" };
}
