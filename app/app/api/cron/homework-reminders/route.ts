import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { notifyHomeworkDueReminder } from "@/lib/actions/notifications";
import { addHours } from "date-fns";
import { recordSystemEvent, recordSystemMetric, startDuration } from "@/lib/monitoring";

/**
 * Cron endpoint to send homework due reminders
 * Should be called every hour by a scheduled job
 * Sends reminders for homework due within the next 24 hours
 */
export async function GET(req: Request) {
  const endTimer = startDuration("cron:homework-reminders");
  // Optional: Verify cron secret to prevent unauthorized access
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminClient = createServiceRoleClient();
  if (!adminClient) {
    return NextResponse.json(
      { error: "Database connection failed" },
      { status: 500 }
    );
  }

  try {
    const now = new Date();
    const in24Hours = addHours(now, 24);
    const in23Hours = addHours(now, 23); // Window: 23-24 hours from now

    // Find homework assignments due within 23-24 hours that haven't been reminded yet
    // This ensures we send the reminder approximately 24 hours before due date
    // Exclude draft homework (auto-generated content awaiting tutor review)
    const { data: homeworkDue, error: fetchError } = await adminClient
      .from("homework_assignments")
      .select(`
        id,
        title,
        due_date,
        student_id,
        students!inner (
          user_id,
          first_name
        )
      `)
      .not("status", "in", '("completed","cancelled","draft")')
      .is("reminder_sent_at", null)
      .not("due_date", "is", null)
      .gte("due_date", in23Hours.toISOString())
      .lte("due_date", in24Hours.toISOString());

    if (fetchError) {
      console.error("[homework-reminders] Error fetching homework:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch homework" },
        { status: 500 }
      );
    }

    if (!homeworkDue || homeworkDue.length === 0) {
      const durationMs = endTimer();
      void recordSystemMetric({ metric: "cron:homework-reminders:duration_ms", value: durationMs ?? 0, sampleRate: 0.25 });
      return NextResponse.json({
        status: "ok",
        message: "No homework reminders to send",
        processed: 0,
        duration_ms: durationMs,
      });
    }

    let sentCount = 0;
    const errors: string[] = [];

    for (const hw of homeworkDue) {
      const student = hw.students as unknown as { user_id: string | null; first_name: string };

      // Skip if student doesn't have a user account
      if (!student?.user_id) {
        continue;
      }

      try {
        // Send the reminder notification
        const result = await notifyHomeworkDueReminder({
          studentUserId: student.user_id,
          homeworkId: hw.id,
          homeworkTitle: hw.title,
          dueDate: hw.due_date!,
        });

        if (result.success) {
          // Update reminder_sent_at timestamp
          await adminClient
            .from("homework_assignments")
            .update({ reminder_sent_at: now.toISOString() })
            .eq("id", hw.id);

          sentCount++;
        } else {
          errors.push(`Failed to notify for homework ${hw.id}: ${result.error}`);
        }
      } catch (err) {
        errors.push(`Error processing homework ${hw.id}: ${err}`);
      }
    }

    const durationMs = endTimer();
    void recordSystemMetric({ metric: "cron:homework-reminders:sent", value: sentCount, sampleRate: 0.5 });
    void recordSystemMetric({ metric: "cron:homework-reminders:duration_ms", value: durationMs ?? 0, sampleRate: 0.25 });

    return NextResponse.json({
      status: "ok",
      message: `Sent ${sentCount} reminder(s)`,
      processed: homeworkDue.length,
      sent: sentCount,
      errors: errors.length > 0 ? errors : undefined,
      duration_ms: durationMs,
    });
  } catch (err) {
    console.error("[homework-reminders] Unexpected error:", err);
    endTimer();
    void recordSystemEvent({
      source: "cron:homework-reminders",
      message: "Unhandled error",
      meta: { error: String(err) },
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Also support POST for cron services that use POST
export async function POST(req: Request) {
  return GET(req);
}
