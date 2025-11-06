import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { sendLessonReminderEmail } from "@/lib/emails/reminder-emails";

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
  } | null;
  services: {
    name: string | null;
  } | null;
  profiles: {
    full_name: string | null;
    custom_video_name: string | null;
  } | null;
};

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
          email
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
          email
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
      errors: [] as string[],
    };

    // Send 24-hour reminders
    const lessons24h = (lessons24hData ?? []) as ReminderLessonRecord[];
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
        } catch (error) {
          console.error(`Error sending 24h reminder for lesson ${lesson.id}:`, error);
          results.errors.push(`24h reminder failed for lesson ${lesson.id}`);
        }
      }
    }

    // Send 1-hour reminders
    const lessons1h = (lessons1hData ?? []) as ReminderLessonRecord[];
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
        } catch (error) {
          console.error(`Error sending 1h reminder for lesson ${lesson.id}:`, error);
          results.errors.push(`1h reminder failed for lesson ${lesson.id}`);
        }
      }
    }

    if (results.errors.length > 0) {
      console.error("[Cron] Reminder errors:", results.errors);
    }

    console.info("[Cron] Lesson reminders dispatched", {
      reminders24h: results.reminders24h,
      reminders1h: results.reminders1h,
    });

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
