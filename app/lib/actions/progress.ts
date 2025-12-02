"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";

export interface LearningGoal {
  id: string;
  student_id: string;
  tutor_id: string;
  title: string;
  description: string | null;
  target_date: string | null;
  status: "active" | "completed" | "paused" | "abandoned";
  progress_percentage: number;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProficiencyAssessment {
  id: string;
  student_id: string;
  tutor_id: string;
  skill_area: "speaking" | "listening" | "reading" | "writing" | "vocabulary" | "grammar" | "pronunciation" | "overall";
  level: "beginner" | "elementary" | "intermediate" | "upper_intermediate" | "advanced" | "proficient";
  score: number | null;
  notes: string | null;
  assessed_at: string;
}

export interface LearningStats {
  id: string;
  student_id: string;
  tutor_id: string;
  total_lessons: number;
  total_minutes: number;
  lessons_this_month: number;
  minutes_this_month: number;
  current_streak: number;
  longest_streak: number;
  last_lesson_at: string | null;
  messages_sent: number;
  homework_completed: number;
}

export interface LessonNote {
  id: string;
  booking_id: string;
  student_id: string;
  tutor_id: string;
  topics_covered: string[] | null;
  vocabulary_introduced: string[] | null;
  grammar_points: string[] | null;
  homework: string | null;
  strengths: string | null;
  areas_to_improve: string | null;
  student_visible_notes: string | null;
  created_at: string;
}

export type HomeworkStatus = "assigned" | "in_progress" | "submitted" | "completed" | "cancelled";

export interface HomeworkAttachment {
  label: string;
  url: string;
  type?: "pdf" | "image" | "link" | "video" | "file";
}

export interface HomeworkAssignment {
  id: string;
  tutor_id: string;
  student_id: string;
  booking_id: string | null;
  title: string;
  instructions: string | null;
  status: HomeworkStatus;
  due_date: string | null;
  attachments: HomeworkAttachment[];
  student_notes: string | null;
  tutor_notes: string | null;
  completed_at: string | null;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
}

export const HOMEWORK_STATUSES: HomeworkStatus[] = [
  "assigned",
  "in_progress",
  "submitted",
  "completed",
  "cancelled",
];

async function requireUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return { supabase, user: null as null };
  }

  return { supabase, user };
}

function normalizeAttachments(attachments?: HomeworkAttachment[] | null): HomeworkAttachment[] {
  if (!attachments || !Array.isArray(attachments)) return [];
  return attachments
    .filter((att) => att && typeof att === "object")
    .map((att) => ({
      label: att.label || "Resource",
      url: att.url,
      type: att.type ?? "link",
    }))
    .filter((att) => !!att.url);
}

/**
 * Get student progress data (for student portal)
 */
export async function getStudentProgress(tutorId?: string): Promise<{
  stats: LearningStats | null;
  goals: LearningGoal[];
  assessments: ProficiencyAssessment[];
  recentNotes: LessonNote[];
  homework: HomeworkAssignment[];
}> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { stats: null, goals: [], assessments: [], recentNotes: [], homework: [] };
  }

  const serviceClient = createServiceRoleClient();
  if (!serviceClient) {
    return { stats: null, goals: [], assessments: [], recentNotes: [], homework: [] };
  }

  // Get student ID for this user
  let studentQuery = serviceClient
    .from("students")
    .select("id")
    .eq("user_id", user.id);

  if (tutorId) {
    studentQuery = studentQuery.eq("tutor_id", tutorId);
  }

  const { data: students } = await studentQuery.limit(1);
  const studentId = students?.[0]?.id;

  if (!studentId) {
    return { stats: null, goals: [], assessments: [], recentNotes: [], homework: [] };
  }

  // Fetch all data in parallel
  const [statsResult, goalsResult, assessmentsResult, notesResult, homeworkResult] = await Promise.all([
    // Learning stats
    serviceClient
      .from("learning_stats")
      .select("*")
      .eq("student_id", studentId)
      .limit(1)
      .maybeSingle(),

    // Learning goals
    serviceClient
      .from("learning_goals")
      .select("*")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false }),

    // Latest assessments (most recent per skill)
    serviceClient
      .from("proficiency_assessments")
      .select("*")
      .eq("student_id", studentId)
      .order("assessed_at", { ascending: false })
      .limit(20),

    // Recent lesson notes (visible to student)
    serviceClient
      .from("lesson_notes")
      .select("id, booking_id, student_id, tutor_id, topics_covered, vocabulary_introduced, grammar_points, homework, strengths, areas_to_improve, student_visible_notes, created_at")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false })
      .limit(10),

    // Homework assignments (ordered by due date first, then newest)
    serviceClient
      .from("homework_assignments")
      .select("*")
      .eq("student_id", studentId)
      .order("due_date", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(25),
  ]);

  // Deduplicate assessments to get latest per skill
  const latestAssessments = Object.values(
    (assessmentsResult.data || []).reduce((acc, assessment) => {
      if (!acc[assessment.skill_area] || new Date(assessment.assessed_at) > new Date(acc[assessment.skill_area].assessed_at)) {
        acc[assessment.skill_area] = assessment;
      }
      return acc;
    }, {} as Record<string, ProficiencyAssessment>)
  );

  const homeworkAssignments = ((homeworkResult.data || []) as any[]).map((assignment) => ({
    ...(assignment as HomeworkAssignment),
    attachments: normalizeAttachments((assignment as any).attachments),
  })) as HomeworkAssignment[];

  return {
    stats: statsResult.data as LearningStats | null,
    goals: (goalsResult.data || []) as LearningGoal[],
    assessments: latestAssessments as ProficiencyAssessment[],
    recentNotes: (notesResult.data || []) as LessonNote[],
    homework: homeworkAssignments,
  };
}

