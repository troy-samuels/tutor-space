// ============================================================================
// Student Actions - Barrel Export
// ============================================================================
// This file re-exports all student actions for backward compatibility.
// Import from "@/lib/actions/students" or directly from submodules.
// ============================================================================

// Types
export type {
	StudentRecord,
	StudentImportPayload,
	StudentImportError,
	StudentImportResult,
	EnsureStudentInput,
	EnsureStudentResult,
} from "./types.ts";

export {
	MAX_IMPORT_ROWS,
	STUDENT_STATUS_MAP,
	EMAIL_REGEX,
	studentImportSchema,
} from "./types.ts";

// Helpers (async server actions)
export { requireTutor } from "./helpers.ts";

// Utilities (sync functions)
export { normalizeStatus } from "./utils.ts";

// Create Operations
export { ensureStudent } from "./create.ts";

// Query Operations
export { listStudents, getPendingAccessRequestsCount } from "./queries.ts";

// Update Operations
export { updateStudentLabels } from "./update.ts";

// Delete Operations
export { deleteStudent } from "./delete.ts";

// Access Control Operations
export {
	approveStudentAccess,
	approveStudentAccessWithClients,
	denyStudentAccess,
	suspendStudentAccess,
	reactivateStudentAccess,
} from "./access.ts";

// Import Operations
export { importStudentsBatch } from "./import.ts";

// Email Operations
export { sendQuickInviteEmail } from "./email.ts";
