"use server";

import { revalidatePath } from "next/cache";
import { requireStudent, requireTutor } from "@/lib/auth/guards";
import type { TimelineEventType, TimelineEvent, TimelineOptions, JourneyStats } from "@/lib/actions/types";

// ============================================================================
// TIMELINE EVENTS - TUTOR VIEW
// ============================================================================

/**
 * Get timeline events for a specific student
 */
export async function getStudentTimeline(
  studentId: string,
  options: TimelineOptions = {}
): Promise<{ events: TimelineEvent[]; hasMore: boolean }> {
  const { supabase, userId } = await requireTutor({ strict: true });

  const {
    limit = 20,
    offset = 0,
    eventTypes,
    startDate,
    endDate,
    milestonesOnly = false,
  } = options;

  let query = supabase
    .from("student_timeline_events")
    .select("*", { count: "exact" })
    .eq("student_id", studentId)
    .eq("tutor_id", userId)
    .order("event_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (eventTypes && eventTypes.length > 0) {
    query = query.in("event_type", eventTypes);
  }

  if (startDate) {
    query = query.gte("event_at", startDate);
  }

  if (endDate) {
    query = query.lte("event_at", endDate);
  }

  if (milestonesOnly) {
    query = query.eq("is_milestone", true);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("[getStudentTimeline] Error:", error);
    return { events: [], hasMore: false };
  }

  const totalCount = count ?? 0;
  const hasMore = offset + limit < totalCount;

  return {
    events: (data ?? []) as TimelineEvent[],
    hasMore,
  };
}

/**
 * Get milestone events for a student
 */
export async function getStudentMilestones(
  studentId: string
): Promise<TimelineEvent[]> {
  const { supabase, userId } = await requireTutor({ strict: true });

  const { data, error } = await supabase
    .from("student_timeline_events")
    .select("*")
    .eq("student_id", studentId)
    .eq("tutor_id", userId)
    .eq("is_milestone", true)
    .order("event_at", { ascending: false });

  if (error) {
    console.error("[getStudentMilestones] Error:", error);
    return [];
  }

  return (data ?? []) as TimelineEvent[];
}

/**
 * Add a custom timeline event
 */
export async function addTimelineEvent(input: {
  studentId: string;
  eventType: TimelineEventType;
  title: string;
  description?: string;
  metadata?: Record<string, unknown>;
  visibleToStudent?: boolean;
  isMilestone?: boolean;
  relatedBookingId?: string;
  relatedHomeworkId?: string;
  eventAt?: string;
}): Promise<{ data?: TimelineEvent; error?: string }> {
  const { supabase, userId } = await requireTutor({ strict: true });

  const {
    studentId,
    eventType,
    title,
    description,
    metadata = {},
    visibleToStudent = false,
    isMilestone = false,
    relatedBookingId,
    relatedHomeworkId,
    eventAt,
  } = input;

  const { data, error } = await supabase
    .from("student_timeline_events")
    .insert({
      student_id: studentId,
      tutor_id: userId,
      event_type: eventType,
      event_title: title,
      event_description: description,
      event_metadata: metadata,
      related_booking_id: relatedBookingId,
      related_homework_id: relatedHomeworkId,
      visible_to_student: visibleToStudent,
      is_milestone: isMilestone,
      event_at: eventAt ?? new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("[addTimelineEvent] Error:", error);
    return { error: "Failed to add timeline event" };
  }

  // Update student's last_activity_at
  await supabase
    .from("students")
    .update({ last_activity_at: new Date().toISOString() })
    .eq("id", studentId)
    .eq("tutor_id", userId);

  revalidatePath(`/students/${studentId}`);

  return { data: data as TimelineEvent };
}

/**
 * Delete a timeline event
 */
export async function deleteTimelineEvent(
  eventId: string
): Promise<{ success: boolean; error?: string }> {
  const { supabase, userId } = await requireTutor({ strict: true });

  const { error } = await supabase
    .from("student_timeline_events")
    .delete()
    .eq("id", eventId)
    .eq("tutor_id", userId);

  if (error) {
    console.error("[deleteTimelineEvent] Error:", error);
    return { success: false, error: "Failed to delete event" };
  }

  return { success: true };
}

/**
 * Get recent timeline events across all students (for dashboard)
 */
export async function getRecentTimelineEvents(
  limit: number = 10
): Promise<Array<TimelineEvent & { student_name: string }>> {
  const { supabase, userId } = await requireTutor({ strict: true });

  const { data, error } = await supabase
    .from("student_timeline_events")
    .select(
      `
      *,
      student:students(full_name)
    `
    )
    .eq("tutor_id", userId)
    .order("event_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[getRecentTimelineEvents] Error:", error);
    return [];
  }

  return (data ?? []).map((event) => ({
    ...(event as TimelineEvent),
    student_name:
      (event.student as { full_name: string })?.full_name ?? "Unknown",
  }));
}

