"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";

// ============================================================================
// TYPES
// ============================================================================

export type RiskStatus = "healthy" | "at_risk" | "critical" | "churned";

export type EngagementScore = {
  id: string;
  student_id: string;
  tutor_id: string;
  score: number;
  lesson_frequency_score: number;
  response_rate_score: number;
  homework_completion_score: number;
  practice_engagement_score: number;
  risk_status: RiskStatus;
  risk_status_override: RiskStatus | null;
  override_reason: string | null;
  override_at: string | null;
  override_by: string | null;
  days_since_last_lesson: number | null;
  days_since_last_message: number | null;
  last_computed_at: string;
  created_at: string;
  updated_at: string;
};

export type AtRiskStudent = {
  id: string;
  full_name: string;
  email: string;
  engagement_score: number;
  risk_status: RiskStatus;
  days_since_last_lesson: number | null;
  days_since_last_message: number | null;
  last_activity_at: string | null;
};

export type EngagementDashboard = {
  total_students: number;
  healthy_count: number;
  at_risk_count: number;
  critical_count: number;
  churned_count: number;
  average_score: number;
};

// ============================================================================
// HELPER: Require authenticated tutor
// ============================================================================

async function requireTutor() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Unauthorized");
  }

  return { supabase, userId: user.id };
}

// ============================================================================
// SCORE MANAGEMENT
// ============================================================================

/**
 * Get engagement score for a specific student
 */
export async function getStudentEngagementScore(
  studentId: string
): Promise<EngagementScore | null> {
  const { supabase, userId } = await requireTutor();

  const { data, error } = await supabase
    .from("student_engagement_scores")
    .select("*")
    .eq("student_id", studentId)
    .eq("tutor_id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // No score exists yet, compute and create one
      return await refreshEngagementScore(studentId);
    }
    console.error("[getStudentEngagementScore] Error:", error);
    return null;
  }

  return data as EngagementScore;
}

/**
 * Refresh/compute engagement score for a student
 */
export async function refreshEngagementScore(
  studentId: string
): Promise<EngagementScore | null> {
  const { supabase, userId } = await requireTutor();

  // Call the RPC function to compute the score
  const { data: scoreData, error: rpcError } = await supabase.rpc(
    "compute_student_engagement_score",
    {
      p_student_id: studentId,
      p_tutor_id: userId,
    }
  );

  if (rpcError) {
    console.error("[refreshEngagementScore] RPC error:", rpcError);
    return null;
  }

  const computed = scoreData?.[0];
  if (!computed) {
    console.error("[refreshEngagementScore] No data returned from RPC");
    return null;
  }

  // Upsert the engagement score record
  const { data, error } = await supabase
    .from("student_engagement_scores")
    .upsert(
      {
        student_id: studentId,
        tutor_id: userId,
        score: computed.score,
        lesson_frequency_score: computed.lesson_frequency_score,
        response_rate_score: computed.response_rate_score,
        homework_completion_score: computed.homework_completion_score,
        practice_engagement_score: computed.practice_engagement_score,
        risk_status: computed.risk_status,
        days_since_last_lesson: computed.days_since_last_lesson,
        days_since_last_message: computed.days_since_last_message,
        last_computed_at: new Date().toISOString(),
      },
      {
        onConflict: "student_id,tutor_id",
        ignoreDuplicates: false,
      }
    )
    .select()
    .single();

  if (error) {
    console.error("[refreshEngagementScore] Upsert error:", error);
    return null;
  }

  // Also update the student record with the score and risk status
  // (respecting any manual override)
  const effectiveRiskStatus = data.risk_status_override || data.risk_status;

  await supabase
    .from("students")
    .update({
      engagement_score: data.score,
      risk_status: effectiveRiskStatus,
    })
    .eq("id", studentId)
    .eq("tutor_id", userId);

  revalidatePath("/students");
  revalidatePath(`/students/${studentId}`);

  return data as EngagementScore;
}

/**
 * Refresh engagement scores for all active students (for cron job)
 */
