import { differenceInCalendarDays, startOfDay } from "date-fns";
import { toZonedTime } from "date-fns-tz";

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
// Tutor Profile Data Type (for dependency injection)
// ============================================================================

/**
 * Pre-fetched tutor profile data for booking validation.
 * Eliminates redundant database queries by passing data through (dependency injection).
 */
export type TutorProfileData = {
	// Booking window settings
	advance_booking_days_min?: number | null;
	advance_booking_days_max?: number | null;
	// Booking limits
	max_lessons_per_day?: number | null;
	max_lessons_per_week?: number | null;
	// Buffer and timezone
	buffer_time_minutes?: number | null;
	timezone?: string | null;
	// Contact/payment (for emails)
	full_name?: string | null;
	email?: string | null;
	payment_instructions?: string | null;
	venmo_handle?: string | null;
	paypal_email?: string | null;
	zelle_phone?: string | null;
	stripe_payment_link?: string | null;
	custom_payment_url?: string | null;
	// Video settings
	video_provider?: string | null;
	zoom_personal_link?: string | null;
	google_meet_link?: string | null;
	microsoft_teams_link?: string | null;
	calendly_link?: string | null;
	custom_video_url?: string | null;
	custom_video_name?: string | null;
	// Stripe Connect
	stripe_account_id?: string | null;
	stripe_charges_enabled?: boolean | null;
	stripe_payouts_enabled?: boolean | null;
	stripe_onboarding_status?: string | null;
};

// ============================================================================
// Advance Booking Window Validation
// ============================================================================

/**
 * Check if a booking falls within the tutor's advance booking window.
 * Returns an error message if the booking is too soon or too far in advance.
 *
 * This is a synchronous function - profile data must be pre-fetched by the caller.
 */
export function checkAdvanceBookingWindow(params: {
	tutorProfile: Pick<TutorProfileData, 'advance_booking_days_min' | 'advance_booking_days_max'>;
	scheduledAt: string;
	timezone?: string | null;
}): { ok: true } | { error: string } {
	const { tutorProfile, scheduledAt, timezone } = params;

	const minDays = tutorProfile.advance_booking_days_min ?? 0;
	const maxDays = tutorProfile.advance_booking_days_max ?? 365;
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
// Booking Record Type
// ============================================================================

/**
 * Booking record type returned from queries with joined relations.
 * This is the canonical type for booking data across the application.
 */
export type BookingRecord = {
	id: string;
	tutor_id: string;
	student_id: string;
	service_id: string | null;
	scheduled_at: string;
	duration_minutes: number;
	timezone: string;
	status: string;
	payment_status: string;
	payment_amount: number | null;
	currency: string | null;
	student_notes: string | null;
	meeting_url?: string | null;
	meeting_provider?: string | null;
	created_at: string;
	updated_at: string;
	students?: {
		id?: string;
		full_name: string;
		email: string;
	} | null;
	services?: {
		name: string;
	} | null;
	tutor?: {
		full_name: string;
		email?: string | null;
	} | null;
	session_package_redemptions?: Array<{
		id: string;
		minutes_redeemed: number;
		status: string;
		session_package_purchases?: {
			session_package_templates?: {
				name: string;
			} | null;
		} | null;
	}> | null;
};

// ============================================================================
// Booking Input Types
// ============================================================================

/**
 * Input type for creating a booking manually (tutor-initiated).
 * Uses snake_case to match database columns and existing component usage.
 */
export type ManualBookingInput = {
	service_id: string;
	student_id?: string;
	new_student?: {
		name: string;
		email: string;
		timezone: string;
	};
	scheduled_at: string;
	duration_minutes: number;
	timezone: string;
	notes?: string;
	payment_option: "send_link" | "already_paid" | "free";
	clientMutationId?: string; // Optional: Idempotency key to prevent duplicate bookings
};

/**
 * Input type for public booking flow (student-initiated).
 */
export type CreateBookingInput = {
	tutorId: string;
	studentEmail: string;
	studentName: string;
	studentPhone?: string;
	studentTimezone: string;
	serviceId: string | null;
	scheduledAt: string;
	durationMinutes: number;
	studentNotes?: string;
	packageId?: string;
	subscriptionId?: string;
};
