/**
 * Briefing Generator Service
 *
 * Generates pre-lesson briefings for tutors by aggregating data from:
 * - lesson_recordings (past lesson analysis, errors, engagement)
 * - student_language_profiles (L1 patterns, proficiency)
 * - spaced_repetition_items (items due for review)
 * - learning_goals (goals and progress)
 * - bookings (lesson history, student info)
 */

import { createServiceRoleClient } from "@/lib/supabase/admin";
import { suggestActivities } from "./activity-suggester";

// =============================================================================
// TYPES
// =============================================================================

export interface FocusArea {
  type: "grammar" | "vocabulary" | "pronunciation" | "conversation" | "l1_interference";
  topic: string;
  reason: string;
  evidence: string;
  count?: number;
}

export interface ErrorPattern {
  type: string;
  count: number;
  examples: string[];
  severity: "minor" | "moderate" | "major";
  isL1Interference?: boolean;
}

export interface SRItemPreview {
  word: string;
  type: "vocabulary" | "grammar" | "pronunciation";
  lastReviewed: string | null;
  repetitionCount: number;
}

export interface GoalProgress {
  goalText: string;
  progressPct: number;
  targetDate: string | null;
  status: string;
}

export interface EngagementSignal {
  type: string;
  value: number | string;
  concern: boolean;
  description: string;
}

export interface SuggestedActivity {
  title: string;
  description: string;
  durationMin: number;
  category: "warmup" | "practice" | "conversation" | "review" | "game";
  targetArea?: string;
}

export interface BriefingData {
  tutorId: string;
  studentId: string;
  bookingId: string;
  studentSummary: string;
  focusAreas: FocusArea[];
  errorPatterns: ErrorPattern[];
  suggestedActivities: SuggestedActivity[];
  srItemsDue: number;
  srItemsPreview: SRItemPreview[];
  goalProgress: GoalProgress | null;
  engagementTrend: "improving" | "stable" | "declining" | "new_student";
  engagementSignals: EngagementSignal[];
  lessonsAnalyzed: number;
  lastLessonSummary: string | null;
  lastLessonDate: string | null;
  proficiencyLevel: string | null;
  nativeLanguage: string | null;
  targetLanguage: string | null;
}

interface RecentLessonData {
  id: string;
  created_at: string;
  student_speech_analysis: StudentSpeechAnalysis | null;
  interaction_metrics: InteractionMetrics | null;
  ai_summary: string | null;
  engagement_score: number | null;
  l1_interference_detected: L1Pattern[] | null;
}

interface StudentSpeechAnalysis {
  errors?: Array<{
    type: string;
    category?: string;
    original: string;
    correction: string;
    severity?: string;
    isL1Interference?: boolean;
  }>;
  fluencyMetrics?: {
    wordsPerMinute?: number;
    fillerCount?: number;
    pauseCount?: number;
  };
  strengths?: Array<{
    type: string;
    example: string;
  }>;
}

interface InteractionMetrics {
  engagementScore?: number;
  speakingRatio?: number;
  turnCount?: number;
  avgStudentLatencyMs?: number;
}

interface L1Pattern {
  pattern: string;
  count: number;
  severity?: string;
}

// =============================================================================
// MAIN GENERATOR
// =============================================================================

/**
 * Generate a pre-lesson briefing for a booking
 */
