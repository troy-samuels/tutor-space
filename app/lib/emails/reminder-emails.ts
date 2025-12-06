"use server";

import {
  LessonReminderEmail,
  LessonReminderEmailText,
} from "@/emails/lesson-reminder";
import { sendEmail } from "@/lib/email/send";

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

    const result = await sendEmail({
      to: params.studentEmail,
      subject,
      html,
      text,
      category: "transactional.lesson_reminder",
      metadata: {
        hoursUntil: params.hoursUntil,
        tutorName: params.tutorName,
      },
    });

    if (!result.success) {
      const reason = result.error || (result.skipped ? "Suppressed" : "Failed to send");
      console.error("Failed to send lesson reminder email:", reason);
      return { success: false, error: reason };
    }

    return { success: true, data: result.data, suppressed: result.suppressed };
  } catch (error) {
    console.error("Error sending lesson reminder email:", error);
    return { success: false, error: "Failed to send email" };
  }
}
