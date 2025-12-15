/**
 * SM-2 (SuperMemo 2) Spaced Repetition Algorithm
 *
 * Implementation of the classic SM-2 algorithm for scheduling review items
 * with adaptations for language learning.
 */

// =============================================================================
// TYPES
// =============================================================================

export interface SM2Item {
  easeFactor: number; // 1.3 to 2.5+
  interval: number; // Days until next review
  repetitions: number; // Number of successful repetitions
  nextReviewDate: Date;
  lastReviewDate?: Date;
}

export interface SM2Result {
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReviewDate: Date;
  wasCorrect: boolean;
}

export interface SM2ItemData {
  easeFactor?: number;
  intervalDays?: number;
  repetitionCount?: number;
  lastReviewAt?: Date | string | null;
}

/**
 * Quality ratings for SM-2 algorithm
 *
 * 0 - Complete blackout: No memory of the item at all
 * 1 - Incorrect: Wrong answer, but recognized correct answer when shown
 * 2 - Incorrect with hint: Wrong, but correct answer seemed easy once revealed
 * 3 - Correct with difficulty: Correct answer but required significant thought
 * 4 - Correct with hesitation: Correct answer after brief hesitation
 * 5 - Perfect: Immediate correct answer with no hesitation
 */
export type QualityRating = 0 | 1 | 2 | 3 | 4 | 5;

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Default values for new items
 */
export const SM2_DEFAULTS = {
  EASE_FACTOR: 2.5,
  MIN_EASE_FACTOR: 1.3,
  MAX_EASE_FACTOR: 3.0,
  FIRST_INTERVAL: 1,
  SECOND_INTERVAL: 6,
  PASSING_GRADE: 3,
};

/**
 * Interval modifiers for language-specific items
 * Pronunciation items may need more frequent review
 */
export const ITEM_TYPE_MODIFIERS: Record<string, number> = {
  vocabulary: 1.0,
  grammar: 1.0,
  pronunciation: 0.8, // More frequent review
  phrase: 1.0,
  cultural: 1.1, // Slightly less frequent
};

// =============================================================================
// MAIN ALGORITHM
// =============================================================================

/**
 * Calculate next review parameters using SM-2 algorithm
 *
 * @param quality - Quality of response (0-5)
 * @param currentItem - Current item state
 * @returns Updated SM-2 parameters
 */
export function calculateSM2(
  quality: QualityRating,
  currentItem: SM2ItemData = {}
): SM2Result {
  // Get current values or defaults
  const currentEaseFactor = currentItem.easeFactor ?? SM2_DEFAULTS.EASE_FACTOR;
  const currentInterval = currentItem.intervalDays ?? 0;
  const currentRepetitions = currentItem.repetitionCount ?? 0;

  let newEaseFactor = currentEaseFactor;
  let newInterval: number;
  let newRepetitions: number;
  const wasCorrect = quality >= SM2_DEFAULTS.PASSING_GRADE;

  if (wasCorrect) {
    // Correct response - advance in schedule
    if (currentRepetitions === 0) {
      // First successful review
      newInterval = SM2_DEFAULTS.FIRST_INTERVAL;
    } else if (currentRepetitions === 1) {
      // Second successful review
      newInterval = SM2_DEFAULTS.SECOND_INTERVAL;
    } else {
      // Subsequent successful reviews
      newInterval = Math.round(currentInterval * currentEaseFactor);
    }
    newRepetitions = currentRepetitions + 1;
  } else {
    // Incorrect response - reset to beginning
    newRepetitions = 0;
    newInterval = SM2_DEFAULTS.FIRST_INTERVAL;
  }

  // Update ease factor based on quality
  // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  newEaseFactor =
    currentEaseFactor +
    (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

  // Clamp ease factor to valid range
  newEaseFactor = Math.max(SM2_DEFAULTS.MIN_EASE_FACTOR, newEaseFactor);
  newEaseFactor = Math.min(SM2_DEFAULTS.MAX_EASE_FACTOR, newEaseFactor);

  // Round ease factor to 2 decimal places
  newEaseFactor = Math.round(newEaseFactor * 100) / 100;

  // Calculate next review date
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);
  nextReviewDate.setHours(0, 0, 0, 0); // Normalize to start of day

  return {
    easeFactor: newEaseFactor,
    interval: newInterval,
    repetitions: newRepetitions,
    nextReviewDate,
    wasCorrect,
  };
}

