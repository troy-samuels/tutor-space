"use server";

import { resend, EMAIL_CONFIG } from "@/lib/resend";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import type { SendEmailParams, SendEmailResult } from "@/lib/email/types";

type Tag = { name: string; value: string };

/**
  * Sends email through Resend with suppression guard and lightweight logging.
  * - Skips suppressed recipients (bounces/complaints) unless allowSuppressed is true
  * - Adds category as a tag for easier Resend filtering
  * - Records a "requested" event to email_events when Supabase is available
  */
export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  const supabase = createServiceRoleClient();

  const recipients = Array.isArray(params.to) ? params.to : [params.to];
  const normalized = recipients
    .map((email) => email?.trim())
    .filter((email): email is string => Boolean(email));

  let suppressed: string[] = [];
  if (supabase && !params.allowSuppressed && normalized.length > 0) {
    const { data: suppressionRows } = await supabase
      .from("email_suppressions")
      .select("email")
      .in(
        "email",
        normalized.map((email) => email.toLowerCase())
      );

    const suppressionSet = new Set(
      (suppressionRows ?? []).map((row) => row.email?.toLowerCase()).filter(Boolean)
    );
    suppressed = normalized.filter((email) =>
      suppressionSet.has(email.toLowerCase())
    );
  }

  const deliverable = normalized.filter(
    (email) => !suppressed.includes(email)
  );

  if (deliverable.length === 0) {
    if (supabase && normalized.length > 0) {
      try {
        await supabase
          .from("email_events")
          .insert({
            to_email: normalized.join(","),
            event_type: "suppressed_skip",
            metadata: { suppressed, category: params.category, metadata: params.metadata },
          });
      } catch {
        // Ignore logging errors
      }
    }
    return { success: false, suppressed, skipped: true };
  }

  const tags: Tag[] = [];
  if (params.tags?.length) {
    tags.push(...params.tags);
  }
  if (params.category) {
    tags.push({ name: "category", value: params.category });
  }

  const { data, error } = await resend.emails.send({
    from: params.from ?? EMAIL_CONFIG.from,
    to: deliverable,
    subject: params.subject,
    html: params.html,
    text: params.text,
    cc: params.cc,
    bcc: params.bcc,
    replyTo: params.replyTo ?? EMAIL_CONFIG.replyTo,
    tags,
    idempotencyKey: params.idempotencyKey,
  });

  if (error) {
    return { success: false, suppressed, error: error.message };
  }

  if (supabase) {
    try {
      await supabase
        .from("email_events")
        .insert({
          message_id: (data as any)?.id ?? null,
          to_email: deliverable.join(","),
          event_type: "requested",
          metadata: {
            category: params.category,
            suppressed,
            metadata: params.metadata,
          },
        });
    } catch {
      // Ignore logging errors
    }
  }

  return { success: true, suppressed, data };
}
