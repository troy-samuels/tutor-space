"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import {
  AI_PRACTICE_BASE_PRICE_CENTS,
  BASE_AUDIO_SECONDS,
  BASE_TEXT_TURNS,
  BLOCK_AUDIO_SECONDS,
  BLOCK_TEXT_TURNS,
} from "@/lib/practice/constants";

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

export interface PracticeAssignmentRef {
  id: string;
  status: "assigned" | "in_progress" | "completed";
  sessions_completed: number;
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
  // Homework-practice integration fields
  topic: string | null;
  practice_assignment_id: string | null;
  // Joined practice assignment data (if linked)
  practice_assignment?: PracticeAssignmentRef | null;
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

  const emptyResponse = { stats: null, goals: [], assessments: [], recentNotes: [], homework: [] };

  // Get student (and owning tutor) for this user
  let studentQuery = serviceClient
    .from("students")
    .select("id, tutor_id")
    .eq("user_id", user.id);

  if (tutorId) {
    studentQuery = studentQuery.eq("tutor_id", tutorId);
  }

  const { data: student } = await studentQuery.limit(1).maybeSingle();
  const studentId = student?.id;
  const scopedTutorId = student?.tutor_id;

  if (!studentId || !scopedTutorId) {
    return emptyResponse;
  }

  // Fetch all data in parallel
  const [statsResult, goalsResult, assessmentsResult, notesResult, homeworkResult] = await Promise.all([
    // Learning stats
    serviceClient
      .from("learning_stats")
      .select("*")
      .eq("student_id", studentId)
      .eq("tutor_id", scopedTutorId)
      .limit(1)
      .maybeSingle(),

    // Learning goals
    serviceClient
      .from("learning_goals")
      .select("*")
      .eq("student_id", studentId)
      .eq("tutor_id", scopedTutorId)
      .order("created_at", { ascending: false }),

    // Latest assessments (most recent per skill)
    serviceClient
      .from("proficiency_assessments")
      .select("*")
      .eq("student_id", studentId)
      .eq("tutor_id", scopedTutorId)
      .order("assessed_at", { ascending: false })
      .limit(20),

    // Recent lesson notes (visible to student)
    serviceClient
      .from("lesson_notes")
      .select("id, booking_id, student_id, tutor_id, topics_covered, vocabulary_introduced, grammar_points, homework, strengths, areas_to_improve, student_visible_notes, created_at")
      .eq("student_id", studentId)
      .eq("tutor_id", scopedTutorId)
      .order("created_at", { ascending: false })
      .limit(10),

    // Homework assignments (ordered by due date first, then newest)
    // Join with practice_assignments to get practice status
    serviceClient
      .from("homework_assignments")
      .select(`
        *,
        practice_assignment:practice_assignments!homework_assignments_practice_assignment_id_fkey (
          id,
          status,
          sessions_completed
        )
      `)
      .eq("student_id", studentId)
      .eq("tutor_id", scopedTutorId)
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

  const homeworkAssignments = ((homeworkResult.data || []) as any[]).map((assignment) => {
    // Normalize the joined practice_assignment (could be array or object depending on Supabase)
    const practiceRaw = assignment.practice_assignment;
    const practiceAssignment = Array.isArray(practiceRaw) ? practiceRaw[0] || null : practiceRaw || null;

    return {
      ...(assignment as HomeworkAssignment),
      attachments: normalizeAttachments((assignment as any).attachments),
      practice_assignment: practiceAssignment,
    };
  }) as HomeworkAssignment[];

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
      .select(`
        *,
        practice_assignment:practice_assignments!homework_assignments_practice_assignment_id_fkey (
          id,
          status,
          sessions_completed
        )
      `)
      .eq("student_id", studentId)
      .eq("tutor_id", user.id)
      .order("due_date", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(25),
  ]);

  const homeworkAssignments = ((homeworkResult.data || []) as any[]).map((assignment) => {
    // Normalize the joined practice_assignment (could be array or object depending on Supabase)
    const practiceRaw = assignment.practice_assignment;
    const practiceAssignment = Array.isArray(practiceRaw) ? practiceRaw[0] || null : practiceRaw || null;

    return {
      ...(assignment as HomeworkAssignment),
      attachments: normalizeAttachments((assignment as any).attachments),
      practice_assignment: practiceAssignment,
    };
  }) as HomeworkAssignment[];

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

// ============================================
// AI Practice Companion Types & Functions
// ============================================

export interface PracticeAssignment {
  id: string;
  title: string;
  instructions: string | null;
  status: "assigned" | "in_progress" | "completed";
  due_date: string | null;
  sessions_completed: number;
  scenario?: {
    id: string;
    title: string;
    language: string;
    level: string | null;
    topic: string | null;
  } | null;
  created_at: string;
}

export interface PracticeStats {
  sessions_completed: number;
  practice_minutes: number;
  messages_sent: number;
}

export interface PracticeUsage {
  audioSecondsUsed: number;
  audioSecondsAllowance: number;
  textTurnsUsed: number;
  textTurnsAllowance: number;
  blocksConsumed: number;
  currentTierPriceCents: number;
  periodEnd: string | null;
  percentAudioUsed: number;
  percentTextUsed: number;
}

export interface StudentPracticeData {
  isSubscribed: boolean;
  assignments: PracticeAssignment[];
  stats: PracticeStats | null;
  studentId: string | null;
  usage: PracticeUsage | null;
}

/**
 * Get AI Practice data for tutor's student (tutor CRM view)
 */
export async function getTutorStudentPracticeData(studentId: string): Promise<{
  isSubscribed: boolean;
  assignments: PracticeAssignment[];
  scenarios: Array<{
    id: string;
    title: string;
    language: string;
    level: string | null;
    topic: string | null;
  }>;
  pendingHomework: PendingHomeworkForPractice[];
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const emptyResponse = {
    isSubscribed: false,
    assignments: [],
    scenarios: [],
    pendingHomework: [],
  };

  if (!user) {
    return emptyResponse;
  }

  // Verify tutor owns this student
  const { data: student } = await supabase
    .from("students")
    .select("id, ai_practice_enabled, ai_practice_current_period_end")
    .eq("id", studentId)
    .eq("tutor_id", user.id)
    .single();

  if (!student) {
    return emptyResponse;
  }

  // Check subscription status
  const isSubscribed = student.ai_practice_enabled === true &&
    (!student.ai_practice_current_period_end ||
      new Date(student.ai_practice_current_period_end) > new Date());

  // Fetch assignments
  const { data: assignments } = await supabase
    .from("practice_assignments")
    .select(`
      id,
      title,
      instructions,
      status,
      due_date,
      sessions_completed,
      created_at,
      scenario:practice_scenarios (
        id,
        title,
        language,
        level,
        topic
      )
    `)
    .eq("student_id", studentId)
    .eq("tutor_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  // Fetch tutor's scenarios for the dropdown
  const { data: scenarios } = await supabase
    .from("practice_scenarios")
    .select("id, title, language, level, topic")
    .eq("tutor_id", user.id)
    .eq("is_active", true)
    .order("title", { ascending: true });

  // Fetch pending homework that can be linked to practice
  const { data: pendingHomework } = await supabase
    .from("homework_assignments")
    .select("id, title, topic, due_date, status, practice_assignment_id")
    .eq("student_id", studentId)
    .eq("tutor_id", user.id)
    .in("status", ["assigned", "in_progress"])
    .is("practice_assignment_id", null)
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(20);

  return {
    isSubscribed,
    assignments: (assignments || []).map((a: any) => ({
      id: a.id,
      title: a.title,
      instructions: a.instructions,
      status: a.status,
      due_date: a.due_date,
      sessions_completed: a.sessions_completed || 0,
      scenario: a.scenario ? {
        id: a.scenario.id,
        title: a.scenario.title,
        language: a.scenario.language,
        level: a.scenario.level,
        topic: a.scenario.topic,
      } : null,
      created_at: a.created_at,
    })),
    scenarios: (scenarios || []).map((s: any) => ({
      id: s.id,
      title: s.title,
      language: s.language,
      level: s.level,
      topic: s.topic,
    })),
    pendingHomework: (pendingHomework || []).map((hw: any) => ({
      id: hw.id,
      title: hw.title,
      topic: hw.topic,
      due_date: hw.due_date,
      status: hw.status,
      practice_assignment_id: hw.practice_assignment_id,
    })),
  };
}

/**
 * Get AI Practice data for student portal
 */
export async function getStudentPracticeData(tutorId?: string): Promise<StudentPracticeData> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const emptyResponse: StudentPracticeData = {
    isSubscribed: false,
    assignments: [],
    stats: null,
    studentId: null,
    usage: null,
  };

  if (!user) {
    return emptyResponse;
  }

  const serviceClient = createServiceRoleClient();
  if (!serviceClient) {
    return emptyResponse;
  }

  // Get student record for this user
  let studentQuery = serviceClient
    .from("students")
    .select("id, tutor_id, ai_practice_enabled, ai_practice_current_period_end, ai_practice_subscription_id")
    .eq("user_id", user.id);

  if (tutorId) {
    studentQuery = studentQuery.eq("tutor_id", tutorId);
  }

  const { data: student } = await studentQuery.limit(1).maybeSingle();

  if (!student) {
    return emptyResponse;
  }

  // Check if subscription is active
  const isSubscribed = student.ai_practice_enabled === true &&
    (!student.ai_practice_current_period_end ||
      new Date(student.ai_practice_current_period_end) > new Date());

  // Fetch assignments with scenarios
  const { data: assignments } = await serviceClient
    .from("practice_assignments")
    .select(`
      id,
      title,
      instructions,
      status,
      due_date,
      sessions_completed,
      created_at,
      scenario:practice_scenarios (
        id,
        title,
        language,
        level,
        topic
      )
    `)
    .eq("student_id", student.id)
    .order("created_at", { ascending: false })
    .limit(20);

  // Get practice stats from learning_stats
  const { data: learningStats } = await serviceClient
    .from("learning_stats")
    .select("practice_sessions_completed, practice_minutes, practice_messages_sent")
    .eq("student_id", student.id)
    .eq("tutor_id", student.tutor_id)
    .maybeSingle();

  const stats: PracticeStats | null = learningStats ? {
    sessions_completed: learningStats.practice_sessions_completed || 0,
    practice_minutes: learningStats.practice_minutes || 0,
    messages_sent: learningStats.practice_messages_sent || 0,
  } : null;

  // Get current usage period for billing
  let usage: PracticeUsage | null = null;

  if (isSubscribed && student.ai_practice_subscription_id) {
    const { data: usagePeriod } = await serviceClient
      .from("practice_usage_periods")
      .select("*")
      .eq("student_id", student.id)
      .eq("subscription_id", student.ai_practice_subscription_id)
      .gte("period_end", new Date().toISOString())
      .lte("period_start", new Date().toISOString())
      .maybeSingle();

    if (usagePeriod) {
      const audioAllowance = BASE_AUDIO_SECONDS + (usagePeriod.blocks_consumed * BLOCK_AUDIO_SECONDS);
      const textAllowance = BASE_TEXT_TURNS + (usagePeriod.blocks_consumed * BLOCK_TEXT_TURNS);

      usage = {
        audioSecondsUsed: usagePeriod.audio_seconds_used,
        audioSecondsAllowance: audioAllowance,
        textTurnsUsed: usagePeriod.text_turns_used,
        textTurnsAllowance: textAllowance,
        blocksConsumed: usagePeriod.blocks_consumed,
        currentTierPriceCents: usagePeriod.current_tier_price_cents,
        periodEnd: usagePeriod.period_end,
        percentAudioUsed: Math.round((usagePeriod.audio_seconds_used / audioAllowance) * 100),
        percentTextUsed: Math.round((usagePeriod.text_turns_used / textAllowance) * 100),
      };
    } else {
      // Default usage (new subscriber with no usage yet)
      usage = {
        audioSecondsUsed: 0,
        audioSecondsAllowance: BASE_AUDIO_SECONDS,
        textTurnsUsed: 0,
        textTurnsAllowance: BASE_TEXT_TURNS,
        blocksConsumed: 0,
        currentTierPriceCents: AI_PRACTICE_BASE_PRICE_CENTS,
        periodEnd: student.ai_practice_current_period_end,
        percentAudioUsed: 0,
        percentTextUsed: 0,
      };
    }
  }

  return {
    isSubscribed,
    assignments: (assignments || []).map((a: any) => ({
      id: a.id,
      title: a.title,
      instructions: a.instructions,
      status: a.status,
      due_date: a.due_date,
      sessions_completed: a.sessions_completed || 0,
      scenario: a.scenario ? {
        id: a.scenario.id,
        title: a.scenario.title,
        language: a.scenario.language,
        level: a.scenario.level,
        topic: a.scenario.topic,
      } : null,
      created_at: a.created_at,
    })),
    stats,
    studentId: student.id,
    usage,
  };
}

// Types for practice analytics
export interface GrammarIssue {
  category_slug: string;
  label: string;
  count: number;
  trend: "improving" | "stable" | "declining" | null;
}

export interface WeeklyActivity {
  week: string;
  sessions: number;
  minutes: number;
  errors: number;
}

export interface PracticeSummary {
  total_sessions: number;
  completed_sessions: number;
  total_messages_sent: number;
  total_practice_minutes: number;
  total_grammar_errors: number;
  total_phonetic_errors: number;
  top_grammar_issues: GrammarIssue[];
  avg_session_rating: number | null;
  last_practice_at: string | null;
  weekly_activity: WeeklyActivity[];
}

/**
 * Get practice analytics summary for a student (tutor-facing)
 */
export async function getStudentPracticeAnalytics(
  studentId: string
): Promise<{ isSubscribed: boolean; summary: PracticeSummary | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { isSubscribed: false, summary: null };
  }

  const serviceClient = createServiceRoleClient();
  if (!serviceClient) {
    return { isSubscribed: false, summary: null };
  }

  // Verify tutor owns this student
  const { data: student } = await serviceClient
    .from("students")
    .select("id, ai_practice_enabled, tutor_id")
    .eq("id", studentId)
    .eq("tutor_id", user.id)
    .single();

  if (!student) {
    return { isSubscribed: false, summary: null };
  }

  // Fetch cached summary if available
  const { data: summary } = await serviceClient
    .from("student_practice_summaries")
    .select("*")
    .eq("student_id", studentId)
    .eq("tutor_id", user.id)
    .single();

  if (summary) {
    return {
      isSubscribed: student.ai_practice_enabled || false,
      summary: {
        total_sessions: summary.total_sessions || 0,
        completed_sessions: summary.completed_sessions || 0,
        total_messages_sent: summary.total_messages_sent || 0,
        total_practice_minutes: summary.total_practice_minutes || 0,
        total_grammar_errors: summary.total_grammar_errors || 0,
        total_phonetic_errors: summary.total_phonetic_errors || 0,
        top_grammar_issues: summary.top_grammar_issues || [],
        avg_session_rating: summary.avg_session_rating,
        last_practice_at: summary.last_practice_at,
        weekly_activity: summary.weekly_activity || [],
      },
    };
  }

  // If no cached summary, compute basic stats
  const { data: sessions } = await serviceClient
    .from("student_practice_sessions")
    .select("id, ended_at, duration_seconds, message_count, ai_feedback, grammar_errors_count, started_at")
    .eq("student_id", studentId)
    .eq("tutor_id", user.id);

  if (!sessions || sessions.length === 0) {
    return { isSubscribed: student.ai_practice_enabled || false, summary: null };
  }

  const totalSessions = sessions.length;
  const completedSessions = sessions.filter((s) => s.ended_at).length;
  const totalMinutes = sessions.reduce(
    (sum, s) => sum + (s.duration_seconds || 0) / 60,
    0
  );
  const totalMessages = sessions.reduce(
    (sum, s) => sum + (s.message_count || 0),
    0
  );
  const totalErrors = sessions.reduce(
    (sum, s) => sum + (s.grammar_errors_count || 0),
    0
  );

  // Calculate average rating
  const ratings = sessions
    .filter((s) => s.ai_feedback && typeof s.ai_feedback === "object" && "overall_rating" in (s.ai_feedback as object))
    .map((s) => (s.ai_feedback as { overall_rating: number }).overall_rating);
  const avgRating =
    ratings.length > 0
      ? ratings.reduce((a, b) => a + b, 0) / ratings.length
      : null;

  const lastSession = sessions.sort(
    (a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
  )[0];

  return {
    isSubscribed: student.ai_practice_enabled || false,
    summary: {
      total_sessions: totalSessions,
      completed_sessions: completedSessions,
      total_messages_sent: totalMessages,
      total_practice_minutes: Math.round(totalMinutes),
      total_grammar_errors: totalErrors,
      total_phonetic_errors: 0,
      top_grammar_issues: [],
      avg_session_rating: avgRating,
      last_practice_at: lastSession?.started_at || null,
      weekly_activity: [],
    },
  };
}

// ============================================
// Homework-Practice Integration
// ============================================

export interface PendingHomeworkForPractice {
  id: string;
  title: string;
  topic: string | null;
  due_date: string | null;
  status: HomeworkStatus;
  practice_assignment_id: string | null;
}

/**
 * Get pending homework for a student that can be linked to practice
 * Only returns homework that doesn't already have a practice assignment linked
 */
export async function getPendingHomeworkForPractice(
  studentId: string
): Promise<PendingHomeworkForPractice[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  // Fetch homework that is pending or in progress and not yet linked to practice
  const { data: homework, error } = await supabase
    .from("homework_assignments")
    .select("id, title, topic, due_date, status, practice_assignment_id")
    .eq("student_id", studentId)
    .eq("tutor_id", user.id)
    .in("status", ["assigned", "in_progress"])
    .is("practice_assignment_id", null)
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("[getPendingHomeworkForPractice] error", error);
    return [];
  }

  return (homework || []).map((hw: any) => ({
    id: hw.id,
    title: hw.title,
    topic: hw.topic,
    due_date: hw.due_date,
    status: hw.status,
    practice_assignment_id: hw.practice_assignment_id,
  }));
}