/**
 * Get progress overview for a tutor's student
 */
export async function getTutorStudentProgress(studentId: string): Promise<{
  stats: LearningStats | null;
  goals: LearningGoal[];
  assessments: ProficiencyAssessment[];
  recentNotes: LessonNote[];
  homework: HomeworkAssignment[];
}> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { stats: null, goals: [], assessments: [], recentNotes: [], homework: [] };
  }

  const serviceClient = createServiceRoleClient();
  if (!serviceClient) {
    return { stats: null, goals: [], assessments: [], recentNotes: [], homework: [] };
  }

  // Verify tutor owns this student
  const { data: student } = await serviceClient
    .from("students")
    .select("id")
    .eq("id", studentId)
    .eq("tutor_id", user.id)
    .single();

  if (!student) {
    return { stats: null, goals: [], assessments: [], recentNotes: [], homework: [] };
  }

  // Fetch all data
  const [statsResult, goalsResult, assessmentsResult, notesResult, homeworkResult] = await Promise.all([
    serviceClient
      .from("learning_stats")
      .select("*")
      .eq("student_id", studentId)
      .eq("tutor_id", user.id)
      .maybeSingle(),

    serviceClient
      .from("learning_goals")
      .select("*")
      .eq("student_id", studentId)
      .eq("tutor_id", user.id)
      .order("created_at", { ascending: false }),

    serviceClient
      .from("proficiency_assessments")
      .select("*")
      .eq("student_id", studentId)
      .eq("tutor_id", user.id)
      .order("assessed_at", { ascending: false }),

    serviceClient
      .from("lesson_notes")
      .select("*")
      .eq("student_id", studentId)
      .eq("tutor_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10),

    serviceClient
      .from("homework_assignments")
      .select("*")
      .eq("student_id", studentId)
      .eq("tutor_id", user.id)
      .order("due_date", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(25),
  ]);

  const homeworkAssignments = ((homeworkResult.data || []) as any[]).map((assignment) => ({
    ...(assignment as HomeworkAssignment),
    attachments: normalizeAttachments((assignment as any).attachments),
  })) as HomeworkAssignment[];

  return {
    stats: statsResult.data as LearningStats | null,
    goals: (goalsResult.data || []) as LearningGoal[],
    assessments: (assessmentsResult.data || []) as ProficiencyAssessment[],
    recentNotes: (notesResult.data || []) as LessonNote[],
    homework: homeworkAssignments,
  };
}

/**
 * Create a new learning goal for a tutor's student
 */
export async function createLearningGoal(input: {
  studentId: string;
  title: string;
  description?: string | null;
  targetDate?: string | null;
  progressPercentage?: number;
  status?: LearningGoal["status"];
}) {
  const { supabase, user } = await requireUser();
  if (!user) {
    return { error: "You need to be signed in to add goals." };
  }

  if (!input.title.trim()) {
    return { error: "Goal title is required." };
  }

  const payload = {
    student_id: input.studentId,
    tutor_id: user.id,
    title: input.title.trim(),
    description: input.description ?? null,
    target_date: input.targetDate ?? null,
    progress_percentage: Math.min(Math.max(input.progressPercentage ?? 0, 0), 100),
    status: input.status ?? "active",
  };

  const { data, error } = await supabase
    .from("learning_goals")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    console.error("[createLearningGoal] error", error);
    return { error: "Unable to create goal right now." };
  }

  return { data: data as LearningGoal };
}

/**
 * Update goal progress or status
 */
export async function updateLearningGoalProgress(goalId: string, progress: number, status?: LearningGoal["status"]) {
  const { supabase, user } = await requireUser();
  if (!user) {
    return { error: "You need to be signed in to update goals." };
  }

  const updates: Partial<LearningGoal> & { progress_percentage: number } = {
    progress_percentage: Math.min(Math.max(progress, 0), 100),
  };

  if (status) {
    updates.status = status;
    if (status === "completed") {
      (updates as any).completed_at = new Date().toISOString();
    }
  }

  const { data, error } = await supabase
    .from("learning_goals")
    .update(updates as any)
    .eq("id", goalId)
    .eq("tutor_id", user.id)
    .select("*")
    .single();

  if (error) {
    console.error("[updateLearningGoalProgress] error", error);
    return { error: "Unable to update goal progress." };
  }

  return { data: data as LearningGoal };
}

