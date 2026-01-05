import type { SupabaseClient } from "@supabase/supabase-js";

// ============================================================================
// Types
// ============================================================================

export interface LifetimePurchase {
	id: string;
	email: string;
	stripe_session_id: string | null;
	stripe_customer_id: string | null;
	amount_paid: number | null;
	currency: string | null;
	source: string | null;
	purchased_at: string;
	claimed: boolean;
	claimed_by: string | null;
	claimed_at: string | null;
}

export interface InsertLifetimePurchaseData {
	email: string;
	stripe_session_id: string;
	stripe_customer_id: string | null;
	amount_paid: number | null;
	currency: string | null;
	source: string;
	purchased_at: string;
	claimed: boolean;
}

export interface UpdateLifetimePurchaseData {
	stripe_session_id?: string;
	stripe_customer_id?: string | null;
	amount_paid?: number | null;
	currency?: string | null;
	source?: string;
}

// ============================================================================
// Lifetime Purchase Repository Functions
// ============================================================================

/**
 * Get a lifetime purchase by email address.
 * Returns the purchase record if found, null otherwise.
 *
 * @param client - Supabase client
 * @param email - Email to look up
 * @returns Lifetime purchase record or null
 */
export async function getLifetimePurchaseByEmail(
	client: SupabaseClient,
	email: string
): Promise<{ id: string; claimed: boolean } | null> {
	const { data, error } = await client
		.from("lifetime_purchases")
		.select("id, claimed")
		.eq("email", email)
		.maybeSingle();

	if (error && error.code !== "PGRST116") {
		throw error;
	}

	if (!data) return null;

	return {
		id: data.id as string,
		claimed: Boolean(data.claimed),
	};
}

/**
 * Insert a new lifetime purchase record.
 *
 * @param client - Supabase client (service role recommended)
 * @param data - Lifetime purchase data
 */
export async function insertLifetimePurchase(
	client: SupabaseClient,
	data: InsertLifetimePurchaseData
): Promise<void> {
	const { error } = await client.from("lifetime_purchases").insert(data);

	if (error) {
		// Non-critical: log but don't throw for duplicate key errors
		if (error.code === "23505") {
			console.warn("[LifetimePurchases] Duplicate lifetime purchase record for:", data.email);
			return;
		}
		throw error;
	}
}

/**
 * Update an existing lifetime purchase record.
 *
 * @param client - Supabase client (service role recommended)
 * @param id - Lifetime purchase ID
 * @param data - Fields to update
 */
export async function updateLifetimePurchase(
	client: SupabaseClient,
	id: string,
	data: UpdateLifetimePurchaseData
): Promise<void> {
	const { error } = await client
		.from("lifetime_purchases")
		.update(data)
		.eq("id", id);

	if (error) {
		throw error;
	}
}

/**
 * Get a pending (unclaimed) lifetime purchase by email.
 * Used during signup to check if user has a pre-existing lifetime purchase.
 *
 * @param client - Supabase client
 * @param email - Email to look up
 * @returns Pending lifetime purchase ID or null
 */
export async function getPendingLifetimePurchaseByEmail(
	client: SupabaseClient,
	email: string
): Promise<{ id: string } | null> {
	const { data, error } = await client
		.from("lifetime_purchases")
		.select("id")
		.eq("email", email)
		.eq("claimed", false)
		.maybeSingle();

	if (error && error.code !== "PGRST116") {
		throw error;
	}

	if (!data) return null;

	return { id: data.id as string };
}

/**
 * Claim a lifetime purchase for a user.
 * Marks the purchase as claimed and links it to the user account.
 *
 * @param client - Supabase client (service role recommended)
 * @param email - Email of the lifetime purchase
 * @param userId - User ID claiming the purchase
 */
export async function claimLifetimePurchase(
	client: SupabaseClient,
	email: string,
	userId: string
): Promise<void> {
	const { error } = await client
		.from("lifetime_purchases")
		.update({
			claimed: true,
			claimed_by: userId,
			claimed_at: new Date().toISOString(),
		})
		.eq("email", email)
		.eq("claimed", false);

	if (error) {
		throw error;
	}
}
