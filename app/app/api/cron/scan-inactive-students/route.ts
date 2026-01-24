import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";

/**
 * Cron job to scan for inactive students and queue re-engagement automation events
 *
 * Should be called daily at 9am via Vercel Cron or external service
 * Protected by CRON_SECRET environment variable
 *
 * @example
 * GET /api/cron/scan-inactive-students
 * Authorization: Bearer <CRON_SECRET>
 */
export async function GET(request: Request) {
  const startTime = Date.now();

  // Verify cron secret to prevent unauthorized access
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error("[Cron:scan-inactive-students] CRON_SECRET is not configured");
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
    console.error("[Cron:scan-inactive-students] No admin client available");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }

  try {
    // Find all active student_inactive automation rules
    const { data: rules, error: rulesError } = await adminClient
      .from("automation_rules")
      .select("id, tutor_id, trigger_settings")
      .eq("trigger_type", "student_inactive")
      .eq("is_active", true);

    if (rulesError) {
      console.error("[Cron:scan-inactive-students] Rules fetch error:", rulesError);
      return NextResponse.json(
        { error: "Failed to fetch rules" },
        { status: 500 }
      );
    }

    if (!rules || rules.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No active student_inactive rules found",
        queued: 0,
        duration_ms: Date.now() - startTime,
      });
    }

    let totalQueued = 0;
    let totalSkipped = 0;

    // Process each rule
    for (const rule of rules) {
      const daysInactive = (rule.trigger_settings as { days_inactive?: number })?.days_inactive ?? 14;
      const cooldownHours = (rule.trigger_settings as { cooldown_hours?: number })?.cooldown_hours ?? 720; // 30 days default

      // Find students who match the inactivity threshold
      // Uses student_engagement_scores.days_since_last_lesson
      const { data: inactiveStudents, error: studentsError } = await adminClient
        .from("student_engagement_scores")
        .select("student_id, tutor_id, days_since_last_lesson")
        .eq("tutor_id", rule.tutor_id)
        .gte("days_since_last_lesson", daysInactive);

      if (studentsError) {
        console.error(
          `[Cron:scan-inactive-students] Students fetch error for rule ${rule.id}:`,
          studentsError
        );
        continue;
      }

      if (!inactiveStudents || inactiveStudents.length === 0) {
        continue;
      }

      for (const student of inactiveStudents) {
        // Check cooldown - don't send if already sent within cooldown period
        const { data: cooldown } = await adminClient
          .from("automation_cooldowns")
          .select("last_sent_at")
          .eq("tutor_id", rule.tutor_id)
          .eq("student_id", student.student_id)
          .eq("rule_id", rule.id)
          .eq("context_key", "")
          .single();

        if (cooldown) {
          const lastSent = new Date(cooldown.last_sent_at);
          const hoursSince = (Date.now() - lastSent.getTime()) / (1000 * 60 * 60);

          if (hoursSince < cooldownHours) {
            totalSkipped++;
            continue;
          }
        }

        // Check if there's already a pending event for this student/rule
        const { data: existingEvent } = await adminClient
          .from("automation_events")
          .select("id")
          .eq("tutor_id", rule.tutor_id)
          .eq("student_id", student.student_id)
          .eq("rule_id", rule.id)
          .eq("status", "pending")
          .single();

        if (existingEvent) {
          totalSkipped++;
          continue;
        }

        // Check if student is still active (not deleted)
        const { data: studentRecord } = await adminClient
          .from("students")
          .select("id, status")
          .eq("id", student.student_id)
          .is("deleted_at", null)
          .single();

        if (!studentRecord || studentRecord.status === "churned") {
          totalSkipped++;
          continue;
        }

        // Queue the automation event
        const { error: insertError } = await adminClient
          .from("automation_events")
          .insert({
            tutor_id: rule.tutor_id,
            student_id: student.student_id,
            rule_id: rule.id,
            status: "pending",
            scheduled_for: new Date().toISOString(),
            requires_condition_check: false,
          });

        if (insertError) {
          console.error(
            `[Cron:scan-inactive-students] Insert error for student ${student.student_id}:`,
            insertError
          );
          continue;
        }

        totalQueued++;
      }
    }

    const durationMs = Date.now() - startTime;

    console.info("[Cron:scan-inactive-students] Completed", {
      rules_processed: rules.length,
      events_queued: totalQueued,
      events_skipped: totalSkipped,
      durationMs,
    });

    return NextResponse.json({
      success: true,
      rules_processed: rules.length,
      events_queued: totalQueued,
      events_skipped: totalSkipped,
      duration_ms: durationMs,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Cron:scan-inactive-students] Error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
