import type { SupabaseClient } from "@supabase/supabase-js";
import { upsertThread } from "@/lib/repositories/messaging";

// ============================================================================
// Extended Types for Full Profile Data
// ============================================================================

export interface FullTutorProfile {
	full_name: string | null;
	email: string | null;
	timezone: string | null;
	buffer_time_minutes: number | null;
	advance_booking_days_min: number | null;
	advance_booking_days_max: number | null;
	max_lessons_per_day: number | null;
	max_lessons_per_week: number | null;
	payment_instructions: string | null;
	venmo_handle: string | null;
	paypal_email: string | null;
	zelle_phone: string | null;
	stripe_payment_link: string | null;
	custom_payment_url: string | null;
	video_provider: string | null;
	zoom_personal_link: string | null;
	google_meet_link: string | null;
	microsoft_teams_link: string | null;
	calendly_link: string | null;
	custom_video_url: string | null;
	custom_video_name: string | null;
	stripe_account_id: string | null;
	stripe_charges_enabled: boolean | null;
	stripe_payouts_enabled: boolean | null;
	stripe_onboarding_status: string | null;
}

export interface ServiceRecord {
	id: string;
	tutor_id: string;
	name: string;
	description: string | null;
	duration_minutes: number;
	price: number | null;
	price_amount: number | null;
	currency: string | null;
	price_currency: string | null;
	is_active: boolean;
}

export interface StudentRecord {
	id: string;
	user_id: string | null;
	full_name: string;
	email: string;
	timezone: string | null;
	status: string;
}

export interface BookingWithRelations {
	id: string;
	tutor_id: string;
	student_id: string;
	status: string;
	scheduled_at: string;
	duration_minutes: number;
	timezone: string | null;
	payment_status: string | null;
	payment_amount: number | null;
	currency: string | null;
	meeting_url: string | null;
	meeting_provider: string | null;
	reschedule_count: number | null;
	students: StudentRecord | StudentRecord[] | null;
	services: ServiceRecord | ServiceRecord[] | null;
	tutor?: FullTutorProfile | FullTutorProfile[] | null;
}

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
 * Get booking by short code for redirect routing.
 */
