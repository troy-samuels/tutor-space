"use server";

import { resend, EMAIL_CONFIG } from "@/lib/resend";
import {
  AccessRequestNotificationEmail,
  AccessRequestNotificationEmailText,
} from "@/emails/access-request-notification";
import {
  AccessApprovedEmail,
  AccessApprovedEmailText,
} from "@/emails/access-approved";
import {
  AccessDeniedEmail,
  AccessDeniedEmailText,
} from "@/emails/access-denied";

interface SendAccessRequestNotificationParams {
  tutorName: string;
  tutorEmail: string;
  studentName: string;
  studentEmail: string;
  studentPhone?: string;
  studentMessage?: string;
  reviewUrl: string;
}

/**
 * Send notification to tutor when a student requests calendar access
 */
export async function sendAccessRequestNotification(
  params: SendAccessRequestNotificationParams
) {
  try {
    const html = AccessRequestNotificationEmail({
      tutorName: params.tutorName,
      studentName: params.studentName,
      studentEmail: params.studentEmail,
      studentPhone: params.studentPhone,
      studentMessage: params.studentMessage,
      reviewUrl: params.reviewUrl,
    });

    const text = AccessRequestNotificationEmailText({
      tutorName: params.tutorName,
      studentName: params.studentName,
      studentEmail: params.studentEmail,
      studentPhone: params.studentPhone,
      studentMessage: params.studentMessage,
      reviewUrl: params.reviewUrl,
    });

    const { data, error } = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: params.tutorEmail,
      subject: `New Calendar Access Request from ${params.studentName}`,
      html,
      text,
    });

    if (error) {
      console.error("Failed to send access request notification:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error sending access request notification:", error);
    return { success: false, error: "Failed to send email" };
  }
}

interface SendAccessApprovedEmailParams {
  studentName: string;
  studentEmail: string;
  tutorName: string;
  tutorEmail: string;
  tutorNotes?: string;
  bookingUrl: string;
  paymentInstructions?: {
    general?: string;
    venmoHandle?: string;
    paypalEmail?: string;
    zellePhone?: string;
    stripePaymentLink?: string;
    customPaymentUrl?: string;
  };
}

/**
 * Send confirmation to student when tutor approves calendar access
 */
export async function sendAccessApprovedEmail(
  params: SendAccessApprovedEmailParams
) {
  try {
    const html = AccessApprovedEmail({
      studentName: params.studentName,
      tutorName: params.tutorName,
      tutorEmail: params.tutorEmail,
      tutorNotes: params.tutorNotes,
      bookingUrl: params.bookingUrl,
      paymentInstructions: params.paymentInstructions,
    });

    const text = AccessApprovedEmailText({
      studentName: params.studentName,
      tutorName: params.tutorName,
      tutorEmail: params.tutorEmail,
      tutorNotes: params.tutorNotes,
      bookingUrl: params.bookingUrl,
      paymentInstructions: params.paymentInstructions,
    });

    const { data, error } = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: params.studentEmail,
      subject: `Calendar Access Approved - Book Lessons with ${params.tutorName}`,
      html,
      text,
    });

    if (error) {
      console.error("Failed to send access approved email:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error sending access approved email:", error);
    return { success: false, error: "Failed to send email" };
  }
}

interface SendAccessDeniedEmailParams {
  studentName: string;
  studentEmail: string;
  tutorName: string;
  tutorEmail: string;
  tutorNotes?: string;
  instagramHandle?: string;
  websiteUrl?: string;
}

/**
 * Send notification to student when tutor denies calendar access
 */
export async function sendAccessDeniedEmail(
  params: SendAccessDeniedEmailParams
) {
  try {
    const html = AccessDeniedEmail({
      studentName: params.studentName,
      tutorName: params.tutorName,
      tutorEmail: params.tutorEmail,
      tutorNotes: params.tutorNotes,
      instagramHandle: params.instagramHandle,
      websiteUrl: params.websiteUrl,
    });

    const text = AccessDeniedEmailText({
      studentName: params.studentName,
      tutorName: params.tutorName,
      tutorEmail: params.tutorEmail,
      tutorNotes: params.tutorNotes,
      instagramHandle: params.instagramHandle,
      websiteUrl: params.websiteUrl,
    });

    const { data, error } = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: params.studentEmail,
      subject: `Calendar Access Request Update from ${params.tutorName}`,
      html,
      text,
    });

    if (error) {
      console.error("Failed to send access denied email:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error sending access denied email:", error);
    return { success: false, error: "Failed to send email" };
  }
}
