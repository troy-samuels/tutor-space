import type { SupabaseClient } from "@supabase/supabase-js";
import type { TutorStripeStatus } from "@/lib/types/payments";

// ============================================================================
// Types
// ============================================================================

export type ProfileRole = "tutor" | "student" | "admin";

export interface ProfileBasic {
	id: string;
	role: ProfileRole | null;
	username: string | null;
	full_name: string | null;
	email?: string;
}

// ============================================================================
// Auth-Related Profile Operations
// ============================================================================

/**
 * Get profile role by user ID.
 * Used during sign-in to determine redirect destination.
 *
 * @param client - Supabase client
 * @param userId - User ID to look up
 * @returns Profile role or null if not found
 */
export async function getProfileRole(
	client: SupabaseClient,
	userId: string
): Promise<ProfileRole | null> {
	const { data, error } = await client
		.from("profiles")
		.select("role")
		.eq("id", userId)
		.maybeSingle();

	if (error) {
		// PGRST116 = no rows found, not an error for our purposes
		if (error.code !== "PGRST116") {
			throw error;
		}
		return null;
	}

	return (data?.role as ProfileRole | null) ?? null;
}

/**
 * Update last login timestamp for a tutor.
 * Used for churn tracking and re-engagement campaigns.
 *
 * @param client - Supabase client (service role recommended)
 * @param userId - User ID
 */
export async function updateLastLogin(
	client: SupabaseClient,
	userId: string
): Promise<void> {
	const { error } = await client
		.from("profiles")
		.update({ last_login_at: new Date().toISOString() })
		.eq("id", userId)
		.eq("role", "tutor");

	if (error) {
		// Non-critical: log but don't throw
		console.error("[Profiles] Failed to update last_login_at:", error);
	}
}

/**
 * Check if a username is already taken.
 *
 * @param client - Supabase client
 * @param username - Username to check
 * @returns True if username is taken, false otherwise
 */
export async function isUsernameTaken(
	client: SupabaseClient,
	username: string
): Promise<boolean> {
	const { data, error } = await client
		.from("profiles")
		.select("id")
		.eq("username", username)
		.maybeSingle();

	if (error && error.code !== "PGRST116") {
		throw error;
	}

	return Boolean(data);
}

/**
 * Get profile by email address.
 * Useful for checking existing registrations.
 *
 * @param client - Supabase client
 * @param email - Email to look up
 * @returns Profile basic info or null
 */
export async function getProfileByEmail(
	client: SupabaseClient,
	email: string
): Promise<ProfileBasic | null> {
	const { data, error } = await client
		.from("profiles")
		.select("id, role, username, full_name")
		.eq("email", email)
		.maybeSingle();

	if (error && error.code !== "PGRST116") {
		throw error;
	}

	if (!data) return null;

	return {
		id: data.id as string,
		role: (data.role as ProfileRole | null) ?? null,
		username: (data.username as string | null) ?? null,
		full_name: (data.full_name as string | null) ?? null,
	};
}

/**
 * Get profile by user ID.
 *
 * @param client - Supabase client
 * @param userId - User ID
 * @returns Profile basic info or null
 */
export async function getProfileById(
	client: SupabaseClient,
	userId: string
): Promise<ProfileBasic | null> {
	const { data, error } = await client
		.from("profiles")
		.select("id, role, username, full_name")
		.eq("id", userId)
		.maybeSingle();

	if (error && error.code !== "PGRST116") {
		throw error;
	}

	if (!data) return null;

	return {
		id: data.id as string,
		role: (data.role as ProfileRole | null) ?? null,
		username: (data.username as string | null) ?? null,
		full_name: (data.full_name as string | null) ?? null,
	};
}

// ============================================================================
// Signup Checkout Operations
// ============================================================================

export interface SignupCheckoutData {
	sessionId: string;
	status: string;
	plan: string;
	startedAt: string;
	expiresAt: string | null;
}

/**
 * Update profile with signup checkout session data.
 * Used during signup flow to track Stripe checkout progress.
 *
 * @param client - Supabase client (service role recommended)
 * @param userId - User ID
 * @param data - Signup checkout session data
 */
