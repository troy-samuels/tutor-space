"use server";

import { revalidatePath } from "next/cache";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import {
	updateStudentLabels as repoUpdateStudentLabels,
	getStudentById,
} from "@/lib/repositories/students";
import { recordAudit } from "@/lib/repositories/audit";
import {
	getTraceId,
	createRequestLogger,
	logStep,
	logStepError,
} from "@/lib/logger";
import { requireTutor } from "./helpers.ts";

// ============================================================================
// Update Student Labels
// ============================================================================

/**
 * Update student labels for organization.
 *
 * Compliance:
 * - Repository Law: Uses updateStudentLabels from repository
 * - Observability Law: Has traceId, logStep, logStepError
 * - Safety Law: N/A (update operation, idempotent by nature)
 * - Security Law: N/A (tutor-authenticated only)
 * - Audit Law: Records audit for label changes
 */
export async function updateStudentLabels(
	studentId: string,
	labels: string[]
): Promise<{ error?: string }> {
	const traceId = await getTraceId();
	const { user } = await requireTutor();

	if (!user) {
		return { error: "Not authenticated" };
	}

	const log = createRequestLogger(traceId, user.id);
	logStep(log, "updateStudentLabels:start", { studentId, labelCount: labels.length });

	const adminClient = createServiceRoleClient();
	if (!adminClient) {
		logStep(log, "updateStudentLabels:no_admin_client", {});
		return { error: "Service unavailable" };
	}

	try {
		// Get current state for audit
		const beforeStudent = await getStudentById(adminClient, studentId, user.id);
		if (!beforeStudent) {
			logStep(log, "updateStudentLabels:student_not_found", { studentId });
			return { error: "Student not found" };
		}

		const beforeLabels = beforeStudent.labels ?? [];

		// Perform update via repository
		await repoUpdateStudentLabels(adminClient, studentId, user.id, labels);

		// Audit Law: Record label change
		await recordAudit(adminClient, {
			actorId: user.id,
			targetId: studentId,
			entityType: "student",
			actionType: "update",
			beforeState: { labels: beforeLabels },
			afterState: { labels },
			metadata: {
				field: "labels",
			},
		});

		logStep(log, "updateStudentLabels:success", { studentId });
		revalidatePath(`/students/${studentId}`);
		return {};
	} catch (error) {
		logStepError(log, "updateStudentLabels:failed", error, { studentId });
		return { error: "Failed to update labels" };
	}
}
