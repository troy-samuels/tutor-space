import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";

/**
 * Cron job to scan for low package balances and queue automation events
 *
 * Should be called daily at 9am via Vercel Cron or external service
 * Protected by CRON_SECRET environment variable
 *
 * @example
 * GET /api/cron/scan-package-balances
 * Authorization: Bearer <CRON_SECRET>
 */
export async function GET(request: Request) {
  const startTime = Date.now();

  // Verify cron secret to prevent unauthorized access
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error("[Cron:scan-package-balances] CRON_SECRET is not configured");
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
    console.error("[Cron:scan-package-balances] No admin client available");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }

  try {
    // Find all active package_low_balance automation rules
    const { data: rules, error: rulesError } = await adminClient
      .from("automation_rules")
      .select("id, tutor_id, trigger_settings")
      .eq("trigger_type", "package_low_balance")
      .eq("is_active", true);

    if (rulesError) {
      console.error("[Cron:scan-package-balances] Rules fetch error:", rulesError);
      return NextResponse.json(
        { error: "Failed to fetch rules" },
        { status: 500 }
      );
    }

    if (!rules || rules.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No active package_low_balance rules found",
        queued: 0,
        duration_ms: Date.now() - startTime,
      });
    }

    let totalQueued = 0;
    let totalSkipped = 0;

    const now = new Date().toISOString();

    // Process each rule
    for (const rule of rules) {
      const thresholdMinutes =
        (rule.trigger_settings as { threshold_minutes?: number })?.threshold_minutes ?? 60;
      const cooldownHours =
        (rule.trigger_settings as { cooldown_hours?: number })?.cooldown_hours ?? 168; // 7 days default

      // Find active packages below threshold for this tutor's students
      const { data: lowPackages, error: packagesError } = await adminClient
        .from("session_package_purchases")
        .select(
          `
          id,
          student_id,
          remaining_minutes,
          students!inner (
            id,
            tutor_id,
            deleted_at
          )
        `
        )
        .lte("remaining_minutes", thresholdMinutes)
        .gt("remaining_minutes", 0)
        .gte("expires_at", now)
        .eq("students.tutor_id", rule.tutor_id)
        .is("students.deleted_at", null);

      if (packagesError) {
        console.error(
          `[Cron:scan-package-balances] Packages fetch error for rule ${rule.id}:`,
          packagesError
        );
        continue;
      }

      if (!lowPackages || lowPackages.length === 0) {
        continue;
      }

      for (const pkg of lowPackages) {
        const studentData = Array.isArray(pkg.students) ? pkg.students[0] : pkg.students;
        if (!studentData) continue;

        // Check cooldown with package_id as context key (don't alert same package repeatedly)
        const { data: cooldown } = await adminClient
          .from("automation_cooldowns")
          .select("last_sent_at")
          .eq("tutor_id", rule.tutor_id)
          .eq("student_id", studentData.id)
          .eq("rule_id", rule.id)
          .eq("context_key", pkg.id)
          .single();

        if (cooldown) {
          const lastSent = new Date(cooldown.last_sent_at);
          const hoursSince = (Date.now() - lastSent.getTime()) / (1000 * 60 * 60);

          if (hoursSince < cooldownHours) {
            totalSkipped++;
            continue;
          }
        }

        // Check if there's already a pending event for this student/rule/package
        const { data: existingEvent } = await adminClient
          .from("automation_events")
          .select("id")
          .eq("tutor_id", rule.tutor_id)
          .eq("student_id", studentData.id)
          .eq("rule_id", rule.id)
          .eq("status", "pending")
          .single();

        if (existingEvent) {
          totalSkipped++;
          continue;
        }

        // Queue the automation event
        const { error: insertError } = await adminClient
          .from("automation_events")
          .insert({
            tutor_id: rule.tutor_id,
            student_id: studentData.id,
            rule_id: rule.id,
            status: "pending",
            scheduled_for: now,
            requires_condition_check: false,
            condition_check_data: {
              package_id: pkg.id,
              remaining_minutes: pkg.remaining_minutes,
            },
          });

        if (insertError) {
          console.error(
            `[Cron:scan-package-balances] Insert error for student ${studentData.id}:`,
            insertError
          );
          continue;
        }

        totalQueued++;
      }
    }

    const durationMs = Date.now() - startTime;

    console.info("[Cron:scan-package-balances] Completed", {
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
    console.error("[Cron:scan-package-balances] Error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
