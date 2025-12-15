/**
 * Spaced Repetition Review Scheduler
 *
 * Manages scheduling, retrieval, and updating of spaced repetition items
 * using the SM-2 algorithm.
 */

import { createServiceRoleClient } from "@/lib/supabase/admin";
import {
  calculateSM2,
  calculateSM2WithType,
  calculatePriority,
  calculateOverdueFactor,
  isDue,
  calculateMasteryLevel,
  getItemStatus,
  forecastReviews,
  calculateStreak,
  type QualityRating,
  type SM2Result,
  type SM2ItemData,
} from "./sm2";

// Re-export types for external consumers
export type { QualityRating, SM2Result, SM2ItemData };

// =============================================================================
// TYPES
// =============================================================================

export interface SRItem {
  id: string;
  studentId: string;
  tutorId: string;
  drillId: string | null;
  itemType: string;
  itemContent: Record<string, unknown>;
  itemKey: string;
  easeFactor: number;
  intervalDays: number;
  repetitionCount: number;
  lastReviewAt: string | null;
  nextReviewAt: string | null;
  lastQuality: number | null;
  totalReviews: number;
  correctCount: number;
  incorrectCount: number;
  averageResponseTimeMs: number | null;
  sourceLessonId: string | null;
  sourceTimestampSeconds: number | null;
  createdAt: string;
}

export interface DueItem extends SRItem {
  overdueBy: number;
  priority: number;
  masteryLevel: number;
  status: {
    status: "new" | "learning" | "review" | "mastered";
    label: string;
    color: string;
  };
}

export interface ReviewResult {
  itemId: string;
  sm2Result: SM2Result;
  previousInterval: number;
  previousEaseFactor: number;
}

export interface CreateSRItemInput {
  studentId: string;
  tutorId: string;
  drillId?: string | null;
  itemType: string;
  itemContent: Record<string, unknown>;
  itemKey: string;
  sourceLessonId?: string | null;
  sourceTimestampSeconds?: number | null;
}

export interface ReviewStats {
  totalItems: number;
  dueToday: number;
  overdue: number;
  newItems: number;
  learningItems: number;
  reviewItems: number;
  masteredItems: number;
  averageMastery: number;
  currentStreak: number;
  forecastNext7Days: number[];
}

// =============================================================================
// ITEM RETRIEVAL
// =============================================================================

/**
 * Get items due for review
 *
 * @param studentId - Student to get items for
 * @param limit - Maximum items to return
 * @param tutorId - Optional tutor filter
 */
