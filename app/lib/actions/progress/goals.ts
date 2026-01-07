"use server";

import { createServiceRoleClient } from "@/lib/supabase/admin";
import {
	createLearningGoal as repoCreateGoal,
	updateLearningGoalProgress as repoUpdateGoal,
	getLearningGoalById,
} from "@/lib/repositories/progress";
import { recordAudit } from "@/lib/repositories/audit";
import {
	getTraceId,
	createRequestLogger,
	logStep,
	logStepError,
	sanitizeInput,
} from "@/lib/logger";
import { requireUser } from "./helpers";
import type { LearningGoal, CreateGoalInput, ActionResult } from "./types";

// ============================================================================
// Create Learning Goal
// ============================================================================

/**
 * Create a new learning goal for a tutor's student.
 *
 * Compliance:
 * - Repository Law: Uses createLearningGoal from repository
 * - Observability Law: Has traceId, logStep, logStepError
 * - Safety Law: N/A (goal creation is idempotent by title check)
 * - Security Law: N/A (tutor-authenticated only)
 * - Audit Law: Records audit for goal creation
 */
export async function createLearningGoal(
	input: CreateGoalInput
): Promise<ActionResult<LearningGoal>> {
	const traceId = await getTraceId();
	const { user } = await requireUser();

	if (!user) {
		return { error: "You need to be signed in to add goals." };
	}

	const log = createRequestLogger(traceId, user.id);
	logStep(log, "createLearningGoal:start", { studentId: input.studentId });

	if (!input.title.trim()) {
		logStep(log, "createLearningGoal:validation_failed", { reason: "empty_title" });
		return { error: "Goal title is required." };
	}

	const adminClient = createServiceRoleClient();
	if (!adminClient) {
		logStep(log, "createLearningGoal:no_admin_client", {});
		return { error: "Service unavailable. Please try again." };
	}

	try {
		const goal = await repoCreateGoal(adminClient, {
			studentId: input.studentId,
			tutorId: user.id,
			title: input.title,
			description: input.description,
			targetDate: input.targetDate,
			progressPercentage: input.progressPercentage,
			status: input.status,
		});

		// Audit Law: Record goal creation
		await recordAudit(adminClient, {
			actorId: user.id,
			targetId: goal.id,
			entityType: "goal",
			actionType: "create",
			beforeState: null,
			afterState: sanitizeInput(goal) as Record<string, unknown>,
			metadata: {
				studentId: input.studentId,
			},
		});

		logStep(log, "createLearningGoal:success", { goalId: goal.id });
		return { data: goal };
	} catch (error) {
		logStepError(log, "createLearningGoal:failed", error, { studentId: input.studentId });
		return { error: "Unable to create goal right now." };
	}
}

// ============================================================================
// Update Learning Goal Progress
// ============================================================================

/**
 * Update goal progress or status.
 *
 * Compliance:
 * - Repository Law: Uses updateLearningGoalProgress from repository
 * - Observability Law: Has traceId, logStep, logStepError
 * - Safety Law: N/A (update is naturally idempotent)
 * - Security Law: N/A (tutor-authenticated only)
 * - Audit Law: Records audit with before/after state
 */
export async function updateLearningGoalProgress(
	goalId: string,
	progress: number,
	status?: LearningGoal["status"]
): Promise<ActionResult<LearningGoal>> {
	const traceId = await getTraceId();
	const { user } = await requireUser();

	if (!user) {
		return { error: "You need to be signed in to update goals." };
	}

	const log = createRequestLogger(traceId, user.id);
	logStep(log, "updateLearningGoalProgress:start", { goalId, progress, status });

	const adminClient = createServiceRoleClient();
	if (!adminClient) {
		logStep(log, "updateLearningGoalProgress:no_admin_client", {});
		return { error: "Service unavailable. Please try again." };
	}

	try {
		// Get before state for audit
		const beforeGoal = await getLearningGoalById(adminClient, goalId, user.id);
		if (!beforeGoal) {
			logStep(log, "updateLearningGoalProgress:not_found", { goalId });
			return { error: "Goal not found." };
		}

		const updatedGoal = await repoUpdateGoal(adminClient, goalId, user.id, {
			progressPercentage: progress,
			status,
		});

		// Audit Law: Record goal update with before/after
		await recordAudit(adminClient, {
			actorId: user.id,
			targetId: goalId,
			entityType: "goal",
			actionType: "update",
			beforeState: {
				progress_percentage: beforeGoal.progress_percentage,
				status: beforeGoal.status,
			},
			afterState: {
				progress_percentage: updatedGoal.progress_percentage,
				status: updatedGoal.status,
			},
			metadata: {
				studentId: updatedGoal.student_id,
			},
		});

		logStep(log, "updateLearningGoalProgress:success", { goalId });
		return { data: updatedGoal };
	} catch (error) {
		logStepError(log, "updateLearningGoalProgress:failed", error, { goalId });
		return { error: "Unable to update goal progress." };
	}
}
