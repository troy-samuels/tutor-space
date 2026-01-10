"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { getActivePackages } from "@/lib/actions/packages";
import { requireTutor, checkBookingLimits } from "./helpers";
import type { BookingRecord } from "./types";
import { checkAdvanceBookingWindow } from "./types";
import { addMinutes } from "date-fns";
import { getCalendarBusyWindowsWithStatus } from "@/lib/calendar/busy-windows";
import { validateBooking } from "@/lib/utils/booking-conflicts";
import {
	listBookingsForTutor,
	getTutorProfileBookingSettings,
	findBookingsInTimeRange,
	getBlockedTimesInRange,
	checkUserProfileExists,
	getStudentProfileByUserId,
	getStudentIdByEmailAndTutor,
	getNextBookingForStudent,
	getTutorAvailability,
} from "@/lib/repositories/bookings";

// ============================================================================
// List Bookings
// ============================================================================

/**
 * List all bookings for the authenticated tutor.
 * Includes student, service, and package redemption data.
 */
export async function listBookings(): Promise<BookingRecord[]> {
	const { user } = await requireTutor();
	if (!user) {
		return [];
	}

	const adminClient = createServiceRoleClient();
	if (!adminClient) {
		return [];
	}

	try {
		const data = await listBookingsForTutor(adminClient, user.id, { limit: 100 });
		return (data as unknown as BookingRecord[]) ?? [];
	} catch (error) {
		console.error("Failed to list bookings:", error);
		return [];
	}
}

// ============================================================================
// Slot Availability Check
// ============================================================================

/**
 * Check if a specific time slot is available for a tutor.
 * Used by public booking pages to validate slot availability before booking.
 */
export async function checkSlotAvailabilityForTutor(params: {
	tutorId: string;
	startISO: string;
	durationMinutes: number;
}): Promise<{ available: boolean } | { error: string }> {
	const adminClient = createServiceRoleClient();

	if (!adminClient) {
		return { error: "Service unavailable. Please try again." };
	}

	const start = new Date(params.startISO);
	if (Number.isNaN(start.getTime())) {
		return { error: "Invalid start time." };
	}

	const end = new Date(start.getTime() + params.durationMinutes * 60000);

	// Fetch tutor profile using repository
	let tutorProfile: Awaited<ReturnType<typeof getTutorProfileBookingSettings>>;
	try {
		tutorProfile = await getTutorProfileBookingSettings(adminClient, params.tutorId);
	} catch (error) {
		console.error("Failed to fetch tutor profile:", error);
		return { error: "Could not verify tutor settings. Please try again." };
	}

	const tutorTimezone = tutorProfile?.timezone ?? "UTC";
	const bufferMinutes = tutorProfile?.buffer_time_minutes ?? 0;

	const bookingWindow = checkAdvanceBookingWindow({
		tutorProfile: tutorProfile ?? {},
		scheduledAt: params.startISO,
		timezone: tutorTimezone,
	});

	if ("error" in bookingWindow) {
		return { error: bookingWindow.error };
	}

	const bookingLimits = await checkBookingLimits({
		adminClient,
		tutorId: params.tutorId,
		tutorProfile: tutorProfile ?? {},
		scheduledAt: params.startISO,
		timezone: tutorTimezone,
	});

	if ("error" in bookingLimits) {
		return { error: bookingLimits.error };
	}

	// Fetch bookings using repository
	const bufferedStart = addMinutes(start, -bufferMinutes);
	const bufferedEnd = addMinutes(end, bufferMinutes);

	const [availability, bookings, blockedTimes, busyResult] = await Promise.all([
		getTutorAvailability(adminClient, params.tutorId),
		findBookingsInTimeRange(adminClient, params.tutorId, start),
		getBlockedTimesInRange(adminClient, params.tutorId, bufferedStart, bufferedEnd),
		getCalendarBusyWindowsWithStatus({
			tutorId: params.tutorId,
			start,
			days: 2,
		}),
	]);

	if (busyResult.unverifiedProviders.length) {
		return {
			error:
				"We couldn't verify your external calendar. Please refresh the page or reconnect your calendar and try again.",
		};
	}

	if (busyResult.staleProviders.length) {
		return {
			error:
				"External calendar sync looks stale. Please refresh your calendar connection before booking.",
		};
	}

	const busyWindows = [
		...busyResult.windows,
		...(blockedTimes ?? [])
			.filter((block) => block.start_time && block.end_time)
			.map((block) => ({ start: block.start_time, end: block.end_time })),
	];

	const validation = validateBooking({
		scheduledAt: params.startISO,
		durationMinutes: params.durationMinutes,
		availability: availability || [],
		existingBookings: bookings || [],
		bufferMinutes,
		busyWindows,
		timezone: tutorTimezone,
	});

	return { available: validation.isValid };
}