export async function generateBriefing(bookingId: string): Promise<BriefingData | null> {
  const supabase = createServiceRoleClient();
  if (!supabase) {
    console.error("[BriefingGenerator] No Supabase client available");
    return null;
  }

  // Fetch booking with student info
  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select(`
      id,
      tutor_id,
      student_id,
      scheduled_at,
      service_id,
      students (
        id,
        full_name,
        email,
        native_language,
        proficiency_level,
        learning_goals,
        tutor_notes
      ),
      services (
        name,
        duration_minutes
      )
    `)
    .eq("id", bookingId)
    .single();

  if (bookingError || !booking) {
    console.error("[BriefingGenerator] Booking not found:", bookingError);
    return null;
  }

  const tutorId = booking.tutor_id;
  const studentId = booking.student_id;
  // Handle Supabase join result which may be array or object
  const studentsData = booking.students;
  const student = (Array.isArray(studentsData) ? studentsData[0] : studentsData) as {
    id: string;
    full_name: string;
    email: string;
    native_language: string | null;
    proficiency_level: string | null;
    learning_goals: string | null;
    tutor_notes: string | null;
  } | null;

  if (!student) {
    console.error("[BriefingGenerator] Student not found for booking");
    return null;
  }

  // Parallel data fetching
  const [
    recentLessons,
    languageProfile,
    srItems,
    goals,
    lessonCount,
  ] = await Promise.all([
    analyzeRecentLessons(studentId, tutorId, supabase),
    getLanguageProfile(studentId, supabase),
    getSRItemsDue(studentId, tutorId, supabase),
    getLearningGoals(studentId, tutorId, supabase),
    getLessonCount(studentId, tutorId, supabase),
  ]);

  // Determine engagement trend
  const { trend, signals } = calculateEngagementTrend(recentLessons, lessonCount);

  // Aggregate error patterns
  const errorPatterns = aggregateErrorPatterns(recentLessons);

  // Build focus areas from errors and L1 patterns
  const focusAreas = buildFocusAreas(errorPatterns, languageProfile);

  // Generate suggested activities (AI-powered)
  const suggestedActivities = await suggestActivities({
    proficiencyLevel: student.proficiency_level || languageProfile?.proficiencyLevel || "intermediate",
    errorPatterns,
    focusAreas,
    nativeLanguage: student.native_language || languageProfile?.nativeLanguage || null,
    targetLanguage: languageProfile?.targetLanguage || "en",
    lessonDuration: (() => {
      const servicesData = booking.services;
      const service = Array.isArray(servicesData) ? servicesData[0] : servicesData;
      return (service as { duration_minutes: number } | null)?.duration_minutes || 60;
    })(),
  });

  // Build student summary
  const studentSummary = buildStudentSummary(student, languageProfile, lessonCount, goals);

  // Get last lesson summary
  const lastLesson = recentLessons[0] || null;

  return {
    tutorId,
    studentId,
    bookingId,
    studentSummary,
    focusAreas,
    errorPatterns,
    suggestedActivities,
    srItemsDue: srItems.count,
    srItemsPreview: srItems.preview,
    goalProgress: goals[0] || null,
    engagementTrend: trend,
    engagementSignals: signals,
    lessonsAnalyzed: recentLessons.length,
    lastLessonSummary: lastLesson?.ai_summary || null,
    lastLessonDate: lastLesson?.created_at || null,
    proficiencyLevel: student.proficiency_level || languageProfile?.proficiencyLevel || null,
    nativeLanguage: student.native_language || languageProfile?.nativeLanguage || null,
    targetLanguage: languageProfile?.targetLanguage || null,
  };
}

// =============================================================================
// DATA FETCHERS
// =============================================================================

/**
 * Analyze recent lessons for error patterns and engagement
 */
async function analyzeRecentLessons(
  studentId: string,
  tutorId: string,
  supabase: ReturnType<typeof createServiceRoleClient>,
  limit = 5
): Promise<RecentLessonData[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("lesson_recordings")
    .select(`
      id,
      created_at,
      student_speech_analysis,
      interaction_metrics,
      ai_summary,
      engagement_score,
      l1_interference_detected
    `)
    .eq("student_id", studentId)
    .eq("tutor_id", tutorId)
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[BriefingGenerator] Error fetching recent lessons:", error);
    return [];
  }

  return (data || []) as RecentLessonData[];
}

/**
 * Get student language profile
 */
