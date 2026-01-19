/**
 * Time Calculation Utilities
 *
 * Shared utilities for formatting durations, calculating relative times,
 * and working with time intervals.
 */

import {
  formatDistanceToNow,
  formatDistanceToNowStrict,
  differenceInMinutes,
  differenceInHours,
  differenceInDays,
  isPast,
  isFuture,
} from "date-fns";

// =============================================================================
// DURATION FORMATTING
// =============================================================================

/**
 * Format duration in minutes to a human-readable string
 *
 * @example
 * formatDuration(90) // "1hr 30m"
 * formatDuration(45) // "45m"
 * formatDuration(120) // "2hr"
 */
export function formatDuration(minutes: number): string {
  if (minutes <= 0) return "0m";

  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours}hr`;
  }

  return `${hours}hr ${remainingMinutes}m`;
}

/**
 * Format duration in minutes to a longer human-readable format
 *
 * @example
 * formatDurationLong(90) // "1 hour 30 minutes"
 * formatDurationLong(45) // "45 minutes"
 */
export function formatDurationLong(minutes: number): string {
  if (minutes <= 0) return "0 minutes";

  if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? "s" : ""}`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  const hourStr = `${hours} hour${hours !== 1 ? "s" : ""}`;

  if (remainingMinutes === 0) {
    return hourStr;
  }

  return `${hourStr} ${remainingMinutes} minute${remainingMinutes !== 1 ? "s" : ""}`;
}

// =============================================================================
// RELATIVE TIME
// =============================================================================

/**
 * Get human-readable time until a target date
 *
 * @example
 * getTimeUntil(twoHoursFromNow) // "in 2 hours"
 * getTimeUntil(yesterday) // "1 day ago"
 */
export function getTimeUntil(targetDate: Date | string): string {
  const date = typeof targetDate === "string" ? new Date(targetDate) : targetDate;

  if (isNaN(date.getTime())) {
    return "Invalid date";
  }

  return formatDistanceToNow(date, { addSuffix: true });
}

/**
 * Get strict relative time (e.g., "2 hours" instead of "about 2 hours")
 */
export function getTimeUntilStrict(targetDate: Date | string): string {
  const date = typeof targetDate === "string" ? new Date(targetDate) : targetDate;

  if (isNaN(date.getTime())) {
    return "Invalid date";
  }

  return formatDistanceToNowStrict(date, { addSuffix: true });
}

/**
 * Format relative time for display (e.g., "2 hours ago", "just now")
 *
 * @example
 * formatRelativeTime(new Date(Date.now() - 3600000)) // "1 hour ago"
 */
export function formatRelativeTime(date: Date | string): string {
  const targetDate = typeof date === "string" ? new Date(date) : date;

  if (isNaN(targetDate.getTime())) {
    return "Invalid date";
  }

  const now = new Date();
  const diffMinutes = differenceInMinutes(now, targetDate);

  if (Math.abs(diffMinutes) < 1) {
    return "just now";
  }

  if (Math.abs(diffMinutes) < 60) {
    return `${Math.abs(diffMinutes)} minute${Math.abs(diffMinutes) !== 1 ? "s" : ""} ${diffMinutes > 0 ? "ago" : "from now"}`;
  }

  const diffHours = differenceInHours(now, targetDate);
  if (Math.abs(diffHours) < 24) {
    return `${Math.abs(diffHours)} hour${Math.abs(diffHours) !== 1 ? "s" : ""} ${diffHours > 0 ? "ago" : "from now"}`;
  }

  const diffDays = differenceInDays(now, targetDate);
  return `${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? "s" : ""} ${diffDays > 0 ? "ago" : "from now"}`;
}

/**
 * Get a short relative time indicator
 *
 * @example
 * getShortRelativeTime(twoHoursAgo) // "2h ago"
 * getShortRelativeTime(twoDaysFromNow) // "in 2d"
 */
export function getShortRelativeTime(date: Date | string): string {
  const targetDate = typeof date === "string" ? new Date(date) : date;

  if (isNaN(targetDate.getTime())) {
    return "-";
  }

  const now = new Date();
  const diffMinutes = Math.abs(differenceInMinutes(now, targetDate));
  const diffHours = Math.abs(differenceInHours(now, targetDate));
  const diffDays = Math.abs(differenceInDays(now, targetDate));

  const suffix = isPast(targetDate) ? " ago" : "";
  const prefix = isFuture(targetDate) ? "in " : "";

  if (diffMinutes < 1) {
    return "now";
  }
  if (diffMinutes < 60) {
    return `${prefix}${diffMinutes}m${suffix}`;
  }
  if (diffHours < 24) {
    return `${prefix}${diffHours}h${suffix}`;
  }
  if (diffDays < 7) {
    return `${prefix}${diffDays}d${suffix}`;
  }

  const weeks = Math.floor(diffDays / 7);
  return `${prefix}${weeks}w${suffix}`;
}

