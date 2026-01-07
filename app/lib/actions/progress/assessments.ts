"use server";

import { createServiceRoleClient } from "@/lib/supabase/admin";
import {
	createProficiencyAssessment as repoCreateAssessment,
	getPreviousAssessment,
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
import type { ProficiencyAssessment, RecordAssessmentInput, ActionResult } from "./types";

// ============================================================================
// Record Proficiency Assessment
// ============================================================================

/**
 * Record a new proficiency assessment for a student.
 *
 * Compliance:
 * - Repository Law: Uses createProficiencyAssessment from repository
 * - Observability Law: Has traceId, logStep, logStepError
 * - Safety Law: N/A (assessment records are append-only)
 * - Security Law: N/A (tutor-authenticated only)
 * - Audit Law: Records audit with before/after state (existing)
 */
export async function recordProficiencyAssessment(
	input: RecordAssessmentInput
): Promise<ActionResult<ProficiencyAssessment>> {
	const traceId = await getTraceId();
	const { user } = await requireUser();

	if (!user) {
		return { error: "You need to be signed in to record assessments." };
	}

	const log = createRequestLogger(traceId, user.id);
	logStep(log, "recordProficiencyAssessment:start", {
		studentId: input.studentId,
		skillArea: input.skillArea,
		level: input.level,
	});

	const adminClient = createServiceRoleClient();
	if (!adminClient) {
		logStep(log, "recordProficiencyAssessment:no_admin_client", {});
		return { error: "Service unavailable. Please try again." };
	}

	try {
		// Get previous assessment for this skill area (for audit before/after)
		const previousAssessment = await getPreviousAssessment(
			adminClient,
			input.studentId,
			user.id,
			input.skillArea
		);

		const assessment = await repoCreateAssessment(adminClient, {
			studentId: input.studentId,
			tutorId: user.id,
			skillArea: input.skillArea,
			level: input.level,
			score: input.score,
			notes: input.notes,
			assessedAt: input.assessedAt,
		});

		// Audit Law: Record assessment with before/after state
		await recordAudit(adminClient, {
			actorId: user.id,
			targetId: assessment.id,
			entityType: "assessment",
			actionType: "create",
			beforeState: previousAssessment
				? (sanitizeInput(previousAssessment) as Record<string, unknown>)
				: null,
			afterState: sanitizeInput(assessment) as Record<string, unknown>,
			metadata: {
				studentId: input.studentId,
				skillArea: input.skillArea,
				previousLevel: previousAssessment?.level ?? null,
				newLevel: input.level,
			},
		});

		logStep(log, "recordProficiencyAssessment:success", {
			assessmentId: assessment.id,
			skillArea: input.skillArea,
		});

		return { data: assessment };
	} catch (error) {
		logStepError(log, "recordProficiencyAssessment:failed", error, {
			studentId: input.studentId,
			skillArea: input.skillArea,
		});
		return { error: "Unable to save assessment." };
	}
}
