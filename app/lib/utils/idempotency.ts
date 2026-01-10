import type { SupabaseClient } from "@supabase/supabase-js";

// ============================================================================
// Constants
// ============================================================================

/** How long a 'processing' reservation is considered valid before it's stale */
const PROCESSING_TIMEOUT_MS = 300_000; // 5 minutes (increased from 60s to prevent race conditions)

/** How often to poll when waiting for another request to complete */
const POLL_INTERVAL_MS = 500; // 500ms

/** Maximum time to wait for another request to complete before giving up */
const MAX_POLL_DURATION_MS = 5_000; // 5 seconds

// ============================================================================
// Types
// ============================================================================

export interface IdempotencyResult<T> {
	cached: boolean;
	response: T;
}

type ClaimStatus = "claimed" | "already_processing" | "already_completed";

interface ClaimResult {
	status: ClaimStatus;
	response?: unknown;
	updatedAt?: string;
}

// ============================================================================
// Internal Functions
// ============================================================================

/**
 * Try to claim an idempotency key atomically using INSERT.
 * Uses unique constraint violation to detect concurrent claims.
 *
 * Returns:
 * - 'claimed': We successfully claimed the key, proceed with operation
 * - 'already_processing': Another request is processing this key
 * - 'already_completed': Key was already processed, use cached response
 */
async function claimIdempotencyKey(
	client: SupabaseClient,
	key: string,
	ownerId?: string
): Promise<ClaimResult> {
	const reservationOwnerId = ownerId ?? null;

	// First, try to INSERT a new row with status='processing'
	const { error: insertError } = await client.from("processed_requests").insert({
		idempotency_key: key,
		status: "processing",
		response_body: null,
		created_at: new Date().toISOString(),
		updated_at: new Date().toISOString(),
		owner_id: reservationOwnerId,
	});

	// If INSERT succeeded, we claimed the key
	if (!insertError) {
		return { status: "claimed" };
	}

	// If not a unique constraint violation, it's an unexpected error
	if (insertError.code !== "23505") {
		throw insertError;
	}

	// Unique constraint violation - key already exists
	// Check the current state of the existing row
	const { data: existing, error: selectError } = await client
		.from("processed_requests")
		.select("status, response_body, updated_at")
		.eq("idempotency_key", key)
		.single();

	if (selectError) {
		throw selectError;
	}

	if (existing.status === "completed") {
		return {
			status: "already_completed",
			response: existing.response_body,
		};
	}

	// Status is 'processing'
	return {
		status: "already_processing",
		updatedAt: existing.updated_at,
	};
}

/**
 * Poll for a processing request to complete.
 * Returns the cached response when found, or null on timeout.
 */
async function pollForCompletion<T>(
	client: SupabaseClient,
	key: string,
	timeoutMs: number
): Promise<T | null> {
	const startTime = Date.now();

	while (Date.now() - startTime < timeoutMs) {
		// Wait before checking
		await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));

		const { data, error } = await client
			.from("processed_requests")
			.select("status, response_body")
			.eq("idempotency_key", key)
			.single();

		if (error) {
			// Row was deleted (maybe due to error cleanup) - return null to trigger retry
			if (error.code === "PGRST116") {
				return null;
			}
			throw error;
		}

		if (data.status === "completed") {
			return data.response_body as T;
		}

		// Still processing, continue polling
	}

	// Timed out waiting
	return null;
}

/**
 * Mark a reservation as completed with the response body.
 */
async function completeReservation<T>(
	client: SupabaseClient,
	key: string,
	response: T
): Promise<void> {
	const { error } = await client
		.from("processed_requests")
		.update({
			status: "completed",
			response_body: response,
			updated_at: new Date().toISOString(),
		})
		.eq("idempotency_key", key);

	if (error) {
		// Log but don't throw - the operation already completed successfully
		console.error("[Idempotency] Failed to complete reservation:", error.message);
	}
}

/**
 * Check if a reservation is stale (processing for too long) and release it.
 *
 * This prevents a failed or crashed request from blocking retries forever.
 * Releasing a stale lock can allow a duplicate operation to run if the
 * original request is still alive, so the timeout should be conservative.
 *
 * @param requestingOwnerId - The traceId of the request attempting to claim
 */
async function releaseStaleReservation(
	client: SupabaseClient,
	key: string,
	requestingOwnerId?: string
): Promise<boolean> {
	const staleThreshold = new Date(Date.now() - PROCESSING_TIMEOUT_MS).toISOString();

	const { data: releasedRows, error } = await client
		.from("processed_requests")
		.delete()
		.eq("idempotency_key", key)
		.eq("status", "processing")
		.lt("updated_at", staleThreshold)
		.select("idempotency_key, created_at, updated_at, owner_id");

	if (error) {
		console.error("[Idempotency] Failed to release stale reservation:", error.message);
		return false;
	}

	const staleRow = releasedRows?.[0];
	if (!staleRow) {
		return false; // Not stale or already released
	}

	const ageMs = Date.now() - new Date(staleRow.updated_at).getTime();

	console.warn("[Idempotency] Released stale reservation", {
		key,
		originalOwner: staleRow.owner_id,
		requestingOwner: requestingOwnerId,
		originalCreatedAt: staleRow.created_at,
		staleSince: staleRow.updated_at,
		ageMs,
		ageMinutes: Math.round(ageMs / 60000),
		thresholdMinutes: PROCESSING_TIMEOUT_MS / 60000,
		action: "released",
	});

	return true;
}

