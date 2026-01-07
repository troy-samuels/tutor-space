/**
 * Progress Actions - Backward Compatibility Re-exports
 *
 * This file re-exports all functions from the modular progress module
 * to maintain backward compatibility with existing imports.
 *
 * New code should import directly from "@/lib/actions/progress/[module]"
 * or from "@/lib/actions/progress" (the barrel export).
 *
 * @module lib/actions/progress
 * @see lib/actions/progress/index.ts for the main module
 */

// ============================================================================
// Types (Re-exported for backward compatibility)
// ============================================================================

export type {
	// Repository types
	LearningGoal,
	ProficiencyAssessment,
	LearningStats,
	LessonNote,
	HomeworkStatus,
	HomeworkAttachment,
	PracticeAssignmentRef,
	HomeworkDrill,
	HomeworkAssignment,
	HomeworkSubmissionSummary,
	// Action-specific types
	PracticeAssignment,
	PracticeStats,
	PracticeUsage,
	StudentPracticeData,
	GrammarIssue,
	WeeklyActivity,
	PracticeSummary,
	PendingHomeworkForPractice,
} from "./progress/types";

// Re-export HomeworkReviewStatus type (matches SubmissionReviewStatus)
export type { SubmissionReviewStatus as HomeworkReviewStatus } from "./progress/types";

// ============================================================================
// Goals
// ============================================================================

export { createLearningGoal, updateLearningGoalProgress } from "./progress/goals";

// ============================================================================
// Assessments
// ============================================================================

export { recordProficiencyAssessment } from "./progress/assessments";

// ============================================================================
// Homework
// ============================================================================

export { assignHomework, updateHomeworkStatus, markHomeworkCompleted } from "./progress/homework";

// ============================================================================
// Stats & Progress Overview
// ============================================================================

export { getStudentProgress, getTutorStudentProgress } from "./progress/stats";

// ============================================================================
// AI Practice
// ============================================================================

export {
	getTutorStudentPracticeData,
	getStudentPracticeData,
	getStudentPracticeAnalytics,
	getPendingHomeworkForPractice,
} from "./progress/practice";
