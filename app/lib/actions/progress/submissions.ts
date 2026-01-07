"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import {
	createHomeworkSubmission as repoCreateSubmission,
	getSubmissionsForHomework as repoGetSubmissions,
	getSubmissionById as repoGetSubmission,
	getSubmissionWithHomework,
	updateSubmissionReview as repoUpdateReview,
	getHomeworkAssignmentForSubmission,
	markHomeworkCompletedFromReview,
} from "@/lib/repositories/homework";
import { getStudentByUserId, getStudentContactById } from "@/lib/repositories/progress";
import { recordAudit } from "@/lib/repositories/audit";
import { checkRateLimit, getClientIP } from "@/lib/security/limiter";
import { withIdempotency } from "@/lib/utils/idempotency";
import {
	getTraceId,
	createRequestLogger,
	logStep,
	logStepError,
	sanitizeInput,
} from "@/lib/logger";
import { requireUser } from "./helpers";
import type {
	HomeworkSubmission,
	SubmitHomeworkInput,
	ReviewSubmissionInput,
	SubmitHomeworkResult,
	ReviewSubmissionResult,
} from "./types";

// ============================================================================
// Submit Homework
// ============================================================================

/**
 * Submit homework as a student.
 * Creates a submission record.
 *
 * Compliance:
 * - Repository Law: Uses createHomeworkSubmission from repository
 * - Observability Law: Has traceId, logStep, logStepError
 * - Safety Law: Wrapped with idempotency to prevent duplicate submissions
 * - Security Law: Rate limited to prevent abuse
 * - Audit Law: Records audit for submission creation
 */
export async function submitHomework(
	input: SubmitHomeworkInput
): Promise<SubmitHomeworkResult> {
	const traceId = await getTraceId();
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return { data: null, error: "You must be signed in to submit homework" };
	}

	const log = createRequestLogger(traceId, user.id);
	logStep(log, "submitHomework:start", { homeworkId: input.homeworkId });

	// Security Law: Rate limit to prevent abuse
	const headersList = await headers();
	const ipAddress = getClientIP(headersList);
	const rateLimitResult = await checkRateLimit(ipAddress, "homework_submission");
	if (!rateLimitResult.success) {
		logStep(log, "submitHomework:rate_limited", {});
		return {
			data: null,
			error: "Too many submissions. Please try again later.",
		};
	}

	const adminClient = createServiceRoleClient();
	if (!adminClient) {
		logStep(log, "submitHomework:no_admin_client", {});
		return { data: null, error: "Service unavailable" };
	}

	// Find the student record for this user
	let student: Awaited<ReturnType<typeof getStudentByUserId>> | null = null;
	try {
		student = await getStudentByUserId(supabase, user.id);
	} catch (error) {
		logStepError(log, "submitHomework:student_lookup_failed", error, {});
		return { data: null, error: "Service unavailable" };
	}

	if (!student) {
		logStep(log, "submitHomework:student_not_found", {});
		return { data: null, error: "Student record not found" };
	}

	// Verify the homework assignment exists and belongs to this student
	let homework: Awaited<ReturnType<typeof getHomeworkAssignmentForSubmission>> | null = null;
	try {
		homework = await getHomeworkAssignmentForSubmission(adminClient, input.homeworkId);
	} catch (error) {
		logStepError(log, "submitHomework:homework_lookup_failed", error, {
			homeworkId: input.homeworkId,
		});
		return { data: null, error: "Service unavailable" };
	}

	if (!homework) {
		logStep(log, "submitHomework:homework_not_found", { homeworkId: input.homeworkId });
		return { data: null, error: "Homework assignment not found" };
	}

	if (homework.student_id !== student.id) {
		logStep(log, "submitHomework:access_denied", { homeworkId: input.homeworkId });
		return { data: null, error: "This homework is not assigned to you" };
	}

	if (homework.status === "completed" || homework.status === "cancelled") {
		logStep(log, "submitHomework:invalid_status", {
			homeworkId: input.homeworkId,
			status: homework.status,
		});
		return { data: null, error: "This homework cannot accept submissions" };
	}

	// Safety Law: Use idempotency wrapper to prevent duplicate submissions
	const idempotencyKey = `hw-submit:${input.homeworkId}:${student.id}:${Date.now().toString().slice(0, -4)}`;

	try {
		const result = await withIdempotency<SubmitHomeworkResult>(
			adminClient,
			idempotencyKey,
			async () => {
				const submission = await repoCreateSubmission(adminClient, {
					homeworkId: input.homeworkId,
					studentId: student.id,
					textResponse: input.textResponse,
					audioUrl: input.audioUrl,
					fileAttachments: input.fileAttachments,
				});

				// Audit Law: Record submission creation
				await recordAudit(adminClient, {
					actorId: user.id,
					targetId: submission.id,
					entityType: "homework",
					actionType: "submit",
					beforeState: null,
					afterState: sanitizeInput(submission) as Record<string, unknown>,
					metadata: {
						homeworkId: input.homeworkId,
						studentId: student.id,
						hasText: !!input.textResponse,
						hasAudio: !!input.audioUrl,
						fileCount: input.fileAttachments?.length ?? 0,
					},
				});

				return { data: submission, error: null };
			},
			user.id // ownerId for debugging stale reservations
		);

		// Send notification to tutor
		try {
			const studentData = await getStudentContactById(adminClient, student.id);

			if (studentData) {
				const studentName =
					[studentData.first_name, studentData.last_name].filter(Boolean).join(" ") ||
					"Student";
				const { notifyHomeworkSubmissionReceived } = await import(
					"@/lib/actions/notifications"
				);
				await notifyHomeworkSubmissionReceived({
					tutorId: homework.tutor_id,
					studentName,
					homeworkId: input.homeworkId,
					homeworkTitle: homework.title,
					studentId: student.id,
				});
			}
		} catch (notificationError) {
			logStepError(log, "submitHomework:notification_failed", notificationError, {
				homeworkId: input.homeworkId,
			});
		}

		logStep(log, "submitHomework:success", {
			homeworkId: input.homeworkId,
			submissionId: result?.response?.data?.id,
		});

		return result.response;
	} catch (error) {
		logStepError(log, "submitHomework:failed", error, { homeworkId: input.homeworkId });
		return { data: null, error: "Failed to submit homework" };
	}
}

