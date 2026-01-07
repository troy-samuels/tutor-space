import type { SupabaseClient } from "@supabase/supabase-js";
import { upsertThread } from "@/lib/repositories/messaging";

// ============================================================================
// Types
// ============================================================================

export interface StudentRecord {
	id: string;
	tutor_id: string;
	user_id: string | null;
	full_name: string;
	email: string;
	phone: string | null;
	timezone: string | null;
	status: string;
	proficiency_level: string | null;
	learning_goals: string | null;
	native_language: string | null;
	notes: string | null;
	labels: string[] | null;
	calendar_access_status: string | null;
	access_approved_at: string | null;
	access_approved_by: string | null;
	email_opt_out: boolean;
	source: string | null;
	created_at: string;
	updated_at: string;
	deleted_at: string | null;
}

export interface ListStudentsOptions {
	includeInactive?: boolean;
	labels?: string[];
	status?: string;
	limit?: number;
}

// ============================================================================
// Read Operations
// ============================================================================

/**
 * Get a student by ID for a specific tutor.
 * Excludes soft-deleted records.
 */
export async function getStudentById(
	client: SupabaseClient,
	studentId: string,
	tutorId: string
): Promise<StudentRecord | null> {
	const { data, error } = await client
		.from("students")
		.select("*")
		.eq("id", studentId)
		.eq("tutor_id", tutorId)
		.is("deleted_at", null)
		.single();

	if (error?.code === "PGRST116") return null;
	if (error) throw error;
	return data as StudentRecord;
}

/**
 * Get a student by email for a specific tutor.
 * Excludes soft-deleted records.
 */
export async function getStudentByEmail(
	client: SupabaseClient,
	email: string,
	tutorId: string
): Promise<StudentRecord | null> {
	const { data, error } = await client
		.from("students")
		.select("*")
		.eq("tutor_id", tutorId)
		.eq("email", email.toLowerCase().trim())
		.is("deleted_at", null)
		.single();

	if (error?.code === "PGRST116") return null;
	if (error) throw error;
	return data as StudentRecord;
}

/**
 * List students for a tutor with optional filtering.
 * Excludes soft-deleted records.
 */
export async function listStudentsForTutor(
	client: SupabaseClient,
	tutorId: string,
	options?: ListStudentsOptions
): Promise<StudentRecord[]> {
	let query = client
		.from("students")
		.select("*")
		.eq("tutor_id", tutorId)
		.is("deleted_at", null)
		.order("full_name", { ascending: true });

	if (options?.status) {
		query = query.eq("status", options.status);
	}

	if (options?.labels && options.labels.length > 0) {
		query = query.overlaps("labels", options.labels);
	}

	if (options?.limit) {
		query = query.limit(options.limit);
	}

	const { data, error } = await query;
	if (error) throw error;
	return (data ?? []) as StudentRecord[];
}

/**
 * Count students for a tutor.
 * Excludes soft-deleted records.
 */
export async function countStudentsForTutor(
	client: SupabaseClient,
	tutorId: string
): Promise<number> {
	const { count, error } = await client
		.from("students")
		.select("id", { count: "exact", head: true })
		.eq("tutor_id", tutorId)
		.is("deleted_at", null);

	if (error) throw error;
	return count ?? 0;
}

// ============================================================================
// Read Operations (Tutor Profiles)
// ============================================================================

export interface TutorInviteProfile {
	full_name: string | null;
	auto_welcome_enabled: boolean | null;
	username: string | null;
	email: string | null;
}

/**
 * Get tutor profile data needed for student welcome emails.
 */
export async function getTutorProfileForStudentInvite(
	client: SupabaseClient,
	tutorId: string
): Promise<TutorInviteProfile | null> {
	const { data, error } = await client
		.from("profiles")
		.select("full_name, auto_welcome_enabled, username, email")
		.eq("id", tutorId)
		.single();

	if (error?.code === "PGRST116") return null;
	if (error) throw error;
	return data as TutorInviteProfile;
}

// ============================================================================
// Create Operations
// ============================================================================

export interface CreateStudentInput {
	tutor_id: string;
	full_name: string;
	email: string;
	phone?: string | null;
	timezone?: string | null;
	status?: string;
	source?: string;
}

/**
 * Create a new student record.
 * Email is normalized to lowercase.
 */
export async function createStudent(
	client: SupabaseClient,
	input: CreateStudentInput
): Promise<StudentRecord> {
	const { data, error } = await client
		.from("students")
		.insert({
			tutor_id: input.tutor_id,
			full_name: input.full_name,
			email: input.email.toLowerCase().trim(),
			phone: input.phone ?? null,
			timezone: input.timezone ?? "UTC",
			status: input.status ?? "active",
			source: input.source ?? null,
		})
		.select("*")
		.single();

	if (error) throw error;
	return data as StudentRecord;
}

/**
 * Create a conversation thread between tutor and student.
 * Ignores duplicate key errors (thread already exists).
 */
export async function createConversationThread(
	client: SupabaseClient,
	tutorId: string,
	studentId: string
): Promise<void> {
	const { error } = await upsertThread(
		client,
		{ tutorId, studentId },
		{ ignoreDuplicates: true }
	);

	// Ignore duplicate key error (thread already exists)
	if (error && error.code !== "23505") {
		throw error;
	}
}

// ============================================================================
// Update Operations
// ============================================================================

/**
 * Update student labels.
 * Validates and sanitizes labels before saving.
 */
