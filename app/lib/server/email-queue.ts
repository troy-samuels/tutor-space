"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { EmailAudienceId } from "@/lib/constants/email-audiences";

type RecipientInput = {
  student_id?: string;
  student_email: string;
  student_name?: string | null;
  personalization_subject: string;
  personalization_body: string;
  scheduled_for: string;
};

type CampaignInput = {
  tutorId: string;
  subject: string;
  body: string;
  audienceFilter: EmailAudienceId | string;
  templateId?: string | null;
  kind: "broadcast" | "automation";
  scheduledFor: string;
  recipientCount: number;
};

type QueueEmailCampaignArgs = CampaignInput & {
  recipients: RecipientInput[];
  client?: SupabaseClient;
};

export async function queueEmailCampaign({
  tutorId,
  subject,
  body,
  audienceFilter,
  templateId,
  kind,
  scheduledFor,
  recipientCount,
  recipients,
  client,
}: QueueEmailCampaignArgs) {
  const supabase = client ?? (await createClient());

  const { data: campaign, error: campaignError } = await supabase
    .from("email_campaigns")
    .insert({
      tutor_id: tutorId,
      subject,
      body,
      audience_filter: audienceFilter,
      template_id: templateId || null,
      kind,
      scheduled_for: scheduledFor,
      status: "pending",
      recipient_count: recipientCount,
    })
    .select("id")
    .single();

  if (campaignError || !campaign) {
    console.error("[EmailQueue] Failed to create campaign", campaignError);
    throw new Error("Failed to queue campaign");
  }

  const { error: recipientError } = await supabase.from("email_campaign_recipients").insert(
    recipients.map((recipient) => ({
      campaign_id: campaign.id,
      student_id: recipient.student_id || null,
      student_email: recipient.student_email,
      student_name: recipient.student_name ?? null,
      personalization_subject: recipient.personalization_subject,
      personalization_body: recipient.personalization_body,
      scheduled_for: recipient.scheduled_for,
      status: "pending",
    }))
  );

  if (recipientError) {
    console.error("[EmailQueue] Failed to queue recipients", recipientError);
    throw new Error("Failed to queue recipients");
  }

  return campaign.id as string;
}
