"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { getNextBookingForStudent } from "@/lib/repositories/bookings";
import type {
  DrillType,
  DrillStatus,
  ScrambleData,
  MatchData,
  GapFillData,
  DrillContent,
  LessonDrill,
  DrillWithContext,
} from "@/lib/actions/types";

/**
 * Get all drills for a student
 * Only returns drills that are visible to the student (approved by tutor)
 */
export async function getStudentDrills(studentId: string): Promise<{
  pending: DrillWithContext[];
  completed: DrillWithContext[];
}> {
  const hasUpcomingLesson = await hasUpcomingLessonForStudent(studentId);
  if (!hasUpcomingLesson) {
    return { pending: [], completed: [] };
  }

  const supabase = await createClient();

  const { data: drills, error } = await supabase
    .from("lesson_drills")
    .select(`
      *,
      profiles:tutor_id (full_name),
      lesson_recordings:recording_id (created_at),
      homework_assignments:homework_assignment_id (title)
    `)
    .eq("student_id", studentId)
    .eq("visible_to_student", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch drills:", error);
    return { pending: [], completed: [] };
  }

  const mapped = (drills || []).map((d) => ({
    ...d,
    tutor_name: d.profiles?.full_name,
    lesson_date: d.lesson_recordings?.created_at,
    homework_title: d.homework_assignments?.title,
  }));

  const pending = mapped.filter((d) => !d.is_completed);
  const completed = mapped.filter((d) => d.is_completed);

  return { pending, completed };
}

/**
 * Get a single drill by ID
 * Only returns drill if visible to student (security check)
 */
export async function getDrillById(drillId: string): Promise<DrillWithContext | null> {
  const supabase = await createClient();

  const { data: drill, error } = await supabase
    .from("lesson_drills")
    .select(`
      *,
      profiles:tutor_id (full_name),
      lesson_recordings:recording_id (created_at)
    `)
    .eq("id", drillId)
    .eq("visible_to_student", true)
    .single();

  if (error || !drill) {
    console.error("Failed to fetch drill:", error);
    return null;
  }

  const hasUpcomingLesson = await hasUpcomingLessonForStudent(drill.student_id);
  if (!hasUpcomingLesson) {
    return null;
  }

  return {
    ...drill,
    tutor_name: drill.profiles?.full_name,
    lesson_date: drill.lesson_recordings?.created_at,
  };
}

/**
 * Mark a drill as completed
 * Only works for drills visible to the student
 */
export async function completeDrill(drillId: string, studentId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const hasUpcomingLesson = await hasUpcomingLessonForStudent(studentId);
  if (!hasUpcomingLesson) {
    return { success: false, error: "Practice is not available yet" };
  }

  const supabase = await createClient();

  // First verify the drill belongs to this student and is visible
  const { data: drill } = await supabase
    .from("lesson_drills")
    .select("id, student_id, is_completed, visible_to_student")
    .eq("id", drillId)
    .single();

  if (!drill) {
    return { success: false, error: "Drill not found" };
  }

  if (drill.student_id !== studentId) {
    return { success: false, error: "Unauthorized" };
  }

  if (!drill.visible_to_student) {
    return { success: false, error: "Drill not available" };
  }

  if (drill.is_completed) {
    return { success: true }; // Already completed
  }

  const { error } = await supabase
    .from("lesson_drills")
    .update({
      is_completed: true,
      completed_at: new Date().toISOString(),
      status: "completed",
    })
    .eq("id", drillId);

  if (error) {
    console.error("Failed to complete drill:", error);
    return { success: false, error: "Failed to save progress" };
  }

  return { success: true };
}

/**
 * Get drill count for a student (for badges/progress display)
 * Only counts drills visible to the student
 */
export async function getDrillCounts(studentId: string): Promise<{
  pending: number;
  completed: number;
  total: number;
}> {
  const hasUpcomingLesson = await hasUpcomingLessonForStudent(studentId);
  if (!hasUpcomingLesson) {
    return { pending: 0, completed: 0, total: 0 };
  }

  const supabase = await createClient();

  const { count: total } = await supabase
    .from("lesson_drills")
    .select("id", { count: "exact", head: true })
    .eq("student_id", studentId)
    .eq("visible_to_student", true);

  const { count: completed } = await supabase
    .from("lesson_drills")
    .select("id", { count: "exact", head: true })
    .eq("student_id", studentId)
    .eq("visible_to_student", true)
    .eq("is_completed", true);

  return {
    total: total ?? 0,
    completed: completed ?? 0,
    pending: (total ?? 0) - (completed ?? 0),
  };
}

/**
 * Get drills linked to a specific homework assignment
 * Only returns drills visible to student
 */
export async function getDrillsByHomework(homeworkId: string): Promise<LessonDrill[]> {
  const supabase = await createClient();

  const { data: drills, error } = await supabase
    .from("lesson_drills")
    .select("*")
    .eq("homework_assignment_id", homeworkId)
    .eq("visible_to_student", true)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Failed to fetch homework drills:", error);
    return [];
  }

  return drills || [];
}

async function hasUpcomingLessonForStudent(studentId: string): Promise<boolean> {
  const adminClient = createServiceRoleClient();
  if (!adminClient) return false;

  const { data: student } = await adminClient
    .from("students")
    .select("id, tutor_id")
    .eq("id", studentId)
    .maybeSingle();

  if (!student) return false;

  try {
    const nextBooking = await getNextBookingForStudent(adminClient, student.tutor_id, student.id);
    return !!nextBooking;
  } catch {
    return false;
  }
}
