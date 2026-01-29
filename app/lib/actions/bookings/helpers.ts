"use server";

import { differenceInCalendarDays, endOfDay, endOfWeek, startOfDay, startOfWeek } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { insertConversationThread, countBookingsInRange } from "@/lib/repositories/bookings";
import type { TutorProfileData } from "./types";

// ============================================================================
// Conversation Thread
// ============================================================================

/**
 * Ensure a conversation thread exists between tutor and student.
 * Creates one if it doesn't exist, ignores duplicate key errors.
 */
export async function ensureConversationThread(
	adminClient: NonNullable<ReturnType<typeof createServiceRoleClient>>,
	tutorId: string,
	studentId: string
): Promise<void> {
	try {
		await insertConversationThread(adminClient, tutorId, studentId);
	} catch (error) {
		// Ignore duplicate key error (thread already exists)
		if (error && typeof error === "object" && "code" in error && error.code !== "23505") {
			console.error("Failed to create conversation thread:", error);
		}
	}
}

// ============================================================================
// Booking Limits Validation
// ============================================================================

/**
 * Check if a booking would exceed the tutor's daily or weekly limits.
 * Returns an error message if limits are exceeded.
 *
 * Profile data must be pre-fetched by the caller (dependency injection).
 * Still async because it queries booking counts.
 */
export async function checkBookingLimits(params: {
	adminClient: NonNullable<ReturnType<typeof createServiceRoleClient>>;
	tutorId: string;
	tutorProfile: Pick<TutorProfileData, 'max_lessons_per_day' | 'max_lessons_per_week'>;
	scheduledAt: string;
	timezone?: string | null;
	excludeBookingId?: string;
}): Promise<{ ok: true } | { error: string }> {
	const { adminClient, tutorId, tutorProfile, scheduledAt, timezone, excludeBookingId } = params;

	const maxDaily = tutorProfile.max_lessons_per_day ?? null;
	const maxWeekly = tutorProfile.max_lessons_per_week ?? null;

	if (!maxDaily && !maxWeekly) {
		return { ok: true };
	}

	const scheduledDate = new Date(scheduledAt);
	let zonedScheduled = scheduledDate;
	if (timezone) {
		try {
			zonedScheduled = toZonedTime(scheduledDate, timezone);
		} catch (timezoneError) {
			console.warn("[Bookings] Invalid timezone for booking limit check", timezoneError);
		}
	}
	const dayStartZoned = startOfDay(zonedScheduled);
	const dayEndZoned = endOfDay(zonedScheduled);
	const weekStartZoned = startOfWeek(zonedScheduled, { weekStartsOn: 0 });
	const weekEndZoned = endOfWeek(zonedScheduled, { weekStartsOn: 0 });

	let dayStart = dayStartZoned;
	let dayEnd = dayEndZoned;
	let weekStart = weekStartZoned;
	let weekEnd = weekEndZoned;

	if (timezone) {
		try {
			dayStart = fromZonedTime(dayStartZoned, timezone);
			dayEnd = fromZonedTime(dayEndZoned, timezone);
			weekStart = fromZonedTime(weekStartZoned, timezone);
			weekEnd = fromZonedTime(weekEndZoned, timezone);
		} catch (timezoneError) {
			console.warn("[Bookings] Invalid timezone for booking limit boundaries", timezoneError);
		}
	}

	if (maxDaily) {
		try {
			const dailyCount = await countBookingsInRange(adminClient, tutorId, dayStart, dayEnd, excludeBookingId);

			if (dailyCount >= maxDaily) {
				return { error: `This tutor has reached the daily booking limit (${maxDaily}).` };
			}
		} catch (dailyError) {
			console.error("[Bookings] Failed to check daily booking limit", dailyError);
			return { error: "Unable to validate daily booking limit. Please try again." };
		}
	}

	if (maxWeekly) {
		try {
			const weeklyCount = await countBookingsInRange(adminClient, tutorId, weekStart, weekEnd, excludeBookingId);

			if (weeklyCount >= maxWeekly) {
				return { error: `This tutor has reached the weekly booking limit (${maxWeekly}).` };
			}
		} catch (weeklyError) {
			console.error("[Bookings] Failed to check weekly booking limit", weeklyError);
			return { error: "Unable to validate weekly booking limit. Please try again." };
		}
	}

	return { ok: true };
}