async function getLanguageProfile(
  studentId: string,
  supabase: ReturnType<typeof createServiceRoleClient>
): Promise<{
  targetLanguage: string;
  nativeLanguage: string | null;
  proficiencyLevel: string;
  l1InterferencePatterns: Array<{ pattern: string; frequency: number; improving: boolean }>;
} | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("student_language_profiles")
    .select("*")
    .eq("student_id", studentId)
    .order("lessons_analyzed", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    targetLanguage: data.target_language || "en",
    nativeLanguage: data.native_language || null,
    proficiencyLevel: data.proficiency_level || "intermediate",
    l1InterferencePatterns: Array.isArray(data.l1_interference_patterns)
      ? data.l1_interference_patterns
      : [],
  };
}

/**
 * Get spaced repetition items due for review
 */
async function getSRItemsDue(
  studentId: string,
  tutorId: string,
  supabase: ReturnType<typeof createServiceRoleClient>
): Promise<{ count: number; preview: SRItemPreview[] }> {
  if (!supabase) return { count: 0, preview: [] };

  const now = new Date().toISOString();

  const { data, error, count } = await supabase
    .from("spaced_repetition_items")
    .select("*", { count: "exact" })
    .eq("student_id", studentId)
    .eq("tutor_id", tutorId)
    .lte("next_review_at", now)
    .order("next_review_at", { ascending: true })
    .limit(10);

  if (error) {
    console.error("[BriefingGenerator] Error fetching SR items:", error);
    return { count: 0, preview: [] };
  }

  const preview: SRItemPreview[] = (data || []).slice(0, 5).map((item) => ({
    word: extractItemWord(item.item_content),
    type: item.item_type as SRItemPreview["type"],
    lastReviewed: item.last_review_at,
    repetitionCount: item.repetition_count || 0,
  }));

  return { count: count || 0, preview };
}

function extractItemWord(content: unknown): string {
  if (!content || typeof content !== "object") return "Unknown";
  const c = content as Record<string, unknown>;
  if (typeof c.word === "string") return c.word;
  if (typeof c.structure === "string") return c.structure;
  if (typeof c.phrase === "string") return c.phrase;
  return "Item";
}

/**
 * Get learning goals for student
 */
