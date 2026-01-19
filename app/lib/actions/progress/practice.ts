"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import {
	AI_PRACTICE_BASE_PRICE_CENTS,
	BASE_AUDIO_SECONDS,
	BASE_TEXT_TURNS,
	BLOCK_AUDIO_SECONDS,
	BLOCK_TEXT_TURNS,
} from "@/lib/practice/constants";
import { getTutorHasPracticeAccess } from "@/lib/practice/access";
import { getPendingHomeworkForPractice as repoGetPendingHomework } from "@/lib/repositories/homework";
import {
	getStudentByIdForTutor,
	getStudentByUserId,
	getPracticeStatsForStudent,
	getPracticeUsagePeriod,
	getStudentPracticeSummary,
	listPracticeAssignmentsForStudent,
	listPracticeScenariosForTutor,
	listStudentPracticeSessions,
} from "@/lib/repositories/progress";
import { getNextBookingForStudent } from "@/lib/repositories/bookings";
import {
	getTraceId,
	createRequestLogger,
	logStep,
	logStepError,
} from "@/lib/logger";
import { requireUser } from "./helpers";
import { isSubscriptionActive } from "./utils";
import type {
	StudentPracticeData,
	TutorStudentPracticeData,
	PracticeAnalyticsResult,
	PracticeAssignment,
	PracticeStats,
	PracticeUsage,
	PracticeSummary,
	PendingHomeworkForPractice,
} from "./types";

// ============================================================================
// Get Tutor Student Practice Data
// ============================================================================

/**
 * Get AI Practice data for tutor's student (tutor CRM view).
 *
 * Compliance:
 * - Repository Law: Uses repository functions for all reads
 * - Observability Law: Has traceId, logStep
 * - Safety Law: N/A (read operation)
 * - Security Law: Validates tutor ownership
 * - Audit Law: N/A (read operation)
 */
export async function getTutorStudentPracticeData(
	studentId: string
): Promise<TutorStudentPracticeData> {
	const traceId = await getTraceId();
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	const emptyResponse: TutorStudentPracticeData = {
		isSubscribed: false,
		assignments: [],
		scenarios: [],
		pendingHomework: [],
	};

	if (!user) {
		return emptyResponse;
	}

	const log = createRequestLogger(traceId, user.id);
	logStep(log, "getTutorStudentPracticeData:start", { studentId });

	// Verify tutor owns this student
	let student: Awaited<ReturnType<typeof getStudentByIdForTutor>> | null = null;
	try {
		student = await getStudentByIdForTutor(supabase, studentId, user.id);
	} catch (error) {
		logStepError(log, "getTutorStudentPracticeData:student_lookup_failed", error, {
			studentId,
		});
		return emptyResponse;
	}

	if (!student) {
		logStep(log, "getTutorStudentPracticeData:access_denied", { studentId });
		return emptyResponse;
	}

	const isSubscribed = isSubscriptionActive(student);

	try {
		// Fetch assignments, scenarios, and pending homework in parallel
		const [assignmentsResult, scenariosResult, pendingHomeworkResult] = await Promise.all([
			listPracticeAssignmentsForStudent(supabase, studentId, user.id, 20),
			listPracticeScenariosForTutor(supabase, user.id),
			repoGetPendingHomework(supabase, studentId, user.id, 20),
		]);

		const assignments: PracticeAssignment[] = (assignmentsResult || []).map((a: any) => ({
			id: a.id,
			title: a.title,
			instructions: a.instructions,
			status: a.status,
			due_date: a.due_date,
			sessions_completed: a.sessions_completed || 0,
			scenario: a.scenario
				? {
						id: a.scenario.id,
						title: a.scenario.title,
						language: a.scenario.language,
						level: a.scenario.level,
						topic: a.scenario.topic,
					}
				: null,
			created_at: a.created_at,
		}));

		const scenarios = (scenariosResult || []).map((s: any) => ({
			id: s.id,
			title: s.title,
			language: s.language,
			level: s.level,
			topic: s.topic,
		}));

		logStep(log, "getTutorStudentPracticeData:success", {
			studentId,
			assignmentsCount: assignments.length,
			scenariosCount: scenarios.length,
		});

		return {
			isSubscribed,
			assignments,
			scenarios,
			pendingHomework: pendingHomeworkResult,
		};
	} catch (error) {
		logStepError(log, "getTutorStudentPracticeData:failed", error, { studentId });
		return emptyResponse;
	}
}

