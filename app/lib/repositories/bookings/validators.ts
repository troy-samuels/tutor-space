import type { SupabaseClient } from "@supabase/supabase-js";
import type { BookingConflictCheckResult } from "./index";

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Count bookings in a date range for limit checking.
 */
export async function countBookingsInRange(
	client: SupabaseClient,
	tutorId: string,
	start: Date,
	end: Date,
	excludeBookingId?: string
): Promise<number> {
	let query = client
		.from("bookings")
		.select("id", { count: "exact", head: true })
		.eq("tutor_id", tutorId)
		.is("deleted_at", null)
		.in("status", ["pending", "confirmed"])
		.gte("scheduled_at", start.toISOString())
		.lte("scheduled_at", end.toISOString());

	if (excludeBookingId) {
		query = query.neq("id", excludeBookingId);
	}

	const { count, error } = await query;

	if (error) {
		throw error;
	}

	return count ?? 0;
}

/**
 * Check for booking conflicts in a time range.
 */
export async function checkBookingConflicts(
	client: SupabaseClient,
	tutorId: string,
	start: Date,
	end: Date,
	excludeBookingId?: string
): Promise<BookingConflictCheckResult> {
	// Expand window for buffer checking
	const windowStart = new Date(start.getTime() - 24 * 60 * 60 * 1000);
	const windowEnd = new Date(end.getTime() + 24 * 60 * 60 * 1000);

	let query = client
		.from("bookings")
		.select("id, scheduled_at, duration_minutes")
		.eq("tutor_id", tutorId)
		.is("deleted_at", null)
		.in("status", ["pending", "confirmed"])
		.gte("scheduled_at", windowStart.toISOString())
		.lte("scheduled_at", windowEnd.toISOString());

	if (excludeBookingId) {
		query = query.neq("id", excludeBookingId);
	}

	const { data, error } = await query;

	if (error) {
		throw error;
	}

	const conflicting = (data ?? []).filter((booking) => {
		const bookingStart = new Date(booking.scheduled_at);
		const bookingEnd = new Date(
			bookingStart.getTime() + (booking.duration_minutes || 60) * 60 * 1000
		);
		return bookingStart < end && bookingEnd > start;
	});

	return {
		hasConflict: conflicting.length > 0,
		conflictingBookings: conflicting,
	};
}

/**
 * Check for booking conflicts by finding overlapping bookings.
 * Excludes the specified booking if provided (for updates).
 */
export async function checkConflictsInWindow(
	client: SupabaseClient,
	tutorId: string,
	scheduledAt: string,
	durationMinutes: number,
	excludeBookingId?: string
): Promise<{ hasConflict: boolean; conflicts: Array<{ id: string; scheduled_at: string; duration_minutes: number }> }> {
	const bookingStart = new Date(scheduledAt);
	const bookingEnd = new Date(bookingStart.getTime() + durationMinutes * 60 * 1000);

	// Fetch bookings within ±24 hours
	const windowStart = new Date(bookingStart.getTime() - 24 * 60 * 60 * 1000);
	const windowEnd = new Date(bookingEnd.getTime() + 24 * 60 * 60 * 1000);

	let query = client
		.from("bookings")
		.select("id, scheduled_at, duration_minutes")
		.eq("tutor_id", tutorId)
		.in("status", ["pending", "confirmed"])
		.is("deleted_at", null)
		.gte("scheduled_at", windowStart.toISOString())
		.lte("scheduled_at", windowEnd.toISOString());

	if (excludeBookingId) {
		query = query.neq("id", excludeBookingId);
	}

	const { data, error } = await query;

	if (error) {
		throw error;
	}

	const conflicts = (data ?? []).filter((existing) => {
		const existingStart = new Date(existing.scheduled_at);
		const existingEnd = new Date(existingStart.getTime() + existing.duration_minutes * 60 * 1000);
		return bookingStart < existingEnd && bookingEnd > existingStart;
	});

	return { hasConflict: conflicts.length > 0, conflicts };
}

/**
 * Check for post-insert race conditions using first-come-first-serve logic.
 * Returns true if a conflicting booking was created before our booking.
 */
export async function checkPostInsertConflict(
	client: SupabaseClient,
	tutorId: string,
	bookingId: string,
	bookingCreatedAt: string,
	scheduledAt: string,
	durationMinutes: number
): Promise<boolean> {
	const bookingStart = new Date(scheduledAt);
	const bookingEnd = new Date(bookingStart.getTime() + durationMinutes * 60 * 1000);

	const { data: conflictingBookings } = await client
		.from("bookings")
		.select("id, scheduled_at, duration_minutes, created_at")
		.eq("tutor_id", tutorId)
		.in("status", ["pending", "confirmed"])
		.is("deleted_at", null)
		.neq("id", bookingId)
		.lte("scheduled_at", bookingEnd.toISOString())
		.order("created_at", { ascending: true });

	return (conflictingBookings ?? []).some((existing) => {
		const existingStart = new Date(existing.scheduled_at);
		const existingEnd = new Date(existingStart.getTime() + existing.duration_minutes * 60 * 1000);
		const overlaps = bookingStart < existingEnd && bookingEnd > existingStart;
		return overlaps && new Date(existing.created_at) < new Date(bookingCreatedAt);
	});
}
