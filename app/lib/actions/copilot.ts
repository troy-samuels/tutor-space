"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import type { BriefingData } from "@/lib/copilot/briefing-generator";

// =============================================================================
// TYPES
// =============================================================================

export interface LessonBriefing {
  id: string;
  tutorId: string;
  studentId: string;
  bookingId: string;
  studentSummary: string | null;
  focusAreas: Array<{
    type: string;
    topic: string;
    reason: string;
    evidence: string;
    count?: number;
  }>;
  errorPatterns: Array<{
    type: string;
    count: number;
    examples: string[];
    severity: string;
    isL1Interference?: boolean;
  }>;
  suggestedActivities: Array<{
    title: string;
    description: string;
    durationMin: number;
    category: string;
    targetArea?: string;
  }>;
  srItemsDue: number;
  srItemsPreview: Array<{
    word: string;
    type: string;
    lastReviewed: string | null;
    repetitionCount: number;
  }>;
  goalProgress: {
    goalText: string;
    progressPct: number;
    targetDate: string | null;
    status: string;
  } | null;
  engagementTrend: "improving" | "stable" | "declining" | "new_student";
  engagementSignals: Array<{
    type: string;
    value: string | number;
    concern: boolean;
    description: string;
  }>;
  lessonsAnalyzed: number;
  lastLessonSummary: string | null;
  lastLessonDate: string | null;
  proficiencyLevel: string | null;
  nativeLanguage: string | null;
  targetLanguage: string | null;
  generatedAt: string;
  viewedAt: string | null;
  dismissedAt: string | null;
  // Joined data
  student?: {
    id: string;
    fullName: string;
    email: string;
  };
  booking?: {
    id: string;
    scheduledAt: string;
    service?: {
      name: string;
      durationMinutes: number;
    };
  };
}

export interface PendingBriefingsResult {
  briefings: LessonBriefing[];
  count: number;
}

// =============================================================================
// GET BRIEFINGS
// =============================================================================

/**
 * Get briefing for a specific booking
 */
export async function getLessonBriefing(bookingId: string): Promise<LessonBriefing | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { data, error } = await supabase
    .from("lesson_briefings")
    .select(`
      *,
      students (
        id,
        full_name,
        email
      ),
      bookings (
        id,
        scheduled_at,
        services (
          name,
          duration_minutes
        )
      )
    `)
    .eq("booking_id", bookingId)
    .eq("tutor_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("[Copilot] Error fetching briefing:", error);
    throw new Error("Failed to fetch briefing");
  }

  if (!data) {
    return null;
  }

  return mapBriefingFromDb(data);
}

/**
 * Get all pending (not dismissed) briefings for tutor dashboard
 */
export async function getPendingBriefings(): Promise<PendingBriefingsResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
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
    console.error("[Copilot] Error fetching pending briefings:", error);
    throw new Error("Failed to fetch briefings");
  }

  return {
    briefings: (data || []).map(mapBriefingFromDb),
    count: count || 0,
  };
}

// =============================================================================
// UPDATE BRIEFINGS
// =============================================================================

/**
 * Mark briefing as viewed (for analytics)
 */
export async function markBriefingViewed(briefingId: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { error } = await supabase
    .from("lesson_briefings")
    .update({ viewed_at: new Date().toISOString() })
    .eq("id", briefingId)
    .eq("tutor_id", user.id)
    .is("viewed_at", null);

  if (error) {
    console.error("[Copilot] Error marking briefing viewed:", error);
    throw new Error("Failed to update briefing");
  }
}

/**
 * Dismiss briefing (won't show again)
 */
export async function dismissBriefing(briefingId: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { error } = await supabase
    .from("lesson_briefings")
    .update({ dismissed_at: new Date().toISOString() })
    .eq("id", briefingId)
    .eq("tutor_id", user.id);

  if (error) {
    console.error("[Copilot] Error dismissing briefing:", error);
    throw new Error("Failed to dismiss briefing");
  }

  revalidatePath("/dashboard");
}

/**
 * Regenerate briefing for a booking (if data has changed)
 */
export async function regenerateBriefing(bookingId: string): Promise<LessonBriefing | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  // Import dynamically to avoid circular dependencies
  const { generateBriefing, saveBriefing } = await import("@/lib/copilot/briefing-generator");

  // Delete existing briefing
  await supabase
    .from("lesson_briefings")
    .delete()
    .eq("booking_id", bookingId)
    .eq("tutor_id", user.id);

  // Generate new briefing
  const briefingData = await generateBriefing(bookingId);
  if (!briefingData) {
    return null;
  }

  // Save to database
  const briefingId = await saveBriefing(briefingData);
  if (!briefingId) {
    return null;
  }

  revalidatePath("/dashboard");
  revalidatePath(`/copilot/briefing/${bookingId}`);

  // Fetch and return the saved briefing
  return getLessonBriefing(bookingId);
}

// =============================================================================
// COPILOT SETTINGS
// =============================================================================

export interface CopilotSettings {
  briefingsEnabled: boolean;
  briefingTiming: "24_hours" | "12_hours" | "6_hours";
  briefingDelivery: "dashboard" | "dashboard_and_email" | "email";
  autoGenerateHomework: boolean;
  autoGenerateDrills: boolean;
  engagementAlertsEnabled: boolean;
  engagementAlertThresholdDays: number;
}

/**
 * Get tutor's copilot settings
 */
export async function getCopilotSettings(): Promise<CopilotSettings> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("copilot_settings")
    .eq("id", user.id)
    .single();

  if (error) {
    console.error("[Copilot] Error fetching settings:", error);
    // Return defaults
    return getDefaultCopilotSettings();
  }

  const settings = data?.copilot_settings as Partial<CopilotSettings> | null;
  return {
    ...getDefaultCopilotSettings(),
    ...settings,
  };
}

/**
 * Update tutor's copilot settings
 */
export async function updateCopilotSettings(
  settings: Partial<CopilotSettings>
): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  // Merge with existing settings
  const current = await getCopilotSettings();
  const merged = { ...current, ...settings };

  const { error } = await supabase
    .from("profiles")
    .update({ copilot_settings: merged })
    .eq("id", user.id);

  if (error) {
    console.error("[Copilot] Error updating settings:", error);
    throw new Error("Failed to update settings");
  }

  revalidatePath("/settings/copilot");
}

function getDefaultCopilotSettings(): CopilotSettings {
  return {
    briefingsEnabled: true,
    briefingTiming: "24_hours",
    briefingDelivery: "dashboard",
    autoGenerateHomework: true,
    autoGenerateDrills: true,
    engagementAlertsEnabled: true,
    engagementAlertThresholdDays: 7,
  };
}

// =============================================================================
// HELPERS
// =============================================================================

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
