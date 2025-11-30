"use server";

import { resend, EMAIL_CONFIG } from "@/lib/resend";
import {
  StudentInviteEmail,
  StudentInviteEmailText,
} from "@/emails/student-invite";

type SendStudentInviteParams = {
  studentEmail: string;
  studentName?: string | null;
  tutorName: string;
  tutorEmail?: string | null;
  requestAccessUrl: string;
  bookingUrl: string;
};

/**
 * Transactional invite sent when a tutor manually adds a student.
 * Gives the student a direct link to finish their profile and book.
 */
export async function sendStudentInviteEmail(params: SendStudentInviteParams) {
  try {
    const html = StudentInviteEmail({
      tutorName: params.tutorName,
      studentName: params.studentName,
      requestAccessUrl: params.requestAccessUrl,
      bookingUrl: params.bookingUrl,
    });

    const text = StudentInviteEmailText({
      tutorName: params.tutorName,
      studentName: params.studentName,
      requestAccessUrl: params.requestAccessUrl,
      bookingUrl: params.bookingUrl,
    });

    const { data, error } = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: params.studentEmail,
      subject: `${params.tutorName} invited you to book lessons`,
      html,
      text,
      replyTo: params.tutorEmail || EMAIL_CONFIG.replyTo,
    });

    if (error) {
      console.error("Failed to send student invite email:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error sending student invite email:", error);
    return { success: false, error: "Failed to send email" };
  }
}
