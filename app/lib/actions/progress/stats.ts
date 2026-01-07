"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import {
	getLearningStats,
	getGoalsForStudent,
	getLatestAssessmentsForStudent,
	getRecentLessonNotes,
	getStudentProgressContext,
} from "@/lib/repositories/progress";
import {
	getHomeworkForStudent,
	getHomeworkForStudentWithDrills,
	getLatestSubmissionsForHomework,
} from "@/lib/repositories/homework";
import {
	getTraceId,
	createRequestLogger,
	logStep,
	logStepError,
} from "@/lib/logger";
import { requireUser, getStudentForUser, verifyStudentOwnership } from "./helpers";
import type { StudentProgressResult, HomeworkAssignment } from "./types";

// ============================================================================
// Get Student Progress (Student Portal)
// ============================================================================

/**
 * Get student progress data for the student portal.
 *
 * Compliance:
 * - Repository Law: Uses repository functions for all DB operations
 * - Observability Law: Has traceId, logStep
 * - Safety Law: N/A (read operation)
 * - Security Law: N/A (student-authenticated only)
 * - Audit Law: N/A (read operation)
 */
export async function getStudentProgress(
	tutorId?: string,
	studentIdOverride?: string
): Promise<StudentProgressResult> {
	const traceId = await getTraceId();
	const supabase = await createClient();

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return { stats: null, goals: [], assessments: [], recentNotes: [], homework: [] };
	}

	const log = createRequestLogger(traceId, user.id);
	logStep(log, "getStudentProgress:start", { tutorId, studentIdOverride });

	const serviceClient = createServiceRoleClient();
	if (!serviceClient) {
		logStep(log, "getStudentProgress:no_service_client", {});
		return { stats: null, goals: [], assessments: [], recentNotes: [], homework: [] };
	}

	const emptyResponse: StudentProgressResult = {
		stats: null,
		goals: [],
		assessments: [],
		recentNotes: [],
		homework: [],
	};

	// Resolve student and tutor IDs
	let studentId = studentIdOverride ?? null;
	let scopedTutorId = tutorId ?? null;

	if (!studentId || !scopedTutorId) {
		try {
			const student = await getStudentProgressContext(serviceClient, {
				userId: user.id,
				studentId: studentIdOverride,
				tutorId,
			});
			studentId = student?.id ?? studentId;
			scopedTutorId = student?.tutor_id ?? scopedTutorId;
		} catch (error) {
			logStepError(log, "getStudentProgress:student_lookup_failed", error, {});
			return emptyResponse;
		}
	}

	if (!studentId || !scopedTutorId) {
		logStep(log, "getStudentProgress:student_not_found", {});
		return emptyResponse;
	}

	try {
		// Fetch all data in parallel using repository functions
		const [stats, goals, assessments, recentNotes, homework] = await Promise.all([
			getLearningStats(serviceClient, studentId, scopedTutorId),
			getGoalsForStudent(serviceClient, studentId, scopedTutorId),
			getLatestAssessmentsForStudent(serviceClient, studentId, scopedTutorId),
			getRecentLessonNotes(serviceClient, studentId, scopedTutorId, 10),
			getHomeworkForStudent(serviceClient, studentId, scopedTutorId, { limit: 25 }),
		]);

		// Fetch latest submissions for homework
		let homeworkWithSubmissions: HomeworkAssignment[] = homework;
		if (homework.length > 0) {
			const homeworkIds = homework.map((h) => h.id);
			const latestSubmissions = await getLatestSubmissionsForHomework(
				serviceClient,
				homeworkIds,
				studentId
			);

			homeworkWithSubmissions = homework.map((h) => ({
				...h,
				latest_submission: latestSubmissions[h.id] ?? null,
			}));
		}

		logStep(log, "getStudentProgress:success", {
			studentId,
			goalsCount: goals.length,
			homeworkCount: homework.length,
		});

		return {
			stats,
			goals,
			assessments,
			recentNotes,
			homework: homeworkWithSubmissions,
		};
	} catch (error) {
		logStepError(log, "getStudentProgress:failed", error, { studentId });
		return emptyResponse;
	}
}

// ============================================================================
// Get Tutor Student Progress (Tutor CRM)
// ============================================================================

/**
 * Get progress overview for a tutor's student.
 *
 * Compliance:
 * - Repository Law: Uses repository functions for all DB operations
 * - Observability Law: Has traceId, logStep
 * - Safety Law: N/A (read operation)
 * - Security Law: Validates tutor ownership
 * - Audit Law: N/A (read operation)
 */
export async function getTutorStudentProgress(studentId: string): Promise<StudentProgressResult> {
	const traceId = await getTraceId();
	const { supabase, user } = await requireUser();

	if (!user) {
		return { stats: null, goals: [], assessments: [], recentNotes: [], homework: [] };
	}

	const log = createRequestLogger(traceId, user.id);
	logStep(log, "getTutorStudentProgress:start", { studentId });

	const serviceClient = createServiceRoleClient();
	if (!serviceClient) {
		logStep(log, "getTutorStudentProgress:no_service_client", {});
		return { stats: null, goals: [], assessments: [], recentNotes: [], homework: [] };
	}

	const emptyResponse: StudentProgressResult = {
		stats: null,
		goals: [],
		assessments: [],
		recentNotes: [],
		homework: [],
	};

	// Verify tutor owns this student
	const isOwner = await verifyStudentOwnership(serviceClient, studentId, user.id);
	if (!isOwner) {
		logStep(log, "getTutorStudentProgress:access_denied", { studentId });
		return emptyResponse;
	}

	try {
		// Fetch all data in parallel using repository functions
		const [stats, goals, assessments, recentNotes, homework] = await Promise.all([
			getLearningStats(serviceClient, studentId, user.id),
			getGoalsForStudent(serviceClient, studentId, user.id),
			getLatestAssessmentsForStudent(serviceClient, studentId, user.id),
			getRecentLessonNotes(serviceClient, studentId, user.id, 10),
			getHomeworkForStudentWithDrills(serviceClient, studentId, user.id, 25),
		]);

		logStep(log, "getTutorStudentProgress:success", {
			studentId,
			goalsCount: goals.length,
			homeworkCount: homework.length,
		});

		return {
			stats,
			goals,
			assessments,
			recentNotes,
			homework,
		};
	} catch (error) {
		logStepError(log, "getTutorStudentProgress:failed", error, { studentId });
		return emptyResponse;
	}
}