/**
 * Calculate SM-2 with item type modifier
 * Different item types may need different review frequencies
 */
export function calculateSM2WithType(
  quality: QualityRating,
  currentItem: SM2ItemData,
  itemType: string
): SM2Result {
  const result = calculateSM2(quality, currentItem);

  // Apply item type modifier to interval
  const modifier = ITEM_TYPE_MODIFIERS[itemType] ?? 1.0;
  const adjustedInterval = Math.max(1, Math.round(result.interval * modifier));

  // Recalculate next review date with adjusted interval
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + adjustedInterval);
  nextReviewDate.setHours(0, 0, 0, 0);

  return {
    ...result,
    interval: adjustedInterval,
    nextReviewDate,
  };
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Estimate quality rating based on response time and correctness
 *
 * @param isCorrect - Whether the answer was correct
 * @param responseTimeMs - Time taken to respond in milliseconds
 * @param expectedTimeMs - Expected response time for this item type
 * @returns Estimated quality rating 0-5
 */
export function estimateQuality(
  isCorrect: boolean,
  responseTimeMs: number,
  expectedTimeMs: number = 5000
): QualityRating {
  if (!isCorrect) {
    // Wrong answer
    if (responseTimeMs < expectedTimeMs * 0.5) {
      // Quick wrong answer - didn't try
      return 0;
    } else if (responseTimeMs < expectedTimeMs * 1.5) {
      // Normal attempt but wrong
      return 1;
    } else {
      // Tried hard but still wrong
      return 2;
    }
  } else {
    // Correct answer
    if (responseTimeMs < expectedTimeMs * 0.3) {
      // Very quick - perfect recall
      return 5;
    } else if (responseTimeMs < expectedTimeMs * 0.7) {
      // Quick with slight hesitation
      return 4;
    } else {
      // Correct but required effort
      return 3;
    }
  }
}

/**
 * Calculate overdue factor for prioritizing reviews
 * Items that are more overdue should be reviewed first
 *
 * @param nextReviewDate - When the item was due
 * @returns Overdue factor (0 = not due, 1 = due today, >1 = overdue)
 */
export function calculateOverdueFactor(nextReviewDate: Date | string): number {
  const dueDate = new Date(nextReviewDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);

  const diffDays = (today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24);

  if (diffDays < 0) {
    // Not due yet
    return 0;
  } else if (diffDays === 0) {
    // Due today
    return 1;
  } else {
    // Overdue - exponentially increasing priority
    return 1 + Math.log2(diffDays + 1);
  }
}

/**
 * Calculate review priority score
 * Higher score = should be reviewed first
 *
 * @param item - The SR item
 * @param nextReviewDate - When the item is due
 * @returns Priority score
 */
export function calculatePriority(
  item: SM2ItemData,
  nextReviewDate: Date | string
): number {
  const overdueFactor = calculateOverdueFactor(nextReviewDate);

  // Base priority from overdue factor
  let priority = overdueFactor * 100;

  // Items with lower ease factor (harder items) get higher priority
  const easeFactor = item.easeFactor ?? SM2_DEFAULTS.EASE_FACTOR;
  const easePenalty = (SM2_DEFAULTS.EASE_FACTOR - easeFactor) * 20;
  priority += easePenalty;

  // New items (low repetition count) get higher priority
  const repetitions = item.repetitionCount ?? 0;
  if (repetitions < 3) {
    priority += (3 - repetitions) * 10;
  }

  return Math.round(priority * 100) / 100;
}

/**
 * Determine if an item is due for review
 *
 * @param nextReviewDate - When the item is due
 * @returns Whether the item should be reviewed
 */
export function isDue(nextReviewDate: Date | string | null): boolean {
  if (!nextReviewDate) return true; // Never reviewed = due

  const dueDate = new Date(nextReviewDate);
  const today = new Date();
  today.setHours(23, 59, 59, 999); // End of today

  return dueDate <= today;
}

/**
 * Calculate estimated mastery level based on SM-2 parameters
 *
 * @param item - The SR item
 * @returns Mastery level 0-100
 */
