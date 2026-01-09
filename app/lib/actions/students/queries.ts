"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import {
	listStudentsForTutor,
	countPendingAccessRequests,
	type StudentRecord,
} from "@/lib/repositories/students";
import {
	getTraceId,
	createRequestLogger,
	logStep,
} from "@/lib/logger";
import { requireTutor } from "./helpers";

// ============================================================================
// List Students
// ============================================================================

/**
 * List all students for the authenticated tutor.
 *
 * Compliance:
 * - Repository Law: Uses listStudentsForTutor from repository
 * - Observability Law: Has traceId and logStep
 * - Safety Law: N/A (read operation)
 * - Security Law: N/A (tutor-authenticated only)
 * - Audit Law: N/A (read operation)
 */
export async function listStudents(): Promise<StudentRecord[]> {
	const traceId = await getTraceId();
	const { user } = await requireTutor();

	if (!user) {
		return [];
	}

	const log = createRequestLogger(traceId, user.id);
	logStep(log, "listStudents:start", {});

	const adminClient = createServiceRoleClient();
	if (!adminClient) {
		logStep(log, "listStudents:no_admin_client", {});
		return [];
	}

	try {
		const students = await listStudentsForTutor(adminClient, user.id);
		logStep(log, "listStudents:success", { count: students.length });
		return students;
	} catch (error) {
		logStep(log, "listStudents:error", { error: String(error) });
		return [];
	}
}

// ============================================================================
// Pending Access Requests Count
// ============================================================================

/**
 * Get pending access requests count for dashboard widget.
 *
 * Compliance:
 * - Repository Law: Uses countPendingAccessRequests from repository
 * - Observability Law: Has traceId and logStep
 * - Safety Law: N/A (read operation)
 * - Security Law: N/A (tutor-authenticated only)
 * - Audit Law: N/A (read operation)
 */
export async function getPendingAccessRequestsCount(): Promise<number> {
	const traceId = await getTraceId();
	const supabase = await createClient();

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return 0;
	}

	const log = createRequestLogger(traceId, user.id);
	logStep(log, "getPendingAccessRequestsCount:start", {});

	const adminClient = createServiceRoleClient();
	if (!adminClient) {
		logStep(log, "getPendingAccessRequestsCount:no_admin_client", {});
		return 0;
	}

	try {
		const count = await countPendingAccessRequests(adminClient, user.id);
		logStep(log, "getPendingAccessRequestsCount:success", { count });
		return count;
	} catch (error) {
		logStep(log, "getPendingAccessRequestsCount:error", { error: String(error) });
		return 0;
	}
}