/**
 * Record a new proficiency assessment
 */
export async function recordProficiencyAssessment(input: {
  studentId: string;
  skillArea: ProficiencyAssessment["skill_area"];
  level: ProficiencyAssessment["level"];
  score?: number | null;
  notes?: string | null;
  assessedAt?: string;
}) {
  const { supabase, user } = await requireUser();
  if (!user) {
    return { error: "You need to be signed in to record assessments." };
  }

  const payload = {
    student_id: input.studentId,
    tutor_id: user.id,
    skill_area: input.skillArea,
    level: input.level,
    score: input.score ?? null,
    notes: input.notes ?? null,
    assessed_at: input.assessedAt ?? new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("proficiency_assessments")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    console.error("[recordProficiencyAssessment] error", error);
    return { error: "Unable to save assessment." };
  }

  return { data: data as ProficiencyAssessment };
}

/**
 * Assign homework to a student (tutor-facing)
 */
export async function assignHomework(input: {
  studentId: string;
  title: string;
  instructions?: string | null;
  dueDate?: string | null;
  bookingId?: string | null;
  attachments?: HomeworkAttachment[];
  status?: HomeworkStatus;
}) {
  const { supabase, user } = await requireUser();
  if (!user) {
    return { error: "You need to be signed in to assign homework." };
  }

  const status = input.status ?? "assigned";
  if (!HOMEWORK_STATUSES.includes(status)) {
    return { error: "Invalid homework status." };
  }

  if (!input.title.trim()) {
    return { error: "Homework title is required." };
  }

  const payload = {
    student_id: input.studentId,
    tutor_id: user.id,
    booking_id: input.bookingId ?? null,
    title: input.title.trim(),
    instructions: input.instructions ?? null,
    due_date: input.dueDate ?? null,
    status,
    attachments: normalizeAttachments(input.attachments),
  };

  const { data, error } = await supabase
    .from("homework_assignments")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    console.error("[assignHomework] error", error);
    return { error: "Unable to assign homework right now." };
  }

  return { data: { ...(data as HomeworkAssignment), attachments: normalizeAttachments((data as any).attachments) } };
}

/**
 * Update homework status (tutor-facing)
 */
export async function updateHomeworkStatus(input: {
  assignmentId: string;
  status: HomeworkStatus;
  studentNotes?: string | null;
}) {
  const { supabase, user } = await requireUser();
  if (!user) {
    return { error: "You need to be signed in to update homework." };
  }

  if (!HOMEWORK_STATUSES.includes(input.status)) {
    return { error: "Invalid homework status." };
  }

  const updates: Record<string, any> = {
    status: input.status,
    student_notes: input.studentNotes ?? null,
  };

  if (input.status === "completed") {
    updates.completed_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("homework_assignments")
    .update(updates)
    .eq("id", input.assignmentId)
    .eq("tutor_id", user.id)
    .select("*")
    .single();

  if (error) {
    console.error("[updateHomeworkStatus] error", error);
    return { error: "Unable to update homework status." };
  }

  return { data: { ...(data as HomeworkAssignment), attachments: normalizeAttachments((data as any).attachments) } };
}

/**
 * Allow students to mark homework as completed (service role validates ownership)
 */
export async function markHomeworkCompleted(assignmentId: string, studentNotes?: string | null) {
  const { supabase, user } = await requireUser();
  if (!user) {
    return { error: "You need to be signed in to update homework." };
  }

  const adminClient = createServiceRoleClient();
  if (!adminClient) {
    return { error: "Service role client is not configured." };
  }

  // Ensure the assignment exists and belongs to this student account
  const { data: assignment } = await adminClient
    .from("homework_assignments")
    .select("id, student_id")
    .eq("id", assignmentId)
    .maybeSingle();

  if (!assignment) {
    return { error: "Assignment not found." };
  }

  const { data: student } = await adminClient
    .from("students")
    .select("id")
    .eq("id", assignment.student_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!student) {
    return { error: "You do not have access to this assignment." };
  }

  const { data, error } = await adminClient
    .from("homework_assignments")
    .update({
      status: "completed",
      student_notes: studentNotes ?? null,
      completed_at: new Date().toISOString(),
    })
    .eq("id", assignmentId)
    .select("*")
    .single();

  if (error) {
    console.error("[markHomeworkCompleted] error", error);
    return { error: "Unable to mark homework as completed." };
  }

  return { data: { ...(data as HomeworkAssignment), attachments: normalizeAttachments((data as any).attachments) } };
}
