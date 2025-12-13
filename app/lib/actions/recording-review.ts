"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Server actions for tutors to review and manage auto-generated
 * homework and drills from lesson recordings.
 */

// ============================================================================
// Types
// ============================================================================

interface RecordingWithDrills {
  id: string;
  booking_id: string | null;
  student_id: string;
  created_at: string;
  status: string;
  ai_summary_md: string | null;
  key_points: unknown;
  tutor_reviewed_at: string | null;
  drill_count: number;
  pending_drill_count: number;
  homework_id: string | null;
  homework_status: string | null;
}

interface DrillPreview {
  id: string;
  recording_id: string;
  content: Record<string, unknown>;
  drill_type: string;
  focus_area: string | null;
  source: string;
  visible_to_student: boolean;
  tutor_approved: boolean;
  tutor_approved_at: string | null;
  status: string;
  created_at: string;
}

interface HomeworkDraft {
  id: string;
  title: string;
  instructions: string;
  status: string;
  source: string;
  recording_id: string | null;
  due_date: string | null;
  tutor_reviewed: boolean;
  tutor_reviewed_at: string | null;
  created_at: string;
  student: {
    id: string;
    full_name: string | null;
    email: string;
  };
  drills: DrillPreview[];
  recording: {
    id: string;
    ai_summary_md: string | null;
    key_points: unknown;
  } | null;
}

// ============================================================================
// Query Actions
// ============================================================================

/**
 * Get all recordings for a student with drill counts and review status.
 */
export async function getStudentRecordingsWithStatus(studentId: string): Promise<{
  success: boolean;
  recordings?: RecordingWithDrills[];
  error?: string;
}> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Get recordings with drill counts
  const { data: recordings, error } = await supabase
    .from("lesson_recordings")
    .select(`
      id,
      booking_id,
      student_id,
      created_at,
      status,
      ai_summary_md,
      key_points,
      tutor_reviewed_at
    `)
    .eq("tutor_id", user.id)
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[Recording Review] Fetch error:", error);
    return { success: false, error: "Failed to fetch recordings" };
  }

  // Get drill counts for each recording
  const recordingIds = recordings?.map(r => r.id) || [];

  if (recordingIds.length === 0) {
    return { success: true, recordings: [] };
  }

  const { data: drillCounts } = await supabase
    .from("lesson_drills")
    .select("recording_id, visible_to_student")
    .in("recording_id", recordingIds);

  const { data: homeworkLinks } = await supabase
    .from("homework_assignments")
    .select("id, recording_id, status")
    .in("recording_id", recordingIds);

  // Aggregate counts
  const drillCountMap = new Map<string, { total: number; pending: number }>();
  drillCounts?.forEach(drill => {
    const existing = drillCountMap.get(drill.recording_id) || { total: 0, pending: 0 };
    existing.total++;
    if (!drill.visible_to_student) {
      existing.pending++;
    }
    drillCountMap.set(drill.recording_id, existing);
  });

  const homeworkMap = new Map<string, { id: string; status: string }>();
  homeworkLinks?.forEach(hw => {
    if (hw.recording_id) {
      homeworkMap.set(hw.recording_id, { id: hw.id, status: hw.status });
    }
  });

  const enrichedRecordings: RecordingWithDrills[] = (recordings || []).map(r => ({
    ...r,
    drill_count: drillCountMap.get(r.id)?.total || 0,
    pending_drill_count: drillCountMap.get(r.id)?.pending || 0,
    homework_id: homeworkMap.get(r.id)?.id || null,
    homework_status: homeworkMap.get(r.id)?.status || null,
  }));

  return { success: true, recordings: enrichedRecordings };
}

/**
 * Get all draft homework assignments for the current tutor.
 */
