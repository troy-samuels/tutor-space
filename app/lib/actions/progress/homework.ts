"use server";

import { revalidatePath } from "next/cache";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import {
	createHomeworkAssignment as repoCreateHomework,
	updateHomeworkAssignment as repoUpdateHomework,
	markHomeworkCompleted as repoMarkCompleted,
	getHomeworkById,
	setHomeworkNotificationSent,
} from "@/lib/repositories/homework";
import { recordAudit } from "@/lib/repositories/audit";
import { sendHomeworkAssignedEmail } from "@/lib/emails/ops-emails";
import { ensureHomeworkPracticeAssignment } from "@/lib/practice/unified-assignment";
import { HOMEWORK_STATUSES, type HomeworkStatus as TypeHomeworkStatus } from "@/lib/types/progress";
import { getStudentContactById, getTutorProfileById } from "@/lib/repositories/progress";
import {
	getTraceId,
	createRequestLogger,
	logStep,
	logStepError,
	sanitizeInput,
} from "@/lib/logger";
import { requireUser, verifyHomeworkAccess } from "./helpers";
import type {
	HomeworkAssignment,
	AssignHomeworkInput,
	UpdateHomeworkInput,
	ActionResult,
} from "./types";

// ============================================================================
// Assign Homework
// ============================================================================

/**
 * Assign homework to a student (tutor-facing).
 *
 * Compliance:
 * - Repository Law: Uses createHomeworkAssignment from repository
 * - Observability Law: Has traceId, logStep, logStepError
 * - Safety Law: TODO - Add idempotency key support
 * - Security Law: N/A (tutor-authenticated only)
 * - Audit Law: Records audit for homework creation
 */
