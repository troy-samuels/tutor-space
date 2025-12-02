import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { sendLessonReminderEmail } from "@/lib/emails/reminder-emails";
import { queueReengageAutomation } from "@/lib/server/email-automations";
import { resend, EMAIL_CONFIG } from "@/lib/resend";
import {
  BroadcastCampaignEmail,
  BroadcastCampaignEmailText,
} from "@/emails/broadcast-campaign";

type ReminderLessonRecord = {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  timezone: string;
  meeting_url: string | null;
  meeting_provider: string | null;
  reminder_24h_sent?: boolean;
  reminder_1h_sent?: boolean;
  students: {
    full_name: string | null;
    email: string | null;
    user_id: string | null;
  } | null;
  services: {
    name: string | null;
  } | null;
  profiles: {
    full_name: string | null;
    custom_video_name: string | null;
  } | null;
};

type CampaignRecipient = {
  id: string;
  campaign_id: string;
  student_email: string;
  student_name: string | null;
  personalization_subject: string | null;
  personalization_body: string | null;
  email_campaigns: {
    tutor_id: string;
    kind: string | null;
    profiles?: {
      full_name: string | null;
    } | null;
  } | null;
  students: {
    id: string;
    email_opt_out: boolean;
    email_unsubscribe_token: string | null;
  } | null;
};

type TutorAutomationSettings = {
  id: string;
  full_name: string | null;
  auto_reengage_days: number | null;
};

const PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://tutorlingua.co";

/**
 * Cron job to send lesson reminders
 * Should be called every hour via Vercel Cron or external service
 *
 * Protected by CRON_SECRET environment variable
 */
