"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { queueEmailCampaign } from "@/lib/server/email-queue";
import { emailTemplates } from "@/lib/constants/email-templates";

function getTemplateById(id: string) {
  return emailTemplates.find((template) => template.id === id);
}

type AutomationContext = {
  client?: SupabaseClient;
};

export async function queueWelcomeAutomation({
  tutorId,
  tutorName,
  studentId,
  studentEmail,
  studentName,
  client,
}: {
  tutorId: string;
  tutorName: string;
  studentId: string;
  studentEmail: string;
  studentName?: string | null;
} & AutomationContext) {
  const template = getTemplateById("welcome");
  const subject = template?.subject ?? "Welcome! Let’s get started";
  const body =
    template?.body ??
    `Hi {{student_name}},

I’m excited to start working with you. Let me know your goals so we can tailor every session.

{{tutor_name}}`;

  const personalize = (value: string) =>
    value
      .replace(/\{\{\s*student_name\s*\}\}/gi, studentName || "there")
      .replace(/\{\{\s*tutor_name\s*\}\}/gi, tutorName);

  const now = new Date().toISOString();
  await queueEmailCampaign({
    tutorId,
    subject,
    body,
    audienceFilter: "automation:welcome",
    templateId: "welcome",
    kind: "automation",
    scheduledFor: now,
    recipientCount: 1,
    recipients: [
      {
        student_id: studentId,
        student_email: studentEmail,
        student_name: studentName,
        personalization_subject: personalize(subject),
        personalization_body: personalize(body),
        scheduled_for: now,
      },
    ],
    client,
  });
}

export async function queueReengageAutomation({
  tutorId,
  tutorName,
  studentId,
  studentEmail,
  studentName,
  sendAt,
  client,
}: {
  tutorId: string;
  tutorName: string;
  studentId: string;
  studentEmail: string;
  studentName?: string | null;
  sendAt: string;
} & AutomationContext) {
  const template = getTemplateById("reengage");
  const subject = template?.subject ?? "Ready to jump back in?";
  const body =
    template?.body ??
    `Hi {{student_name}},

It’s been a bit since our last lesson. I’d love to help you build momentum again. Reply and I’ll hold a spot for you.

{{tutor_name}}`;

  const personalize = (value: string) =>
    value
      .replace(/\{\{\s*student_name\s*\}\}/gi, studentName || "there")
      .replace(/\{\{\s*tutor_name\s*\}\}/gi, tutorName);

  await queueEmailCampaign({
    tutorId,
    subject,
    body,
    audienceFilter: "automation:reengage",
    templateId: "reengage",
    kind: "automation",
    scheduledFor: sendAt,
    recipientCount: 1,
    recipients: [
      {
        student_id: studentId,
        student_email: studentEmail,
        student_name: studentName,
        personalization_subject: personalize(subject),
        personalization_body: personalize(body),
        scheduled_for: sendAt,
      },
    ],
    client,
  });
}
