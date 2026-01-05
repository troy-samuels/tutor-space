import type { SupabaseClient } from "@supabase/supabase-js";

// ============================================================================
// Types
// ============================================================================

/** Entity types that can be audited */
export type AuditEntityType = "booking" | "student" | "billing";

/** Action types for audit entries */
export type AuditActionType =
	| "create"
	| "update"
	| "update_status"
	| "manual_payment"
	| "delete";

export interface RecordAuditInput {
	readonly actorId: string;
	readonly targetId?: string | null;
	readonly entityType: AuditEntityType;
	readonly actionType: AuditActionType;
	readonly metadata?: Record<string, unknown>;
}

export interface AuditLogEntry {
	id: string;
	actor_id: string;
	target_id: string | null;
	entity_type: AuditEntityType;
	action_type: AuditActionType;
	metadata: Record<string, unknown>;
	created_at: string;
}

// ============================================================================
// Write Operations
// ============================================================================

/**
 * Record an audit log entry.
 *
 * Audit logs are immutable - once inserted, they cannot be modified or deleted.
 * This function logs errors but does not throw, so audit failures don't break
 * business operations.
 *
 * @param client - Supabase client (admin/service role recommended)
 * @param input - Audit entry data
 *
 * @example
 * // Record a booking status change
 * await recordAudit(adminClient, {
 *   actorId: tutorId,
 *   targetId: bookingId,
 *   entityType: "booking",
 *   actionType: "update_status",
 *   metadata: { previousStatus: "pending", newStatus: "confirmed" }
 * });
 *
 * @example
 * // Record a manual payment
 * await recordAudit(adminClient, {
 *   actorId: tutorId,
 *   targetId: bookingId,
 *   entityType: "billing",
 *   actionType: "manual_payment",
 *   metadata: { amount: 5000, currency: "USD", method: "venmo" }
 * });
 */
export async function recordAudit(
	client: SupabaseClient,
	input: RecordAuditInput
): Promise<void> {
	const { error } = await client.from("audit_logs").insert({
		actor_id: input.actorId,
		target_id: input.targetId ?? null,
		entity_type: input.entityType,
		action_type: input.actionType,
		metadata: input.metadata ?? {},
	});

	if (error) {
		// Log but don't throw - audit failures shouldn't break business operations
		console.error("[Audit] Failed to record audit log:", error);
	}
}

// ============================================================================
// Read Operations
// ============================================================================

/**
 * List audit logs for a specific entity.
 *
 * @param client - Supabase client
 * @param entityType - Type of entity to query
 * @param targetId - ID of the specific entity
 * @param options - Query options (limit defaults to 50)
 * @returns Array of audit log entries, newest first
 *
 * @example
 * // Get all audit logs for a booking
 * const logs = await listAuditLogsForEntity(client, "booking", bookingId);
 */
export async function listAuditLogsForEntity(
	client: SupabaseClient,
	entityType: AuditEntityType,
	targetId: string,
	options?: { limit?: number }
): Promise<AuditLogEntry[]> {
	const { data, error } = await client
		.from("audit_logs")
		.select("*")
		.eq("entity_type", entityType)
		.eq("target_id", targetId)
		.order("created_at", { ascending: false })
		.limit(options?.limit ?? 50);

	if (error) {
		throw error;
	}

	return (data ?? []) as AuditLogEntry[];
}

/**
 * List audit logs by actor (tutor/admin).
 *
 * @param client - Supabase client
 * @param actorId - ID of the actor who performed actions
 * @param options - Query options (entityType filter, limit defaults to 50)
 * @returns Array of audit log entries, newest first
 *
 * @example
 * // Get all audit logs for a tutor
 * const logs = await listAuditLogsByActor(client, tutorId);
 *
 * @example
 * // Get only booking-related logs for a tutor
 * const bookingLogs = await listAuditLogsByActor(client, tutorId, {
 *   entityType: "booking"
 * });
 */
export async function listAuditLogsByActor(
	client: SupabaseClient,
	actorId: string,
	options?: { entityType?: AuditEntityType; limit?: number }
): Promise<AuditLogEntry[]> {
	let query = client
		.from("audit_logs")
		.select("*")
		.eq("actor_id", actorId)
		.order("created_at", { ascending: false })
		.limit(options?.limit ?? 50);

	if (options?.entityType) {
		query = query.eq("entity_type", options.entityType);
	}

	const { data, error } = await query;

	if (error) {
		throw error;
	}

	return (data ?? []) as AuditLogEntry[];
}