// ============================================================================
// Get Homework Submissions
// ============================================================================

/**
 * Get submissions for a homework assignment.
 * Available to both tutors (for their students) and students (for their own).
 *
 * Compliance:
 * - Repository Law: Uses getSubmissionsForHomework from repository
 * - Observability Law: Has traceId and logStep
 * - Safety Law: N/A (read operation)
 * - Security Law: N/A (RLS handles access control)
 * - Audit Law: N/A (read operation)
 */
export async function getHomeworkSubmissions(
	homeworkId: string
): Promise<{ data: HomeworkSubmission[]; error: string | null }> {
	const traceId = await getTraceId();
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return { data: [], error: "You must be signed in" };
	}

	const log = createRequestLogger(traceId, user.id);
	logStep(log, "getHomeworkSubmissions:start", { homeworkId });

	try {
		const submissions = await repoGetSubmissions(supabase, homeworkId);
		logStep(log, "getHomeworkSubmissions:success", {
			homeworkId,
			count: submissions.length,
		});
		return { data: submissions, error: null };
	} catch (error) {
		logStepError(log, "getHomeworkSubmissions:failed", error, { homeworkId });
		return { data: [], error: "Failed to fetch submissions" };
	}
}

// ============================================================================
// Review Submission
// ============================================================================

/**
 * Review a homework submission (tutor only).
 * Updates feedback and review status.
 *
 * Compliance:
 * - Repository Law: Uses updateSubmissionReview from repository
 * - Observability Law: Has traceId, logStep, logStepError
 * - Safety Law: N/A (update is naturally idempotent)
 * - Security Law: Validates tutor ownership
 * - Audit Law: Records audit with before/after state
 */
export async function reviewSubmission(
	input: ReviewSubmissionInput
): Promise<ReviewSubmissionResult> {
	const traceId = await getTraceId();
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return { error: "You must be signed in" };
	}

	const log = createRequestLogger(traceId, user.id);
	logStep(log, "reviewSubmission:start", {
		submissionId: input.submissionId,
		status: input.status,
	});

	const adminClient = createServiceRoleClient();
	if (!adminClient) {
		logStep(log, "reviewSubmission:no_admin_client", {});
		return { error: "Service unavailable" };
	}

	try {
		// Verify tutor owns the homework assignment and get before state
		const submissionData = await getSubmissionWithHomework(adminClient, input.submissionId);
		if (!submissionData) {
			logStep(log, "reviewSubmission:not_found", { submissionId: input.submissionId });
			return { error: "Submission not found" };
		}

		if (submissionData.homework.tutor_id !== user.id) {
			logStep(log, "reviewSubmission:access_denied", { submissionId: input.submissionId });
			return { error: "You can only review submissions for your students" };
		}

		const beforeState = {
			tutor_feedback: submissionData.submission.tutor_feedback,
			review_status: submissionData.submission.review_status,
			reviewed_at: submissionData.submission.reviewed_at,
		};

		// Update submission
		await repoUpdateReview(adminClient, input.submissionId, {
			feedback: input.feedback,
			status: input.status,
		});

		// Audit Law: Record review with before/after state
		await recordAudit(adminClient, {
			actorId: user.id,
			targetId: input.submissionId,
			entityType: "homework",
			actionType: "review",
			beforeState,
			afterState: {
				tutor_feedback: input.feedback,
				review_status: input.status,
				reviewed_at: new Date().toISOString(),
			},
			metadata: {
				homeworkId: submissionData.submission.homework_id,
				studentId: submissionData.homework.student_id,
			},
		});

		// If reviewed (not needs_revision), mark homework as completed
		if (input.status === "reviewed") {
			await markHomeworkCompletedFromReview(adminClient, submissionData.submission.homework_id);
		}

		logStep(log, "reviewSubmission:success", { submissionId: input.submissionId });
		return { error: null };
	} catch (error) {
		logStepError(log, "reviewSubmission:failed", error, {
			submissionId: input.submissionId,
		});
		return { error: "Failed to save review" };
	}
}

// ============================================================================
// Get Submission By ID
// ============================================================================

/**
 * Get a submission by ID with full details.
 *
 * Compliance:
 * - Repository Law: Uses getSubmissionById from repository
 * - Observability Law: Has traceId and logStep
 * - Safety Law: N/A (read operation)
 * - Security Law: N/A (RLS handles access control)
 * - Audit Law: N/A (read operation)
 */
export async function getSubmission(
	submissionId: string
): Promise<{ data: HomeworkSubmission | null; error: string | null }> {
	const traceId = await getTraceId();
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return { data: null, error: "You must be signed in" };
	}

	const log = createRequestLogger(traceId, user.id);
	logStep(log, "getSubmission:start", { submissionId });

	try {
		const submission = await repoGetSubmission(supabase, submissionId);
		logStep(log, "getSubmission:success", { submissionId, found: !!submission });
		return { data: submission, error: null };
	} catch (error) {
		logStepError(log, "getSubmission:failed", error, { submissionId });
		return { data: null, error: "Submission not found" };
	}
}