export async function updateSignupCheckout(
	client: SupabaseClient,
	userId: string,
	data: SignupCheckoutData
): Promise<void> {
	const { error } = await client
		.from("profiles")
		.update({
			signup_checkout_session_id: data.sessionId,
			signup_checkout_status: data.status,
			signup_checkout_plan: data.plan,
			signup_checkout_started_at: data.startedAt,
			signup_checkout_expires_at: data.expiresAt,
		})
		.eq("id", userId);

	if (error) {
		// Non-critical: log but don't throw
		console.error("[Profiles] Failed to update signup checkout:", error);
	}
}

// ============================================================================
// Stripe-Related Profile Operations
// ============================================================================

export async function setStripeAccountId(
	client: SupabaseClient,
	tutorId: string,
	accountId: string
): Promise<void> {
	const { error } = await client
		.from("profiles")
		.update({ stripe_account_id: accountId })
		.eq("id", tutorId);
	if (error) {
		throw error;
	}
}

export async function updateStripeStatus(
	client: SupabaseClient,
	tutorId: string,
	status: TutorStripeStatus
): Promise<void> {
	const baseUpdate = {
		stripe_account_id: status.accountId,
		stripe_charges_enabled: status.chargesEnabled,
		stripe_payouts_enabled: status.payoutsEnabled,
		stripe_onboarding_status: status.onboardingStatus,
		stripe_default_currency: status.defaultCurrency,
		stripe_country: status.country,
		stripe_last_capability_check_at: status.lastCapabilityCheckAt,
	};

	const extendedUpdate = {
		stripe_disabled_reason: status.disabledReason,
		stripe_currently_due: status.currentlyDue,
		stripe_eventually_due: status.eventuallyDue,
		stripe_past_due: status.pastDue,
		stripe_pending_verification: status.pendingVerification,
		stripe_details_submitted: status.detailsSubmitted,
	};

	const isMissingColumn = (err: { code?: string; message?: string }) => {
		return err.code === "42703" || Boolean(err.message?.toLowerCase().includes("column"));
	};

	const { error } = await client
		.from("profiles")
		.update({ ...baseUpdate, ...extendedUpdate })
		.eq("id", tutorId);

	if (!error) {
		return;
	}

	if (!isMissingColumn(error)) {
		throw error;
	}

	console.warn("[Stripe Connect] Falling back to base profile update:", {
		code: error.code,
		message: error.message,
	});

	const { error: baseError } = await client
		.from("profiles")
		.update(baseUpdate)
		.eq("id", tutorId);

	if (!baseError) {
		return;
	}

	if (!isMissingColumn(baseError)) {
		throw baseError;
	}

	console.warn("[Stripe Connect] Falling back to minimal profile update:", {
		code: baseError.code,
		message: baseError.message,
	});

	const { error: minimalError } = await client
		.from("profiles")
		.update({ stripe_account_id: status.accountId })
		.eq("id", tutorId);

	if (minimalError) {
		throw minimalError;
	}
}

export async function getTutorStripeStatus(
	client: SupabaseClient,
	tutorId: string
): Promise<TutorStripeStatus> {
	const { data, error } = await client
		.from("profiles")
		.select(
			"stripe_account_id, stripe_charges_enabled, stripe_payouts_enabled, stripe_onboarding_status, stripe_default_currency, stripe_country, stripe_last_capability_check_at, stripe_disabled_reason, stripe_currently_due, stripe_eventually_due, stripe_past_due, stripe_pending_verification, stripe_details_submitted"
		)
		.eq("id", tutorId)
		.single();
	if (error) {
		throw error;
	}
	return {
		accountId: (data?.stripe_account_id as string | null) ?? null,
		chargesEnabled: Boolean(data?.stripe_charges_enabled),
		payoutsEnabled: Boolean(data?.stripe_payouts_enabled),
		onboardingStatus: (data?.stripe_onboarding_status as TutorStripeStatus["onboardingStatus"]) ?? "pending",
		defaultCurrency: (data?.stripe_default_currency as string | null) ?? null,
		country: (data?.stripe_country as string | null) ?? null,
		lastCapabilityCheckAt: (data?.stripe_last_capability_check_at as string | null) ?? null,
		disabledReason: (data?.stripe_disabled_reason as string | null) ?? null,
		currentlyDue: (data?.stripe_currently_due as string[] | null) ?? null,
		eventuallyDue: (data?.stripe_eventually_due as string[] | null) ?? null,
		pastDue: (data?.stripe_past_due as string[] | null) ?? null,
		pendingVerification: (data?.stripe_pending_verification as string[] | null) ?? null,
		detailsSubmitted: Boolean(data?.stripe_details_submitted),
	};
}