// ============================================================================
// STUDENT PORTAL - JOURNEY VIEW
// ============================================================================

/**
 * Get student's journey (timeline visible to student)
 */
export async function getStudentJourney(tutorId?: string): Promise<{
  events: TimelineEvent[];
  milestones: TimelineEvent[];
  stats: JourneyStats;
}> {
  const { supabase, student } = await requireStudent({ strict: true });

  if (!student) {
    return {
      events: [],
      milestones: [],
      stats: {
        total_events: 0,
        milestones_count: 0,
        first_event_at: null,
        latest_event_at: null,
        lessons_completed: 0,
        homework_completed: 0,
        days_since_start: null,
      },
    };
  }

  let query = supabase
    .from("student_timeline_events")
    .select("*")
    .eq("student_id", student.id)
    .eq("visible_to_student", true)
    .order("event_at", { ascending: false });

  if (tutorId) {
    query = query.eq("tutor_id", tutorId);
  }

  const { data, error } = await query.limit(50);

  if (error) {
    console.error("[getStudentJourney] Error:", error);
    return {
      events: [],
      milestones: [],
      stats: {
        total_events: 0,
        milestones_count: 0,
        first_event_at: null,
        latest_event_at: null,
        lessons_completed: 0,
        homework_completed: 0,
        days_since_start: null,
      },
    };
  }

  const events = (data ?? []) as TimelineEvent[];
  const milestones = events.filter((e) => e.is_milestone);

  // Calculate stats
  const lessonsCompleted = events.filter(
    (e) => e.event_type === "booking_completed" || e.event_type === "first_lesson"
  ).length;

  const homeworkCompleted = events.filter(
    (e) => e.event_type === "homework_completed"
  ).length;

  const firstEvent = events[events.length - 1];
  const latestEvent = events[0];

  let daysSinceStart: number | null = null;
  if (firstEvent) {
    const startDate = new Date(firstEvent.event_at);
    const now = new Date();
    daysSinceStart = Math.floor(
      (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
  }

  return {
    events,
    milestones,
    stats: {
      total_events: events.length,
      milestones_count: milestones.length,
      first_event_at: firstEvent?.event_at ?? null,
      latest_event_at: latestEvent?.event_at ?? null,
      lessons_completed: lessonsCompleted,
      homework_completed: homeworkCompleted,
      days_since_start: daysSinceStart,
    },
  };
}

/**
 * Get student's milestones (achievements)
 */
export async function getStudentMilestonesForPortal(): Promise<TimelineEvent[]> {
  const { supabase, student } = await requireStudent({ strict: true });

  if (!student) {
    return [];
  }

  const { data, error } = await supabase
    .from("student_timeline_events")
    .select("*")
    .eq("student_id", student.id)
    .eq("visible_to_student", true)
    .eq("is_milestone", true)
    .order("event_at", { ascending: false });

  if (error) {
    console.error("[getStudentMilestonesForPortal] Error:", error);
    return [];
  }

  return (data ?? []) as TimelineEvent[];
}

// ============================================================================
// TIMELINE AGGREGATION
// ============================================================================

/**
 * Get timeline events grouped by date
 */
export async function getStudentTimelineGrouped(
  studentId: string,
  options: TimelineOptions = {}
): Promise<Record<string, TimelineEvent[]>> {
  const { events } = await getStudentTimeline(studentId, {
    ...options,
    limit: options.limit ?? 50,
  });

  const grouped: Record<string, TimelineEvent[]> = {};

  for (const event of events) {
    const date = new Date(event.event_at).toISOString().split("T")[0];
    if (!grouped[date]) {
      grouped[date] = [];
    }
    grouped[date].push(event);
  }

  return grouped;
}

/**
 * Get event type counts for a student
 */
export async function getTimelineEventCounts(
  studentId: string
): Promise<Record<string, number>> {
  const { supabase, userId } = await requireTutor({ strict: true });

  const { data, error } = await supabase
    .from("student_timeline_events")
    .select("event_type")
    .eq("student_id", studentId)
    .eq("tutor_id", userId);

  if (error) {
    console.error("[getTimelineEventCounts] Error:", error);
    return {};
  }

  const counts: Record<string, number> = {};

  for (const event of data ?? []) {
    const type = event.event_type;
    counts[type] = (counts[type] ?? 0) + 1;
  }

  return counts;
}
