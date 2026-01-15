"use server";

import { revalidatePath } from "next/cache";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import {
	updateStudentLabels as repoUpdateStudentLabels,
	updateStudentDetails as repoUpdateStudentDetails,
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
// Update Student Details
// ============================================================================

export type StudentUpdateFields = {
	full_name?: string;
	email?: string;
	phone?: string | null;
	proficiency_level?: string | null;
	learning_goals?: string | null;
	native_language?: string | null;
	notes?: string | null;
	status?: string | null;
};

/**
 * Update student details.
 *
 * Compliance:
 * - Repository Law: Uses updateStudentDetails from repository
 * - Observability Law: Has traceId, logStep, logStepError
 * - Safety Law: N/A (update operation, idempotent by nature)
 * - Security Law: N/A (tutor-authenticated only)
 * - Audit Law: Records audit for field changes
 */
export async function updateStudent(
	studentId: string,
	updates: StudentUpdateFields
): Promise<{ error?: string }> {
	const traceId = await getTraceId();
	const { user } = await requireTutor();

	if (!user) {
		return { error: "Not authenticated" };
	}

	const log = createRequestLogger(traceId, user.id);
	logStep(log, "updateStudent:start", { studentId, fields: Object.keys(updates) });

	const adminClient = createServiceRoleClient();
	if (!adminClient) {
		logStep(log, "updateStudent:no_admin_client", {});
		return { error: "Service unavailable" };
	}

	// Validate required fields
	if (updates.email !== undefined && !updates.email?.trim()) {
		return { error: "Email is required" };
	}
	if (updates.full_name !== undefined && !updates.full_name?.trim()) {
		return { error: "Full name is required" };
	}

	try {
		// Get current state for audit
		const beforeStudent = await getStudentById(adminClient, studentId, user.id);
		if (!beforeStudent) {
			logStep(log, "updateStudent:student_not_found", { studentId });
			return { error: "Student not found" };
		}

		// Build before/after state for audit
		const beforeState: Record<string, unknown> = {};
		const afterState: Record<string, unknown> = {};
		const studentRecord = beforeStudent as unknown as Record<string, unknown>;
		for (const [key, value] of Object.entries(updates)) {
			beforeState[key] = studentRecord[key];
			afterState[key] = value;
		}

		// Normalize email if present
		const normalizedUpdates = { ...updates };
		if (normalizedUpdates.email) {
			normalizedUpdates.email = normalizedUpdates.email.toLowerCase().trim();
		}

		// Perform update via repository
		await repoUpdateStudentDetails(adminClient, studentId, user.id, normalizedUpdates);

		// Audit Law: Record field changes
		await recordAudit(adminClient, {
			actorId: user.id,
			targetId: studentId,
			entityType: "student",
			actionType: "update",
			beforeState,
			afterState,
			metadata: {
				fields: Object.keys(updates),
			},
		});

		logStep(log, "updateStudent:success", { studentId });
		revalidatePath(`/students/${studentId}`);
		revalidatePath("/students");
		return {};
	} catch (error) {
		logStepError(log, "updateStudent:failed", error, { studentId });
		return { error: "Failed to update student" };
	}
}

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