// ============================================================================
// Student Packages Check
// ============================================================================

/**
 * Check if student has available packages for booking.
 * Used by public booking page to show package redemption option.
 *
 * SECURITY NOTE: This is called from public booking page.
 * - If user is authenticated as a student, verify they own the email
 * - If user is authenticated as a tutor, verify they own the tutorId
 * - Unauthenticated users can check (for booking flow), but should be rate-limited
 */
export async function checkStudentPackages(params: {
	studentEmail: string;
	tutorId: string;
	durationMinutes: number;
}): Promise<{ packages: Array<Record<string, unknown>>; error?: string }> {
	const supabase = await createClient();

	// SECURITY: If user is authenticated, verify authorization
	const {
		data: { user },
	} = await supabase.auth.getUser();

	const adminClient = createServiceRoleClient();
	if (!adminClient) {
		return { packages: [] };
	}

	if (user) {
		// Get user's profile to check if they're a tutor using repository
		try {
			const profile = await checkUserProfileExists(adminClient, user.id);

			// If authenticated as a tutor, verify they own the tutorId
			if (profile) {
				if (profile.id !== params.tutorId) {
					return {
						error: "You can only check packages for your own students.",
						packages: [],
					};
				}
			} else {
				// If authenticated as a student, verify they own the email using repository
				const studentProfile = await getStudentProfileByUserId(adminClient, user.id);

				if (studentProfile && studentProfile.email.toLowerCase() !== params.studentEmail.toLowerCase()) {
					return {
						error: "You can only check your own packages.",
						packages: [],
					};
				}
			}
		} catch (error) {
			console.error("Error checking user authorization:", error);
			// Continue without auth verification for graceful degradation
		}
	}

	try {
		// Find student by email and tutor using repository
		const studentId = await getStudentIdByEmailAndTutor(adminClient, params.studentEmail, params.tutorId);

		if (!studentId) {
			return { packages: [] };
		}

		// Get active packages
		const packages = await getActivePackages(studentId, params.tutorId);

		// Filter packages with enough minutes
		const suitablePackages = packages.filter(
			(pkg) => pkg.remaining_minutes >= params.durationMinutes
		);

		return { packages: suitablePackages };
	} catch (error) {
		console.error("Error checking student packages:", error);
		return { packages: [] };
	}
}

// ============================================================================
// Student Next Booking
// ============================================================================

/**
 * Get the next upcoming booking for a student.
 * Used to auto-populate homework due dates.
 */
export async function getStudentNextBooking(studentId: string): Promise<{
	data:
		| {
				id: string;
				scheduled_at: string;
				duration_minutes: number | null;
				services?: { name: string | null } | null;
		  }
		| null;
	error: string | null;
}> {
	const { user } = await requireTutor();

	if (!user) {
		return { data: null, error: "You need to be signed in." };
	}

	const adminClient = createServiceRoleClient();
	if (!adminClient) {
		return { data: null, error: "Service unavailable." };
	}

	try {
		const data = await getNextBookingForStudent(adminClient, user.id, studentId);
		return { data, error: null };
	} catch (error) {
		console.error("Failed to get next booking:", error);
		return { data: null, error: "Failed to fetch next booking" };
	}
}