export async function GET(request: Request) {
  // Verify cron secret to prevent unauthorized access
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error("[Cron] CRON_SECRET is not configured. Aborting job.");
    return NextResponse.json(
      { error: "Cron secret not configured" },
      { status: 500 }
    );
  }

  const authHeader = request.headers.get("authorization");

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminClient = createServiceRoleClient();

  if (!adminClient) {
    return NextResponse.json(
      { error: "Service unavailable" },
      { status: 500 }
    );
  }

  try {
    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const in1Hour = new Date(now.getTime() + 60 * 60 * 1000);
    const in25Hours = new Date(now.getTime() + 25 * 60 * 60 * 1000);
    const in2Hours = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    // Find lessons happening in 24 hours (with 1 hour buffer)
    const { data: lessons24hData } = await adminClient
      .from("bookings")
      .select(`
        id,
        scheduled_at,
        duration_minutes,
        timezone,
        meeting_url,
        meeting_provider,
        reminder_24h_sent,
        students (
          full_name,
          email,
          user_id
        ),
        services (
          name
        ),
        profiles!bookings_tutor_id_fkey (
          full_name,
          custom_video_name
        )
      `)
      .eq("status", "confirmed")
      .gte("scheduled_at", in24Hours.toISOString())
      .lte("scheduled_at", in25Hours.toISOString())
      .eq("reminder_24h_sent", false);

    // Find lessons happening in 1 hour (with 1 hour buffer)
    const { data: lessons1hData } = await adminClient
      .from("bookings")
      .select(`
        id,
        scheduled_at,
        duration_minutes,
        timezone,
        meeting_url,
        meeting_provider,
        reminder_1h_sent,
        students (
          full_name,
          email,
          user_id
        ),
        services (
          name
        ),
        profiles!bookings_tutor_id_fkey (
          full_name,
          custom_video_name
        )
      `)
      .eq("status", "confirmed")
      .gte("scheduled_at", in1Hour.toISOString())
      .lte("scheduled_at", in2Hours.toISOString())
      .eq("reminder_1h_sent", false);

    const results = {
      reminders24h: 0,
      reminders1h: 0,
      notifications24h: 0,
      notifications1h: 0,
      campaignSent: 0,
      campaignFailed: 0,
      automationsQueued: 0,
      errors: [] as string[],
    };

    // Send 24-hour reminders
    const lessons24h = normalizeLessonRecords(lessons24hData);
    if (lessons24h.length > 0) {
      for (const lesson of lessons24h) {
        try {
          const student = lesson.students;
          const service = lesson.services;
          const tutor = lesson.profiles;

          if (!student?.email || !student?.full_name) {
            console.warn(`Skipping lesson ${lesson.id}: missing student info`);
            continue;
          }

          await sendLessonReminderEmail({
            studentName: student.full_name,
            studentEmail: student.email,
            tutorName: tutor?.full_name || "Your tutor",
            serviceName: service?.name || "Lesson",
            scheduledAt: lesson.scheduled_at,
            durationMinutes: lesson.duration_minutes,
            timezone: lesson.timezone,
            meetingUrl: lesson.meeting_url || undefined,
            meetingProvider: lesson.meeting_provider || undefined,
            customVideoName: tutor?.custom_video_name || undefined,
            hoursUntil: 24,
          });

          // Mark as sent
          await adminClient
            .from("bookings")
            .update({ reminder_24h_sent: true })
            .eq("id", lesson.id);

          results.reminders24h++;

          // Create in-app notification if student has an account
          if (student.user_id) {
            try {
              await adminClient.from("notifications").insert({
                user_id: student.user_id,
                user_role: "student",
                type: "booking_reminder",
                title: "Lesson tomorrow",
                body: `${service?.name || "Lesson"} with ${tutor?.full_name || "your tutor"}`,
                link: lesson.meeting_url || "/student-auth/search",
                icon: "bell",
                metadata: {
                  booking_id: lesson.id,
                  meeting_url: lesson.meeting_url,
                  meeting_provider: lesson.meeting_provider,
                  scheduled_at: lesson.scheduled_at,
                  hours_until: 24,
                },
              });
              results.notifications24h++;
            } catch (notifError) {
              console.warn(`Failed to create 24h notification for lesson ${lesson.id}:`, notifError);
            }
          }
        } catch (error) {
          console.error(`Error sending 24h reminder for lesson ${lesson.id}:`, error);
          results.errors.push(`24h reminder failed for lesson ${lesson.id}`);
        }
      }
    }

    // Send 1-hour reminders
    const lessons1h = normalizeLessonRecords(lessons1hData);
    if (lessons1h.length > 0) {
      for (const lesson of lessons1h) {
        try {
          const student = lesson.students;
          const service = lesson.services;
          const tutor = lesson.profiles;

          if (!student?.email || !student?.full_name) {
            console.warn(`Skipping lesson ${lesson.id}: missing student info`);
            continue;
          }

          await sendLessonReminderEmail({
            studentName: student.full_name,
            studentEmail: student.email,
            tutorName: tutor?.full_name || "Your tutor",
            serviceName: service?.name || "Lesson",
            scheduledAt: lesson.scheduled_at,
            durationMinutes: lesson.duration_minutes,
            timezone: lesson.timezone,
            meetingUrl: lesson.meeting_url || undefined,
            meetingProvider: lesson.meeting_provider || undefined,
            customVideoName: tutor?.custom_video_name || undefined,
            hoursUntil: 1,
          });

          // Mark as sent
          await adminClient
            .from("bookings")
            .update({ reminder_1h_sent: true })
            .eq("id", lesson.id);

          results.reminders1h++;

          // Create in-app notification if student has an account
          if (student.user_id) {
            try {
              await adminClient.from("notifications").insert({
                user_id: student.user_id,
                user_role: "student",
                type: "booking_reminder",
                title: "Lesson starting soon",
                body: `${service?.name || "Lesson"} with ${tutor?.full_name || "your tutor"} in 1 hour`,
                link: lesson.meeting_url || "/student-auth/search",
                icon: "bell",
                metadata: {
                  booking_id: lesson.id,
                  meeting_url: lesson.meeting_url,
                  meeting_provider: lesson.meeting_provider,
                  scheduled_at: lesson.scheduled_at,
                  hours_until: 1,
                },
              });
              results.notifications1h++;
            } catch (notifError) {
              console.warn(`Failed to create 1h notification for lesson ${lesson.id}:`, notifError);
            }
          }
        } catch (error) {
          console.error(`Error sending 1h reminder for lesson ${lesson.id}:`, error);
          results.errors.push(`1h reminder failed for lesson ${lesson.id}`);
        }
      }
    }

    results.automationsQueued += await enqueueReengagementAutomations(adminClient);
    const campaignResult = await processEmailCampaignQueue(adminClient);
    results.campaignSent += campaignResult.sent;
    results.campaignFailed += campaignResult.failed;

    if (results.errors.length > 0) {
      console.error("[Cron] Reminder errors:", results.errors);
    }

    console.info("[Cron] Jobs dispatched", results);

    return NextResponse.json({
      success: true,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in send-reminders cron:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}

function normalizeLessonRecords(
  records: unknown
): ReminderLessonRecord[] {
  const lessons =
    (records as Array<
      ReminderLessonRecord & {
        students:
          | ReminderLessonRecord["students"]
          | ReminderLessonRecord["students"][];
        services:
          | ReminderLessonRecord["services"]
          | ReminderLessonRecord["services"][];
        profiles:
          | ReminderLessonRecord["profiles"]
          | ReminderLessonRecord["profiles"][];
      }
    > | null) ?? [];

  return lessons.map((lesson) => ({
    ...lesson,
    students: Array.isArray(lesson.students)
      ? lesson.students[0]
      : lesson.students,
    services: Array.isArray(lesson.services)
      ? lesson.services[0]
      : lesson.services,
    profiles: Array.isArray(lesson.profiles)
      ? lesson.profiles[0]
      : lesson.profiles,
  }));
}

async function processEmailCampaignQueue(adminClient: ReturnType<typeof createServiceRoleClient>) {
  if (!adminClient) return { sent: 0, failed: 0 };
  const nowIso = new Date().toISOString();
  const { data } = await adminClient
    .from("email_campaign_recipients")
    .select(
      `
        id,
        campaign_id,
        student_email,
        student_name,
        personalization_subject,
        personalization_body,
        email_campaigns (
          tutor_id,
          kind,
          profiles!email_campaigns_tutor_id_fkey (
            full_name
          )
        ),
        students (
          id,
          email_opt_out,
          email_unsubscribe_token
        )
      `
    )
    .eq("status", "pending")
    .lte("scheduled_for", nowIso)
    .order("created_at", { ascending: true })
    .limit(50);

  const pending: CampaignRecipient[] = (data ?? []).map((item) => {
    const campaign = Array.isArray(item.email_campaigns) ? item.email_campaigns[0] : item.email_campaigns;
    const student = Array.isArray(item.students) ? item.students[0] : item.students;
    return {
      id: item.id,
      campaign_id: item.campaign_id,
      student_email: item.student_email,
      student_name: item.student_name,
      personalization_subject: item.personalization_subject,
      personalization_body: item.personalization_body,
      email_campaigns: campaign
        ? {
            tutor_id: campaign.tutor_id,
            kind: campaign.kind,
            profiles: Array.isArray(campaign.profiles)
              ? campaign.profiles[0]
              : campaign.profiles ?? null,
          }
        : null,
      students: student
        ? {
            id: student.id,
            email_opt_out: student.email_opt_out,
            email_unsubscribe_token: student.email_unsubscribe_token,
          }
        : null,
    };
  });
  if (pending.length === 0) {
    return { sent: 0, failed: 0 };
  }

  const campaignIds = new Set<string>();
  let sent = 0;
  let failed = 0;

  for (const recipient of pending) {
    const student = recipient.students;
    campaignIds.add(recipient.campaign_id);

    if (!student || student.email_opt_out) {
      await adminClient
        .from("email_campaign_recipients")
        .update({ status: "skipped", error_message: "Opted out" })
        .eq("id", recipient.id);
      continue;
    }

    const tutorName =
      recipient.email_campaigns?.profiles?.full_name?.trim() || "Your tutor";
    const subject = recipient.personalization_subject || "TutorLingua update";
    const body = recipient.personalization_body || "";

    try {
      const unsubscribeToken = student.email_unsubscribe_token;
      const unsubscribeUrl = unsubscribeToken
        ? `${PUBLIC_APP_URL}/email-unsubscribe?token=${unsubscribeToken}`
        : undefined;

      const html = BroadcastCampaignEmail({
        subject,
        tutorName,
        studentName: recipient.student_name || "there",
        body,
        unsubscribeUrl,
      });
      const text = BroadcastCampaignEmailText({
        subject,
        tutorName,
        studentName: recipient.student_name || "there",
        body,
        unsubscribeUrl,
      });

      await resend.emails.send({
        from: EMAIL_CONFIG.from,
        to: recipient.student_email,
        subject,
        html,
        text,
      });

      await adminClient
        .from("email_campaign_recipients")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("id", recipient.id);

      sent++;
    } catch (error) {
      console.error("[Cron] Failed to send campaign email", error);
      await adminClient
        .from("email_campaign_recipients")
        .update({
          status: "failed",
          error_message: String(error),
        })
        .eq("id", recipient.id);
      failed++;
    }
  }

  for (const campaignId of campaignIds) {
    const { count } = await adminClient
      .from("email_campaign_recipients")
      .select("id", { count: "exact", head: true })
      .eq("campaign_id", campaignId)
      .eq("status", "pending");

    const statusUpdate =
      (count ?? 0) === 0
        ? { status: "sent", sent_at: new Date().toISOString() }
        : { status: "sending" };

    await adminClient
      .from("email_campaigns")
      .update(statusUpdate)
      .eq("id", campaignId);
  }

  return { sent, failed };
}

async function enqueueReengagementAutomations(
  adminClient: ReturnType<typeof createServiceRoleClient>
) {
  if (!adminClient) return 0;
  const { data: tutors } = await adminClient
    .from("profiles")
    .select("id, full_name, auto_reengage_enabled, auto_reengage_days")
    .eq("auto_reengage_enabled", true);

  if (!tutors || tutors.length === 0) {
    return 0;
  }

  const tutorMap = new Map<string, TutorAutomationSettings>();
  tutors.forEach((tutor) => {
    tutorMap.set(tutor.id, {
      id: tutor.id,
      full_name: tutor.full_name,
      auto_reengage_days: tutor.auto_reengage_days ?? 30,
    });
  });

  const tutorIds = tutors.map((tutor) => tutor.id);

  const { data: students } = await adminClient
    .from("students")
    .select(
      "id, tutor_id, full_name, email, email_opt_out, status, updated_at, last_reengage_email_at"
    )
    .in("tutor_id", tutorIds)
    .in("status", ["inactive", "paused"]);

  if (!students || students.length === 0) {
    return 0;
  }

  let queued = 0;
  const now = new Date();

  for (const student of students) {
    if (queued >= 25) break;
    if (!student.email || student.email_opt_out) continue;

    const settings = tutorMap.get(student.tutor_id);
    if (!settings) continue;

    const thresholdDays = settings.auto_reengage_days ?? 30;
    const thresholdDate = new Date(now.getTime() - thresholdDays * 24 * 60 * 60 * 1000);
    const lastTouch = student.updated_at ? new Date(student.updated_at) : new Date(0);
    const lastReengage = student.last_reengage_email_at
      ? new Date(student.last_reengage_email_at)
      : new Date(0);

    if (lastTouch > thresholdDate) continue;
    if (lastReengage > thresholdDate) continue;

    try {
      await queueReengageAutomation({
        tutorId: student.tutor_id,
        tutorName: settings.full_name || "Your tutor",
        studentId: student.id,
        studentEmail: student.email,
        studentName: student.full_name,
        sendAt: now.toISOString(),
        client: adminClient,
      });

      await adminClient
        .from("students")
        .update({ last_reengage_email_at: now.toISOString() })
        .eq("id", student.id);

      queued++;
    } catch (error) {
      console.error("[Cron] Failed to queue reengagement email", error);
    }
  }

  return queued;
}
