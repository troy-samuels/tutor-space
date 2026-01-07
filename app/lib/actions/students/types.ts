import { z } from "zod";
import type { StudentRecord } from "@/lib/repositories/students";

// ============================================================================
// Student Record Type (exported from repository but re-exported here for convenience)
// ============================================================================

export type { StudentRecord };

// ============================================================================
// Create/Ensure Types
// ============================================================================

export type EnsureStudentInput = {
	full_name: string;
	email: string;
	phone?: string;
	timezone?: string;
	clientMutationId?: string;
};

export type EnsureStudentResult = {
	data?: StudentRecord;
	error?: string;
};

// ============================================================================
// Constants
// ============================================================================

export const MAX_IMPORT_ROWS = 500;

export const STUDENT_STATUS_MAP: Record<string, string> = {
	active: "active",
	trial: "trial",
	new: "trial",
	paused: "paused",
	"on hold": "paused",
	alumni: "alumni",
	graduated: "alumni",
	inactive: "inactive",
};

// Strict email regex that validates common email formats properly
export const EMAIL_REGEX =
	/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

// ============================================================================
// Import Schemas
// ============================================================================

export const studentImportSchema = z.object({
	rowIndex: z.number().optional(),
	full_name: z.string().min(1, "Full name is required."),
	email: z
		.string()
		.min(1, "Email is required.")
		.refine((email) => EMAIL_REGEX.test(email.trim()), {
			message: "Invalid email format. Please check the email address.",
		}),
	phone: z
		.string()
		.optional()
		.transform((value) => (value && value.trim().length > 0 ? value.trim() : undefined)),
	status: z
		.string()
		.optional()
		.transform((value) => value?.trim() || undefined),
	proficiency_level: z
		.string()
		.optional()
		.transform((value) => value?.trim() || undefined),
	learning_goals: z
		.string()
		.optional()
		.transform((value) => value?.trim() || undefined),
	native_language: z
		.string()
		.optional()
		.transform((value) => value?.trim() || undefined),
	notes: z
		.string()
		.optional()
		.transform((value) => value?.trim() || undefined),
});

export type StudentImportPayload = z.infer<typeof studentImportSchema>;

export type StudentImportError = {
	row: number;
	email?: string;
	message: string;
};

export type StudentImportResult = {
	success: boolean;
	imported: number;
	errors: StudentImportError[];
};
