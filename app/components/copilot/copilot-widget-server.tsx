import { createClient } from "@/lib/supabase/server";
import { CopilotWidget, type PendingBriefingsResult, type LessonBriefing } from "./copilot-widget";

/**
 * Map database row to LessonBriefing type
 */
function mapBriefingFromDb(data: DbBriefing): LessonBriefing {
  return {
    id: data.id,
    tutorId: data.tutor_id,
    studentId: data.student_id,
    bookingId: data.booking_id,
    studentSummary: data.student_summary,
    focusAreas: Array.isArray(data.focus_areas) ? data.focus_areas : [],
    errorPatterns: Array.isArray(data.error_patterns) ? data.error_patterns : [],
    suggestedActivities: Array.isArray(data.suggested_activities) ? data.suggested_activities : [],
    srItemsDue: data.sr_items_due || 0,
    srItemsPreview: Array.isArray(data.sr_items_preview) ? data.sr_items_preview : [],
    goalProgress: data.goal_progress as LessonBriefing["goalProgress"],
    engagementTrend: (data.engagement_trend as LessonBriefing["engagementTrend"]) || "stable",
    engagementSignals: Array.isArray(data.engagement_signals) ? data.engagement_signals : [],
    lessonsAnalyzed: data.lessons_analyzed || 0,
    lastLessonSummary: data.last_lesson_summary,
    lastLessonDate: data.last_lesson_date,
    proficiencyLevel: data.proficiency_level,
    nativeLanguage: data.native_language,
    targetLanguage: data.target_language,
    generatedAt: data.generated_at,
    viewedAt: data.viewed_at,
    dismissedAt: data.dismissed_at,
    student: data.students ? {
      id: data.students.id,
      fullName: data.students.full_name,
      email: data.students.email,
    } : undefined,
    booking: data.bookings ? {
      id: data.bookings.id,
      scheduledAt: data.bookings.scheduled_at,
      service: data.bookings.services ? {
        name: data.bookings.services.name,
        durationMinutes: data.bookings.services.duration_minutes,
      } : undefined,
    } : undefined,
  };
}

interface DbBriefing {
  id: string;
  tutor_id: string;
  student_id: string;
  booking_id: string;
  student_summary: string | null;
  focus_areas: unknown;
  error_patterns: unknown;
  suggested_activities: unknown;
  sr_items_due: number;
  sr_items_preview: unknown;
  goal_progress: unknown;
  engagement_trend: string;
  engagement_signals: unknown;
  lessons_analyzed: number;
  last_lesson_summary: string | null;
  last_lesson_date: string | null;
  proficiency_level: string | null;
  native_language: string | null;
  target_language: string | null;
  generated_at: string;
  viewed_at: string | null;
  dismissed_at: string | null;
  students?: {
    id: string;
    full_name: string;
    email: string;
  } | null;
  bookings?: {
    id: string;
    scheduled_at: string;
    services?: {
      name: string;
      duration_minutes: number;
    } | null;
  } | null;
}

/**
 * Fetch pending briefings directly (for Server Component use)
 */
async function fetchPendingBriefings(): Promise<PendingBriefingsResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { briefings: [], count: 0 };
  }

  // Get briefings for upcoming lessons (next 48 hours)
  const now = new Date();
  const in48Hours = new Date(now.getTime() + 48 * 60 * 60 * 1000);

  const { data, error, count } = await supabase
    .from("lesson_briefings")
    .select(`
      *,
      students (
        id,
        full_name,
        email
      ),
      bookings!inner (
        id,
        scheduled_at,
        status,
        services (
          name,
          duration_minutes
        )
      )
    `, { count: "exact" })
    .eq("tutor_id", user.id)
    .is("dismissed_at", null)
    .gte("bookings.scheduled_at", now.toISOString())
    .lte("bookings.scheduled_at", in48Hours.toISOString())
    .in("bookings.status", ["confirmed", "pending"])
    .order("bookings(scheduled_at)", { ascending: true })
    .limit(10);

  if (error) {
    console.error("[CopilotWidgetServer] Error fetching briefings:", error);
    return { briefings: [], count: 0 };
  }

  return {
    briefings: (data || []).map(mapBriefingFromDb),
    count: count || 0,
  };
}

/**
 * Server component wrapper that pre-fetches data
 */
export async function CopilotWidgetServer() {
  try {
    const data = await fetchPendingBriefings();

    // Don't render if no briefings
    if (data.briefings.length === 0) {
      return null;
    }

    return <CopilotWidget initialData={data} />;
  } catch (error) {
    console.error("Failed to fetch initial briefings:", error);
    return null;
  }
}
