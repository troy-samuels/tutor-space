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
} from "./types";

export {
	MAX_IMPORT_ROWS,
	STUDENT_STATUS_MAP,
	EMAIL_REGEX,
	studentImportSchema,
} from "./types";

// Helpers (async server actions)
export { requireTutor } from "./helpers";

// Utilities (sync functions)
export { normalizeStatus } from "./utils";

// Create Operations
export { ensureStudent } from "./create";

// Query Operations
export { listStudents, getPendingAccessRequestsCount } from "./queries";

// Update Operations
export { updateStudentLabels } from "./update";

// Delete Operations
export { deleteStudent } from "./delete";

// Access Control Operations
export {
	approveStudentAccess,
	approveStudentAccessWithClients,
	denyStudentAccess,
	suspendStudentAccess,
	reactivateStudentAccess,
} from "./access";

// Import Operations
export { importStudentsBatch } from "./import";

// Email Operations
export { sendQuickInviteEmail } from "./email";
