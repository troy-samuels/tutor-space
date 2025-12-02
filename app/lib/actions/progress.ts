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

/**
 * Get student progress data (for student portal)
 */
export async function getStudentProgress(tutorId?: string): Promise<{
  stats: LearningStats | null;
  goals: LearningGoal[];
  assessments: ProficiencyAssessment[];
  recentNotes: LessonNote[];
}> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { stats: null, goals: [], assessments: [], recentNotes: [] };
  }

  const serviceClient = createServiceRoleClient();
  if (!serviceClient) {
    return { stats: null, goals: [], assessments: [], recentNotes: [] };
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
    return { stats: null, goals: [], assessments: [], recentNotes: [] };
  }

  // Fetch all data in parallel
  const [statsResult, goalsResult, assessmentsResult, notesResult] = await Promise.all([
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

  return {
    stats: statsResult.data as LearningStats | null,
    goals: (goalsResult.data || []) as LearningGoal[],
    assessments: latestAssessments,
    recentNotes: (notesResult.data || []) as LessonNote[],
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
}> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { stats: null, goals: [], assessments: [], recentNotes: [] };
  }

  const serviceClient = createServiceRoleClient();
  if (!serviceClient) {
    return { stats: null, goals: [], assessments: [], recentNotes: [] };
  }

  // Verify tutor owns this student
  const { data: student } = await serviceClient
    .from("students")
    .select("id")
    .eq("id", studentId)
    .eq("tutor_id", user.id)
    .single();

  if (!student) {
    return { stats: null, goals: [], assessments: [], recentNotes: [] };
  }

  // Fetch all data
  const [statsResult, goalsResult, assessmentsResult, notesResult] = await Promise.all([
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
  ]);

  return {
    stats: statsResult.data as LearningStats | null,
    goals: (goalsResult.data || []) as LearningGoal[],
    assessments: (assessmentsResult.data || []) as ProficiencyAssessment[],
    recentNotes: (notesResult.data || []) as LessonNote[],
  };
}

// Skill level to numeric score
export const LEVEL_SCORES: Record<string, number> = {
  beginner: 1,
  elementary: 2,
  intermediate: 3,
  upper_intermediate: 4,
  advanced: 5,
  proficient: 6,
};

export const LEVEL_LABELS: Record<string, string> = {
  beginner: "Beginner (A1)",
  elementary: "Elementary (A2)",
  intermediate: "Intermediate (B1)",
  upper_intermediate: "Upper Intermediate (B2)",
  advanced: "Advanced (C1)",
  proficient: "Proficient (C2)",
};

export const SKILL_LABELS: Record<string, string> = {
  speaking: "Speaking",
  listening: "Listening",
  reading: "Reading",
  writing: "Writing",
  vocabulary: "Vocabulary",
  grammar: "Grammar",
  pronunciation: "Pronunciation",
  overall: "Overall",
};
