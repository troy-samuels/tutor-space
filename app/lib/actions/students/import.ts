"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { ServerActionLimiters } from "@/lib/middleware/rate-limit";
import {
	getStudentByEmail,
	createStudent,
	createConversationThread,
	getStudentById,
	updateStudentDetails,
} from "@/lib/repositories/students";
import { recordAudit } from "@/lib/repositories/audit";
import {
	getTraceId,
	createRequestLogger,
	logStep,
	logStepError,
	sanitizeInput,
} from "@/lib/logger";
import { requireTutor } from "./helpers.ts";
import { normalizeStatus } from "./utils.ts";
import {
	MAX_IMPORT_ROWS,
	studentImportSchema,
	type StudentImportPayload,
	type StudentImportError,
	type StudentImportResult,
} from "./types.ts";

// ============================================================================
// Import Students Batch
// ============================================================================

/**
 * Batch import students from CSV data.
 *
 * Compliance:
 * - Repository Law: Uses repository functions for all DB operations
 * - Observability Law: Has traceId, logStep, logStepError
 * - Safety Law: Per-row error handling (no idempotency wrapper needed)
 * - Security Law: Rate limited to prevent resource exhaustion
 * - Audit Law: Records audit for each created student
 */
export async function importStudentsBatch(
	entries: StudentImportPayload[]
): Promise<StudentImportResult> {
	const traceId = await getTraceId();
	const { user } = await requireTutor();

	if (!user) {
		return {
			success: false,
			imported: 0,
			errors: [{ row: 0, message: "You must be signed in." }],
		};
	}

	const log = createRequestLogger(traceId, user.id);
	logStep(log, "importStudentsBatch:start", { rowCount: entries?.length ?? 0 });

	// Security Law: Rate limit to prevent resource exhaustion
	const headersList = await headers();
	const rateLimitResult = await ServerActionLimiters.import(headersList);
	if (!rateLimitResult.success) {
		logStep(log, "importStudentsBatch:rate_limited", {});
		return {
			success: false,
			imported: 0,
			errors: [
				{
					row: 0,
					message:
						rateLimitResult.error || "Too many import attempts. Please try again later.",
				},
			],
		};
	}

	if (!entries || entries.length === 0) {
		logStep(log, "importStudentsBatch:empty_input", {});
		return {
			success: false,
			imported: 0,
			errors: [{ row: 0, message: "No students provided." }],
		};
	}

	// Enforce row limit to prevent memory issues and abuse
	if (entries.length > MAX_IMPORT_ROWS) {
		logStep(log, "importStudentsBatch:too_many_rows", { count: entries.length });
		return {
			success: false,
			imported: 0,
			errors: [
				{
					row: 0,
					message: `Too many rows. Maximum allowed is ${MAX_IMPORT_ROWS} students per import. You provided ${entries.length} rows. Please split your file into smaller batches.`,
				},
			],
		};
	}

	const parsed = z.array(studentImportSchema).safeParse(entries);
	if (!parsed.success) {
		logStep(log, "importStudentsBatch:validation_failed", {
			issueCount: parsed.error.issues.length,
		});
		return {
			success: false,
			imported: 0,
			errors: parsed.error.issues.map((issue) => {
				const pathHead = issue.path[0];
				const row =
					typeof pathHead === "number" ? pathHead + 1 : (issue.path[1] as number | undefined) ?? 0;
				return {
					row,
					message: issue.message,
				};
			}),
		};
	}

	const adminClient = createServiceRoleClient();
	if (!adminClient) {
		logStep(log, "importStudentsBatch:no_admin_client", {});
		return {
			success: false,
			imported: 0,
			errors: [{ row: 0, message: "Service unavailable. Please try again." }],
		};
	}

	const seenEmails = new Set<string>();
	const errors: StudentImportError[] = [];
	let importedCount = 0;

	for (let index = 0; index < parsed.data.length; index += 1) {
		const entry = parsed.data[index];
		const rowNumber = entry.rowIndex ?? index + 1;
		const normalizedEmail = entry.email.trim().toLowerCase();

		if (seenEmails.has(normalizedEmail)) {
			errors.push({
				row: rowNumber,
				email: entry.email,
				message: "Duplicate row with the same email detected in this upload.",
			});
			continue;
		}
		seenEmails.add(normalizedEmail);

		// Check for existing student
		let existingStudent = null;
		try {
			existingStudent = await getStudentByEmail(adminClient, normalizedEmail, user.id);
		} catch (lookupError) {
			logStepError(log, "importStudentsBatch:lookup_failed", lookupError, {
				row: rowNumber,
				email: normalizedEmail,
			});
			errors.push({
				row: rowNumber,
				email: entry.email,
				message: "Failed to check for existing student.",
			});
			continue;
		}

		let studentId: string;
		let isNewStudent = false;

		if (existingStudent) {
			studentId = existingStudent.id;
		} else {
			// Create new student
			try {
				const newStudent = await createStudent(adminClient, {
					tutor_id: user.id,
					full_name: entry.full_name.trim(),
					email: normalizedEmail,
					phone: entry.phone ?? null,
					timezone: "UTC",
					status: "active",
					source: "import",
				});
				studentId = newStudent.id;
				isNewStudent = true;

				// Audit Law: Record student creation
				await recordAudit(adminClient, {
					actorId: user.id,
					targetId: studentId,
					entityType: "student",
					actionType: "create",
					beforeState: null,
					afterState: sanitizeInput(newStudent) as Record<string, unknown>,
					metadata: {
						source: "import",
						row: rowNumber,
					},
				});

				// Create conversation thread
				await createConversationThread(adminClient, user.id, studentId);

				logStep(log, "importStudentsBatch:student_created", {
					row: rowNumber,
					studentId,
				});
			} catch (createError) {
				const err = createError as { code?: string; message?: string };
				logStepError(log, "importStudentsBatch:create_failed", createError, {
					row: rowNumber,
					email: normalizedEmail,
				});

				if (err?.code === "23505") {
					errors.push({
						row: rowNumber,
						email: entry.email,
						message: "A student with this email already exists.",
					});
				} else {
					errors.push({
						row: rowNumber,
						email: entry.email,
						message: `Failed to create student: ${err?.message || "Unknown error"}`,
					});
				}
				continue;
			}
		}

		// Update additional fields if provided
		const updates: Record<string, unknown> = {};
		const normalizedStatus = normalizeStatus(entry.status);

		if (normalizedStatus) {
			updates.status = normalizedStatus;
		}
		if (entry.proficiency_level) {
			updates.proficiency_level = entry.proficiency_level;
		}
		if (entry.learning_goals) {
			updates.learning_goals = entry.learning_goals;
		}
		if (entry.native_language) {
			updates.native_language = entry.native_language;
		}
		if (entry.notes) {
			updates.notes = entry.notes;
		}

		if (Object.keys(updates).length > 0) {
			// Get before state for audit
			const beforeStudent = isNewStudent ? null : await getStudentById(adminClient, studentId, user.id);

			try {
				await updateStudentDetails(adminClient, studentId, user.id, updates);
			} catch (updateError) {
				const fields = Object.keys(updates).join(", ");
				const err = updateError as { message?: string };
				logStepError(log, "importStudentsBatch:update_failed", updateError, {
					row: rowNumber,
					studentId,
					fields,
				});
				errors.push({
					row: rowNumber,
					email: entry.email,
					message: `Saved student but failed to update ${fields}: ${
						err?.message || "Unknown error"
					}`,
				});
				continue;
			}

			// Audit the update if not a new student
			if (!isNewStudent && beforeStudent) {
				const sanitizedBefore = sanitizeInput(beforeStudent) as Record<string, unknown>;
				await recordAudit(adminClient, {
					actorId: user.id,
					targetId: studentId,
					entityType: "student",
					actionType: "update",
					beforeState: sanitizedBefore,
					afterState: { ...sanitizedBefore, ...updates },
					metadata: {
						source: "import",
						row: rowNumber,
						fields: Object.keys(updates),
					},
				});
			}
		}

		importedCount += 1;
	}

	// Revalidate tutor-facing pages
	await Promise.allSettled([
		revalidatePath("/students"),
		revalidatePath("/students/import"),
		revalidatePath("/dashboard"),
	]);

	logStep(log, "importStudentsBatch:complete", {
		imported: importedCount,
		errors: errors.length,
	});

	return {
		success: errors.length === 0,
		imported: importedCount,
		errors,
	};
}
