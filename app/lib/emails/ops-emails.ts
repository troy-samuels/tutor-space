import { resend, EMAIL_CONFIG } from "@/lib/resend";
import { sendEmail } from "@/lib/email/send";
import {
  BookingRescheduledEmail,
  BookingRescheduledEmailText,
} from "@/emails/booking-rescheduled";
import {
  TutorCancellationEmail,
  TutorCancellationEmailText,
} from "@/emails/tutor-cancelled";
import { RefundReceiptEmail, RefundReceiptEmailText } from "@/emails/refund-receipt";
import {
  SubscriptionUpdateEmail,
  SubscriptionUpdateEmailText,
} from "@/emails/subscription-update";
import {
  UnreadMessagesDigestEmail,
  UnreadMessagesDigestEmailText,
} from "@/emails/unread-messages-digest";
import {
  HomeworkAssignedEmail,
  HomeworkAssignedEmailText,
} from "@/emails/homework-assigned";
import { SupportTicketEmail, SupportTicketEmailText } from "@/emails/support-ticket";

export async function sendBookingRescheduledEmails(params: {
  studentEmail?: string | null;
  tutorEmail?: string | null;
  studentName: string;
  tutorName: string;
  serviceName: string;
  oldScheduledAt: string;
  newScheduledAt: string;
  timezone: string;
  durationMinutes: number;
  meetingUrl?: string | null;
  meetingProvider?: string | null;
  rescheduleUrl?: string | null;
}) {
  const basePayload = {
    serviceName: params.serviceName,
    oldScheduledAt: params.oldScheduledAt,
    newScheduledAt: params.newScheduledAt,
    timezone: params.timezone,
    durationMinutes: params.durationMinutes,
    meetingUrl: params.meetingUrl,
    meetingProvider: params.meetingProvider,
    rescheduleUrl: params.rescheduleUrl,
  };

  if (params.studentEmail) {
    await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: params.studentEmail,
      subject: "Updated lesson time",
      html: BookingRescheduledEmail({
        ...basePayload,
        recipientName: params.studentName,
        recipientRole: "student",
        tutorName: params.tutorName,
        studentName: params.studentName,
      }),
      text: BookingRescheduledEmailText({
        ...basePayload,
        recipientName: params.studentName,
        recipientRole: "student",
        tutorName: params.tutorName,
        studentName: params.studentName,
      }),
    });
  }

  if (params.tutorEmail) {
    await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: params.tutorEmail,
      subject: "Lesson rescheduled",
      html: BookingRescheduledEmail({
        ...basePayload,
        recipientName: params.tutorName,
        recipientRole: "tutor",
        tutorName: params.tutorName,
        studentName: params.studentName,
      }),
      text: BookingRescheduledEmailText({
        ...basePayload,
        recipientName: params.tutorName,
        recipientRole: "tutor",
        tutorName: params.tutorName,
        studentName: params.studentName,
      }),
    });
  }
}

export async function sendTutorCancellationEmail(params: {
  tutorEmail?: string | null;
  tutorName: string;
  studentName: string;
  serviceName: string;
  scheduledAt: string;
  timezone: string;
  refundNote?: string | null;
  rescheduleUrl?: string | null;
}) {
  if (!params.tutorEmail) return;

  await resend.emails.send({
    from: EMAIL_CONFIG.from,
    to: params.tutorEmail,
    subject: "You cancelled a booking",
    html: TutorCancellationEmail({
      tutorName: params.tutorName,
      studentName: params.studentName,
      serviceName: params.serviceName,
      scheduledAt: params.scheduledAt,
      timezone: params.timezone,
      refundNote: params.refundNote,
      rescheduleUrl: params.rescheduleUrl,
    }),
    text: TutorCancellationEmailText({
      tutorName: params.tutorName,
      studentName: params.studentName,
      serviceName: params.serviceName,
      scheduledAt: params.scheduledAt,
      timezone: params.timezone,
      refundNote: params.refundNote,
      rescheduleUrl: params.rescheduleUrl,
    }),
  });
}

export async function sendRefundReceiptEmail(params: {
  studentEmail?: string | null;
  studentName: string;
  tutorName: string;
  amountCents: number;
  currency: string;
  serviceName?: string | null;
  scheduledAt?: string | null;
  refundId?: string | null;
  reason?: string | null;
}) {
  if (!params.studentEmail) return;

  await sendEmail({
    to: params.studentEmail,
    subject: "Refund processed",
    html: RefundReceiptEmail(params),
    text: RefundReceiptEmailText(params),
    category: "transactional.refund_receipt",
    metadata: { refundId: params.refundId },
  });
}