export async function getDraftHomework(): Promise<{
  success: boolean;
  drafts?: HomeworkDraft[];
  error?: string;
}> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { data: drafts, error } = await supabase
    .from("homework_assignments")
    .select(`
      id,
      title,
      instructions,
      status,
      source,
      recording_id,
      due_date,
      tutor_reviewed,
      tutor_reviewed_at,
      created_at,
      students!inner (
        id,
        full_name,
        email
      )
    `)
    .eq("tutor_id", user.id)
    .eq("status", "draft")
    .neq("source", "manual")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[Recording Review] Draft fetch error:", error);
    return { success: false, error: "Failed to fetch drafts" };
  }

  // Get drills and recordings for each draft
  const recordingIds = drafts?.map(d => d.recording_id).filter(Boolean) as string[];

  const drillsMap = new Map<string, DrillPreview[]>();
  const recordingsMap = new Map<string, { id: string; ai_summary_md: string | null; key_points: unknown }>();

  if (recordingIds.length > 0) {
    const { data: drills } = await supabase
      .from("lesson_drills")
      .select(`
        id,
        recording_id,
        content,
        drill_type,
        focus_area,
        source,
        visible_to_student,
        tutor_approved,
        tutor_approved_at,
        status,
        created_at
      `)
      .in("recording_id", recordingIds);

    drills?.forEach(drill => {
      const existing = drillsMap.get(drill.recording_id) || [];
      existing.push(drill as DrillPreview);
      drillsMap.set(drill.recording_id, existing);
    });

    const { data: recordings } = await supabase
      .from("lesson_recordings")
      .select("id, ai_summary_md, key_points")
      .in("id", recordingIds);

    recordings?.forEach(rec => {
      recordingsMap.set(rec.id, rec);
    });
  }

  const enrichedDrafts: HomeworkDraft[] = (drafts || []).map(d => ({
    id: d.id,
    title: d.title,
    instructions: d.instructions,
    status: d.status,
    source: d.source,
    recording_id: d.recording_id,
    due_date: d.due_date,
    tutor_reviewed: d.tutor_reviewed,
    tutor_reviewed_at: d.tutor_reviewed_at,
    created_at: d.created_at,
    student: {
      id: (d.students as unknown as { id: string; full_name: string | null; email: string }).id,
      full_name: (d.students as unknown as { id: string; full_name: string | null; email: string }).full_name,
      email: (d.students as unknown as { id: string; full_name: string | null; email: string }).email,
    },
    drills: d.recording_id ? (drillsMap.get(d.recording_id) || []) : [],
    recording: d.recording_id ? (recordingsMap.get(d.recording_id) || null) : null,
  }));

  return { success: true, drafts: enrichedDrafts };
}

/**
 * Get drills for a specific recording.
 */
export async function getRecordingDrills(recordingId: string): Promise<{
  success: boolean;
  drills?: DrillPreview[];
  error?: string;
}> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { data: drills, error } = await supabase
    .from("lesson_drills")
    .select(`
      id,
      recording_id,
      content,
      drill_type,
      focus_area,
      source,
      visible_to_student,
      tutor_approved,
      tutor_approved_at,
      status,
      created_at
    `)
    .eq("recording_id", recordingId)
    .eq("tutor_id", user.id)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[Recording Review] Drills fetch error:", error);
    return { success: false, error: "Failed to fetch drills" };
  }

  return { success: true, drills: drills as DrillPreview[] };
}

// ============================================================================
// Drill Approval Actions
// ============================================================================

/**
 * Approve a single drill, making it visible to the student.
 */
export async function approveDrill(drillId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("lesson_drills")
    .update({
      visible_to_student: true,
      tutor_approved: true,
      tutor_approved_at: new Date().toISOString(),
      status: "assigned",
    })
    .eq("id", drillId)
    .eq("tutor_id", user.id);

  if (error) {
    console.error("[Recording Review] Approve drill error:", error);
    return { success: false, error: "Failed to approve drill" };
  }

  return { success: true };
}

/**
 * Approve all drills for a recording, making them visible to the student.
 */
export async function approveAllDrills(recordingId: string): Promise<{
  success: boolean;
  count?: number;
  error?: string;
}> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { data, error } = await supabase
    .from("lesson_drills")
    .update({
      visible_to_student: true,
      tutor_approved: true,
      tutor_approved_at: new Date().toISOString(),
      status: "assigned",
    })
    .eq("recording_id", recordingId)
    .eq("tutor_id", user.id)
    .eq("visible_to_student", false)
    .select("id");

  if (error) {
    console.error("[Recording Review] Approve all drills error:", error);
    return { success: false, error: "Failed to approve drills" };
  }

  // Mark recording as reviewed
  await supabase
    .from("lesson_recordings")
    .update({ tutor_reviewed_at: new Date().toISOString() })
    .eq("id", recordingId)
    .eq("tutor_id", user.id);

  return { success: true, count: data?.length || 0 };
}

/**
 * Update drill content before approval.
 */
export async function updateDrillContent(
  drillId: string,
  content: Record<string, unknown>
): Promise<{
  success: boolean;
  error?: string;
}> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("lesson_drills")
    .update({ content })
    .eq("id", drillId)
    .eq("tutor_id", user.id);

  if (error) {
    console.error("[Recording Review] Update drill error:", error);
    return { success: false, error: "Failed to update drill" };
  }

  return { success: true };
}

/**
 * Delete an unwanted drill.
 */
export async function deleteDrill(drillId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("lesson_drills")
    .delete()
    .eq("id", drillId)
    .eq("tutor_id", user.id);

  if (error) {
    console.error("[Recording Review] Delete drill error:", error);
    return { success: false, error: "Failed to delete drill" };
  }

  return { success: true };
}

// ============================================================================
// Homework Management Actions
// ============================================================================

/**
 * Publish a draft homework assignment, making it visible to the student.
 */