export async function assignHomework(
	input: AssignHomeworkInput
): Promise<ActionResult<HomeworkAssignment>> {
	const traceId = await getTraceId();
	const { supabase, user } = await requireUser();

	if (!user) {
		return { error: "You need to be signed in to assign homework." };
	}

	const log = createRequestLogger(traceId, user.id);
	logStep(log, "assignHomework:start", { studentId: input.studentId, title: input.title });

	const status = input.status ?? "assigned";
	if (!HOMEWORK_STATUSES.includes(status as TypeHomeworkStatus)) {
		logStep(log, "assignHomework:invalid_status", { status });
		return { error: "Invalid homework status." };
	}

	if (!input.title.trim()) {
		logStep(log, "assignHomework:validation_failed", { reason: "empty_title" });
		return { error: "Homework title is required." };
	}

	const adminClient = createServiceRoleClient();
	if (!adminClient) {
		logStep(log, "assignHomework:no_admin_client", {});
		return { error: "Service unavailable. Please try again." };
	}

	try {
		let homework = await repoCreateHomework(adminClient, {
			studentId: input.studentId,
			tutorId: user.id,
			title: input.title,
			instructions: input.instructions,
			topic: input.topic,
			dueDate: input.dueDate,
			bookingId: input.bookingId,
			attachments: input.attachments,
			audioInstructionUrl: input.audioInstructionUrl,
			status,
		});

		let linkedPracticeId = homework.practice_assignment_id ?? null;

		// Auto-link topic-based homework to practice so students can launch a single flow.
		if (homework.topic?.trim()) {
			try {
				const linkedPractice = await ensureHomeworkPracticeAssignment(adminClient, {
					homeworkId: homework.id,
					tutorId: user.id,
					studentId: input.studentId,
					title: homework.title,
					topic: homework.topic,
					dueDate: homework.due_date,
					practiceAssignmentId: homework.practice_assignment_id,
				});

				if (linkedPractice) {
					linkedPracticeId = linkedPractice.id;
					homework = {
						...homework,
						practice_assignment_id: linkedPractice.id,
						practice_assignment: {
							id: linkedPractice.id,
							status: linkedPractice.status,
							sessions_completed: linkedPractice.sessionsCompleted,
						},
					};
				}
			} catch (practiceLinkError) {
				// Preserve homework creation even if practice auto-linking fails.
				logStepError(log, "assignHomework:practice_link_failed", practiceLinkError, {
					homeworkId: homework.id,
				});
			}
		}

		// Audit Law: Record homework creation
		await recordAudit(adminClient, {
			actorId: user.id,
			targetId: homework.id,
			entityType: "homework",
			actionType: "create",
			beforeState: null,
			afterState: sanitizeInput(homework) as Record<string, unknown>,
			metadata: {
				studentId: input.studentId,
				dueDate: input.dueDate ?? null,
			},
		});

		logStep(log, "assignHomework:created", { homeworkId: homework.id });

		// Send notification to student if they have a user account
		try {
			const [studentResult, tutorResult] = await Promise.all([
				getStudentContactById(supabase, input.studentId),
				getTutorProfileById(supabase, user.id),
			]);

			if (studentResult?.user_id && tutorResult?.full_name) {
				const { notifyHomeworkAssigned } = await import("@/lib/actions/notifications");
				await notifyHomeworkAssigned({
					studentUserId: studentResult.user_id,
					tutorName: tutorResult.full_name,
					homeworkId: homework.id,
					homeworkTitle: input.title.trim(),
					dueDate: input.dueDate ?? null,
				});

				// Update notification_sent_at timestamp
				await setHomeworkNotificationSent(adminClient, homework.id);
			}

			// Email the student if we have an address
			if (studentResult?.email) {
				const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tutorlingua.co";
				const normalizedAppUrl = appUrl.replace(/\/+$/, "");
				const practiceLaunchUrl = linkedPracticeId
					? `${normalizedAppUrl}/practice/start/${linkedPracticeId}?source=homework&homeworkId=${homework.id}`
					: undefined;

				await sendHomeworkAssignedEmail({
					to: studentResult.email,
					studentName: studentResult.full_name || "Student",
					tutorName: tutorResult?.full_name || "Your tutor",
					title: input.title.trim(),
					instructions: input.instructions ?? null,
					dueDate: input.dueDate ?? null,
					timezone: null,
					homeworkUrl: `${normalizedAppUrl}/student/library`,
					practiceUrl: practiceLaunchUrl,
				});
			}
		} catch (notificationError) {
			// Don't fail the whole operation if notification fails
			logStepError(log, "assignHomework:notification_failed", notificationError, {
				homeworkId: homework.id,
			});
		}

		logStep(log, "assignHomework:success", { homeworkId: homework.id });
		revalidatePath("/student/assignments");
		return { data: homework };
	} catch (error) {
		logStepError(log, "assignHomework:failed", error, { studentId: input.studentId });
		return { error: "Unable to assign homework right now." };
	}
}

// ============================================================================
// Update Homework Status
// ============================================================================

/**
 * Update homework status (tutor-facing).
 *
 * Compliance:
 * - Repository Law: Uses updateHomeworkAssignment from repository
 * - Observability Law: Has traceId, logStep, logStepError
 * - Safety Law: N/A (update is naturally idempotent)
 * - Security Law: N/A (tutor-authenticated only)
 * - Audit Law: Records audit with before/after state
 */
