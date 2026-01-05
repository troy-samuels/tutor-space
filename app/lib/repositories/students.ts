import type { SupabaseClient } from "@supabase/supabase-js";

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
