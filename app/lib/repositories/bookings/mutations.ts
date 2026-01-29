import type { SupabaseClient } from "@supabase/supabase-js";
import { upsertThread } from "@/lib/repositories/messaging";
import type { BookingResult, CreateBookingInput } from "./index";

// ============================================================================
// Create Operations
// ============================================================================

/**
 * Insert a booking atomically using the database RPC function.
 * This prevents race conditions with concurrent booking attempts.
 */
export async function insertBookingAtomic(
	client: SupabaseClient,
	input: CreateBookingInput
): Promise<BookingResult> {
	const { data, error } = await client.rpc("create_booking_atomic", {
		p_tutor_id: input.tutorId,
		p_student_id: input.studentId,
		p_service_id: input.serviceId,
		p_scheduled_at: input.scheduledAt,
		p_duration_minutes: input.durationMinutes,
		p_timezone: input.timezone,
		p_status: input.status,
		p_payment_status: input.paymentStatus,
		p_payment_amount: input.paymentAmount,
		p_currency: input.currency,
		p_student_notes: input.studentNotes,
	});

	if (error) {
		throw error;
	}

	const result = Array.isArray(data) ? data[0] : data;
	if (!result) {
		throw new Error("Booking creation returned no data");
	}

	return result as BookingResult;
}

// ============================================================================
// Update Operations
// ============================================================================

/**
 * Update booking status.
 */
export async function updateBookingStatus(
	client: SupabaseClient,
	bookingId: string,
	tutorId: string,
	status: string,
	metadata?: {
		paymentStatus?: string;
		cancelledAt?: string;
		cancelledBy?: string;
	}
): Promise<void> {
	const updateData: Record<string, unknown> = {
		status,
		updated_at: new Date().toISOString(),
	};

	if (metadata?.paymentStatus) {
		updateData.payment_status = metadata.paymentStatus;
	}
	if (metadata?.cancelledAt) {
		updateData.cancelled_at = metadata.cancelledAt;
	}
	if (metadata?.cancelledBy) {
		updateData.cancelled_by = metadata.cancelledBy;
	}

	const { error } = await client
		.from("bookings")
		.update(updateData)
		.eq("id", bookingId)
		.eq("tutor_id", tutorId);

	if (error) {
		throw error;
	}
}

/**
 * Update booking schedule (for reschedule).
 */
export async function updateBookingSchedule(
	client: SupabaseClient,
	bookingId: string,
	newScheduledAt: string,
	durationMinutes: number,
	timezone: string,
	metadata: {
		rescheduleCount: number;
		requestedBy: "tutor" | "student";
		reason?: string | null;
	}
): Promise<Record<string, unknown>> {
	const { data, error } = await client
		.from("bookings")
		.update({
			scheduled_at: newScheduledAt,
			duration_minutes: durationMinutes,
			timezone,
			reschedule_count: metadata.rescheduleCount,
			reschedule_requested_at: new Date().toISOString(),
			reschedule_requested_by: metadata.requestedBy,
			reschedule_reason: metadata.reason ?? null,
			updated_at: new Date().toISOString(),
		})
		.eq("id", bookingId)
		.select("*, students(full_name, email), services(name)")
		.single();

	if (error) {
		throw error;
	}

	return data;
}

/**
 * Update booking with meeting URL.
 */
export async function updateBookingMeetingUrl(
	client: SupabaseClient,
	bookingId: string,
	tutorId: string,
	meetingUrl: string,
	meetingProvider: string
): Promise<void> {
	const { error } = await client
		.from("bookings")
		.update({
			meeting_url: meetingUrl,
			meeting_provider: meetingProvider,
		})
		.eq("id", bookingId)
		.eq("tutor_id", tutorId);

	if (error) {
		throw error;
	}
}

/**
 * Update booking with short code for memorable classroom URLs.
 */
export async function updateBookingShortCode(
	client: SupabaseClient,
	bookingId: string,
	shortCode: string
): Promise<void> {
	const { error } = await client
		.from("bookings")
		.update({ short_code: shortCode })
		.eq("id", bookingId);

	if (error) {
		throw error;
	}
}

/**
 * Update booking payment status and mark as paid.
 */
export async function markBookingPaid(
	client: SupabaseClient,
	bookingId: string,
	tutorId: string
): Promise<void> {
	const { error } = await client
		.from("bookings")
		.update({
			status: "confirmed",
			payment_status: "paid",
			updated_at: new Date().toISOString(),
		})
		.eq("id", bookingId)
		.eq("tutor_id", tutorId);

	if (error) {
		throw error;
	}
}