// ============================================================================
// Get Student Practice Data
// ============================================================================

/**
 * Get AI Practice data for student portal.
 *
 * Compliance:
 * - Repository Law: Uses repository functions for all reads
 * - Observability Law: Has traceId, logStep
 * - Safety Law: N/A (read operation)
 * - Security Law: N/A (student-authenticated only)
 * - Audit Law: N/A (read operation)
 */
export async function getStudentPracticeData(tutorId?: string): Promise<StudentPracticeData> {
	const traceId = await getTraceId();
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	const emptyResponse: StudentPracticeData = {
		isSubscribed: false,
		assignments: [],
		stats: null,
		studentId: null,
		usage: null,
	};

	if (!user) {
		return emptyResponse;
	}

	const log = createRequestLogger(traceId, user.id);
	logStep(log, "getStudentPracticeData:start", { tutorId });

	const serviceClient = createServiceRoleClient();
	if (!serviceClient) {
		logStep(log, "getStudentPracticeData:no_service_client", {});
		return emptyResponse;
	}

	// Get student record for this user
	let student: Awaited<ReturnType<typeof getStudentByUserId>> | null = null;
	try {
		student = await getStudentByUserId(serviceClient, user.id, tutorId);
	} catch (error) {
		logStepError(log, "getStudentPracticeData:student_lookup_failed", error, {});
		return emptyResponse;
	}

	if (!student) {
		logStep(log, "getStudentPracticeData:student_not_found", {});
		return emptyResponse;
	}

	let hasUpcomingLesson = false;
	try {
		const nextBooking = await getNextBookingForStudent(
			serviceClient,
			student.tutor_id,
			student.id
		);
		hasUpcomingLesson = !!nextBooking;
	} catch (error) {
		logStepError(log, "getStudentPracticeData:next_booking_failed", error, {
			studentId: student.id,
		});
	}

	if (!hasUpcomingLesson) {
		logStep(log, "getStudentPracticeData:no_upcoming_lesson", { studentId: student.id });
		return emptyResponse;
	}

	// Check subscription status
	let isSubscribed = isSubscriptionActive(student);

	// Fallback to tutor practice access check
	if (!isSubscribed) {
		const tutorHasPracticeAccess = await getTutorHasPracticeAccess(
			serviceClient,
			student.tutor_id
		);
		if (tutorHasPracticeAccess) {
			isSubscribed = true;
		}
	}

	try {
		// Fetch assignments with scenarios
		const assignmentsRaw = await listPracticeAssignmentsForStudent(
			serviceClient,
			student.id,
			undefined,
			20
		);

		const homeworkIds = assignmentsRaw
			.map((assignment: { homework_assignment_id?: string | null }) => assignment.homework_assignment_id)
			.filter((id): id is string => Boolean(id));

		const homeworkStatusMap = new Map<string, string>();
		if (homeworkIds.length > 0) {
			const { data: homeworkRows } = await serviceClient
				.from("homework_assignments")
				.select("id, status")
				.in("id", homeworkIds);

			(homeworkRows || []).forEach((row: { id: string; status: string }) => {
				homeworkStatusMap.set(row.id, row.status);
			});
		}

		const assignments = assignmentsRaw.filter(
			(assignment: { homework_assignment_id?: string | null }) => {
				if (!assignment.homework_assignment_id) return true;
				const status = homeworkStatusMap.get(assignment.homework_assignment_id);
				return !!status && status !== "draft";
			}
		);

		// Get practice stats from learning_stats
		const learningStats = await getPracticeStatsForStudent(
			serviceClient,
			student.id,
			student.tutor_id
		);

		const stats: PracticeStats | null = learningStats
			? {
					sessions_completed: learningStats.practice_sessions_completed || 0,
					practice_minutes: learningStats.practice_minutes || 0,
					messages_sent: learningStats.practice_messages_sent || 0,
				}
			: null;

		// Get current usage period for billing
		let usage: PracticeUsage | null = null;

		if (isSubscribed && student.ai_practice_subscription_id) {
			const now = new Date().toISOString();
			const usagePeriod = await getPracticeUsagePeriod(
				serviceClient,
				student.id,
				student.ai_practice_subscription_id,
				now
			);

			if (usagePeriod) {
				const audioAllowance =
					BASE_AUDIO_SECONDS + usagePeriod.blocks_consumed * BLOCK_AUDIO_SECONDS;
				const textAllowance =
					BASE_TEXT_TURNS + usagePeriod.blocks_consumed * BLOCK_TEXT_TURNS;

				usage = {
					audioSecondsUsed: usagePeriod.audio_seconds_used,
					audioSecondsAllowance: audioAllowance,
					textTurnsUsed: usagePeriod.text_turns_used,
					textTurnsAllowance: textAllowance,
					blocksConsumed: usagePeriod.blocks_consumed,
					currentTierPriceCents: usagePeriod.current_tier_price_cents,
					periodEnd: usagePeriod.period_end,
					percentAudioUsed: Math.round(
						(usagePeriod.audio_seconds_used / audioAllowance) * 100
					),
					percentTextUsed: Math.round(
						(usagePeriod.text_turns_used / textAllowance) * 100
					),
				};
			} else {
				// Default usage (new subscriber with no usage yet)
				usage = {
					audioSecondsUsed: 0,
					audioSecondsAllowance: BASE_AUDIO_SECONDS,
					textTurnsUsed: 0,
					textTurnsAllowance: BASE_TEXT_TURNS,
					blocksConsumed: 0,
					currentTierPriceCents: AI_PRACTICE_BASE_PRICE_CENTS,
					periodEnd: student.ai_practice_current_period_end ?? null,
					percentAudioUsed: 0,
					percentTextUsed: 0,
				};
			}
		}

		const formattedAssignments: PracticeAssignment[] = (assignments || []).map((a: any) => ({
			id: a.id,
			title: a.title,
			instructions: a.instructions,
			status: a.status,
			due_date: a.due_date,
			sessions_completed: a.sessions_completed || 0,
			scenario: a.scenario
				? {
						id: a.scenario.id,
						title: a.scenario.title,
						language: a.scenario.language,
						level: a.scenario.level,
						topic: a.scenario.topic,
					}
				: null,
			created_at: a.created_at,
		}));

		logStep(log, "getStudentPracticeData:success", {
			studentId: student.id,
			assignmentsCount: formattedAssignments.length,
			isSubscribed,
		});

		return {
			isSubscribed,
			assignments: formattedAssignments,
			stats,
			studentId: student.id,
			usage,
		};
	} catch (error) {
		logStepError(log, "getStudentPracticeData:failed", error, { studentId: student.id });
		return emptyResponse;
	}
}

