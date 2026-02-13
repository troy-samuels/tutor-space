/**
 * Shared types for progress module.
 * Re-exports repository types and adds action-specific types.
 */

// Re-export repository types
export type {
	LearningGoal,
	CreateLearningGoalInput,
	UpdateLearningGoalInput,
	ProficiencyAssessment,
	CreateProficiencyAssessmentInput,
	SkillArea,
	ProficiencyLevel,
	LearningStats,
	LessonNote,
} from "@/lib/repositories/progress";

export type {
	HomeworkStatus,
	HomeworkAttachment,
	PracticeAssignmentRef,
	HomeworkDrill,
	HomeworkAssignment,
	CreateHomeworkInput,
	UpdateHomeworkStatusInput,
	SubmissionReviewStatus,
	SubmissionFile,
	HomeworkSubmission,
	CreateSubmissionInput,
	UpdateSubmissionReviewInput,
	HomeworkSubmissionSummary,
} from "@/lib/repositories/homework";

// ============================================================================
// Action-Specific Types
// ============================================================================

/**
 * Result of getStudentProgress action.
 */
export interface StudentProgressResult {
	stats: import("@/lib/repositories/progress").LearningStats | null;
	goals: import("@/lib/repositories/progress").LearningGoal[];
	assessments: import("@/lib/repositories/progress").ProficiencyAssessment[];
	recentNotes: import("@/lib/repositories/progress").LessonNote[];
	homework: import("@/lib/repositories/homework").HomeworkAssignment[];
}

/**
 * AI Practice assignment with scenario details.
 */
export interface PracticeAssignment {
	id: string;
	title: string;
	instructions: string | null;
	status: "assigned" | "in_progress" | "completed";
	due_date: string | null;
	homework_assignment_id?: string | null;
	sessions_completed: number;
	scenario?: {
		id: string;
		title: string;
		language: string;
		level: string | null;
		topic: string | null;
	} | null;
	created_at: string;
}

/**
 * Practice statistics for a student.
 */
export interface PracticeStats {
	sessions_completed: number;
	practice_minutes: number;
	messages_sent: number;
}

/**
 * Practice usage and billing info.
 */
export interface PracticeUsage {
	audioSecondsUsed: number;
	audioSecondsAllowance: number;
	textTurnsUsed: number;
	textTurnsAllowance: number;
	blocksConsumed: number;
	currentTierPriceCents: number;
	periodEnd: string | null;
	percentAudioUsed: number;
	percentTextUsed: number;
}

/**
 * Full student practice data for portal.
 */
export interface StudentPracticeData {
	isSubscribed: boolean;
	assignments: PracticeAssignment[];
	stats: PracticeStats | null;
	studentId: string | null;
	usage: PracticeUsage | null;
}

/**
 * Grammar issue tracking for analytics.
 */
export interface GrammarIssue {
	category_slug: string;
	label: string;
	count: number;
	trend: "improving" | "stable" | "declining" | null;
}

/**
 * Weekly activity summary.
 */
export interface WeeklyActivity {
	week: string;
	sessions: number;
	minutes: number;
	errors: number;
}

/**
 * Full practice analytics summary.
 */
export interface PracticeSummary {
	total_sessions: number;
	completed_sessions: number;
	total_messages_sent: number;
	total_practice_minutes: number;
	total_grammar_errors: number;
	total_phonetic_errors: number;
	top_grammar_issues: GrammarIssue[];
	avg_session_rating: number | null;
	last_practice_at: string | null;
	weekly_activity: WeeklyActivity[];
}

/**
 * Pending homework for practice linking.
 */
export interface PendingHomeworkForPractice {
	id: string;
	title: string;
	topic: string | null;
	due_date: string | null;
	status: import("@/lib/repositories/homework").HomeworkStatus;
	practice_assignment_id: string | null;
}

/**
 * Tutor's view of student practice data.
 */
export interface TutorStudentPracticeData {
	isSubscribed: boolean;
	assignments: PracticeAssignment[];
	scenarios: Array<{
		id: string;
		title: string;
		language: string;
		level: string | null;
		topic: string | null;
	}>;
	pendingHomework: PendingHomeworkForPractice[];
}

/**
 * Practice analytics result.
 */
export interface PracticeAnalyticsResult {
	isSubscribed: boolean;
	summary: PracticeSummary | null;
}

// ============================================================================
// Action Input Types
// ============================================================================

export interface CreateGoalInput {
	studentId: string;
	title: string;
	description?: string | null;
	targetDate?: string | null;
	progressPercentage?: number;
	status?: "active" | "completed" | "paused" | "abandoned";
}

export interface RecordAssessmentInput {
	studentId: string;
	skillArea: import("@/lib/repositories/progress").SkillArea;
	level: import("@/lib/repositories/progress").ProficiencyLevel;
	score?: number | null;
	notes?: string | null;
	assessedAt?: string;
}

export interface AssignHomeworkInput {
	studentId: string;
	title: string;
	instructions?: string | null;
	topic?: string | null;
	dueDate?: string | null;
	bookingId?: string | null;
	attachments?: import("@/lib/repositories/homework").HomeworkAttachment[];
	audioInstructionUrl?: string | null;
	status?: import("@/lib/repositories/homework").HomeworkStatus;
}

export interface UpdateHomeworkInput {
	assignmentId: string;
	status: import("@/lib/repositories/homework").HomeworkStatus;
	studentNotes?: string | null;
}

export interface SubmitHomeworkInput {
	homeworkId: string;
	textResponse?: string;
	audioUrl?: string;
	fileAttachments?: import("@/lib/repositories/homework").SubmissionFile[];
}

export interface ReviewSubmissionInput {
	submissionId: string;
	feedback: string;
	status: "reviewed" | "needs_revision";
}

// ============================================================================
// Action Result Types
// ============================================================================

export interface ActionResult<T> {
	data?: T;
	error?: string;
}

export interface SubmitHomeworkResult {
	data: import("@/lib/repositories/homework").HomeworkSubmission | null;
	error: string | null;
}

export interface ReviewSubmissionResult {
	error: string | null;
}

export interface UploadResult {
	url: string | null;
	error: string | null;
}