/**
 * Store Stripe checkout session ID on booking.
 */
export async function updateBookingCheckoutSession(
	client: SupabaseClient,
	bookingId: string,
	checkoutSessionId: string
): Promise<void> {
	const { error } = await client
		.from("bookings")
		.update({ stripe_checkout_session_id: checkoutSessionId })
		.eq("id", bookingId);

	if (error) {
		throw error;
	}
}

// ============================================================================
// Delete Operations
// ============================================================================

/**
 * Soft delete a booking by setting deleted_at timestamp.
 * Returns success/error result instead of throwing.
 */
export async function softDeleteBooking(
	client: SupabaseClient,
	bookingId: string,
	tutorId: string
): Promise<{ success: boolean; error?: string }> {
	const { error } = await client
		.from("bookings")
		.update({ deleted_at: new Date().toISOString() })
		.eq("id", bookingId)
		.eq("tutor_id", tutorId)
		.is("deleted_at", null);

	if (error) {
		return { success: false, error: error.message };
	}
	return { success: true };
}

/**
 * Hard delete a booking (used only for race condition cleanup).
 * @deprecated Use softDeleteBooking() for normal deletion.
 */
export async function deleteBooking(
	client: SupabaseClient,
	bookingId: string,
	tutorId: string
): Promise<void> {
	const { error } = await client
		.from("bookings")
		.delete()
		.eq("id", bookingId)
		.eq("tutor_id", tutorId);

	if (error) {
		throw error;
	}
}

/**
 * Hard delete a booking by ID (used for race condition rollback).
 */
export async function hardDeleteBooking(
	client: SupabaseClient,
	bookingId: string,
	tutorId: string
): Promise<void> {
	const { error } = await client
		.from("bookings")
		.delete()
		.eq("id", bookingId)
		.eq("tutor_id", tutorId);

	if (error) {
		throw error;
	}
}

// ============================================================================
// Student Operations (Write)
// ============================================================================

/**
 * Get or create a student record.
 */
export async function getOrCreateStudent(
	client: SupabaseClient,
	tutorId: string,
	studentData: {
		email: string;
		fullName: string;
		phone?: string | null;
		timezone?: string;
		parentName?: string | null;
		parentEmail?: string | null;
		parentPhone?: string | null;
		userId?: string | null;
		source?: string;
	}
): Promise<{ id: string; user_id: string | null; isNew: boolean }> {
	// Check if student exists (exclude soft-deleted)
	const { data: existing, error: existingError } = await client
		.from("students")
		.select("id, user_id, status")
		.eq("tutor_id", tutorId)
		.eq("email", studentData.email.toLowerCase().trim())
		.is("deleted_at", null)
		.single();

	if (existingError && existingError.code !== "PGRST116") {
		throw existingError;
	}

	if (existing) {
		// Update existing student
		const updatePayload: Record<string, unknown> = {
			full_name: studentData.fullName,
			phone: studentData.phone,
			timezone: studentData.timezone || "UTC",
			parent_name: studentData.parentName,
			parent_email: studentData.parentEmail,
			parent_phone: studentData.parentPhone,
			updated_at: new Date().toISOString(),
		};

		if (!existing.user_id && studentData.userId) {
			updatePayload.user_id = studentData.userId;
		}

		await client
			.from("students")
			.update(updatePayload)
			.eq("id", existing.id)
			.eq("tutor_id", tutorId);

		return {
			id: existing.id,
			user_id: existing.user_id ?? studentData.userId ?? null,
			isNew: false,
		};
	}

	// Create new student
	const { data: newStudent, error: createError } = await client
		.from("students")
		.insert({
			tutor_id: tutorId,
			user_id: studentData.userId ?? null,
			full_name: studentData.fullName,
			email: studentData.email.toLowerCase().trim(),
			phone: studentData.phone,
			timezone: studentData.timezone || "UTC",
			parent_name: studentData.parentName,
			parent_email: studentData.parentEmail,
			parent_phone: studentData.parentPhone,
			source: studentData.source || "booking_page",
		})
		.select("id, user_id")
		.single();

	if (createError) {
		throw createError;
	}

	return {
		id: newStudent.id,
		user_id: newStudent.user_id,
		isNew: true,
	};
}

/**
 * Update student calendar access status.
 */