export async function getDueItems(
  studentId: string,
  limit: number = 20,
  tutorId?: string
): Promise<DueItem[]> {
  const supabase = createServiceRoleClient();
  if (!supabase) {
    throw new Error("Database connection not available");
  }

  // Get all items that are due (next_review_at <= now) or new (next_review_at is null)
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  let query = supabase
    .from("spaced_repetition_items")
    .select("*")
    .eq("student_id", studentId)
    .or(`next_review_at.is.null,next_review_at.lte.${today.toISOString()}`);

  if (tutorId) {
    query = query.eq("tutor_id", tutorId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[Scheduler] Error fetching due items:", error);
    throw error;
  }

  if (!data || data.length === 0) {
    return [];
  }

  // Convert to DueItem format with priority calculation
  const dueItems: DueItem[] = data.map((item) => {
    const itemData: SM2ItemData = {
      easeFactor: item.ease_factor,
      intervalDays: item.interval_days,
      repetitionCount: item.repetition_count,
      lastReviewAt: item.last_review_at,
    };

    const overdueBy = item.next_review_at
      ? calculateOverdueFactor(item.next_review_at)
      : 1; // New items get priority 1

    const priority = calculatePriority(itemData, item.next_review_at || new Date());

    return {
      id: item.id,
      studentId: item.student_id,
      tutorId: item.tutor_id,
      drillId: item.drill_id,
      itemType: item.item_type,
      itemContent: item.item_content,
      itemKey: item.item_key,
      easeFactor: item.ease_factor,
      intervalDays: item.interval_days,
      repetitionCount: item.repetition_count,
      lastReviewAt: item.last_review_at,
      nextReviewAt: item.next_review_at,
      lastQuality: item.last_quality,
      totalReviews: item.total_reviews,
      correctCount: item.correct_count,
      incorrectCount: item.incorrect_count,
      averageResponseTimeMs: item.average_response_time_ms,
      sourceLessonId: item.source_lesson_id,
      sourceTimestampSeconds: item.source_timestamp_seconds,
      createdAt: item.created_at,
      overdueBy,
      priority,
      masteryLevel: calculateMasteryLevel(itemData),
      status: getItemStatus(itemData, item.next_review_at),
    };
  });

  // Sort by priority (highest first) and return limited results
  dueItems.sort((a, b) => b.priority - a.priority);

  return dueItems.slice(0, limit);
}

/**
 * Get all SR items for a student (not just due)
 */
export async function getAllItems(
  studentId: string,
  tutorId?: string,
  itemType?: string
): Promise<DueItem[]> {
  const supabase = createServiceRoleClient();
  if (!supabase) {
    throw new Error("Database connection not available");
  }

  let query = supabase
    .from("spaced_repetition_items")
    .select("*")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });

  if (tutorId) {
    query = query.eq("tutor_id", tutorId);
  }

  if (itemType) {
    query = query.eq("item_type", itemType);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[Scheduler] Error fetching all items:", error);
    throw error;
  }

  if (!data) {
    return [];
  }

  return data.map((item) => {
    const itemData: SM2ItemData = {
      easeFactor: item.ease_factor,
      intervalDays: item.interval_days,
      repetitionCount: item.repetition_count,
      lastReviewAt: item.last_review_at,
    };

    return {
      id: item.id,
      studentId: item.student_id,
      tutorId: item.tutor_id,
      drillId: item.drill_id,
      itemType: item.item_type,
      itemContent: item.item_content,
      itemKey: item.item_key,
      easeFactor: item.ease_factor,
      intervalDays: item.interval_days,
      repetitionCount: item.repetition_count,
      lastReviewAt: item.last_review_at,
      nextReviewAt: item.next_review_at,
      lastQuality: item.last_quality,
      totalReviews: item.total_reviews,
      correctCount: item.correct_count,
      incorrectCount: item.incorrect_count,
      averageResponseTimeMs: item.average_response_time_ms,
      sourceLessonId: item.source_lesson_id,
      sourceTimestampSeconds: item.source_timestamp_seconds,
      createdAt: item.created_at,
      overdueBy: item.next_review_at ? calculateOverdueFactor(item.next_review_at) : 1,
      priority: calculatePriority(itemData, item.next_review_at || new Date()),
      masteryLevel: calculateMasteryLevel(itemData),
      status: getItemStatus(itemData, item.next_review_at),
    };
  });
}

// =============================================================================
// REVIEW RECORDING
// =============================================================================

/**
 * Record a review result and update item scheduling
 *
 * @param itemId - The SR item ID
 * @param quality - Quality rating 0-5
 * @param responseTimeMs - Time taken to respond
 */
export async function recordReview(
  itemId: string,
  quality: QualityRating,
  responseTimeMs?: number
): Promise<ReviewResult> {
  const supabase = createServiceRoleClient();
  if (!supabase) {
    throw new Error("Database connection not available");
  }

  // Fetch current item state
  const { data: item, error: fetchError } = await supabase
    .from("spaced_repetition_items")
    .select("*")
    .eq("id", itemId)
    .single();

  if (fetchError || !item) {
    console.error("[Scheduler] Error fetching item for review:", fetchError);
    throw new Error(`Item not found: ${itemId}`);
  }

  // Calculate new SM-2 parameters
  const currentData: SM2ItemData = {
    easeFactor: item.ease_factor,
    intervalDays: item.interval_days,
    repetitionCount: item.repetition_count,
    lastReviewAt: item.last_review_at,
  };

  const sm2Result = calculateSM2WithType(quality, currentData, item.item_type);

  // Update review statistics
  const isCorrect = quality >= 3;
  const newTotalReviews = item.total_reviews + 1;
  const newCorrectCount = item.correct_count + (isCorrect ? 1 : 0);
  const newIncorrectCount = item.incorrect_count + (isCorrect ? 0 : 1);

  // Calculate running average response time
  let newAvgResponseTime = item.average_response_time_ms;
  if (responseTimeMs !== undefined) {
    if (item.average_response_time_ms === null) {
      newAvgResponseTime = responseTimeMs;
    } else {
      // Running average
      newAvgResponseTime = Math.round(
        (item.average_response_time_ms * (newTotalReviews - 1) + responseTimeMs) /
          newTotalReviews
      );
    }
  }

  // Update the item
  const { error: updateError } = await supabase
    .from("spaced_repetition_items")
    .update({
      ease_factor: sm2Result.easeFactor,
      interval_days: sm2Result.interval,
      repetition_count: sm2Result.repetitions,
      last_review_at: new Date().toISOString(),
      next_review_at: sm2Result.nextReviewDate.toISOString(),
      last_quality: quality,
      total_reviews: newTotalReviews,
      correct_count: newCorrectCount,
      incorrect_count: newIncorrectCount,
      average_response_time_ms: newAvgResponseTime,
    })
    .eq("id", itemId);

  if (updateError) {
    console.error("[Scheduler] Error updating item after review:", updateError);
    throw updateError;
  }

  return {
    itemId,
    sm2Result,
    previousInterval: item.interval_days,
    previousEaseFactor: item.ease_factor,
  };
}