export async function refreshAllEngagementScores(): Promise<{
  updated: number;
  errors: string[];
}> {
  const supabase = await createServiceRoleClient();

  if (!supabase) {
    console.error("[refreshAllEngagementScores] Failed to create service role client");
    return { updated: 0, errors: ["Failed to create service role client"] };
  }

  // Get all active students grouped by tutor
  const { data: students, error: fetchError } = await supabase
    .from("students")
    .select("id, tutor_id")
    .in("status", ["active", "trial"])
    .order("tutor_id");

  if (fetchError) {
    console.error("[refreshAllEngagementScores] Fetch error:", fetchError);
    return { updated: 0, errors: [fetchError.message] };
  }

  let updated = 0;
  const errors: string[] = [];

  for (const student of students ?? []) {
    try {
      // Call the RPC function
      const { data: scoreData, error: rpcError } = await supabase.rpc(
        "compute_student_engagement_score",
        {
          p_student_id: student.id,
          p_tutor_id: student.tutor_id,
        }
      );

      if (rpcError) {
        errors.push(`Student ${student.id}: ${rpcError.message}`);
        continue;
      }

      const computed = scoreData?.[0];
      if (!computed) {
        continue;
      }

      // Upsert the score
      const { data: scoreRecord, error: upsertError } = await supabase
        .from("student_engagement_scores")
        .upsert(
          {
            student_id: student.id,
            tutor_id: student.tutor_id,
            score: computed.score,
            lesson_frequency_score: computed.lesson_frequency_score,
            response_rate_score: computed.response_rate_score,
            homework_completion_score: computed.homework_completion_score,
            practice_engagement_score: computed.practice_engagement_score,
            risk_status: computed.risk_status,
            days_since_last_lesson: computed.days_since_last_lesson,
            days_since_last_message: computed.days_since_last_message,
            last_computed_at: new Date().toISOString(),
          },
          {
            onConflict: "student_id,tutor_id",
            ignoreDuplicates: false,
          }
        )
        .select()
        .single();

      if (upsertError) {
        errors.push(`Student ${student.id}: ${upsertError.message}`);
        continue;
      }

      // Update student record
      const effectiveRiskStatus =
        scoreRecord?.risk_status_override || scoreRecord?.risk_status;

      await supabase
        .from("students")
        .update({
          engagement_score: computed.score,
          risk_status: effectiveRiskStatus,
        })
        .eq("id", student.id);

      updated++;
    } catch (err) {
      errors.push(`Student ${student.id}: ${String(err)}`);
    }
  }

  return { updated, errors };
}

// ============================================================================
// RISK STATUS OVERRIDE
// ============================================================================

/**
 * Override risk status for a student manually
 */
export async function overrideRiskStatus(input: {
  studentId: string;
  riskStatus: RiskStatus;
  reason: string;
}): Promise<{ success: boolean; error?: string }> {
  const { supabase, userId } = await requireTutor();

  const { studentId, riskStatus, reason } = input;

  if (!reason.trim()) {
    return { success: false, error: "Please provide a reason for the override" };
  }

  // Update engagement score record
  const { error: scoreError } = await supabase
    .from("student_engagement_scores")
    .update({
      risk_status_override: riskStatus,
      override_reason: reason.trim(),
      override_at: new Date().toISOString(),
      override_by: userId,
    })
    .eq("student_id", studentId)
    .eq("tutor_id", userId);

  if (scoreError) {
    // If no score record exists, create one first
    if (scoreError.code === "PGRST116") {
      await refreshEngagementScore(studentId);
      // Retry the update
      const { error: retryError } = await supabase
        .from("student_engagement_scores")
        .update({
          risk_status_override: riskStatus,
          override_reason: reason.trim(),
          override_at: new Date().toISOString(),
          override_by: userId,
        })
        .eq("student_id", studentId)
        .eq("tutor_id", userId);

      if (retryError) {
        console.error("[overrideRiskStatus] Retry error:", retryError);
        return { success: false, error: "Failed to override risk status" };
      }
    } else {
      console.error("[overrideRiskStatus] Score error:", scoreError);
      return { success: false, error: "Failed to override risk status" };
    }
  }

  // Update student record
  await supabase
    .from("students")
    .update({ risk_status: riskStatus })
    .eq("id", studentId)
    .eq("tutor_id", userId);

  // Add timeline event
  await supabase.from("student_timeline_events").insert({
    student_id: studentId,
    tutor_id: userId,
    event_type: "risk_status_changed",
    event_title: `Risk status updated to ${riskStatus}`,
    event_description: reason.trim(),
    event_metadata: { new_status: riskStatus, is_override: true },
    visible_to_student: false,
    is_milestone: false,
  });

  revalidatePath("/students");
  revalidatePath(`/students/${studentId}`);

  return { success: true };
}

/**
 * Clear risk status override (revert to computed status)
 */
export async function clearRiskStatusOverride(
  studentId: string
): Promise<{ success: boolean; error?: string }> {
  const { supabase, userId } = await requireTutor();

  // Get current computed status
  const { data: scoreData } = await supabase
    .from("student_engagement_scores")
    .select("risk_status")
    .eq("student_id", studentId)
    .eq("tutor_id", userId)
    .single();

  const computedStatus = scoreData?.risk_status ?? "healthy";

  // Clear the override
  const { error } = await supabase
    .from("student_engagement_scores")
    .update({
      risk_status_override: null,
      override_reason: null,
      override_at: null,
      override_by: null,
    })
    .eq("student_id", studentId)
    .eq("tutor_id", userId);

  if (error) {
    console.error("[clearRiskStatusOverride] Error:", error);
    return { success: false, error: "Failed to clear override" };
  }

  // Update student record with computed status
  await supabase
    .from("students")
    .update({ risk_status: computedStatus })
    .eq("id", studentId)
    .eq("tutor_id", userId);

  revalidatePath("/students");
  revalidatePath(`/students/${studentId}`);

  return { success: true };
}

