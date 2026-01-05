import type { SupabaseClient } from "@supabase/supabase-js";

// ============================================================================
// Types
// ============================================================================

export interface CreateBookingInput {
	readonly tutorId: string;
	readonly studentId: string;
	readonly serviceId: string | null;
	readonly scheduledAt: string;
	readonly durationMinutes: number;
	readonly timezone: string;
	readonly status: string;
	readonly paymentStatus: string;
	readonly paymentAmount: number;
	readonly currency: string | null;
	readonly studentNotes: string | null;
}

export interface BookingResult {
	id: string;
	created_at: string;
}

export interface BookingConflictCheckResult {
	hasConflict: boolean;
	conflictingBookings: Array<{
		id: string;
		scheduled_at: string;
		duration_minutes: number;
	}>;
}

export interface TutorBookingSettings {
	timezone: string | null;
	bufferTimeMinutes: number;
	advanceBookingDaysMin: number;
	advanceBookingDaysMax: number;
	maxLessonsPerDay: number | null;
	maxLessonsPerWeek: number | null;
}

export interface BookingCountResult {
	count: number;
}

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
// Read Operations
// ============================================================================

/**
 * Get a booking by ID with optional related data.
 */
export async function getBookingById(
	client: SupabaseClient,
	bookingId: string,
	options?: {
		includeStudent?: boolean;
		includeService?: boolean;
		includeTutor?: boolean;
	}
): Promise<Record<string, unknown> | null> {
	let selectClause = "*";

	if (options?.includeStudent) {
		selectClause += ", students(id, user_id, full_name, email, timezone)";
	}
	if (options?.includeService) {
		selectClause += ", services(id, name, duration_minutes, price_amount, price_currency)";
	}
	if (options?.includeTutor) {
		selectClause += ", tutor:profiles!bookings_tutor_id_fkey(full_name, email, timezone)";
	}

	const { data, error } = await client
		.from("bookings")
		.select(selectClause)
		.eq("id", bookingId)
		.is("deleted_at", null)
		.single();

	if (error) {
		if (error.code === "PGRST116") {
			return null; // Not found
		}
		throw error;
	}

	return data as unknown as Record<string, unknown> | null;
}

/**
 * List bookings for a tutor with optional filtering.
 */
export async function listBookingsForTutor(
	client: SupabaseClient,
	tutorId: string,
	options?: {
		limit?: number;
		statuses?: string[];
		includeStudent?: boolean;
		includeService?: boolean;
	}
): Promise<Array<Record<string, unknown>>> {
	let selectClause = `
		*,
		session_package_redemptions(
			id,
			minutes_redeemed,
			status,
			session_package_purchases(
				session_package_templates(name)
			)
		)
	`;

	if (options?.includeStudent !== false) {
		selectClause += ", students(full_name, email)";
	}
	if (options?.includeService !== false) {
		selectClause += ", services(name)";
	}

	let query = client
		.from("bookings")
		.select(selectClause)
		.eq("tutor_id", tutorId)
		.is("deleted_at", null)
		.order("scheduled_at", { ascending: true });

	if (options?.statuses) {
		query = query.in("status", options.statuses);
	}

	if (options?.limit) {
		query = query.limit(options.limit);
	}

	const { data, error } = await query;

	if (error) {
		throw error;
	}

	return (data ?? []) as unknown as Array<Record<string, unknown>>;
}

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
 * Get blocked times in a date range.
 */
export async function getBlockedTimesInRange(
	client: SupabaseClient,
	tutorId: string,
	start: Date,
	end: Date
): Promise<Array<{ id: string; start_time: string; end_time: string }>> {
	const { data, error } = await client
		.from("blocked_times")
		.select("id, start_time, end_time")
		.eq("tutor_id", tutorId)
		.lt("start_time", end.toISOString())
		.gt("end_time", start.toISOString());

	if (error) {
		throw error;
	}

	return data ?? [];
}

/**
 * Get tutor's booking-related settings.
 */
export async function getTutorBookingSettings(
	client: SupabaseClient,
	tutorId: string
): Promise<TutorBookingSettings> {
	const { data, error } = await client
		.from("profiles")
		.select(
			"timezone, buffer_time_minutes, advance_booking_days_min, advance_booking_days_max, max_lessons_per_day, max_lessons_per_week"
		)
		.eq("id", tutorId)
		.single();

	if (error) {
		throw error;
	}

	return {
		timezone: data?.timezone ?? null,
		bufferTimeMinutes: data?.buffer_time_minutes ?? 0,
		advanceBookingDaysMin: data?.advance_booking_days_min ?? 0,
		advanceBookingDaysMax: data?.advance_booking_days_max ?? 365,
		maxLessonsPerDay: data?.max_lessons_per_day ?? null,
		maxLessonsPerWeek: data?.max_lessons_per_week ?? null,
	};
}

/**
 * Get availability slots for a tutor.
 */
export async function getTutorAvailability(
	client: SupabaseClient,
	tutorId: string
): Promise<Array<{ day_of_week: number; start_time: string; end_time: string; is_available: boolean }>> {
	const { data, error } = await client
		.from("availability")
		.select("day_of_week, start_time, end_time, is_available")
		.eq("tutor_id", tutorId)
		.eq("is_available", true);

	if (error) {
		throw error;
	}

	return data ?? [];
}

/**
 * Get a service by ID for a specific tutor.
 */
export async function getServiceById(
	client: SupabaseClient,
	serviceId: string,
	tutorId: string
): Promise<Record<string, unknown> | null> {
	const { data, error } = await client
		.from("services")
		.select(
			"id, tutor_id, name, description, duration_minutes, price, price_amount, currency, price_currency, is_active"
		)
		.eq("id", serviceId)
		.eq("tutor_id", tutorId)
		.is("deleted_at", null)
		.single();

	if (error) {
		if (error.code === "PGRST116") {
			return null;
		}
		throw error;
	}

	return data;
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

// ============================================================================
// Student Operations
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
 * Get a student by ID for a specific tutor.
 */
export async function getStudentById(
	client: SupabaseClient,
	studentId: string,
	tutorId: string
): Promise<Record<string, unknown> | null> {
	const { data, error } = await client
		.from("students")
		.select("id, user_id, full_name, email, timezone, status")
		.eq("id", studentId)
		.eq("tutor_id", tutorId)
		.is("deleted_at", null)
		.single();

	if (error) {
		if (error.code === "PGRST116") {
			return null;
		}
		throw error;
	}

	return data;
}

/**
 * Get student by email for a specific tutor.
 */
export async function getStudentByEmail(
	client: SupabaseClient,
	email: string,
	tutorId: string
): Promise<Record<string, unknown> | null> {
	const { data, error } = await client
		.from("students")
		.select("id, user_id, full_name, email, timezone, status")
		.eq("tutor_id", tutorId)
		.eq("email", email.toLowerCase().trim())
		.is("deleted_at", null)
		.single();

	if (error) {
		if (error.code === "PGRST116") {
			return null;
		}
		throw error;
	}

	return data;
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