export function calculateMasteryLevel(item: SM2ItemData): number {
  const easeFactor = item.easeFactor ?? SM2_DEFAULTS.EASE_FACTOR;
  const interval = item.intervalDays ?? 0;
  const repetitions = item.repetitionCount ?? 0;

  // Base mastery from repetitions (max 50 points)
  const repetitionScore = Math.min(repetitions * 10, 50);

  // Ease factor contribution (max 25 points)
  // Higher ease factor = easier item = lower mastery needed
  const easeScore =
    ((easeFactor - SM2_DEFAULTS.MIN_EASE_FACTOR) /
      (SM2_DEFAULTS.MAX_EASE_FACTOR - SM2_DEFAULTS.MIN_EASE_FACTOR)) *
    25;

  // Interval contribution (max 25 points)
  // Longer intervals indicate stronger retention
  const intervalScore = Math.min(Math.log2(interval + 1) * 5, 25);

  const totalMastery = Math.round(repetitionScore + easeScore + intervalScore);
  return Math.min(100, Math.max(0, totalMastery));
}

/**
 * Get human-readable status for an item
 */
export function getItemStatus(item: SM2ItemData, nextReviewDate: Date | string | null): {
  status: "new" | "learning" | "review" | "mastered";
  label: string;
  color: string;
} {
  const repetitions = item.repetitionCount ?? 0;
  const interval = item.intervalDays ?? 0;
  const isItemDue = isDue(nextReviewDate);

  if (repetitions === 0) {
    return { status: "new", label: "New", color: "blue" };
  } else if (interval < 7) {
    return { status: "learning", label: "Learning", color: "yellow" };
  } else if (interval >= 30) {
    return { status: "mastered", label: "Mastered", color: "green" };
  } else {
    return { status: "review", label: isItemDue ? "Due" : "Review", color: "orange" };
  }
}

/**
 * Batch calculate next reviews for multiple items
 */
export function batchCalculateSM2(
  items: Array<{ id: string; quality: QualityRating; currentData: SM2ItemData; itemType?: string }>
): Array<{ id: string; result: SM2Result }> {
  return items.map((item) => ({
    id: item.id,
    result: item.itemType
      ? calculateSM2WithType(item.quality, item.currentData, item.itemType)
      : calculateSM2(item.quality, item.currentData),
  }));
}

// =============================================================================
// ANALYTICS FUNCTIONS
// =============================================================================

/**
 * Calculate retention rate from review history
 *
 * @param reviews - Array of review outcomes (true = correct, false = incorrect)
 * @param window - Number of recent reviews to consider
 * @returns Retention rate 0-1
 */
export function calculateRetentionRate(
  reviews: boolean[],
  window: number = 20
): number {
  if (reviews.length === 0) return 0;

  const recentReviews = reviews.slice(-window);
  const correctCount = recentReviews.filter((r) => r).length;

  return correctCount / recentReviews.length;
}

/**
 * Estimate items due for review over upcoming days
 *
 * @param items - Array of items with next review dates
 * @param days - Number of days to forecast
 * @returns Array of counts per day
 */
export function forecastReviews(
  items: Array<{ nextReviewAt: Date | string | null }>,
  days: number = 7
): number[] {
  const forecast = new Array(days).fill(0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const item of items) {
    if (!item.nextReviewAt) {
      forecast[0]++; // New items due today
      continue;
    }

    const dueDate = new Date(item.nextReviewAt);
    dueDate.setHours(0, 0, 0, 0);

    const diffDays = Math.floor(
      (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays < 0) {
      forecast[0]++; // Overdue items count as today
    } else if (diffDays < days) {
      forecast[diffDays]++;
    }
  }

  return forecast;
}

/**
 * Calculate study streak from review dates
 *
 * @param reviewDates - Array of review dates
 * @returns Current streak in days
 */
export function calculateStreak(reviewDates: (Date | string)[]): number {
  if (reviewDates.length === 0) return 0;

  const sortedDates = reviewDates
    .map((d) => {
      const date = new Date(d);
      date.setHours(0, 0, 0, 0);
      return date.getTime();
    })
    .sort((a, b) => b - a); // Most recent first

  const uniqueDates = [...new Set(sortedDates)];

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTime = today.getTime();

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayTime = yesterday.getTime();

  // Check if studied today or yesterday
  if (uniqueDates[0] !== todayTime && uniqueDates[0] !== yesterdayTime) {
    return 0; // Streak broken
  }

  let streak = 1;
  let currentDate = uniqueDates[0];

  for (let i = 1; i < uniqueDates.length; i++) {
    const expectedPrevious = currentDate - 24 * 60 * 60 * 1000;
    if (uniqueDates[i] === expectedPrevious) {
      streak++;
      currentDate = uniqueDates[i];
    } else {
      break;
    }
  }

  return streak;
}
