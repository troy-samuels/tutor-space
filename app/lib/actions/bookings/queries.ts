"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { getActivePackages } from "@/lib/actions/packages";
import { requireTutor, checkAdvanceBookingWindow, checkBookingLimits } from "./helpers";
import type { BookingRecord } from "./types";

// ============================================================================
// List Bookings
// ============================================================================

/**
 * List all bookings for the authenticated tutor.
 * Includes student, service, and package redemption data.
 */
export async function listBookings(): Promise<BookingRecord[]> {
	const { supabase, user } = await requireTutor();
	if (!user) {
		return [];
	}

	const { data } = await supabase
		.from("bookings")
		.select(`
			*,
			students(full_name, email),
			services(name),
			session_package_redemptions(
				id,
				minutes_redeemed,
				status,
				session_package_purchases(
					session_package_templates(name)
				)
			)
		`)
		.eq("tutor_id", user.id)
		.order("scheduled_at", { ascending: true })
		.limit(100);

	return (data as BookingRecord[] | null) ?? [];
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
	const windowStart = new Date(start.getTime() - 3 * 60 * 60000);
	const windowEnd = new Date(end.getTime() + 3 * 60 * 60000);

	const { data: tutorProfile } = await adminClient
		.from("profiles")
		.select("timezone")
		.eq("id", params.tutorId)
		.single();

	const tutorTimezone = tutorProfile?.timezone ?? "UTC";

	const bookingWindow = await checkAdvanceBookingWindow({
		adminClient,
		tutorId: params.tutorId,
		scheduledAt: params.startISO,
		timezone: tutorTimezone,
	});

	if ("error" in bookingWindow) {
		return { error: bookingWindow.error };
	}

	const bookingLimits = await checkBookingLimits({
		adminClient,
		tutorId: params.tutorId,
		scheduledAt: params.startISO,
		timezone: tutorTimezone,
	});

	if ("error" in bookingLimits) {
		return { error: bookingLimits.error };
	}

	const { data: bookings } = await adminClient
		.from("bookings")
		.select("id, scheduled_at, duration_minutes, status")
		.eq("tutor_id", params.tutorId)
		.in("status", ["pending", "confirmed"])
		.gte("scheduled_at", windowStart.toISOString())
		.lte("scheduled_at", windowEnd.toISOString());

	const hasBookingConflict =
		bookings?.some((booking) => {
			const bookingStart = new Date(booking.scheduled_at);
			const bookingEnd = new Date(
				bookingStart.getTime() + (booking.duration_minutes || params.durationMinutes) * 60000
			);
			return bookingStart < end && bookingEnd > start;
		}) ?? false;

	const { data: blockedTimes } = await adminClient
		.from("blocked_times")
		.select("id, start_time, end_time")
		.eq("tutor_id", params.tutorId)
		.lt("start_time", end.toISOString())
		.gt("end_time", start.toISOString());

	const blockedConflict = (blockedTimes?.length ?? 0) > 0;

	return { available: !(hasBookingConflict || blockedConflict) };
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

	if (user) {
		// Get user's profile to check if they're a tutor
		const { data: profile } = await supabase
			.from("profiles")
			.select("id")
			.eq("id", user.id)
			.single();

		// If authenticated as a tutor, verify they own the tutorId
		if (profile) {
			if (profile.id !== params.tutorId) {
				return {
					error: "You can only check packages for your own students.",
					packages: [],
				};
			}
		} else {
			// If authenticated as a student, verify they own the email
			const { data: studentProfile } = await supabase
				.from("students")
				.select("email, user_id")
				.eq("user_id", user.id)
				.single();

			if (studentProfile && studentProfile.email.toLowerCase() !== params.studentEmail.toLowerCase()) {
				return {
					error: "You can only check your own packages.",
					packages: [],
				};
			}
		}
	}

	const adminClient = createServiceRoleClient();

	if (!adminClient) {
		return { packages: [] };
	}

	try {
		// Find student by email and tutor
		const { data: student } = await adminClient
			.from("students")
			.select("id")
			.eq("email", params.studentEmail)
			.eq("tutor_id", params.tutorId)
			.single();

		if (!student) {
			return { packages: [] };
		}

		// Get active packages
		const packages = await getActivePackages(student.id, params.tutorId);

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
	const { supabase, user } = await requireTutor();

	if (!user) {
		return { data: null, error: "You need to be signed in." };
	}

	const { data, error } = await supabase
		.from("bookings")
		.select("id, scheduled_at, duration_minutes, services(name)")
		.eq("tutor_id", user.id)
		.eq("student_id", studentId)
		.in("status", ["pending", "confirmed"])
		.gt("scheduled_at", new Date().toISOString())
		.order("scheduled_at", { ascending: true })
		.limit(1)
		.maybeSingle();

	if (error) {
		console.error("Failed to get next booking:", error);
		return { data: null, error: "Failed to fetch next booking" };
	}

	const rawService = data
		? Array.isArray((data as { services?: unknown }).services)
			? ((data as { services?: { name?: string | null }[] }).services?.[0] ?? null)
			: ((data as { services?: { name?: string | null } }).services ?? null)
		: null;

	const normalized = data
		? {
				id: String(data.id),
				scheduled_at: String(data.scheduled_at),
				duration_minutes: (data as { duration_minutes?: number | null }).duration_minutes ?? null,
				services:
					rawService && typeof rawService === "object"
						? { name: (rawService as { name?: string | null }).name ?? null }
						: null,
			}
		: null;

	return { data: normalized, error: null };
}