export async function sendLessonSubscriptionEmails(params: {
  studentEmail?: string | null;
  studentName: string;
  tutorEmail?: string | null;
  tutorName: string;
  status: "activated" | "renewed" | "cancellation_scheduled" | "canceled";
  planName: string;
  lessonsPerMonth?: number | null;
  periodEnd?: string | null;
  manageUrl?: string | null;
}) {
  const base = {
    status: params.status,
    planName: params.planName,
    lessonsPerMonth: params.lessonsPerMonth,
    periodEnd: params.periodEnd,
    manageUrl: params.manageUrl,
  };

  if (params.studentEmail) {
    await sendEmail({
      to: params.studentEmail,
      subject:
        params.status === "activated"
          ? "Your subscription is active"
          : params.status === "renewed"
          ? "Subscription renewed"
          : params.status === "cancellation_scheduled"
          ? "Cancellation scheduled"
          : "Subscription cancelled",
      html: SubscriptionUpdateEmail({
        ...base,
        recipientName: params.studentName,
        audience: "student",
        tutorName: params.tutorName,
      }),
      text: SubscriptionUpdateEmailText({
        ...base,
        recipientName: params.studentName,
        audience: "student",
        tutorName: params.tutorName,
      }),
      category: "subscription.lesson.student",
    });
  }

  if (params.tutorEmail) {
    await sendEmail({
      to: params.tutorEmail,
      subject:
        params.status === "activated"
          ? "New student subscription"
          : params.status === "renewed"
          ? "Student subscription renewed"
          : params.status === "cancellation_scheduled"
          ? "Student scheduled cancellation"
          : "Student subscription cancelled",
      html: SubscriptionUpdateEmail({
        ...base,
        recipientName: params.tutorName,
        audience: "tutor",
        tutorName: params.tutorName,
      }),
      text: SubscriptionUpdateEmailText({
        ...base,
        recipientName: params.tutorName,
        audience: "tutor",
        tutorName: params.tutorName,
      }),
      category: "subscription.lesson.tutor",
    });
  }
}

export async function sendUnreadMessagesDigestEmail(params: {
  to: string;
  recipientName: string;
  role: "tutor" | "student";
  totalUnread: number;
  items: Array<{
    otherPartyName: string;
    preview: string;
    lastMessageAt: string;
    threadUrl?: string | null;
  }>;
  dashboardUrl?: string | null;
  idempotencyKey?: string;
}) {
  if (!params.to || params.totalUnread === 0) return;

  await sendEmail({
    to: params.to,
    subject: `You have ${params.totalUnread} unread message${params.totalUnread === 1 ? "" : "s"}`,
    html: UnreadMessagesDigestEmail({
      recipientName: params.recipientName,
      role: params.role,
      totalUnread: params.totalUnread,
      items: params.items,
      dashboardUrl: params.dashboardUrl,
    }),
    text: UnreadMessagesDigestEmailText({
      recipientName: params.recipientName,
      role: params.role,
      totalUnread: params.totalUnread,
      items: params.items,
      dashboardUrl: params.dashboardUrl,
    }),
    category: "digest.unread_messages",
    idempotencyKey: params.idempotencyKey,
  });
}

export async function sendHomeworkAssignedEmail(params: {
  to?: string | null;
  studentName: string;
  tutorName: string;
  title: string;
  instructions?: string | null;
  dueDate?: string | null;
  timezone?: string | null;
  homeworkUrl?: string | null;
  practiceUrl?: string | null;
}) {
  if (!params.to) return;

  await sendEmail({
    to: params.to,
    subject: "New homework assigned",
    html: HomeworkAssignedEmail({
      studentName: params.studentName,
      tutorName: params.tutorName,
      title: params.title,
      instructions: params.instructions,
      dueDate: params.dueDate,
      timezone: params.timezone,
      homeworkUrl: params.homeworkUrl,
      practiceUrl: params.practiceUrl,
    }),
    text: HomeworkAssignedEmailText({
      studentName: params.studentName,
      tutorName: params.tutorName,
      title: params.title,
      instructions: params.instructions,
      dueDate: params.dueDate,
      timezone: params.timezone,
      homeworkUrl: params.homeworkUrl,
      practiceUrl: params.practiceUrl,
    }),
    category: "transactional.homework_assigned",
  });
}

export async function sendSupportTicketEmails(params: {
  userEmail?: string | null;
  userName?: string | null;
  ticketId: string;
  subject: string;
  message: string;
  category?: string | null;
  supportEmail?: string | null;
  viewUrl?: string | null;
}) {
  if (params.userEmail) {
    await sendEmail({
      to: params.userEmail,
      subject: "We received your support request",
      html: SupportTicketEmail({
        audience: "user",
        ticketId: params.ticketId,
        subject: params.subject,
        message: params.message,
        category: params.category,
        submittedByName: params.userName,
        submittedByEmail: params.userEmail,
        viewUrl: params.viewUrl,
      }),
      text: SupportTicketEmailText({
        audience: "user",
        ticketId: params.ticketId,
        subject: params.subject,
        message: params.message,
        category: params.category,
        submittedByName: params.userName,
        submittedByEmail: params.userEmail,
        viewUrl: params.viewUrl,
      }),
      category: "support.ticket.user",
    });
  }

  if (params.supportEmail) {
    await sendEmail({
      to: params.supportEmail,
      subject: `New support ticket: ${params.subject}`,
      html: SupportTicketEmail({
        audience: "support",
        ticketId: params.ticketId,
        subject: params.subject,
        message: params.message,
        category: params.category,
        submittedByName: params.userName,
        submittedByEmail: params.userEmail,
        viewUrl: params.viewUrl,
      }),
      text: SupportTicketEmailText({
        audience: "support",
        ticketId: params.ticketId,
        subject: params.subject,
        message: params.message,
        category: params.category,
        submittedByName: params.userName,
        submittedByEmail: params.userEmail,
        viewUrl: params.viewUrl,
      }),
      category: "support.ticket.agent",
    });
  }
}
