// Shared types for booking repositories.

export interface FullTutorProfile {
	full_name: string | null;
	email: string | null;
	timezone: string | null;
	tier?: string | null;
	plan?: string | null;
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
	short_code?: string | null;
	reschedule_count: number | null;
	students: StudentRecord | StudentRecord[] | null;
	services: ServiceRecord | ServiceRecord[] | null;
	tutor?: FullTutorProfile | FullTutorProfile[] | null;
}

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

export interface StudentTutorConnection {
	id: string;
	student_user_id: string;
	tutor_id: string;
	status: string;
	requested_at: string | null;
	resolved_at: string | null;
	initial_message: string | null;
}

export * from "./queries";
export * from "./mutations";
export * from "./validators";