export async function getBookingByShortCode(
	client: SupabaseClient,
	shortCode: string
): Promise<{ id: string; tutor_id: string } | null> {
	const { data, error } = await client
		.from("bookings")
		.select("id, tutor_id")
		.eq("short_code", shortCode)
		.is("deleted_at", null)
		.single();

	if (error) {
		if (error.code === "PGRST116") {
			return null; // Not found
		}
		throw error;
	}

	return data as { id: string; tutor_id: string };
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

// ============================================================================
// Tutor Profile Operations
// ============================================================================

/**
 * Tutor profile record with payment and video settings.
 */
export interface TutorProfileRecord {
	full_name: string | null;
	email: string | null;
	timezone: string | null;
	payment_instructions: string | null;
	venmo_handle: string | null;
	paypal_email: string | null;
	zelle_phone: string | null;
	stripe_payment_link: string | null;
	custom_payment_url: string | null;
	video_provider: string | null;
	zoom_personal_link: string | null;
	google_meet_link: string | null;
	microsoft_teams_link: string | null;
	calendly_link: string | null;
	custom_video_url: string | null;
	custom_video_name: string | null;
	stripe_account_id: string | null;
	stripe_charges_enabled: boolean | null;
	stripe_payouts_enabled: boolean | null;
	stripe_onboarding_status: string | null;
}

/**
 * Get tutor profile with payment and video settings.
 */
export async function getTutorProfile(
	client: SupabaseClient,
	tutorId: string,
	fields?: string
): Promise<TutorProfileRecord | null> {
	const selectFields = fields ?? `
		full_name, email, timezone,
		payment_instructions, venmo_handle, paypal_email, zelle_phone,
		stripe_payment_link, custom_payment_url,
		video_provider, zoom_personal_link, google_meet_link,
		microsoft_teams_link, calendly_link, custom_video_url, custom_video_name,
		stripe_account_id, stripe_charges_enabled, stripe_payouts_enabled, stripe_onboarding_status
	`;

	const { data, error } = await client
		.from("profiles")
		.select(selectFields)
		.eq("id", tutorId)
		.single();

	if (error) {
		if (error.code === "PGRST116") {
			return null;
		}
		throw error;
	}

	return data as unknown as TutorProfileRecord;
}

// ============================================================================
// Student Stripe Operations
// ============================================================================

/**
 * Get student profile Stripe info.
 */
export async function getStudentStripeInfo(
	client: SupabaseClient,
	studentProfileId: string
): Promise<{ stripe_customer_id: string | null; email: string; full_name: string } | null> {
	const { data, error } = await client
		.from("profiles")
		.select("stripe_customer_id, email, full_name")
		.eq("id", studentProfileId)
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
// Student-Tutor Connection Operations
// ============================================================================

/**
 * Student-tutor connection record.
 */
export interface StudentTutorConnection {
	id: string;
	student_user_id: string;
	tutor_id: string;
	status: string;
	requested_at: string | null;
	resolved_at: string | null;
	initial_message: string | null;
}

/**
 * Get student-tutor connection by user and tutor IDs.
 */
export async function getStudentTutorConnection(
	client: SupabaseClient,
	studentUserId: string,
	tutorId: string
): Promise<StudentTutorConnection | null> {
	const { data, error } = await client
		.from("student_tutor_connections")
		.select("id, student_user_id, tutor_id, status, requested_at, resolved_at, initial_message")
		.eq("student_user_id", studentUserId)
		.eq("tutor_id", tutorId)
		.maybeSingle();

	if (error) {
		// Table might not exist in some environments
		if (error.code === "42P01") {
			return null;
		}
		throw error;
	}

	return data;
}

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
// Extended Query Operations
// ============================================================================

/**
 * Get active service for a tutor by service ID.
 */
export async function getActiveServiceForTutor(
	client: SupabaseClient,
	serviceId: string,
	tutorId: string
): Promise<ServiceRecord | null> {
	const { data, error } = await client
		.from("services")
		.select(`
			id,
			tutor_id,
			name,
			description,
			duration_minutes,
			price,
			price_amount,
			currency,
			price_currency,
			is_active
		`)
		.eq("id", serviceId)
		.eq("tutor_id", tutorId)
		.eq("is_active", true)
		.is("deleted_at", null)
		.single();

	if (error) {
		if (error.code === "PGRST116") {
			return null;
		}
		throw error;
	}

	return data as ServiceRecord;
}

/**
 * Get full tutor profile with all booking-related settings.
 */
export async function getFullTutorProfileForBooking(
	client: SupabaseClient,
	tutorId: string
): Promise<FullTutorProfile | null> {
	const { data, error } = await client
		.from("profiles")
		.select(`
			full_name, email, timezone,
			buffer_time_minutes,
			advance_booking_days_min, advance_booking_days_max,
			max_lessons_per_day, max_lessons_per_week,
			payment_instructions, venmo_handle, paypal_email, zelle_phone,
			stripe_payment_link, custom_payment_url,
			video_provider, zoom_personal_link, google_meet_link, microsoft_teams_link,
			calendly_link, custom_video_url, custom_video_name,
			stripe_account_id, stripe_charges_enabled, stripe_payouts_enabled, stripe_onboarding_status
		`)
		.eq("id", tutorId)
		.single();

	if (error) {
		if (error.code === "PGRST116") {
			return null;
		}
		throw error;
	}

	return data as FullTutorProfile;
}

/**
 * Get booking with full relations for cancel operation.
 */
export async function getBookingForCancel(
	client: SupabaseClient,
	bookingId: string
): Promise<BookingWithRelations | null> {
	const { data, error } = await client
		.from("bookings")
		.select(`
			id,
			tutor_id,
			student_id,
			status,
			scheduled_at,
			duration_minutes,
			timezone,
			payment_status,
			payment_amount,
			currency,
			meeting_url,
			meeting_provider,
			reschedule_count,
			services (
				id,
				name,
				duration_minutes
			),
			students (
				id,
				user_id,
				full_name,
				email,
				timezone
			),
			tutor:profiles!bookings_tutor_id_fkey (
				full_name,
				email
			)
		`)
		.eq("id", bookingId)
		.is("deleted_at", null)
		.single();

	if (error) {
		if (error.code === "PGRST116") {
			return null;
		}
		throw error;
	}

	return data as unknown as BookingWithRelations;
}

/**
 * Get booking with full relations for reschedule operation.
 */
export async function getBookingForReschedule(
	client: SupabaseClient,
	bookingId: string
): Promise<BookingWithRelations | null> {
	const { data, error } = await client
		.from("bookings")
		.select(`
			id,
			tutor_id,
			student_id,
			scheduled_at,
			duration_minutes,
			status,
			timezone,
			reschedule_count,
			payment_status,
			payment_amount,
			currency,
			meeting_url,
			meeting_provider,
			students (
				id,
				user_id,
				full_name,
				email
			),
			services (
				id,
				name,
				duration_minutes
			)
		`)
		.eq("id", bookingId)
		.is("deleted_at", null)
		.single();

	if (error) {
		if (error.code === "PGRST116") {
			return null;
		}
		throw error;
	}

	return data as unknown as BookingWithRelations;
}

/**
 * Get booking with relations for payment operations.
 */
export async function getBookingForPayment(
	client: SupabaseClient,
	bookingId: string,
	tutorId: string
): Promise<BookingWithRelations | null> {
	const { data, error } = await client
		.from("bookings")
		.select(`
			id,
			tutor_id,
			student_id,
			status,
			payment_status,
			scheduled_at,
			duration_minutes,
			timezone,
			payment_amount,
			currency,
			meeting_url,
			meeting_provider,
			reschedule_count,
			services (
				id,
				name,
				price_amount,
				price_currency,
				duration_minutes
			),
			students (
				id,
				user_id,
				full_name,
				email,
				timezone
			),
			tutor:profiles!bookings_tutor_id_fkey (
				full_name,
				email
			)
		`)
		.eq("id", bookingId)
		.eq("tutor_id", tutorId)
		.is("deleted_at", null)
		.single();

	if (error) {
		if (error.code === "PGRST116") {
			return null;
		}
		throw error;
	}

	return data as unknown as BookingWithRelations;
}

/**
 * Find bookings in a time range for conflict checking.
 * Returns bookings within ±24 hours of the given time for overlap detection.
 */
export async function findBookingsInTimeRange(
	client: SupabaseClient,
	tutorId: string,
	centerTime: Date,
	excludeBookingId?: string
): Promise<Array<{ id: string; scheduled_at: string; duration_minutes: number; created_at?: string }>> {
	const windowStart = new Date(centerTime.getTime() - 24 * 60 * 60 * 1000);
	const windowEnd = new Date(centerTime.getTime() + 24 * 60 * 60 * 1000);

	let query = client
		.from("bookings")
		.select("id, scheduled_at, duration_minutes, created_at")
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

	return data ?? [];
}

/**
 * Find future bookings for availability check.
 */
export async function findFutureBookingsForTutor(
	client: SupabaseClient,
	tutorId: string,
	excludeBookingId?: string
): Promise<Array<{ id: string; scheduled_at: string; duration_minutes: number; status: string }>> {
	let query = client
		.from("bookings")
		.select("id, scheduled_at, duration_minutes, status")
		.eq("tutor_id", tutorId)
		.in("status", ["pending", "confirmed"])
		.is("deleted_at", null)
		.gte("scheduled_at", new Date().toISOString());

	if (excludeBookingId) {
		query = query.neq("id", excludeBookingId);
	}

	const { data, error } = await query;

	if (error) {
		throw error;
	}

	return data ?? [];
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

/**
 * Get booking with student and service info for display.
 */
export async function getBookingWithDetails(
	client: SupabaseClient,
	bookingId: string,
	tutorId: string
): Promise<BookingWithRelations | null> {
	const { data, error } = await client
		.from("bookings")
		.select("*, students(full_name, email), services(name)")
		.eq("id", bookingId)
		.eq("tutor_id", tutorId)
		.is("deleted_at", null)
		.single();

	if (error) {
		if (error.code === "PGRST116") {
			return null;
		}
		throw error;
	}

	return data as unknown as BookingWithRelations;
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
// Query Operations for Public Booking
// ============================================================================

/**
 * Get tutor profile booking settings.
 */
export async function getTutorProfileBookingSettings(
	client: SupabaseClient,
	tutorId: string
): Promise<{
	timezone: string | null;
	advance_booking_days_min: number | null;
	advance_booking_days_max: number | null;
	max_lessons_per_day: number | null;
	max_lessons_per_week: number | null;
} | null> {
	const { data, error } = await client
		.from("profiles")
		.select(`
			timezone,
			advance_booking_days_min, advance_booking_days_max,
			max_lessons_per_day, max_lessons_per_week
		`)
		.eq("id", tutorId)
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
 * Check if user profile exists.
 */
export async function checkUserProfileExists(
	client: SupabaseClient,
	userId: string
): Promise<{ id: string } | null> {
	const { data, error } = await client
		.from("profiles")
		.select("id")
		.eq("id", userId)
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
 * Get student profile by user ID for verification.
 */
export async function getStudentProfileByUserId(
	client: SupabaseClient,
	userId: string
): Promise<{ email: string; user_id: string | null } | null> {
	const { data, error } = await client
		.from("students")
		.select("email, user_id")
		.eq("user_id", userId)
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
 * Get student ID by email and tutor.
 */
export async function getStudentIdByEmailAndTutor(
	client: SupabaseClient,
	email: string,
	tutorId: string
): Promise<string | null> {
	const { data, error } = await client
		.from("students")
		.select("id")
		.eq("email", email.toLowerCase().trim())
		.eq("tutor_id", tutorId)
		.is("deleted_at", null)
		.single();

	if (error) {
		if (error.code === "PGRST116") {
			return null;
		}
		throw error;
	}

	return data?.id ?? null;
}

/**
 * Get next upcoming booking for a student.
 */
export async function getNextBookingForStudent(
	client: SupabaseClient,
	tutorId: string,
	studentId: string
): Promise<{
	id: string;
	scheduled_at: string;
	duration_minutes: number | null;
	services?: { name: string | null } | null;
} | null> {
	const { data, error } = await client
		.from("bookings")
		.select("id, scheduled_at, duration_minutes, services(name)")
		.eq("tutor_id", tutorId)
		.eq("student_id", studentId)
		.in("status", ["pending", "confirmed"])
		.is("deleted_at", null)
		.gt("scheduled_at", new Date().toISOString())
		.order("scheduled_at", { ascending: true })
		.limit(1)
		.maybeSingle();

	if (error) {
		throw error;
	}

	if (!data) {
		return null;
	}

	const rawService = Array.isArray((data as { services?: unknown }).services)
		? ((data as { services?: { name?: string | null }[] }).services?.[0] ?? null)
		: ((data as { services?: { name?: string | null } }).services ?? null);

	return {
		id: String(data.id),
		scheduled_at: String(data.scheduled_at),
		duration_minutes: (data as { duration_minutes?: number | null }).duration_minutes ?? null,
		services:
			rawService && typeof rawService === "object"
				? { name: (rawService as { name?: string | null }).name ?? null }
				: null,
	};
}

// ============================================================================
// Combined Query Operations for Booking Flow
// ============================================================================

/**
 * Fetch service and full tutor profile in parallel for booking creation.
 * Eliminates redundant database roundtrips.
 */
export async function getServiceWithTutorProfile(
	client: SupabaseClient,
	serviceId: string,
	tutorId: string
): Promise<{
	service: ServiceRecord | null;
	tutorProfile: FullTutorProfile | null;
}> {
	const [serviceResult, profileResult] = await Promise.all([
		client
			.from("services")
			.select(`
				id, tutor_id, name, description, duration_minutes,
				price, price_amount, currency, price_currency, is_active
			`)
			.eq("id", serviceId)
			.eq("tutor_id", tutorId)
			.eq("is_active", true)
			.is("deleted_at", null)
			.single(),
		client
			.from("profiles")
			.select(`
				full_name, email, timezone,
				buffer_time_minutes,
				advance_booking_days_min, advance_booking_days_max,
				max_lessons_per_day, max_lessons_per_week,
				payment_instructions, venmo_handle, paypal_email, zelle_phone,
				stripe_payment_link, custom_payment_url,
				video_provider, zoom_personal_link, google_meet_link, microsoft_teams_link,
				calendly_link, custom_video_url, custom_video_name,
				stripe_account_id, stripe_charges_enabled, stripe_payouts_enabled, stripe_onboarding_status
			`)
			.eq("id", tutorId)
			.single(),
	]);

	return {
		service: serviceResult.error ? null : (serviceResult.data as ServiceRecord),
		tutorProfile: profileResult.error ? null : (profileResult.data as FullTutorProfile),
	};
}

/**
 * Fetch all prerequisites for booking creation in parallel.
 * Returns availability, existing bookings, and existing student record.
 */
export async function getBookingPrerequisites(
	client: SupabaseClient,
	tutorId: string,
	studentEmail: string
): Promise<{
	availability: Array<{ day_of_week: number; start_time: string; end_time: string; is_available: boolean }>;
	existingBookings: Array<{ id: string; scheduled_at: string; duration_minutes: number; status: string }>;
	existingStudent: { id: string; user_id: string | null; status: string } | null;
}> {
	const [availabilityResult, bookingsResult, studentResult] = await Promise.all([
		client
			.from("availability")
			.select("day_of_week, start_time, end_time, is_available")
			.eq("tutor_id", tutorId)
			.eq("is_available", true),
		client
			.from("bookings")
			.select("id, scheduled_at, duration_minutes, status")
			.eq("tutor_id", tutorId)
			.in("status", ["pending", "confirmed"])
			.is("deleted_at", null)
			.gte("scheduled_at", new Date().toISOString()),
		client
			.from("students")
			.select("id, user_id, status")
			.eq("tutor_id", tutorId)
			.eq("email", studentEmail.toLowerCase().trim())
			.is("deleted_at", null)
			.maybeSingle(),
	]);

	return {
		availability: availabilityResult.data ?? [],
		existingBookings: bookingsResult.data ?? [],
		existingStudent: studentResult.data,
	};
}

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
