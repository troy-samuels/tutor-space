import type { SupabaseClient } from "@supabase/supabase-js";
import type { SubscriptionBalance } from "@/lib/subscription";

// ============================================================================
// Types
// ============================================================================

export interface RedeemCreditParams {
	subscriptionId: string;
	bookingId: string;
	lessonsCount: number;
}

export interface RedeemCreditResult {
	success: boolean;
	error?: string;
}

export interface RefundCreditResult {
	success: boolean;
	refunded: boolean;
	error?: string;
}

// ============================================================================
// Credit Operations (Database RPC Calls)
// ============================================================================

/**
 * Get subscription balance via database RPC.
 * Returns available lessons for a subscription.
 *
 * @param client - Supabase client (admin recommended)
 * @param subscriptionId - Subscription ID
 * @returns Balance or null if no active period
 */
export async function getSubscriptionBalance(
	client: SupabaseClient,
	subscriptionId: string
): Promise<SubscriptionBalance | null> {
	const { data, error } = await client.rpc("get_subscription_balance", {
		p_subscription_id: subscriptionId,
	});

	if (error) {
		throw error;
	}

	if (!data || data.length === 0) {
		return null;
	}

	return data[0] as SubscriptionBalance;
}

/**
 * Redeem a subscription lesson credit for a booking.
 * Uses database RPC with FOR UPDATE lock to prevent race conditions.
 *
 * @param client - Supabase client (admin recommended)
 * @param params - Redemption parameters
 * @throws Error if redemption fails (insufficient balance, already redeemed, etc.)
 */
export async function redeemCredit(
	client: SupabaseClient,
	params: RedeemCreditParams
): Promise<void> {
	const { error } = await client.rpc("redeem_subscription_lesson", {
		p_subscription_id: params.subscriptionId,
		p_booking_id: params.bookingId,
		p_lessons_count: params.lessonsCount,
	});

	if (error) {
		throw error;
	}
}

/**
 * Refund a subscription lesson credit when booking is cancelled.
 * Uses database RPC to safely restore credits.
 *
 * @param client - Supabase client (admin recommended)
 * @param bookingId - Booking ID to refund
 * @returns True if refund occurred, false if no redemption existed
 */
export async function refundCredit(
	client: SupabaseClient,
	bookingId: string
): Promise<boolean> {
	const { data, error } = await client.rpc("refund_subscription_lesson", {
		p_booking_id: bookingId,
	});

	if (error) {
		throw error;
	}

	return Boolean(data);
}

// ============================================================================
// Allowance Period Operations
// ============================================================================

export interface AllowancePeriod {
	id: string;
	subscription_id: string;
	period_start: string;
	period_end: string;
	lessons_allocated: number;
	lessons_rolled_over: number;
	lessons_used: number;
	is_current: boolean;
	created_at: string;
}

/**
 * Get current allowance period for a subscription.
 *
 * @param client - Supabase client
 * @param subscriptionId - Subscription ID
 * @returns Current allowance period or null
 */
export async function getCurrentAllowancePeriod(
	client: SupabaseClient,
	subscriptionId: string
): Promise<AllowancePeriod | null> {
	const { data, error } = await client
		.from("lesson_allowance_periods")
		.select("*")
		.eq("subscription_id", subscriptionId)
		.eq("is_current", true)
		.maybeSingle();

	if (error && error.code !== "PGRST116") {
		throw error;
	}

	return data as AllowancePeriod | null;
}

/**
 * List all allowance periods for a subscription.
 *
 * @param client - Supabase client
 * @param subscriptionId - Subscription ID
 * @param options - Query options
 * @returns Array of allowance periods
 */
export async function listAllowancePeriods(
	client: SupabaseClient,
	subscriptionId: string,
	options?: { limit?: number }
): Promise<AllowancePeriod[]> {
	const { data, error } = await client
		.from("lesson_allowance_periods")
		.select("*")
		.eq("subscription_id", subscriptionId)
		.order("period_start", { ascending: false })
		.limit(options?.limit ?? 12);

	if (error) {
		throw error;
	}

	return (data ?? []) as AllowancePeriod[];
}

// ============================================================================
// Redemption Operations
// ============================================================================

export interface RedemptionRecord {
	id: string;
	subscription_id: string;
	allowance_period_id: string;
	booking_id: string;
	lessons_redeemed: number;
	refunded: boolean;
	created_at: string;
}

/**
 * Get redemption record by booking ID.
 *
 * @param client - Supabase client
 * @param bookingId - Booking ID
 * @returns Redemption record or null
 */
export async function getRedemptionByBookingId(
	client: SupabaseClient,
	bookingId: string
): Promise<RedemptionRecord | null> {
	const { data, error } = await client
		.from("lesson_subscription_redemptions")
		.select("*")
		.eq("booking_id", bookingId)
		.maybeSingle();

	if (error && error.code !== "PGRST116") {
		throw error;
	}

	return data as RedemptionRecord | null;
}

/**
 * List redemptions for a subscription.
 *
 * @param client - Supabase client
 * @param subscriptionId - Subscription ID
 * @param options - Query options
 * @returns Array of redemption records
 */
export async function listRedemptions(
	client: SupabaseClient,
	subscriptionId: string,
	options?: { limit?: number; includeRefunded?: boolean }
): Promise<RedemptionRecord[]> {
	let query = client
		.from("lesson_subscription_redemptions")
		.select("*")
		.eq("subscription_id", subscriptionId)
		.order("created_at", { ascending: false })
		.limit(options?.limit ?? 50);

	if (!options?.includeRefunded) {
		query = query.eq("refunded", false);
	}

	const { data, error } = await query;

	if (error) {
		throw error;
	}

	return (data ?? []) as RedemptionRecord[];
}
