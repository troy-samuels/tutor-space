import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { User } from "@supabase/supabase-js";

/**
 * Authentication error class for consistent error handling
 */
export class AuthError extends Error {
  constructor(
    message: string,
    public code: "UNAUTHENTICATED" | "FORBIDDEN" | "NOT_FOUND" = "UNAUTHENTICATED"
  ) {
    super(message);
    this.name = "AuthError";
  }
}

/**
 * Result type for auth operations that don't throw
 */
export type AuthResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Require authentication and return the authenticated user.
 * Throws AuthError if user is not authenticated.
 *
 * @example
 * ```ts
 * const user = await requireAuth();
 * // user.id is guaranteed to exist
 * ```
 */
export async function requireAuth(): Promise<User> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error) {
    console.error("[Auth] Error getting user:", error.message);
  }

  if (!user) {
    throw new AuthError("You need to be signed in to perform this action");
  }

  return user;
}

/**
 * Get the authenticated user without throwing.
 * Returns null if not authenticated.
 *
 * @example
 * ```ts
 * const user = await getAuthUser();
 * if (!user) {
 *   return { error: "Please sign in" };
 * }
 * ```
 */
export async function getAuthUser(): Promise<User | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * Get user with result type for actions that return error objects.
 *
 * @example
 * ```ts
 * const result = await getAuthUserResult();
 * if (!result.success) {
 *   return { error: result.error };
 * }
 * const user = result.data;
 * ```
 */
export async function getAuthUserResult(): Promise<AuthResult<User>> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error) {
    console.error("[Auth] Error getting user:", error.message);
    return { success: false, error: "Authentication failed" };
  }

  if (!user) {
    return { success: false, error: "You need to be signed in to perform this action" };
  }

  return { success: true, data: user };
}

/**
 * Verify that the authenticated user owns a record.
 * Throws AuthError if ownership check fails.
 *
 * @param table - The table name
 * @param recordId - The record ID to check
 * @param userId - The user ID to verify ownership against
 * @param ownerField - The field name that stores the owner ID (default: "tutor_id")
 *
 * @example
 * ```ts
 * await verifyOwnership("bookings", bookingId, user.id);
 * // Throws AuthError if user doesn't own the booking
 * ```
 */
export async function verifyOwnership(
  table: string,
  recordId: string,
  userId: string,
  ownerField: string = "tutor_id"
): Promise<void> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from(table)
    .select(ownerField)
    .eq("id", recordId)
    .single();

  if (error || !data) {
    throw new AuthError("Resource not found", "NOT_FOUND");
  }

  const recordData = data as unknown as Record<string, unknown>;
  if (recordData[ownerField] !== userId) {
    throw new AuthError("You don't have permission to access this resource", "FORBIDDEN");
  }
}

/**
 * Verify ownership without throwing - returns a result object.
 * Useful for server actions that return error objects.
 *
 * @example
 * ```ts
 * const result = await verifyOwnershipResult("bookings", bookingId, user.id);
 * if (!result.success) {
 *   return { error: result.error };
 * }
 * ```
 */
export async function verifyOwnershipResult(
  table: string,
  recordId: string,
  userId: string,
  ownerField: string = "tutor_id"
): Promise<AuthResult<void>> {
  try {
    await verifyOwnership(table, recordId, userId, ownerField);
    return { success: true, data: undefined };
  } catch (err) {
    if (err instanceof AuthError) {
      return { success: false, error: err.message };
    }
    return { success: false, error: "Access verification failed" };
  }
}

/**
 * Get record with ownership verification in one query.
 * More efficient than separate queries.
 *
 * @example
 * ```ts
 * const booking = await getOwnedRecord("bookings", bookingId, user.id, "id, status, scheduled_at");
 * // Returns the record data if owned by user, throws otherwise
 * ```
 */
export async function getOwnedRecord<T extends Record<string, unknown>>(
  table: string,
  recordId: string,
  userId: string,
  select: string = "*",
  ownerField: string = "tutor_id"
): Promise<T> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from(table)
    .select(select)
    .eq("id", recordId)
    .eq(ownerField, userId)
    .single();

  if (error || !data) {
    throw new AuthError("You don't have permission to access this resource", "FORBIDDEN");
  }

  return data as unknown as T;
}

/**
 * Get record with ownership verification - result version.
 *
 * @example
 * ```ts
 * const result = await getOwnedRecordResult("bookings", bookingId, user.id, "id, status");
 * if (!result.success) {
 *   return { error: result.error };
 * }
 * const booking = result.data;
 * ```
 */
export async function getOwnedRecordResult<T extends Record<string, unknown>>(
  table: string,
  recordId: string,
  userId: string,
  select: string = "*",
  ownerField: string = "tutor_id"
): Promise<AuthResult<T>> {
  try {
    const data = await getOwnedRecord<T>(table, recordId, userId, select, ownerField);
    return { success: true, data };
  } catch (err) {
    if (err instanceof AuthError) {
      return { success: false, error: err.message };
    }
    return { success: false, error: "Failed to access resource" };
  }
}

/**
 * Get admin client for elevated operations.
 * Returns null if service role is not configured.
 *
 * @example
 * ```ts
 * const adminClient = getAdminClient();
 * if (!adminClient) {
 *   return { error: "Service unavailable" };
 * }
 * ```
 */
export function getAdminClient() {
  return createServiceRoleClient();
}

/**
 * Require admin client and throw if not available.
 *
 * @example
 * ```ts
 * const adminClient = requireAdminClient();
 * // adminClient is guaranteed to exist
 * ```
 */
export function requireAdminClient() {
  const client = createServiceRoleClient();
  if (!client) {
    throw new AuthError("Service unavailable", "FORBIDDEN");
  }
  return client;
}
