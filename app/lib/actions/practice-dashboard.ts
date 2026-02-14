"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { getStudentStreak } from "@/lib/practice/streaks";

// ---------------------------------------------------------------------------
// Student Practice Dashboard Data
// ---------------------------------------------------------------------------

export type PracticeDashboardData = {
  streak: number;
  dailyComplete: boolean;
  lastLanguage: string | null;
};

/**
 * Fetches practice dashboard data for the currently authenticated student.
 * Used by QuickPracticeCard on the student home page.
 */
export async function getStudentPracticeDashboard(): Promise<PracticeDashboardData | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Get student record
  const { data: student } = await supabase
    .from("students")
    .select("id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!student) return null;

  // Fetch streak data and last practice language in parallel
  const adminClient = createServiceRoleClient();
  if (!adminClient) {
    return { streak: 0, dailyComplete: false, lastLanguage: null };
  }

  const [streakData, lastSession] = await Promise.all([
    getStudentStreak(student.id, adminClient),
    adminClient
      .from("student_practice_sessions")
      .select("language")
      .eq("student_id", student.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then((r) => r.data),
  ]);

  return {
    streak: streakData.current,
    dailyComplete: streakData.todayComplete,
    lastLanguage: lastSession?.language ?? null,
  };
}

// ---------------------------------------------------------------------------
// Tutor Student Activity Feed Data
// ---------------------------------------------------------------------------

export type StudentActivityItem = {
  id: string;
  studentName: string;
  studentInitials: string;
  type: "practice_complete" | "streak_milestone" | "assignment_complete";
  language: string;
  score?: number;
  streak?: number;
  timeAgo: string;
};

/**
 * Fetches recent student practice activity for the tutor dashboard.
 */
export async function getTutorStudentActivity(): Promise<StudentActivityItem[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const adminClient = createServiceRoleClient();
  if (!adminClient) return [];

  // Get this tutor's students
  const { data: students } = await adminClient
    .from("students")
    .select("id, full_name, user_id")
    .eq("tutor_id", user.id)
    .limit(50);

  if (!students || students.length === 0) return [];

  const studentIds = students.map((s) => s.id);
  const studentMap = new Map(students.map((s) => [s.id, s]));

  // Get recent practice sessions from these students
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: sessions } = await adminClient
    .from("student_practice_sessions")
    .select("id, student_id, language, score, created_at, ended_at")
    .in("student_id", studentIds)
    .gte("created_at", sevenDaysAgo.toISOString())
    .not("ended_at", "is", null)
    .order("created_at", { ascending: false })
    .limit(10);

  if (!sessions || sessions.length === 0) return [];

  const now = Date.now();
  const activities: StudentActivityItem[] = [];

  for (const session of sessions) {
    const student = studentMap.get(session.student_id);
    if (!student) continue;

    const name = student.full_name || "Student";
    const initials = name
      .split(" ")
      .map((w: string) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    const elapsed = now - new Date(session.created_at).getTime();
    const timeAgo = formatTimeAgo(elapsed);

    activities.push({
      id: session.id,
      studentName: name,
      studentInitials: initials,
      type: "practice_complete",
      language: session.language || "Spanish",
      score: session.score ?? undefined,
      timeAgo,
    });
  }

  return activities;
}

function formatTimeAgo(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  return `${days}d ago`;
}