export async function updateHomeworkStatus(
	input: UpdateHomeworkInput
): Promise<ActionResult<HomeworkAssignment>> {
	const traceId = await getTraceId();
	const { user } = await requireUser();

	if (!user) {
		return { error: "You need to be signed in to update homework." };
	}

	const log = createRequestLogger(traceId, user.id);
	logStep(log, "updateHomeworkStatus:start", {
		assignmentId: input.assignmentId,
		status: input.status,
	});

	if (!HOMEWORK_STATUSES.includes(input.status as TypeHomeworkStatus)) {
		logStep(log, "updateHomeworkStatus:invalid_status", { status: input.status });
		return { error: "Invalid homework status." };
	}

	const adminClient = createServiceRoleClient();
	if (!adminClient) {
		logStep(log, "updateHomeworkStatus:no_admin_client", {});
		return { error: "Service unavailable. Please try again." };
	}

	try {
		// Get before state for audit
		const beforeHomework = await getHomeworkById(adminClient, input.assignmentId);
		if (!beforeHomework || beforeHomework.tutor_id !== user.id) {
			logStep(log, "updateHomeworkStatus:not_found", { assignmentId: input.assignmentId });
			return { error: "Homework not found." };
		}

		const homework = await repoUpdateHomework(adminClient, input.assignmentId, user.id, {
			status: input.status,
			studentNotes: input.studentNotes,
		});

		// Audit Law: Record status change with before/after
		await recordAudit(adminClient, {
			actorId: user.id,
			targetId: input.assignmentId,
			entityType: "homework",
			actionType: "update_status",
			beforeState: sanitizeInput(beforeHomework) as Record<string, unknown>,
			afterState: sanitizeInput(homework) as Record<string, unknown>,
			metadata: {
				studentId: homework.student_id,
			},
		});

		logStep(log, "updateHomeworkStatus:success", { assignmentId: input.assignmentId });
		return { data: homework };
	} catch (error) {
		logStepError(log, "updateHomeworkStatus:failed", error, {
			assignmentId: input.assignmentId,
		});
		return { error: "Unable to update homework status." };
	}
}

// ============================================================================
// Mark Homework Completed (Student Action)
// ============================================================================

/**
 * Allow students to mark homework as completed.
 *
 * Compliance:
 * - Repository Law: Uses markHomeworkCompleted from repository
 * - Observability Law: Has traceId, logStep, logStepError
 * - Safety Law: N/A (update is naturally idempotent)
 * - Security Law: Validates student ownership via service role
 * - Audit Law: Records audit with before/after state
 */
export async function markHomeworkCompleted(
	assignmentId: string,
	studentNotes?: string | null
): Promise<ActionResult<HomeworkAssignment>> {
	const traceId = await getTraceId();
	const { supabase, user } = await requireUser();

	if (!user) {
		return { error: "You need to be signed in to update homework." };
	}

	const log = createRequestLogger(traceId, user.id);
	logStep(log, "markHomeworkCompleted:start", { assignmentId });

	const adminClient = createServiceRoleClient();
	if (!adminClient) {
		logStep(log, "markHomeworkCompleted:no_admin_client", {});
		return { error: "Service unavailable. Please try again." };
	}

	// Verify student ownership
	const access = await verifyHomeworkAccess(supabase, user.id, assignmentId);
	if (!access) {
		logStep(log, "markHomeworkCompleted:access_denied", { assignmentId });
		return { error: "You do not have access to this assignment." };
	}

	try {
		// Get before state for audit
		const beforeHomework = await getHomeworkById(adminClient, assignmentId);
		if (!beforeHomework) {
			logStep(log, "markHomeworkCompleted:not_found", { assignmentId });
			return { error: "Assignment not found." };
		}

		const homework = await repoMarkCompleted(adminClient, assignmentId, studentNotes);

		// Audit Law: Record completion with before/after
		await recordAudit(adminClient, {
			actorId: user.id,
			targetId: assignmentId,
			entityType: "homework",
			actionType: "update_status",
			beforeState: sanitizeInput(beforeHomework) as Record<string, unknown>,
			afterState: sanitizeInput(homework) as Record<string, unknown>,
			metadata: {
				studentId: homework.student_id,
				completedBy: "student",
			},
		});

		// Revalidate student progress page
		revalidatePath("/student/progress");
		revalidatePath("/student/assignments");

		logStep(log, "markHomeworkCompleted:success", { assignmentId });
		return { data: homework };
	} catch (error) {
		logStepError(log, "markHomeworkCompleted:failed", error, { assignmentId });
		return { error: "Unable to mark homework as completed." };
	}
}
