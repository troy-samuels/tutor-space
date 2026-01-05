import type { SupabaseClient } from "@supabase/supabase-js";

export interface IdempotencyResult<T> {
	cached: boolean;
	response: T;
}

/**
 * Check if a request with this idempotency key was already processed.
 * Returns cached response if found, null otherwise.
 */
export async function getCachedResponse<T>(
	client: SupabaseClient,
	idempotencyKey: string
): Promise<T | null> {
	const { data, error } = await client
		.from("processed_requests")
		.select("response_body")
		.eq("idempotency_key", idempotencyKey)
		.maybeSingle();

	if (error && error.code !== "PGRST116") {
		throw error;
	}

	// Explicitly return null when no data found (not undefined)
	return (data?.response_body ?? null) as T | null;
}

/**
 * Store the response for an idempotency key.
 * Uses upsert with ON CONFLICT to handle race conditions safely.
 */
export async function cacheResponse<T>(
	client: SupabaseClient,
	idempotencyKey: string,
	response: T
): Promise<void> {
	const { error } = await client.from("processed_requests").upsert(
		{
			idempotency_key: idempotencyKey,
			response_body: response,
		},
		{
			onConflict: "idempotency_key",
		}
	);

	if (error) {
		// Log but don't throw - caching failure shouldn't break the request
		console.error("[Idempotency] Failed to cache response:", error.message);
	}
}

/**
 * Wrapper for idempotent operations.
 * Checks cache, executes if not cached, stores result.
 *
 * Usage:
 * ```ts
 * const { cached, response } = await withIdempotency(
 *   adminClient,
 *   params.clientMutationId,
 *   async () => {
 *     // ... operation logic ...
 *     return result;
 *   }
 * );
 * ```
 */
export async function withIdempotency<T>(
	client: SupabaseClient,
	idempotencyKey: string | undefined,
	fn: () => Promise<T>
): Promise<IdempotencyResult<T>> {
	// If no key provided, execute without idempotency
	if (!idempotencyKey) {
		return { cached: false, response: await fn() };
	}

	// Check for cached response
	const cached = await getCachedResponse<T>(client, idempotencyKey);
	if (cached !== null) {
		return { cached: true, response: cached };
	}

	// Execute the operation
	const response = await fn();

	// Cache the response
	await cacheResponse(client, idempotencyKey, response);

	return { cached: false, response };
}
