import type { SupabaseClient } from "@supabase/supabase-js";
import type {
	BookingWithRelations,
	FullTutorProfile,
	ServiceRecord,
	StudentTutorConnection,
	TutorBookingSettings,
	TutorProfileRecord,
} from "./index";

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

// ============================================================================
// Student Operations (Read)
// ============================================================================

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

// ============================================================================
// Tutor Profile Operations
// ============================================================================

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

// ============================================================================
// Student-Tutor Connection Operations (Read)
// ============================================================================

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
			full_name, email, timezone, tier, plan,
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
			short_code,
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
				email,
				tier,
				plan
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
			short_code,
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
			short_code,
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
): Promise<Array<{ id: string; scheduled_at: string; duration_minutes: number; status?: string | null; created_at?: string }>> {
	const windowStart = new Date(centerTime.getTime() - 24 * 60 * 60 * 1000);
	const windowEnd = new Date(centerTime.getTime() + 24 * 60 * 60 * 1000);

	let query = client
		.from("bookings")
		.select("id, scheduled_at, duration_minutes, status, created_at")
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
	tier: string | null;
	plan: string | null;
	buffer_time_minutes: number | null;
	advance_booking_days_min: number | null;
	advance_booking_days_max: number | null;
	max_lessons_per_day: number | null;
	max_lessons_per_week: number | null;
} | null> {
	const { data, error } = await client
		.from("profiles")
		.select(`
			timezone, tier, plan,
			buffer_time_minutes,
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
				full_name, email, timezone, tier, plan,
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