export async function updateStudentAccessStatus(
	client: SupabaseClient,
	studentId: string,
	tutorId: string,
	status: "approved" | "pending" | "denied"
): Promise<void> {
	const { error } = await client
		.from("students")
		.update({
			calendar_access_status: status,
			access_approved_at: status === "approved" ? new Date().toISOString() : null,
			updated_at: new Date().toISOString(),
		})
		.eq("id", studentId)
		.eq("tutor_id", tutorId);

	if (error) {
		throw error;
	}
}

/**
 * Create a new student record.
 */
export async function createStudent(
	client: SupabaseClient,
	tutorId: string,
	studentData: {
		fullName: string;
		email: string;
		phone?: string | null;
		timezone?: string;
		parentName?: string | null;
		parentEmail?: string | null;
		parentPhone?: string | null;
		userId?: string | null;
		source?: string;
		calendarAccessStatus?: string;
	}
): Promise<{ id: string; user_id: string | null }> {
	const { data, error } = await client
		.from("students")
		.insert({
			tutor_id: tutorId,
			user_id: studentData.userId ?? null,
			full_name: studentData.fullName,
			email: studentData.email.toLowerCase().trim(),
			phone: studentData.phone ?? null,
			timezone: studentData.timezone || "UTC",
			parent_name: studentData.parentName ?? null,
			parent_email: studentData.parentEmail ?? null,
			parent_phone: studentData.parentPhone ?? null,
			source: studentData.source || "booking_page",
			calendar_access_status: studentData.calendarAccessStatus || "pending",
		})
		.select("id, user_id")
		.single();

	if (error) {
		throw error;
	}

	return data;
}

/**
 * Update student fields.
 */
export async function updateStudent(
	client: SupabaseClient,
	studentId: string,
	tutorId: string,
	updates: {
		fullName?: string;
		phone?: string | null;
		timezone?: string;
		parentName?: string | null;
		parentEmail?: string | null;
		parentPhone?: string | null;
		userId?: string | null;
		calendarAccessStatus?: string;
		accessApprovedAt?: string | null;
	}
): Promise<void> {
	const updatePayload: Record<string, unknown> = {
		updated_at: new Date().toISOString(),
	};

	if (updates.fullName !== undefined) updatePayload.full_name = updates.fullName;
	if (updates.phone !== undefined) updatePayload.phone = updates.phone;
	if (updates.timezone !== undefined) updatePayload.timezone = updates.timezone;
	if (updates.parentName !== undefined) updatePayload.parent_name = updates.parentName;
	if (updates.parentEmail !== undefined) updatePayload.parent_email = updates.parentEmail;
	if (updates.parentPhone !== undefined) updatePayload.parent_phone = updates.parentPhone;
	if (updates.userId !== undefined) updatePayload.user_id = updates.userId;
	if (updates.calendarAccessStatus !== undefined) updatePayload.calendar_access_status = updates.calendarAccessStatus;
	if (updates.accessApprovedAt !== undefined) updatePayload.access_approved_at = updates.accessApprovedAt;

	const { error } = await client
		.from("students")
		.update(updatePayload)
		.eq("id", studentId)
		.eq("tutor_id", tutorId);

	if (error) {
		throw error;
	}
}

// ============================================================================
// Student Stripe Operations (Write)
// ============================================================================

/**
 * Update student's Stripe customer ID.
 */
export async function updateStudentStripeCustomerId(
	client: SupabaseClient,
	studentProfileId: string,
	stripeCustomerId: string
): Promise<void> {
	const { error } = await client
		.from("profiles")
		.update({ stripe_customer_id: stripeCustomerId })
		.eq("id", studentProfileId);

	if (error) {
		throw error;
	}
}

// ============================================================================
// Student-Tutor Connection Operations (Write)
// ============================================================================

/**
 * Upsert student-tutor connection.
 */
export async function upsertStudentTutorConnection(
	client: SupabaseClient,
	studentUserId: string,
	tutorId: string,
	status: string = "approved",
	initialMessage?: string
): Promise<void> {
	const { error } = await client.from("student_tutor_connections").upsert(
		{
			student_user_id: studentUserId,
			tutor_id: tutorId,
			status,
			requested_at: new Date().toISOString(),
			resolved_at: status === "approved" ? new Date().toISOString() : null,
			initial_message: initialMessage ?? "Auto-approved from booking",
		},
		{
			onConflict: "student_user_id,tutor_id",
		}
	);

	if (error) {
		// Table might not exist in some environments
		if (error.code === "42P01") {
			console.warn("[Repository] student_tutor_connections table not found, skipping upsert");
			return;
		}
		throw error;
	}
}

