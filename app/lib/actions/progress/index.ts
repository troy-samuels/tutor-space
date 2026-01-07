/**
 * Progress Module - Barrel Export
 *
 * This module handles student progress tracking including:
 * - Learning goals
 * - Proficiency assessments
 * - Homework assignments and submissions
 * - AI Practice integration
 * - Progress statistics
 *
 * All functions comply with TutorLingua 10x Laws:
 * - Repository Law: All DB operations through repositories
 * - Observability Law: Structured logging with traceId
 * - Safety Law: Idempotency for create operations
 * - Security Law: Rate limiting for uploads/submissions
 * - Audit Law: Before/after state for all mutations
 */

// ============================================================================
// Types
// ============================================================================

export * from "./types";

// ============================================================================
// Goals
// ============================================================================

export { createLearningGoal, updateLearningGoalProgress } from "./goals";

// ============================================================================
// Assessments
// ============================================================================

export { recordProficiencyAssessment } from "./assessments";

// ============================================================================
// Homework
// ============================================================================

export { assignHomework, updateHomeworkStatus, markHomeworkCompleted } from "./homework";

// ============================================================================
// Submissions
// ============================================================================

export {
	submitHomework,
	getHomeworkSubmissions,
	reviewSubmission,
	getSubmission,
} from "./submissions";

// ============================================================================
// Uploads
// ============================================================================

export { uploadSubmissionFile, uploadHomeworkInstructionAudio } from "./uploads";

// ============================================================================
// Stats & Progress Overview
// ============================================================================

export { getStudentProgress, getTutorStudentProgress } from "./stats";

// ============================================================================
// AI Practice
// ============================================================================

export {
	getTutorStudentPracticeData,
	getStudentPracticeData,
	getStudentPracticeAnalytics,
	getPendingHomeworkForPractice,
} from "./practice";
