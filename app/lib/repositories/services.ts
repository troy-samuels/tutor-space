import type { SupabaseClient } from "@supabase/supabase-js";

// ============================================================================
// Types
// ============================================================================

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
	requires_approval: boolean;
	max_students_per_session: number;
	offer_type: string | null;
	stripe_product_id: string | null;
	stripe_price_id: string | null;
	created_at: string;
	updated_at: string;
	deleted_at: string | null;
}

export interface ListServicesOptions {
	includeInactive?: boolean;
	limit?: number;
}

// ============================================================================
// Read Operations
// ============================================================================

/**
 * Get a service by ID for a specific tutor.
 * Excludes soft-deleted records.
 */
export async function getServiceById(
	client: SupabaseClient,
	serviceId: string,
	tutorId: string
): Promise<ServiceRecord | null> {
	const { data, error } = await client
		.from("services")
		.select("*")
		.eq("id", serviceId)
		.eq("tutor_id", tutorId)
		.is("deleted_at", null)
		.single();

	if (error?.code === "PGRST116") return null;
	if (error) throw error;
	return data as ServiceRecord;
}

/**
 * List services for a tutor with optional filtering.
 * Excludes soft-deleted records.
 */
export async function listServicesForTutor(
	client: SupabaseClient,
	tutorId: string,
	options?: ListServicesOptions
): Promise<ServiceRecord[]> {
	let query = client
		.from("services")
		.select("*")
		.eq("tutor_id", tutorId)
		.is("deleted_at", null)
		.order("name", { ascending: true });

	if (!options?.includeInactive) {
		query = query.eq("is_active", true);
	}

	if (options?.limit) {
		query = query.limit(options.limit);
	}

	const { data, error } = await query;
	if (error) throw error;
	return (data ?? []) as ServiceRecord[];
}

/**
 * Count services for a tutor.
 * Excludes soft-deleted records.
 */
export async function countServicesForTutor(
	client: SupabaseClient,
	tutorId: string,
	activeOnly = true
): Promise<number> {
	let query = client
		.from("services")
		.select("id", { count: "exact", head: true })
		.eq("tutor_id", tutorId)
		.is("deleted_at", null);

	if (activeOnly) {
		query = query.eq("is_active", true);
	}

	const { count, error } = await query;
	if (error) throw error;
	return count ?? 0;
}

// ============================================================================
// Delete Operations
// ============================================================================

/**
 * Soft delete a service by setting deleted_at timestamp and deactivating.
 * Returns success/error result instead of throwing.
 */
export async function softDeleteService(
	client: SupabaseClient,
	serviceId: string,
	tutorId: string
): Promise<{ success: boolean; error?: string }> {
	const { error } = await client
		.from("services")
		.update({
			deleted_at: new Date().toISOString(),
			is_active: false,
		})
		.eq("id", serviceId)
		.eq("tutor_id", tutorId)
		.is("deleted_at", null);

	if (error) {
		return { success: false, error: error.message };
	}
	return { success: true };
}