export async function publishHomework(homeworkId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Get homework to find recording_id
  const { data: homework } = await supabase
    .from("homework_assignments")
    .select("recording_id, student_id")
    .eq("id", homeworkId)
    .eq("tutor_id", user.id)
    .single();

  if (!homework) {
    return { success: false, error: "Homework not found" };
  }

  // Update homework status
  const { error } = await supabase
    .from("homework_assignments")
    .update({
      status: "assigned",
      tutor_reviewed: true,
      tutor_reviewed_at: new Date().toISOString(),
    })
    .eq("id", homeworkId)
    .eq("tutor_id", user.id);

  if (error) {
    console.error("[Recording Review] Publish homework error:", error);
    return { success: false, error: "Failed to publish homework" };
  }

  // Also approve all associated drills
  if (homework.recording_id) {
    await supabase
      .from("lesson_drills")
      .update({
        visible_to_student: true,
        tutor_approved: true,
        tutor_approved_at: new Date().toISOString(),
        status: "assigned",
      })
      .eq("recording_id", homework.recording_id)
      .eq("tutor_id", user.id);

    // Mark recording as reviewed
    await supabase
      .from("lesson_recordings")
      .update({ tutor_reviewed_at: new Date().toISOString() })
      .eq("id", homework.recording_id)
      .eq("tutor_id", user.id);
  }

  // Send notification to student
  const { data: student } = await supabase
    .from("students")
    .select("user_id")
    .eq("id", homework.student_id)
    .single();

  if (student?.user_id) {
    await supabase.from("notifications").insert({
      user_id: student.user_id,
      type: "homework_assigned",
      title: "New Homework Assigned",
      message: "Your tutor has assigned new practice materials based on your recent lesson.",
      metadata: { homework_id: homeworkId },
      action_url: "/student/progress",
      read: false,
    });
  }

  revalidatePath("/students/[studentId]", "page");

  return { success: true };
}

/**
 * Update a draft homework assignment before publishing.
 */
export async function updateHomeworkDraft(
  homeworkId: string,
  updates: {
    title?: string;
    instructions?: string;
    due_date?: string | null;
  }
): Promise<{
  success: boolean;
  error?: string;
}> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("homework_assignments")
    .update(updates)
    .eq("id", homeworkId)
    .eq("tutor_id", user.id)
    .eq("status", "draft");

  if (error) {
    console.error("[Recording Review] Update homework error:", error);
    return { success: false, error: "Failed to update homework" };
  }

  return { success: true };
}

/**
 * Discard a draft homework assignment (and associated drills).
 */
export async function discardHomeworkDraft(homeworkId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Get homework to find recording_id
  const { data: homework } = await supabase
    .from("homework_assignments")
    .select("recording_id")
    .eq("id", homeworkId)
    .eq("tutor_id", user.id)
    .eq("status", "draft")
    .single();

  if (!homework) {
    return { success: false, error: "Homework not found or already published" };
  }

  // Delete associated drills first
  if (homework.recording_id) {
    await supabase
      .from("lesson_drills")
      .delete()
      .eq("recording_id", homework.recording_id)
      .eq("tutor_id", user.id)
      .eq("visible_to_student", false);
  }

  // Delete homework
  const { error } = await supabase
    .from("homework_assignments")
    .delete()
    .eq("id", homeworkId)
    .eq("tutor_id", user.id)
    .eq("status", "draft");

  if (error) {
    console.error("[Recording Review] Discard homework error:", error);
    return { success: false, error: "Failed to discard homework" };
  }

  revalidatePath("/students/[studentId]", "page");

  return { success: true };
}

// ============================================================================
// Recording Review Actions
// ============================================================================

/**
 * Mark a recording as reviewed by the tutor.
 */
export async function markRecordingReviewed(recordingId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("lesson_recordings")
    .update({ tutor_reviewed_at: new Date().toISOString() })
    .eq("id", recordingId)
    .eq("tutor_id", user.id);

  if (error) {
    console.error("[Recording Review] Mark reviewed error:", error);
    return { success: false, error: "Failed to mark recording as reviewed" };
  }

  return { success: true };
}

// ============================================================================
// Tutor Settings Actions
// ============================================================================

/**
 * Get the current tutor's auto-homework approval preference.
 */
export async function getAutoHomeworkPreference(): Promise<{
  success: boolean;
  preference?: "require_approval" | "auto_send";
  error?: string;
}> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("auto_homework_approval")
    .eq("id", user.id)
    .single();

  if (error) {
    console.error("[Recording Review] Get preference error:", error);
    return { success: false, error: "Failed to get preference" };
  }

  return {
    success: true,
    preference: (profile?.auto_homework_approval as "require_approval" | "auto_send") || "require_approval",
  };
}

/**
 * Update the tutor's auto-homework approval preference.
 */
export async function updateAutoHomeworkPreference(
  preference: "require_approval" | "auto_send"
): Promise<{
  success: boolean;
  error?: string;
}> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ auto_homework_approval: preference })
    .eq("id", user.id);

  if (error) {
    console.error("[Recording Review] Update preference error:", error);
    return { success: false, error: "Failed to update preference" };
  }

  return { success: true };
}
