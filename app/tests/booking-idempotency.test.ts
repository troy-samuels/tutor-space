import test from "node:test";
import assert from "node:assert/strict";
import {
	withIdempotency,
	getCachedResponse,
	cacheResponse,
} from "../lib/utils/idempotency.ts";
import type { SupabaseClient } from "@supabase/supabase-js";

// Mock Supabase client for testing
function createMockClient(
	storedResponses: Map<string, unknown>
): SupabaseClient {
	return {
		from: (table: string) => ({
			select: (columns: string) => ({
				eq: (column: string, value: string) => ({
					maybeSingle: async () => {
						const response = storedResponses.get(value);
						return {
							data: response ? { response_body: response } : null,
							error: null,
						};
					},
				}),
			}),
			upsert: async (
				data: { idempotency_key: string; response_body: unknown },
				_options: unknown
			) => {
				storedResponses.set(data.idempotency_key, data.response_body);
				return { error: null };
			},
		}),
	} as unknown as SupabaseClient;
}

test("getCachedResponse returns null for non-existent key", async () => {
	const store = new Map<string, unknown>();
	const client = createMockClient(store);

	const result = await getCachedResponse(client, "non-existent-key");

	assert.equal(result, null);
});

test("getCachedResponse returns cached value for existing key", async () => {
	const store = new Map<string, unknown>();
	const expectedResponse = { success: true, bookingId: "booking-123" };
	store.set("test-key", expectedResponse);
	const client = createMockClient(store);

	const result = await getCachedResponse(client, "test-key");

	assert.deepStrictEqual(result, expectedResponse);
});

test("cacheResponse stores response in database", async () => {
	const store = new Map<string, unknown>();
	const client = createMockClient(store);
	const response = { success: true, bookingId: "booking-456" };

	await cacheResponse(client, "new-key", response);

	assert.deepStrictEqual(store.get("new-key"), response);
});

test("withIdempotency returns cached response on duplicate key", async () => {
	const store = new Map<string, unknown>();
	const client = createMockClient(store);
	const idempotencyKey = "test-key-123";

	let executionCount = 0;
	const operation = async () => {
		executionCount++;
		return { success: true, bookingId: "booking-abc" };
	};

	// First call - should execute
	const result1 = await withIdempotency(client, idempotencyKey, operation);
	assert.equal(result1.cached, false);
	assert.equal(executionCount, 1);
	assert.deepStrictEqual(result1.response, {
		success: true,
		bookingId: "booking-abc",
	});

	// Second call with same key - should return cached
	const result2 = await withIdempotency(client, idempotencyKey, operation);
	assert.equal(result2.cached, true);
	assert.equal(executionCount, 1); // Still 1 - not executed again
	assert.deepStrictEqual(result2.response, {
		success: true,
		bookingId: "booking-abc",
	});
});

test("withIdempotency executes without caching when no key provided", async () => {
	const store = new Map<string, unknown>();
	const client = createMockClient(store);

	let executionCount = 0;
	const operation = async () => {
		executionCount++;
		return { success: true };
	};

	// Call without key
	const result1 = await withIdempotency(client, undefined, operation);
	assert.equal(result1.cached, false);
	assert.equal(executionCount, 1);

	// Second call without key - should execute again
	const result2 = await withIdempotency(client, undefined, operation);
	assert.equal(result2.cached, false);
	assert.equal(executionCount, 2);
});

test("duplicate createBooking calls with same key don't create duplicate records", async () => {
	const store = new Map<string, unknown>();
	const client = createMockClient(store);
	const idempotencyKey = "booking-mutation-456";

	const bookingsCreated: string[] = [];

	const createBookingOperation = async () => {
		const bookingId = `booking-${Date.now()}-${Math.random().toString(36).slice(2)}`;
		bookingsCreated.push(bookingId);
		return { success: true, bookingId };
	};

	// First call - creates booking
	const result1 = await withIdempotency(
		client,
		idempotencyKey,
		createBookingOperation
	);
	assert.equal(result1.cached, false);
	assert.equal(bookingsCreated.length, 1);

	// Second call with same key - returns cached (simulate network retry)
	const result2 = await withIdempotency(
		client,
		idempotencyKey,
		createBookingOperation
	);
	assert.equal(result2.cached, true);
	assert.equal(bookingsCreated.length, 1); // Still 1 - no duplicate

	// Both should return the same booking ID
	assert.equal(result1.response.bookingId, result2.response.bookingId);
});

test("different idempotency keys create separate bookings", async () => {
	const store = new Map<string, unknown>();
	const client = createMockClient(store);

	let bookingCounter = 0;
	const createBookingOperation = async () => {
		bookingCounter++;
		return { success: true, bookingId: `booking-${bookingCounter}` };
	};

	// Call with first key
	const result1 = await withIdempotency(
		client,
		"key-1",
		createBookingOperation
	);
	assert.equal(result1.cached, false);
	assert.equal(result1.response.bookingId, "booking-1");

	// Call with different key
	const result2 = await withIdempotency(
		client,
		"key-2",
		createBookingOperation
	);
	assert.equal(result2.cached, false);
	assert.equal(result2.response.bookingId, "booking-2");

	// Verify both are stored separately
	assert.equal(bookingCounter, 2);
});

test("withIdempotency handles error responses correctly", async () => {
	const store = new Map<string, unknown>();
	const client = createMockClient(store);
	const idempotencyKey = "error-key";

	const errorResponse = { error: "Service not found" };
	const operation = async () => errorResponse;

	// First call - should cache error response
	const result1 = await withIdempotency(client, idempotencyKey, operation);
	assert.equal(result1.cached, false);
	assert.deepStrictEqual(result1.response, errorResponse);

	// Second call - should return cached error response
	const result2 = await withIdempotency(client, idempotencyKey, operation);
	assert.equal(result2.cached, true);
	assert.deepStrictEqual(result2.response, errorResponse);
});