export async function updateStudentLabels(
	client: SupabaseClient,
	studentId: string,
	tutorId: string,
	labels: string[]
): Promise<void> {
	const sanitizedLabels = labels
		.map((l) => l.trim())
		.filter((l) => l.length > 0 && l.length <= 50)
		.slice(0, 20);

	const { error } = await client
		.from("students")
		.update({
			labels: sanitizedLabels,
			updated_at: new Date().toISOString(),
		})
		.eq("id", studentId)
		.eq("tutor_id", tutorId);

	if (error) throw error;
}

/**
 * Update student details for a tutor.
 */
export async function updateStudentDetails(
	client: SupabaseClient,
	studentId: string,
	tutorId: string,
	updates: Record<string, unknown>
): Promise<void> {
	const { error } = await client
		.from("students")
		.update({
			...updates,
			updated_at: new Date().toISOString(),
		})
		.eq("id", studentId)
		.eq("tutor_id", tutorId);

	if (error) throw error;
}

export type AccessStatus = "approved" | "denied" | "suspended" | "pending";

export interface AccessApprovalData {
	approvedBy: string;
	approvedAt: string;
}

/**
 * Update student calendar access status.
 * Optionally sets approval metadata for approved status.
 */
export async function updateStudentAccessStatus(
	client: SupabaseClient,
	studentId: string,
	tutorId: string,
	status: AccessStatus,
	approvalData?: AccessApprovalData
): Promise<void> {
	const updatePayload: Record<string, unknown> = {
		calendar_access_status: status,
		updated_at: new Date().toISOString(),
	};

	if (status === "approved" && approvalData) {
		updatePayload.access_approved_at = approvalData.approvedAt;
		updatePayload.access_approved_by = approvalData.approvedBy;
	}

	const { error } = await client
		.from("students")
		.update(updatePayload)
		.eq("id", studentId)
		.eq("tutor_id", tutorId);

	if (error) throw error;
}

// ============================================================================
// Read Operations (Extended)
// ============================================================================

export interface TutorProfile {
	id: string;
	full_name: string | null;
	email: string | null;
	username: string | null;
	instagram_handle: string | null;
	website_url: string | null;
	payment_venmo_handle: string | null;
	payment_paypal_email: string | null;
	payment_zelle_phone: string | null;
	payment_stripe_link: string | null;
	payment_custom_url: string | null;
	payment_general_instructions: string | null;
}

export interface StudentWithProfile extends StudentRecord {
	profiles: TutorProfile | TutorProfile[] | null;
}

/**
 * Get student with joined tutor profile data.
 * Used for access control emails that need tutor contact info.
 */
export async function getStudentWithTutorProfile(
	client: SupabaseClient,
	studentId: string,
	tutorId: string
): Promise<StudentWithProfile | null> {
	const { data, error } = await client
		.from("students")
		.select(
			`
			*,
			profiles!students_tutor_id_fkey (
				id,
				full_name,
				email,
				username,
				instagram_handle,
				website_url,
				payment_venmo_handle,
				payment_paypal_email,
				payment_zelle_phone,
				payment_stripe_link,
				payment_custom_url,
				payment_general_instructions
			)
		`
		)
		.eq("id", studentId)
		.eq("tutor_id", tutorId)
		.is("deleted_at", null)
		.single();

	if (error?.code === "PGRST116") return null;
	if (error) throw error;
	return data as StudentWithProfile;
}

/**
 * Count pending student access requests for a tutor.
 */
export async function countPendingAccessRequests(
	client: SupabaseClient,
	tutorId: string
): Promise<number> {
	const { count, error } = await client
		.from("student_access_requests")
		.select("*", { count: "exact", head: true })
		.eq("tutor_id", tutorId)
		.eq("status", "pending");

	if (error) throw error;
	return count ?? 0;
}

// ============================================================================
// Access Request Operations
// ============================================================================

export interface AccessRequest {
	id: string;
	tutor_id: string;
	student_id: string;
	status: string;
	student_message: string | null;
	tutor_notes: string | null;
	resolved_at: string | null;
	resolved_by: string | null;
	created_at: string;
	updated_at: string;
}

/**
 * Get an access request by ID.
 */
export async function getAccessRequest(
	client: SupabaseClient,
	requestId: string,
	tutorId: string
): Promise<AccessRequest | null> {
	const { data, error } = await client
		.from("student_access_requests")
		.select("*")
		.eq("id", requestId)
		.eq("tutor_id", tutorId)
		.single();

	if (error?.code === "PGRST116") return null;
	if (error) throw error;
	return data as AccessRequest;
}

export interface UpdateAccessRequestInput {
	status: "approved" | "denied";
	resolvedAt: string;
	resolvedBy: string;
	tutorNotes?: string | null;
}

/**
 * Update an access request status.
 */
export async function updateAccessRequest(
	client: SupabaseClient,
	requestId: string,
	tutorId: string,
	data: UpdateAccessRequestInput
): Promise<void> {
	const { error } = await client
		.from("student_access_requests")
		.update({
			status: data.status,
			resolved_at: data.resolvedAt,
			resolved_by: data.resolvedBy,
			tutor_notes: data.tutorNotes ?? null,
			updated_at: new Date().toISOString(),
		})
		.eq("id", requestId)
		.eq("tutor_id", tutorId);

	if (error) throw error;
}

// ============================================================================
// Delete Operations
// ============================================================================

/**
 * Soft delete a student by setting deleted_at timestamp.
 * Returns success/error result instead of throwing.
 */
export async function softDeleteStudent(
	client: SupabaseClient,
	studentId: string,
	tutorId: string
): Promise<{ success: boolean; error?: string }> {
	const { error } = await client
		.from("students")
		.update({ deleted_at: new Date().toISOString() })
		.eq("id", studentId)
		.eq("tutor_id", tutorId)
		.is("deleted_at", null);

	if (error) {
		return { success: false, error: error.message };
	}
	return { success: true };
}