// ============================================================================
// DASHBOARD QUERIES
// ============================================================================

/**
 * Get all at-risk students for dashboard widget
 */
export async function getAtRiskStudents(): Promise<AtRiskStudent[]> {
  const { supabase, userId } = await requireTutor();

  const { data, error } = await supabase
    .from("students")
    .select(
      `
      id,
      full_name,
      email,
      engagement_score,
      risk_status,
      last_activity_at
    `
    )
    .eq("tutor_id", userId)
    .in("risk_status", ["at_risk", "critical", "churned"])
    .in("status", ["active", "trial"]) // Only show active students
    .order("engagement_score", { ascending: true })
    .limit(10);

  if (error) {
    console.error("[getAtRiskStudents] Error:", error);
    return [];
  }

  // Get additional data from engagement scores
  const studentIds = (data ?? []).map((s) => s.id);

  if (studentIds.length === 0) {
    return [];
  }

  const { data: scores } = await supabase
    .from("student_engagement_scores")
    .select("student_id, days_since_last_lesson, days_since_last_message")
    .eq("tutor_id", userId)
    .in("student_id", studentIds);

  const scoreMap = new Map(scores?.map((s) => [s.student_id, s]) ?? []);

  return (data ?? []).map((student) => {
    const score = scoreMap.get(student.id);
    return {
      id: student.id,
      full_name: student.full_name ?? "",
      email: student.email,
      engagement_score: student.engagement_score ?? 100,
      risk_status: (student.risk_status as RiskStatus) ?? "healthy",
      days_since_last_lesson: score?.days_since_last_lesson ?? null,
      days_since_last_message: score?.days_since_last_message ?? null,
      last_activity_at: student.last_activity_at,
    };
  });
}

/**
 * Get engagement dashboard summary
 */
export async function getEngagementDashboard(): Promise<EngagementDashboard> {
  const { supabase, userId } = await requireTutor();

  const { data, error } = await supabase
    .from("students")
    .select("risk_status, engagement_score")
    .eq("tutor_id", userId)
    .in("status", ["active", "trial"]);

  if (error) {
    console.error("[getEngagementDashboard] Error:", error);
    return {
      total_students: 0,
      healthy_count: 0,
      at_risk_count: 0,
      critical_count: 0,
      churned_count: 0,
      average_score: 0,
    };
  }

  const students = data ?? [];
  const total = students.length;

  if (total === 0) {
    return {
      total_students: 0,
      healthy_count: 0,
      at_risk_count: 0,
      critical_count: 0,
      churned_count: 0,
      average_score: 0,
    };
  }

  const counts = {
    healthy: 0,
    at_risk: 0,
    critical: 0,
    churned: 0,
  };

  let totalScore = 0;

  for (const student of students) {
    const status = (student.risk_status as RiskStatus) ?? "healthy";
    if (status in counts) {
      counts[status]++;
    }
    totalScore += student.engagement_score ?? 100;
  }

  return {
    total_students: total,
    healthy_count: counts.healthy,
    at_risk_count: counts.at_risk,
    critical_count: counts.critical,
    churned_count: counts.churned,
    average_score: Math.round(totalScore / total),
  };
}

/**
 * Get students filtered by risk status
 */
export async function getStudentsByRiskStatus(
  riskStatus: RiskStatus
): Promise<AtRiskStudent[]> {
  const { supabase, userId } = await requireTutor();

  const { data, error } = await supabase
    .from("students")
    .select(
      `
      id,
      full_name,
      email,
      engagement_score,
      risk_status,
      last_activity_at
    `
    )
    .eq("tutor_id", userId)
    .eq("risk_status", riskStatus)
    .in("status", ["active", "trial"])
    .order("full_name");

  if (error) {
    console.error("[getStudentsByRiskStatus] Error:", error);
    return [];
  }

  return (data ?? []).map((student) => ({
    id: student.id,
    full_name: student.full_name ?? "",
    email: student.email,
    engagement_score: student.engagement_score ?? 100,
    risk_status: (student.risk_status as RiskStatus) ?? "healthy",
    days_since_last_lesson: null,
    days_since_last_message: null,
    last_activity_at: student.last_activity_at,
  }));
}
