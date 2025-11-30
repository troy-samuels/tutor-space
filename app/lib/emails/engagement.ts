import { resend, EMAIL_CONFIG } from "@/lib/resend";
import {
  ParentUpdateEmail,
  ParentUpdateEmailText,
} from "@/emails/parent-update";
import {
  TestimonialRequestEmail,
  TestimonialRequestEmailText,
} from "@/emails/testimonial-request";
import {
  DailyDigestEmail,
  DailyDigestEmailText,
} from "@/emails/daily-digest";
import {
  LeadNurtureEmail,
  LeadNurtureEmailText,
  type LeadNurtureStage,
} from "@/emails/lead-nurture";
import {
  OnboardingChecklistEmail,
  OnboardingChecklistEmailText,
} from "@/emails/onboarding-checklist";

type ParentUpdateParams = {
  to: string;
  parentName?: string | null;
  studentName: string;
  tutorName: string;
  lessonDate: string;
  timezone: string;
  lessonName?: string;
  highlights: string[];
  nextFocus?: string;
  resources?: Array<{ label: string; url: string }>;
  bookingLink?: string;
};

export async function sendParentUpdateEmail({
  to,
  parentName,
  studentName,
  tutorName,
  lessonDate,
  timezone,
  highlights,
  nextFocus,
  resources,
  bookingLink,
}: ParentUpdateParams) {
  const payload = {
    parentName: parentName ?? undefined,
    studentName,
    tutorName,
    lessonDate,
    timezone,
    highlights: highlights.length > 0 ? highlights : ["Great effort this week!"],
    nextFocus,
    resources,
    bookingLink,
  };

  await resend.emails.send({
    from: EMAIL_CONFIG.from,
    to,
    subject: `${studentName}'s progress update`,
    html: ParentUpdateEmail(payload),
    text: ParentUpdateEmailText(payload),
  });
}

type TestimonialRequestParams = {
  to: string;
  parentName?: string | null;
  tutorName: string;
  studentName: string;
  lessonHighlight: string;
  testimonialUrl: string;
  incentive?: string;
};

export async function sendTestimonialRequestEmail(params: TestimonialRequestParams) {
  await resend.emails.send({
    from: EMAIL_CONFIG.from,
    to: params.to,
    subject: `Mind sharing ${params.studentName}'s win?`,
    html: TestimonialRequestEmail({
      parentName: params.parentName ?? undefined,
      tutorName: params.tutorName,
      studentName: params.studentName,
      lessonHighlight: params.lessonHighlight,
      testimonialUrl: params.testimonialUrl,
      incentive: params.incentive,
    }),
    text: TestimonialRequestEmailText({
      parentName: params.parentName ?? undefined,
      tutorName: params.tutorName,
      studentName: params.studentName,
      lessonHighlight: params.lessonHighlight,
      testimonialUrl: params.testimonialUrl,
      incentive: params.incentive,
    }),
  });
}

type DailyDigestParams = {
  to: string;
  tutorName: string;
  dateLabel: string;
  timezone: string;
  lessons: Array<{ student: string; service: string; timeLabel: string }>;
  invoices: Array<{ label: string; amount: string; dueDate: string; invoiceUrl?: string }>;
  leads: Array<{ name: string; channel: string; lastAction: string }>;
  dashboardUrl?: string;
};

export async function sendDailyDigestEmail(params: DailyDigestParams) {
  await resend.emails.send({
    from: EMAIL_CONFIG.from,
    to: params.to,
    subject: `${params.dateLabel} · TutorLingua daily digest`,
    html: DailyDigestEmail({
      tutorName: params.tutorName,
      dateLabel: params.dateLabel,
      timezone: params.timezone,
      lessons: params.lessons,
      invoices: params.invoices,
      leads: params.leads,
      dashboardUrl: params.dashboardUrl,
    }),
    text: DailyDigestEmailText({
      tutorName: params.tutorName,
      dateLabel: params.dateLabel,
      timezone: params.timezone,
      lessons: params.lessons,
      invoices: params.invoices,
      leads: params.leads,
      dashboardUrl: params.dashboardUrl,
    }),
  });
}

type LeadNurtureParams = {
  to: string;
  tutorName: string;
  leadName?: string | null;
  stage: LeadNurtureStage;
  bookingLink: string;
  bonusOffer?: string;
};

export async function sendLeadNurtureEmail(params: LeadNurtureParams) {
  await resend.emails.send({
    from: EMAIL_CONFIG.from,
    to: params.to,
    subject: "Ready to lock in your next lesson?",
    html: LeadNurtureEmail({
      tutorName: params.tutorName,
      leadName: params.leadName ?? undefined,
      stage: params.stage,
      bookingLink: params.bookingLink,
      bonusOffer: params.bonusOffer,
    }),
    text: LeadNurtureEmailText({
      tutorName: params.tutorName,
      leadName: params.leadName ?? undefined,
      stage: params.stage,
      bookingLink: params.bookingLink,
      bonusOffer: params.bonusOffer,
    }),
  });
}

type OnboardingChecklistParams = {
  to: string;
  tutorName: string;
  checklist: Array<{ label: string; description: string; link: string }>;
};

export async function sendOnboardingChecklistEmail(params: OnboardingChecklistParams) {
  await resend.emails.send({
    from: EMAIL_CONFIG.from,
    to: params.to,
    subject: "Launch your TutorLingua site in 5 minutes",
    html: OnboardingChecklistEmail({
      tutorName: params.tutorName,
      checklist: params.checklist,
      supportEmail: EMAIL_CONFIG.replyTo,
    }),
    text: OnboardingChecklistEmailText({
      tutorName: params.tutorName,
      checklist: params.checklist,
      supportEmail: EMAIL_CONFIG.replyTo,
    }),
  });
}

export type { LeadNurtureStage };