/**
 * Clean up a failed reservation so the key can be retried.
 */
async function cleanupFailedReservation(
	client: SupabaseClient,
	key: string
): Promise<void> {
	const { error } = await client
		.from("processed_requests")
		.delete()
		.eq("idempotency_key", key)
		.eq("status", "processing");

	if (error) {
		console.error("[Idempotency] Failed to cleanup reservation:", error.message);
	}
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Check if a request with this idempotency key was already processed.
 * Returns cached response if found, null otherwise.
 *
 * @deprecated Use withIdempotency() for automatic handling
 */
export async function getCachedResponse<T>(
	client: SupabaseClient,
	idempotencyKey: string
): Promise<T | null> {
	const { data, error } = await client
		.from("processed_requests")
		.select("response_body, status")
		.eq("idempotency_key", idempotencyKey)
		.eq("status", "completed")
		.maybeSingle();

	if (error && error.code !== "PGRST116") {
		throw error;
	}

	return (data?.response_body ?? null) as T | null;
}

/**
 * Store the response for an idempotency key.
 * Uses upsert with ON CONFLICT to handle race conditions safely.
 *
 * @deprecated Use withIdempotency() for automatic handling
 */
export async function cacheResponse<T>(
	client: SupabaseClient,
	idempotencyKey: string,
	response: T
): Promise<void> {
	const { error } = await client.from("processed_requests").upsert(
		{
			idempotency_key: idempotencyKey,
			status: "completed",
			response_body: response,
			updated_at: new Date().toISOString(),
		},
		{
			onConflict: "idempotency_key",
		}
	);

	if (error) {
		console.error("[Idempotency] Failed to cache response:", error.message);
	}
}

/**
 * Wrapper for idempotent operations using the reservation pattern.
 *
 * This function ensures that concurrent requests with the same idempotency key
 * will only execute the operation once. The first request to claim the key will
 * execute the operation, and subsequent requests will wait for the result.
 *
 * The reservation pattern works as follows:
 * 1. Try to INSERT a row with status='processing' (atomic claim)
 * 2. If INSERT fails (unique constraint), poll until status='completed' or timeout
 * 3. If INSERT succeeds, execute operation and UPDATE to status='completed'
 * 4. Handle stale reservations (>5min processing) by logging CRITICAL (NOT deleting)
 *
 * Usage:
 * ```ts
 * const traceId = await getTraceId();
 * const { cached, response } = await withIdempotency(
 *   adminClient,
 *   params.clientMutationId,
 *   async () => {
 *     // ... operation logic ...
 *     return result;
 *   },
 *   traceId // Optional: owner tracking for debugging stale reservations
 * );
 * ```
 */
export async function withIdempotency<T>(
	client: SupabaseClient,
	idempotencyKey: string | undefined,
	fn: () => Promise<T>,
	ownerId?: string
): Promise<IdempotencyResult<T>> {
	// If no key provided, execute without idempotency
	if (!idempotencyKey) {
		return { cached: false, response: await fn() };
	}

	// 1. Try to claim the key atomically
	const claim = await claimIdempotencyKey(client, idempotencyKey, ownerId);

	// 2. If already completed, return cached response
	if (claim.status === "already_completed") {
		return { cached: true, response: claim.response as T };
	}

	// 3. If another request is processing, wait for it
	if (claim.status === "already_processing") {
		const result = await pollForCompletion<T>(client, idempotencyKey, MAX_POLL_DURATION_MS);

		if (result !== null) {
			return { cached: true, response: result };
		}

		// Poll timed out - check if the reservation is stale
		const released = await releaseStaleReservation(client, idempotencyKey, ownerId);

		if (released) {
			return withIdempotency(client, idempotencyKey, fn, ownerId);
		}

		// Reservation is not stale (or is stale but we're not releasing it)
		// The requesting client should fail gracefully
		throw new Error(
			`Idempotency key "${idempotencyKey}" is locked by another request that has not completed`
		);
	}

	// 4. We claimed the key - execute the operation
	try {
		const response = await fn();
		await completeReservation(client, idempotencyKey, response);
		return { cached: false, response };
	} catch (error) {
		// On error, clean up the reservation so retries can succeed
		await cleanupFailedReservation(client, idempotencyKey);
		throw error;
	}
}