// ============================================================================
// Get Student Practice Analytics
// ============================================================================

/**
 * Get practice analytics summary for a student (tutor-facing).
 *
 * Compliance:
 * - Repository Law: Uses repository functions for reads
 * - Observability Law: Has traceId, logStep
 * - Safety Law: N/A (read operation)
 * - Security Law: Validates tutor ownership
 * - Audit Law: N/A (read operation)
 */
export async function getStudentPracticeAnalytics(
	studentId: string
): Promise<PracticeAnalyticsResult> {
	const traceId = await getTraceId();
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return { isSubscribed: false, summary: null };
	}

	const log = createRequestLogger(traceId, user.id);
	logStep(log, "getStudentPracticeAnalytics:start", { studentId });

	const serviceClient = createServiceRoleClient();
	if (!serviceClient) {
		logStep(log, "getStudentPracticeAnalytics:no_service_client", {});
		return { isSubscribed: false, summary: null };
	}

	// Verify tutor owns this student
	let student: Awaited<ReturnType<typeof getStudentByIdForTutor>> | null = null;
	try {
		student = await getStudentByIdForTutor(serviceClient, studentId, user.id);
	} catch (error) {
		logStepError(log, "getStudentPracticeAnalytics:student_lookup_failed", error, {
			studentId,
		});
		return { isSubscribed: false, summary: null };
	}

	if (!student) {
		logStep(log, "getStudentPracticeAnalytics:access_denied", { studentId });
		return { isSubscribed: false, summary: null };
	}

	const isSubscribed = isSubscriptionActive(student);

	try {
		// Fetch cached summary if available
		const summary = await getStudentPracticeSummary(serviceClient, studentId, user.id);

		if (summary) {
			logStep(log, "getStudentPracticeAnalytics:cached", { studentId });
			return {
				isSubscribed,
				summary: {
					total_sessions: summary.total_sessions || 0,
					completed_sessions: summary.completed_sessions || 0,
					total_messages_sent: summary.total_messages_sent || 0,
					total_practice_minutes: summary.total_practice_minutes || 0,
					total_grammar_errors: summary.total_grammar_errors || 0,
					total_phonetic_errors: summary.total_phonetic_errors || 0,
					top_grammar_issues: summary.top_grammar_issues || [],
					avg_session_rating: summary.avg_session_rating,
					last_practice_at: summary.last_practice_at,
					weekly_activity: summary.weekly_activity || [],
				},
			};
		}

		// If no cached summary, compute basic stats
		const sessions = await listStudentPracticeSessions(serviceClient, studentId, user.id);

		if (!sessions || sessions.length === 0) {
			logStep(log, "getStudentPracticeAnalytics:no_sessions", { studentId });
			return { isSubscribed, summary: null };
		}

		const totalSessions = sessions.length;
		const completedSessions = sessions.filter((s) => s.ended_at).length;
		const totalMinutes = sessions.reduce(
			(sum, s) => sum + (s.duration_seconds || 0) / 60,
			0
		);
		const totalMessages = sessions.reduce((sum, s) => sum + (s.message_count || 0), 0);
		const totalErrors = sessions.reduce(
			(sum, s) => sum + (s.grammar_errors_count || 0),
			0
		);

		// Calculate average rating
		const ratings = sessions
			.filter(
				(s) =>
					s.ai_feedback &&
					typeof s.ai_feedback === "object" &&
					"overall_rating" in (s.ai_feedback as object)
			)
			.map((s) => (s.ai_feedback as { overall_rating: number }).overall_rating);

		const avgRating =
			ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;

		const lastSession = sessions.sort(
			(a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
		)[0];

		const practiceSummary: PracticeSummary = {
			total_sessions: totalSessions,
			completed_sessions: completedSessions,
			total_messages_sent: totalMessages,
			total_practice_minutes: Math.round(totalMinutes),
			total_grammar_errors: totalErrors,
			total_phonetic_errors: 0,
			top_grammar_issues: [],
			avg_session_rating: avgRating,
			last_practice_at: lastSession?.started_at || null,
			weekly_activity: [],
		};

		logStep(log, "getStudentPracticeAnalytics:computed", {
			studentId,
			totalSessions,
		});

		return { isSubscribed, summary: practiceSummary };
	} catch (error) {
		logStepError(log, "getStudentPracticeAnalytics:failed", error, { studentId });
		return { isSubscribed: false, summary: null };
	}
}

// ============================================================================
// Get Pending Homework For Practice
// ============================================================================

/**
 * Get pending homework for a student that can be linked to practice.
 *
 * Compliance:
 * - Repository Law: Uses getPendingHomeworkForPractice from repository
 * - Observability Law: Has traceId, logStep
 * - Safety Law: N/A (read operation)
 * - Security Law: N/A (tutor-authenticated only)
 * - Audit Law: N/A (read operation)
 */
export async function getPendingHomeworkForPractice(
	studentId: string
): Promise<PendingHomeworkForPractice[]> {
	const traceId = await getTraceId();
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return [];
	}

	const log = createRequestLogger(traceId, user.id);
	logStep(log, "getPendingHomeworkForPractice:start", { studentId });

	try {
		const homework = await repoGetPendingHomework(supabase, studentId, user.id, 20);

		logStep(log, "getPendingHomeworkForPractice:success", {
			studentId,
			count: homework.length,
		});

		return homework;
	} catch (error) {
		logStepError(log, "getPendingHomeworkForPractice:failed", error, { studentId });
		return [];
	}
}
