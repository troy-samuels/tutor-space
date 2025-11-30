"use server";

import { resend, EMAIL_CONFIG } from "@/lib/resend";
import {
  BookingConfirmationEmail,
  BookingConfirmationEmailText,
} from "@/emails/booking-confirmation";
import {
  TutorBookingNotificationEmail,
  TutorBookingNotificationEmailText,
} from "@/emails/tutor-booking-notification";
import {
  BookingCancelledEmail,
  BookingCancelledEmailText,
} from "@/emails/booking-cancelled";
import {
  PaymentReceiptEmail,
  PaymentReceiptEmailText,
} from "@/emails/payment-receipt";
import {
  PaymentFailedEmail,
  PaymentFailedEmailText,
} from "@/emails/payment-failed";

interface SendBookingConfirmationParams {
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
      paymentInstructions: params.paymentInstructions,
      meetingUrl: params.meetingUrl,
      meetingProvider: params.meetingProvider,
      customVideoName: params.customVideoName,
    });

    const { data, error } = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: params.studentEmail,
      subject: `Booking Confirmed - ${params.serviceName} with ${params.tutorName}`,
      html,
      text,
    });

    if (error) {
      console.error("Failed to send booking confirmation email:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error sending booking confirmation email:", error);
    return { success: false, error: "Failed to send email" };
  }
}

interface SendTutorNotificationParams {
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

    const { data, error } = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: params.tutorEmail,
      subject: `New Booking Request from ${params.studentName}`,
      html,
      text,
    });

    if (error) {
      console.error("Failed to send tutor notification email:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error sending tutor notification email:", error);
    return { success: false, error: "Failed to send email" };
  }
}

type SendBookingCancelledParams = {
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

    await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: params.studentEmail,
      subject: `Lesson cancelled - ${params.serviceName}`,
      html,
      text,
    });
  } catch (error) {
    console.error("Error sending booking cancelled email:", error);
  }
}

type SendPaymentReceiptParams = {
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

    await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: params.studentEmail,
      subject: `Payment receipt - ${params.serviceName}`,
      html,
      text,
    });
  } catch (error) {
    console.error("Error sending payment receipt email:", error);
  }
}

type SendPaymentFailedParams = {
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

    const { error } = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: params.userEmail,
      subject: `Action required: Payment failed for ${params.planName}`,
      html,
      text,
    });

    if (error) {
      console.error("Failed to send payment failed email:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Error sending payment failed email:", error);
    return { success: false, error: "Failed to send email" };
  }
}