// ============================================================================
// Conversation Thread Operations
// ============================================================================

/**
 * Insert a conversation thread between tutor and student.
 * Uses upsert to avoid duplicates.
 */
export async function insertConversationThread(
	client: SupabaseClient,
	tutorId: string,
	studentId: string
): Promise<void> {
	const { error } = await upsertThread(
		client,
		{ tutorId, studentId },
		{ ignoreDuplicates: true }
	);

	if (error) {
		// Table might not exist or other issues
		if (error.code === "42P01") {
			console.warn("[Repository] conversation_threads table not found, skipping insert");
			return;
		}
		throw error;
	}
}

// ============================================================================
// Combined Mutations for Booking Flow
// ============================================================================

/**
 * Create or update student with connection management.
 * Handles:
 * - Creating new student or updating existing
 * - Managing student-tutor connections
 * - Setting calendar access status
 */
export async function createStudentWithConnection(
	client: SupabaseClient,
	tutorId: string,
	studentData: {
		email: string;
		fullName: string;
		phone?: string | null;
		timezone?: string;
		parentName?: string | null;
		parentEmail?: string | null;
		parentPhone?: string | null;
	},
	connectionOptions?: {
		studentUserId?: string | null;
		autoApprove?: boolean;
	}
): Promise<{ studentId: string; studentProfileId: string | null; isNew: boolean }> {
	const normalizedEmail = studentData.email.toLowerCase().trim();

	// Check for existing student
	const { data: existing, error: existingError } = await client
		.from("students")
		.select("id, user_id, status")
		.eq("tutor_id", tutorId)
		.eq("email", normalizedEmail)
		.is("deleted_at", null)
		.maybeSingle();

	if (existingError && existingError.code !== "PGRST116") {
		throw existingError;
	}

	let studentId: string;
	let studentProfileId: string | null = connectionOptions?.studentUserId ?? null;
	let isNew = false;

	if (existing) {
		studentId = existing.id;
		studentProfileId = existing.user_id ?? studentProfileId;

		// Update existing student
		const updatePayload: Record<string, unknown> = {
			full_name: studentData.fullName,
			phone: studentData.phone,
			timezone: studentData.timezone || "UTC",
			parent_name: studentData.parentName,
			parent_email: studentData.parentEmail,
			parent_phone: studentData.parentPhone,
			updated_at: new Date().toISOString(),
		};

		if (!existing.user_id && connectionOptions?.studentUserId) {
			updatePayload.user_id = connectionOptions.studentUserId;
		}

		await client
			.from("students")
			.update(updatePayload)
			.eq("id", studentId)
			.eq("tutor_id", tutorId);
	} else {
		// Create new student
		const { data: newStudent, error: createError } = await client
			.from("students")
			.insert({
				tutor_id: tutorId,
				user_id: connectionOptions?.studentUserId ?? null,
				full_name: studentData.fullName,
				email: normalizedEmail,
				phone: studentData.phone ?? null,
				timezone: studentData.timezone || "UTC",
				parent_name: studentData.parentName ?? null,
				parent_email: studentData.parentEmail ?? null,
				parent_phone: studentData.parentPhone ?? null,
				source: "booking_page",
			})
			.select("id, user_id")
			.single();

		if (createError) {
			throw createError;
		}

		studentId = newStudent.id;
		studentProfileId = newStudent.user_id ?? studentProfileId;
		isNew = true;
	}

	// Auto-approve connection if specified and user is logged in
	if (connectionOptions?.autoApprove && connectionOptions?.studentUserId) {
		try {
			await client.from("student_tutor_connections").upsert(
				{
					student_user_id: connectionOptions.studentUserId,
					tutor_id: tutorId,
					status: "approved",
					requested_at: new Date().toISOString(),
					resolved_at: new Date().toISOString(),
					initial_message: "Auto-approved from booking",
				},
				{ onConflict: "student_user_id,tutor_id" }
			);

			// Also update calendar access status
			await client
				.from("students")
				.update({
					calendar_access_status: "approved",
					access_approved_at: new Date().toISOString(),
					updated_at: new Date().toISOString(),
				})
				.eq("id", studentId)
				.eq("tutor_id", tutorId);
		} catch (connectionError) {
			// Non-fatal - log and continue
			console.warn("[Repository] Connection sync failed:", connectionError);
		}
	}

	return { studentId, studentProfileId, isNew };
}
