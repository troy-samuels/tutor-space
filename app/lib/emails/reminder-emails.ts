"use server";

import { resend, EMAIL_CONFIG } from "@/lib/resend";
import {
  LessonReminderEmail,
  LessonReminderEmailText,
} from "@/emails/lesson-reminder";

interface SendLessonReminderParams {
  studentName: string;
  studentEmail: string;
  tutorName: string;
  serviceName: string;
  scheduledAt: string;
  durationMinutes: number;
  timezone: string;
  meetingUrl?: string;
  meetingProvider?: string;
  customVideoName?: string;
  hoursUntil: 24 | 1;
}

/**
 * Send lesson reminder email to student
 */
export async function sendLessonReminderEmail(
  params: SendLessonReminderParams
) {
  try {
    const html = LessonReminderEmail({
      studentName: params.studentName,
      tutorName: params.tutorName,
      serviceName: params.serviceName,
      scheduledAt: params.scheduledAt,
      durationMinutes: params.durationMinutes,
      timezone: params.timezone,
      meetingUrl: params.meetingUrl,
      meetingProvider: params.meetingProvider,
      customVideoName: params.customVideoName,
      hoursUntil: params.hoursUntil,
    });

    const text = LessonReminderEmailText({
      studentName: params.studentName,
      tutorName: params.tutorName,
      serviceName: params.serviceName,
      scheduledAt: params.scheduledAt,
      durationMinutes: params.durationMinutes,
      timezone: params.timezone,
      meetingUrl: params.meetingUrl,
      meetingProvider: params.meetingProvider,
      customVideoName: params.customVideoName,
      hoursUntil: params.hoursUntil,
    });

    const subject =
      params.hoursUntil === 1
        ? `🔔 Lesson starting in 1 hour with ${params.tutorName}`
        : `📚 Reminder: Lesson tomorrow with ${params.tutorName}`;

    const { data, error } = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: params.studentEmail,
      subject,
      html,
      text,
    });

    if (error) {
      console.error("Failed to send lesson reminder email:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error sending lesson reminder email:", error);
    return { success: false, error: "Failed to send email" };
  }
}
