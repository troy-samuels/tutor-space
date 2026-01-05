"use server";

import { differenceInCalendarDays, endOfDay, endOfWeek, startOfDay, startOfWeek } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";

// ============================================================================
// Constants
// ============================================================================

export const MAX_RESCHEDULES = 3;

// ============================================================================
// Status Helpers
// ============================================================================

export const isCancelledStatus = (status?: string | null) =>
	Boolean(status && status.startsWith("cancelled"));

// ============================================================================
// Authentication
// ============================================================================

/**
 * Get the authenticated tutor from the current session.
 * Returns both the supabase client and the user if authenticated.
 */
export async function requireTutor() {
	const supabase = await createClient();
	const {
		data: { user },
		error,
	} = await supabase.auth.getUser();

	if (error || !user) {
		return { supabase, user: null as null };
	}

	return { supabase, user };
}

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
	const { error } = await adminClient
		.from("conversation_threads")
		.insert({ tutor_id: tutorId, student_id: studentId })
		.select("id")
		.single();

	// Ignore duplicate key error (thread already exists)
	if (error && error.code !== "23505") {
		console.error("Failed to create conversation thread:", error);
	}
}

// ============================================================================
// Booking Window Validation
// ============================================================================

/**
 * Check if a booking falls within the tutor's advance booking window.
 * Returns an error message if the booking is too soon or too far in advance.
 */
export async function checkAdvanceBookingWindow(params: {
	adminClient: NonNullable<ReturnType<typeof createServiceRoleClient>>;
	tutorId: string;
	scheduledAt: string;
	timezone?: string | null;
}): Promise<{ ok: true } | { error: string }> {
	const { adminClient, tutorId, scheduledAt, timezone } = params;

	const { data: profile, error } = await adminClient
		.from("profiles")
		.select("advance_booking_days_min, advance_booking_days_max")
		.eq("id", tutorId)
		.single();

	if (error) {
		console.error("[Bookings] Failed to load booking window settings", error);
		return { error: "Unable to validate booking window. Please try again." };
	}

	const minDays = profile?.advance_booking_days_min ?? 0;
	const maxDays = profile?.advance_booking_days_max ?? 365;
	const now = new Date();
	const scheduledDate = new Date(scheduledAt);
	let zonedNow = now;
	let zonedScheduled = scheduledDate;

	if (timezone) {
		try {
			zonedNow = toZonedTime(now, timezone);
			zonedScheduled = toZonedTime(scheduledDate, timezone);
		} catch (timezoneError) {
			console.warn("[Bookings] Invalid timezone for booking window check", timezoneError);
		}
	}

	const daysAhead = differenceInCalendarDays(startOfDay(zonedScheduled), startOfDay(zonedNow));

	if (daysAhead < minDays) {
		return {
			error: `Bookings must be at least ${minDays} day${minDays === 1 ? "" : "s"} in advance.`,
		};
	}

	if (daysAhead > maxDays) {
		return {
			error: `Bookings cannot be more than ${maxDays} day${maxDays === 1 ? "" : "s"} in advance.`,
		};
	}

	return { ok: true };
}

// ============================================================================
// Booking Limits Validation
// ============================================================================

/**
 * Check if a booking would exceed the tutor's daily or weekly limits.
 * Returns an error message if limits are exceeded.
 */
export async function checkBookingLimits(params: {
	adminClient: NonNullable<ReturnType<typeof createServiceRoleClient>>;
	tutorId: string;
	scheduledAt: string;
	timezone?: string | null;
	excludeBookingId?: string;
}): Promise<{ ok: true } | { error: string }> {
	const { adminClient, tutorId, scheduledAt, timezone, excludeBookingId } = params;

	const { data: profile, error } = await adminClient
		.from("profiles")
		.select("max_lessons_per_day, max_lessons_per_week")
		.eq("id", tutorId)
		.single();

	if (error) {
		console.error("[Bookings] Failed to load booking limits", error);
		return { error: "Unable to validate booking limits. Please try again." };
	}

	const maxDaily = profile?.max_lessons_per_day ?? null;
	const maxWeekly = profile?.max_lessons_per_week ?? null;

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

	const buildCountQuery = (start: Date, end: Date) => {
		let query = adminClient
			.from("bookings")
			.select("id", { count: "exact", head: true })
			.eq("tutor_id", tutorId)
			.in("status", ["pending", "confirmed"])
			.gte("scheduled_at", start.toISOString())
			.lte("scheduled_at", end.toISOString());

		if (excludeBookingId) {
			query = query.neq("id", excludeBookingId);
		}

		return query;
	};

	if (maxDaily) {
		const { count: dailyCount, error: dailyError } = await buildCountQuery(dayStart, dayEnd);
		if (dailyError) {
			console.error("[Bookings] Failed to check daily booking limit", dailyError);
			return { error: "Unable to validate daily booking limit. Please try again." };
		}

		if ((dailyCount ?? 0) >= maxDaily) {
			return { error: `This tutor has reached the daily booking limit (${maxDaily}).` };
		}
	}

	if (maxWeekly) {
		const { count: weeklyCount, error: weeklyError } = await buildCountQuery(weekStart, weekEnd);
		if (weeklyError) {
			console.error("[Bookings] Failed to check weekly booking limit", weeklyError);
			return { error: "Unable to validate weekly booking limit. Please try again." };
		}

		if ((weeklyCount ?? 0) >= maxWeekly) {
			return { error: `This tutor has reached the weekly booking limit (${maxWeekly}).` };
		}
	}

	return { ok: true };
}