/**
 * Record multiple reviews in batch
 */
export async function recordReviewBatch(
  reviews: Array<{
    itemId: string;
    quality: QualityRating;
    responseTimeMs?: number;
  }>
): Promise<ReviewResult[]> {
  const results: ReviewResult[] = [];

  for (const review of reviews) {
    const result = await recordReview(
      review.itemId,
      review.quality,
      review.responseTimeMs
    );
    results.push(result);
  }

  return results;
}

// =============================================================================
// ITEM CREATION
// =============================================================================

/**
 * Create a new SR item
 */
export async function createSRItem(input: CreateSRItemInput): Promise<string> {
  const supabase = createServiceRoleClient();
  if (!supabase) {
    throw new Error("Database connection not available");
  }

  // Check for existing item with same key
  const { data: existing } = await supabase
    .from("spaced_repetition_items")
    .select("id")
    .eq("student_id", input.studentId)
    .eq("item_key", input.itemKey)
    .single();

  if (existing) {
    // Return existing item ID (no duplicate)
    return existing.id;
  }

  // Create new item
  const { data, error } = await supabase
    .from("spaced_repetition_items")
    .insert({
      student_id: input.studentId,
      tutor_id: input.tutorId,
      drill_id: input.drillId || null,
      item_type: input.itemType,
      item_content: input.itemContent,
      item_key: input.itemKey,
      source_lesson_id: input.sourceLessonId || null,
      source_timestamp_seconds: input.sourceTimestampSeconds || null,
      // Defaults set by database
    })
    .select("id")
    .single();

  if (error) {
    console.error("[Scheduler] Error creating SR item:", error);
    throw error;
  }

  return data.id;
}

/**
 * Create SR items from a drill
 */
export async function createSRItemsFromDrill(
  studentId: string,
  tutorId: string,
  drillId: string,
  items: Array<{
    type: string;
    content: Record<string, unknown>;
    key: string;
  }>,
  sourceLessonId?: string
): Promise<string[]> {
  const itemIds: string[] = [];

  for (const item of items) {
    const id = await createSRItem({
      studentId,
      tutorId,
      drillId,
      itemType: item.type,
      itemContent: item.content,
      itemKey: item.key,
      sourceLessonId,
    });
    itemIds.push(id);
  }

  return itemIds;
}

// =============================================================================
// STATISTICS
// =============================================================================

/**
 * Get review statistics for a student
 */