async function getLearningGoals(
  studentId: string,
  tutorId: string,
  supabase: ReturnType<typeof createServiceRoleClient>
): Promise<GoalProgress[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("learning_goals")
    .select("*")
    .eq("student_id", studentId)
    .eq("tutor_id", tutorId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(3);

  if (error) {
    console.error("[BriefingGenerator] Error fetching goals:", error);
    return [];
  }

  return (data || []).map((goal) => ({
    goalText: goal.goal_text,
    progressPct: goal.progress_percentage || 0,
    targetDate: goal.target_date,
    status: goal.status,
  }));
}

/**
 * Get total lesson count between student and tutor
 */
async function getLessonCount(
  studentId: string,
  tutorId: string,
  supabase: ReturnType<typeof createServiceRoleClient>
): Promise<number> {
  if (!supabase) return 0;

  const { count, error } = await supabase
    .from("bookings")
    .select("*", { count: "exact", head: true })
    .eq("student_id", studentId)
    .eq("tutor_id", tutorId)
    .eq("status", "completed");

  if (error) {
    console.error("[BriefingGenerator] Error fetching lesson count:", error);
    return 0;
  }

  return count || 0;
}

// =============================================================================
// ANALYSIS FUNCTIONS
// =============================================================================

/**
 * Calculate engagement trend from recent lessons
 */
function calculateEngagementTrend(
  lessons: RecentLessonData[],
  totalLessons: number
): { trend: BriefingData["engagementTrend"]; signals: EngagementSignal[] } {
  const signals: EngagementSignal[] = [];

  // New student (fewer than 3 lessons)
  if (totalLessons < 3) {
    return { trend: "new_student", signals: [] };
  }

  // No recent analyzed lessons
  if (lessons.length === 0) {
    signals.push({
      type: "no_recent_data",
      value: "No recent lesson data",
      concern: true,
      description: "No analyzed lessons available for this student",
    });
    return { trend: "stable", signals };
  }

  // Calculate engagement scores trend
  const engagementScores = lessons
    .map((l) => l.engagement_score || l.interaction_metrics?.engagementScore)
    .filter((s): s is number => typeof s === "number");

  if (engagementScores.length >= 2) {
    const recent = engagementScores.slice(0, 2);
    const older = engagementScores.slice(2);
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.length > 0
      ? older.reduce((a, b) => a + b, 0) / older.length
      : recentAvg;

    if (recentAvg > olderAvg + 0.1) {
      signals.push({
        type: "engagement_improving",
        value: `${Math.round(recentAvg * 100)}%`,
        concern: false,
        description: "Engagement has improved in recent lessons",
      });
      return { trend: "improving", signals };
    }

    if (recentAvg < olderAvg - 0.1) {
      signals.push({
        type: "engagement_declining",
        value: `${Math.round(recentAvg * 100)}%`,
        concern: true,
        description: "Engagement has declined - consider adjusting lesson format",
      });
      return { trend: "declining", signals };
    }
  }

  // Check speaking ratio
  const speakingRatios = lessons
    .map((l) => l.interaction_metrics?.speakingRatio)
    .filter((r): r is number => typeof r === "number");

  if (speakingRatios.length > 0) {
    const avgRatio = speakingRatios.reduce((a, b) => a + b, 0) / speakingRatios.length;
    if (avgRatio < 0.3) {
      signals.push({
        type: "low_speaking_time",
        value: `${Math.round(avgRatio * 100)}%`,
        concern: true,
        description: "Student has limited speaking time - encourage more participation",
      });
    }
  }

  return { trend: "stable", signals };
}

/**
 * Aggregate error patterns from recent lessons
 */
function aggregateErrorPatterns(lessons: RecentLessonData[]): ErrorPattern[] {
  const patternMap = new Map<string, {
    count: number;
    examples: string[];
    severity: "minor" | "moderate" | "major";
    isL1Interference: boolean;
  }>();

  for (const lesson of lessons) {
    const analysis = lesson.student_speech_analysis;
    if (!analysis?.errors) continue;

    for (const error of analysis.errors) {
      const key = error.category || error.type;
      const existing = patternMap.get(key);

      if (existing) {
        existing.count++;
        if (existing.examples.length < 3 && error.original) {
          existing.examples.push(`"${error.original}" → "${error.correction}"`);
        }
        if (error.isL1Interference) {
          existing.isL1Interference = true;
        }
      } else {
        patternMap.set(key, {
          count: 1,
          examples: error.original ? [`"${error.original}" → "${error.correction}"`] : [],
          severity: (error.severity as ErrorPattern["severity"]) || "moderate",
          isL1Interference: error.isL1Interference || false,
        });
      }
    }

    // Also incorporate L1 interference patterns
    if (lesson.l1_interference_detected) {
      for (const pattern of lesson.l1_interference_detected) {
        const key = `l1_${pattern.pattern}`;
        const existing = patternMap.get(key);

        if (existing) {
          existing.count += pattern.count;
        } else {
          patternMap.set(key, {
            count: pattern.count,
            examples: [],
            severity: (pattern.severity as ErrorPattern["severity"]) || "moderate",
            isL1Interference: true,
          });
        }
      }
    }
  }

  // Convert to array and sort by count
  return Array.from(patternMap.entries())
    .map(([type, data]) => ({
      type,
      count: data.count,
      examples: data.examples,
      severity: data.severity,
      isL1Interference: data.isL1Interference,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

/**
 * Build focus areas from error patterns and language profile
 */
function buildFocusAreas(
  errorPatterns: ErrorPattern[],
  languageProfile: Awaited<ReturnType<typeof getLanguageProfile>>
): FocusArea[] {
  const focusAreas: FocusArea[] = [];

  // Add focus areas from error patterns
  for (const pattern of errorPatterns.slice(0, 5)) {
    const type = pattern.type.startsWith("l1_") ? "l1_interference" : categorizeError(pattern.type);

    focusAreas.push({
      type,
      topic: formatErrorTopic(pattern.type),
      reason: `Occurred ${pattern.count} time${pattern.count > 1 ? "s" : ""} in recent lessons`,
      evidence: pattern.examples[0] || `${pattern.count} occurrences detected`,
      count: pattern.count,
    });
  }

  // Add persistent L1 interference patterns from profile
  if (languageProfile?.l1InterferencePatterns) {
    for (const pattern of languageProfile.l1InterferencePatterns.slice(0, 3)) {
      if (!pattern.improving && pattern.frequency > 2) {
        const exists = focusAreas.some(
          (f) => f.topic.toLowerCase().includes(pattern.pattern.toLowerCase())
        );
        if (!exists) {
          focusAreas.push({
            type: "l1_interference",
            topic: formatErrorTopic(pattern.pattern),
            reason: "Persistent L1 interference pattern",
            evidence: `Detected ${pattern.frequency} times across lessons`,
            count: pattern.frequency,
          });
        }
      }
    }
  }

  return focusAreas.slice(0, 6);
}

function categorizeError(errorType: string): FocusArea["type"] {
  const type = errorType.toLowerCase();
  if (type.includes("grammar") || type.includes("tense") || type.includes("agreement")) {
    return "grammar";
  }
  if (type.includes("vocab") || type.includes("word")) {
    return "vocabulary";
  }
  if (type.includes("pronun") || type.includes("accent")) {
    return "pronunciation";
  }
  return "grammar";
}

function formatErrorTopic(errorType: string): string {
  // Remove l1_ prefix if present
  const cleaned = errorType.replace(/^l1_/, "");
  // Convert snake_case to Title Case
  return cleaned
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Build a summary of the student for quick context
 */
function buildStudentSummary(
  student: {
    full_name: string;
    proficiency_level: string | null;
    native_language: string | null;
    learning_goals: string | null;
  },
  languageProfile: Awaited<ReturnType<typeof getLanguageProfile>>,
  lessonCount: number,
  goals: GoalProgress[]
): string {
  const parts: string[] = [];

  // Basic info
  const level = student.proficiency_level || languageProfile?.proficiencyLevel || "intermediate";
  parts.push(`${student.full_name} is a ${level} student`);

  // Native language
  const nativeLang = student.native_language || languageProfile?.nativeLanguage;
  if (nativeLang) {
    parts.push(`with ${nativeLang} as their native language`);
  }

  // Lesson history
  if (lessonCount > 0) {
    parts.push(`You've had ${lessonCount} lesson${lessonCount > 1 ? "s" : ""} together`);
  }

  // Active goal
  if (goals.length > 0) {
    const goal = goals[0];
    parts.push(`Working toward: "${goal.goalText}" (${goal.progressPct}% complete)`);
  }

  return parts.join(". ") + ".";
}

// =============================================================================
// SAVE TO DATABASE
// =============================================================================

/**
 * Save generated briefing to database
 */
export async function saveBriefing(briefing: BriefingData): Promise<string | null> {
  const supabase = createServiceRoleClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("lesson_briefings")
    .insert({
      tutor_id: briefing.tutorId,
      student_id: briefing.studentId,
      booking_id: briefing.bookingId,
      student_summary: briefing.studentSummary,
      focus_areas: briefing.focusAreas,
      error_patterns: briefing.errorPatterns,
      suggested_activities: briefing.suggestedActivities,
      sr_items_due: briefing.srItemsDue,
      sr_items_preview: briefing.srItemsPreview,
      goal_progress: briefing.goalProgress,
      engagement_trend: briefing.engagementTrend,
      engagement_signals: briefing.engagementSignals,
      lessons_analyzed: briefing.lessonsAnalyzed,
      last_lesson_summary: briefing.lastLessonSummary,
      last_lesson_date: briefing.lastLessonDate,
      proficiency_level: briefing.proficiencyLevel,
      native_language: briefing.nativeLanguage,
      target_language: briefing.targetLanguage,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[BriefingGenerator] Error saving briefing:", error);
    return null;
  }

  return data?.id || null;
}
