"use server";

import { createClient } from "@/lib/supabase/server";
import { getStudentByIdForTutor, getStudentByUserId } from "@/lib/repositories/progress";
import { getHomeworkAssignmentForSubmission } from "@/lib/repositories/homework";

// ============================================================================
// Authentication Helper
// ============================================================================

/**
 * Require authenticated user for progress operations.
 * Returns null user if not authenticated.
 */
export async function requireUser() {
	const supabase = await createClient();
	const {
		data: { user },
		error,
	} = await supabase.auth.getUser();

	if (error || !user) {
		return { supabase, user: null as null };
	}

	return { supabase, user };
}

// ============================================================================
// Student Lookup Helpers
// ============================================================================

/**
 * Get student ID for the authenticated user.
 * Optionally scoped to a specific tutor.
 */
export async function getStudentForUser(
	supabase: Awaited<ReturnType<typeof createClient>>,
	userId: string,
	tutorId?: string
): Promise<{ studentId: string; tutorId: string } | null> {
	let student: Awaited<ReturnType<typeof getStudentByUserId>> | null = null;
	try {
		student = await getStudentByUserId(supabase, userId, tutorId);
	} catch {
		return null;
	}

	if (!student) {
		return null;
	}

	return {
		studentId: student.id,
		tutorId: student.tutor_id,
	};
}

/**
 * Verify that a tutor owns a specific student.
 */
export async function verifyStudentOwnership(
	supabase: Awaited<ReturnType<typeof createClient>>,
	studentId: string,
	tutorId: string
): Promise<boolean> {
	try {
		const student = await getStudentByIdForTutor(supabase, studentId, tutorId);
		return !!student;
	} catch {
		return false;
	}
}

/**
 * Verify that a student has access to a homework assignment.
 * Returns the student record if valid.
 */
export async function verifyHomeworkAccess(
	supabase: Awaited<ReturnType<typeof createClient>>,
	userId: string,
	assignmentId: string
): Promise<{ studentId: string; assignmentStudentId: string } | null> {
	// Get student for this user
	let student: Awaited<ReturnType<typeof getStudentByUserId>> | null = null;
	try {
		student = await getStudentByUserId(supabase, userId);
	} catch {
		return null;
	}

	if (!student) {
		return null;
	}

	// Get assignment and verify ownership
	let assignment: Awaited<ReturnType<typeof getHomeworkAssignmentForSubmission>> | null = null;
	try {
		assignment = await getHomeworkAssignmentForSubmission(supabase, assignmentId);
	} catch {
		return null;
	}

	if (!assignment) {
		return null;
	}

	if (assignment.student_id !== student.id) {
		return null;
	}

	return {
		studentId: student.id,
		assignmentStudentId: assignment.student_id,
	};
}