// =============================================================================
// TIME CONFLICT DETECTION
// =============================================================================

export interface TimeWindow {
  start: Date | string;
  end: Date | string;
}

/**
 * Check if a time slot conflicts with any busy windows
 *
 * @example
 * hasTimeConflict(
 *   { start: new Date('2024-01-15T10:00:00'), end: new Date('2024-01-15T11:00:00') },
 *   [{ start: '2024-01-15T10:30:00', end: '2024-01-15T11:30:00' }]
 * ) // true
 */
export function hasTimeConflict(
  slot: TimeWindow,
  busyWindows: TimeWindow[]
): boolean {
  const slotStart =
    typeof slot.start === "string" ? new Date(slot.start) : slot.start;
  const slotEnd =
    typeof slot.end === "string" ? new Date(slot.end) : slot.end;

  for (const window of busyWindows) {
    const windowStart =
      typeof window.start === "string" ? new Date(window.start) : window.start;
    const windowEnd =
      typeof window.end === "string" ? new Date(window.end) : window.end;

    // Check for overlap: slot starts before window ends AND slot ends after window starts
    if (slotStart < windowEnd && slotEnd > windowStart) {
      return true;
    }
  }

  return false;
}

/**
 * Find all conflicts between a slot and busy windows
 */
export function findTimeConflicts(
  slot: TimeWindow,
  busyWindows: TimeWindow[]
): TimeWindow[] {
  const slotStart =
    typeof slot.start === "string" ? new Date(slot.start) : slot.start;
  const slotEnd =
    typeof slot.end === "string" ? new Date(slot.end) : slot.end;

  const conflicts: TimeWindow[] = [];

  for (const window of busyWindows) {
    const windowStart =
      typeof window.start === "string" ? new Date(window.start) : window.start;
    const windowEnd =
      typeof window.end === "string" ? new Date(window.end) : window.end;

    if (slotStart < windowEnd && slotEnd > windowStart) {
      conflicts.push(window);
    }
  }

  return conflicts;
}

// =============================================================================
// TIME PARSING & CALCULATIONS
// =============================================================================

/**
 * Parse a time string (HH:mm or HH:mm:ss) into hours and minutes.
 */
export function parseTimeString(timeStr: string): { hour: number; minute: number } {
  if (!timeStr) return { hour: 0, minute: 0 };
  const [hourPart, minutePart] = timeStr.split(":");
  const hourValue = Number(hourPart);
  const minuteValue = Number(minutePart);

  const hour = Number.isFinite(hourValue) ? Math.max(0, Math.min(23, hourValue)) : 0;
  const minute = Number.isFinite(minuteValue) ? Math.max(0, Math.min(59, minuteValue)) : 0;

  return { hour, minute };
}

/**
 * Calculate an end time string (HH:mm) from a start time string and duration.
 */
export function calculateEndTime(startTime: string, durationMinutes: number): string {
  const { hour, minute } = parseTimeString(startTime);
  const totalMinutes = hour * 60 + minute + Math.max(0, durationMinutes);
  const normalizedMinutes = totalMinutes % (24 * 60);
  const endHour = Math.floor(normalizedMinutes / 60);
  const endMinute = normalizedMinutes % 60;

  return `${endHour.toString().padStart(2, "0")}:${endMinute.toString().padStart(2, "0")}`;
}

// =============================================================================
// TIME SLOT GENERATION
// =============================================================================

/**
 * Generate time slots for a day
 *
 * @param startHour - Starting hour (0-23)
 * @param endHour - Ending hour (0-23)
 * @param intervalMinutes - Slot interval in minutes
 */
export function generateTimeSlots(
  startHour: number,
  endHour: number,
  intervalMinutes: number = 30
): Array<{ hour: number; minute: number; label: string }> {
  const slots: Array<{ hour: number; minute: number; label: string }> = [];

  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += intervalMinutes) {
      const label = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
      slots.push({ hour, minute, label });
    }
  }

  return slots;
}

/**
 * Round a date to the nearest interval
 *
 * @example
 * roundToNearestInterval(new Date('2024-01-15T10:17:00'), 15) // 2024-01-15T10:15:00
 */
export function roundToNearestInterval(
  date: Date,
  intervalMinutes: number
): Date {
  const ms = intervalMinutes * 60 * 1000;
  return new Date(Math.round(date.getTime() / ms) * ms);
}

/**
 * Get the next available time slot after the current time
 */
export function getNextAvailableSlot(
  intervalMinutes: number = 30,
  minMinutesAhead: number = 0
): Date {
  const now = new Date();
  now.setMinutes(now.getMinutes() + minMinutesAhead);
  return roundToNearestInterval(now, intervalMinutes);
}
