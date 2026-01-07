"use server";

import { revalidatePath } from "next/cache";
import { getStudentById, softDeleteStudent } from "@/lib/repositories/students";
import {
	getTraceId,
	createRequestLogger,
	logStep,
	logStepError,
} from "@/lib/logger";
import { requireTutor } from "./helpers.ts";

// ============================================================================
// Delete Student
// ============================================================================

/**
 * Soft delete a student (sets deleted_at timestamp).
 *
 * Compliance:
 * - Repository Law: Uses softDeleteStudent from repository
 * - Observability Law: Has traceId, logStep, logStepError
 * - Safety Law: N/A (not a create operation)
 * - Security Law: N/A (tutor-authenticated only)
 * - Audit Law: TODO - Should add audit for delete
 */
export async function deleteStudent(studentId: string) {
	const traceId = await getTraceId();
	const { supabase, user } = await requireTutor();

	if (!user) {
		return { error: "You must be logged in to delete students." };
	}

	const log = createRequestLogger(traceId, user.id);
	logStep(log, "deleteStudent:start", { studentId });

	// Verify the student exists and belongs to this tutor
	let existing = null;
	try {
		existing = await getStudentById(supabase, studentId, user.id);
	} catch (error) {
		logStepError(log, "deleteStudent:lookup_failed", error, { studentId });
		return { error: "We couldn't find that student. Please try again." };
	}

	if (!existing) {
		logStep(log, "deleteStudent:not_found", { studentId });
		return { error: "We couldn't find that student. Please try again." };
	}

	logStep(log, "softDelete:student", { studentId, deletedAt: new Date().toISOString() });
	const result = await softDeleteStudent(supabase, studentId, user.id);

	if (!result.success) {
		logStepError(log, "softDelete:student:failed", result.error, { studentId });
		return { error: "We couldn't delete that student. Please try again." };
	}

	revalidatePath("/students");
	revalidatePath("/students/access-requests");

	logStep(log, "deleteStudent:success", { studentId });
	return { success: true };
}