export async function getReviewStats(
  studentId: string,
  tutorId?: string
): Promise<ReviewStats> {
  const supabase = createServiceRoleClient();
  if (!supabase) {
    throw new Error("Database connection not available");
  }

  let query = supabase
    .from("spaced_repetition_items")
    .select("*")
    .eq("student_id", studentId);

  if (tutorId) {
    query = query.eq("tutor_id", tutorId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[Scheduler] Error fetching review stats:", error);
    throw error;
  }

  if (!data || data.length === 0) {
    return {
      totalItems: 0,
      dueToday: 0,
      overdue: 0,
      newItems: 0,
      learningItems: 0,
      reviewItems: 0,
      masteredItems: 0,
      averageMastery: 0,
      currentStreak: 0,
      forecastNext7Days: [0, 0, 0, 0, 0, 0, 0],
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);

  let dueToday = 0;
  let overdue = 0;
  let newItems = 0;
  let learningItems = 0;
  let reviewItems = 0;
  let masteredItems = 0;
  let totalMastery = 0;

  const reviewDates: Date[] = [];

  for (const item of data) {
    const itemData: SM2ItemData = {
      easeFactor: item.ease_factor,
      intervalDays: item.interval_days,
      repetitionCount: item.repetition_count,
    };

    const status = getItemStatus(itemData, item.next_review_at);
    const mastery = calculateMasteryLevel(itemData);
    totalMastery += mastery;

    // Count by status
    switch (status.status) {
      case "new":
        newItems++;
        break;
      case "learning":
        learningItems++;
        break;
      case "review":
        reviewItems++;
        break;
      case "mastered":
        masteredItems++;
        break;
    }

    // Check due status
    if (!item.next_review_at) {
      dueToday++; // New items are due
    } else {
      const nextReview = new Date(item.next_review_at);
      if (nextReview < today) {
        overdue++;
        dueToday++;
      } else if (nextReview <= todayEnd) {
        dueToday++;
      }
    }

    // Collect review dates for streak calculation
    if (item.last_review_at) {
      reviewDates.push(new Date(item.last_review_at));
    }
  }

  // Calculate forecast
  const forecastData = data.map((item) => ({
    nextReviewAt: item.next_review_at,
  }));
  const forecastNext7Days = forecastReviews(forecastData, 7);

  // Calculate streak
  const currentStreak = calculateStreak(reviewDates);

  return {
    totalItems: data.length,
    dueToday,
    overdue,
    newItems,
    learningItems,
    reviewItems,
    masteredItems,
    averageMastery: Math.round(totalMastery / data.length),
    currentStreak,
    forecastNext7Days,
  };
}

/**
 * Get mastery breakdown by item type
 */
export async function getMasteryByType(
  studentId: string,
  tutorId?: string
): Promise<Record<string, { count: number; averageMastery: number }>> {
  const supabase = createServiceRoleClient();
  if (!supabase) {
    throw new Error("Database connection not available");
  }

  let query = supabase
    .from("spaced_repetition_items")
    .select("item_type, ease_factor, interval_days, repetition_count")
    .eq("student_id", studentId);

  if (tutorId) {
    query = query.eq("tutor_id", tutorId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[Scheduler] Error fetching mastery by type:", error);
    throw error;
  }

  const breakdown: Record<string, { count: number; totalMastery: number }> = {};

  for (const item of data || []) {
    const type = item.item_type;
    if (!breakdown[type]) {
      breakdown[type] = { count: 0, totalMastery: 0 };
    }

    const mastery = calculateMasteryLevel({
      easeFactor: item.ease_factor,
      intervalDays: item.interval_days,
      repetitionCount: item.repetition_count,
    });

    breakdown[type].count++;
    breakdown[type].totalMastery += mastery;
  }

  // Convert to averages
  const result: Record<string, { count: number; averageMastery: number }> = {};
  for (const [type, data] of Object.entries(breakdown)) {
    result[type] = {
      count: data.count,
      averageMastery: Math.round(data.totalMastery / data.count),
    };
  }

  return result;
}

// =============================================================================
// ITEM MANAGEMENT
// =============================================================================

/**
 * Delete an SR item
 */
export async function deleteSRItem(itemId: string): Promise<void> {
  const supabase = createServiceRoleClient();
  if (!supabase) {
    throw new Error("Database connection not available");
  }

  const { error } = await supabase
    .from("spaced_repetition_items")
    .delete()
    .eq("id", itemId);

  if (error) {
    console.error("[Scheduler] Error deleting SR item:", error);
    throw error;
  }
}

/**
 * Reset an item's progress
 */
export async function resetItemProgress(itemId: string): Promise<void> {
  const supabase = createServiceRoleClient();
  if (!supabase) {
    throw new Error("Database connection not available");
  }

  const { error } = await supabase
    .from("spaced_repetition_items")
    .update({
      ease_factor: 2.5,
      interval_days: 1,
      repetition_count: 0,
      last_review_at: null,
      next_review_at: null,
      last_quality: null,
      total_reviews: 0,
      correct_count: 0,
      incorrect_count: 0,
      average_response_time_ms: null,
    })
    .eq("id", itemId);

  if (error) {
    console.error("[Scheduler] Error resetting item progress:", error);
    throw error;
  }
}

/**
 * Get items by source lesson
 */
export async function getItemsByLesson(lessonId: string): Promise<SRItem[]> {
  const supabase = createServiceRoleClient();
  if (!supabase) {
    throw new Error("Database connection not available");
  }

  const { data, error } = await supabase
    .from("spaced_repetition_items")
    .select("*")
    .eq("source_lesson_id", lessonId);

  if (error) {
    console.error("[Scheduler] Error fetching items by lesson:", error);
    throw error;
  }

  return (data || []).map((item) => ({
    id: item.id,
    studentId: item.student_id,
    tutorId: item.tutor_id,
    drillId: item.drill_id,
    itemType: item.item_type,
    itemContent: item.item_content,
    itemKey: item.item_key,
    easeFactor: item.ease_factor,
    intervalDays: item.interval_days,
    repetitionCount: item.repetition_count,
    lastReviewAt: item.last_review_at,
    nextReviewAt: item.next_review_at,
    lastQuality: item.last_quality,
    totalReviews: item.total_reviews,
    correctCount: item.correct_count,
    incorrectCount: item.incorrect_count,
    averageResponseTimeMs: item.average_response_time_ms,
    sourceLessonId: item.source_lesson_id,
    sourceTimestampSeconds: item.source_timestamp_seconds,
    createdAt: item.created_at,
  }));
}
