"use server";

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
 */
export type ManualBookingInput = {
	studentId: string;
	serviceId: string | null;
	scheduledAt: string;
	durationMinutes: number;
	timezone: string;
	paymentAmount?: number;
	currency?: string;
	studentNotes?: string;
	sendConfirmationEmail?: boolean;
	paymentOption?: "mark_paid" | "payment_link" | "unpaid";
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
