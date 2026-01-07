/**
 * Homework Submissions - Backward Compatibility Re-exports
 *
 * This file re-exports all functions from the modular progress module
 * to maintain backward compatibility with existing imports.
 *
 * New code should import directly from "@/lib/actions/progress/submissions"
 * or from "@/lib/actions/progress" (the barrel export).
 *
 * @module lib/actions/homework-submissions
 * @see lib/actions/progress/submissions.ts for the main module
 */

// ============================================================================
// Types
// ============================================================================

export type { SubmissionFile, HomeworkSubmission } from "./progress/types";

// ============================================================================
// Submissions
// ============================================================================

export {
	submitHomework,
	getHomeworkSubmissions,
	reviewSubmission,
	getSubmission,
} from "./progress/submissions";

// ============================================================================
// Uploads
// ============================================================================

export { uploadSubmissionFile, uploadHomeworkInstructionAudio } from "./progress/uploads";
