"use server";

import { createServiceRoleClient } from "@/lib/supabase/admin";
import { sendStudentInviteEmail } from "@/lib/emails/student-invite";
import {
	getStudentByEmail,
	createStudent,
	createConversationThread,
	getTutorProfileForStudentInvite,
	type StudentRecord,
} from "@/lib/repositories/students";
import { recordAudit } from "@/lib/repositories/audit";
import { withIdempotency } from "@/lib/utils/idempotency";
import {
	getTraceId,
	createRequestLogger,
	logStep,
	logStepError,
	sanitizeInput,
} from "@/lib/logger";
import { requireTutor } from "./helpers.ts";
import type { EnsureStudentInput, EnsureStudentResult } from "./types.ts";

// ============================================================================
// Ensure Student (Create or Get)
// ============================================================================

/**
 * Create a new student or return existing one.
 * Optionally sends welcome email if tutor has auto_welcome_enabled.
 *
 * Compliance:
 * - Repository Law: Uses getStudentByEmail, createStudent, createConversationThread
 * - Observability Law: Has traceId, logStep, logStepError
 * - Safety Law: Wrapped with withIdempotency to prevent duplicates
 * - Security Law: N/A (tutor-authenticated only)
 * - Audit Law: Records audit for student creation
 */
export async function ensureStudent(
	input: EnsureStudentInput
): Promise<EnsureStudentResult> {
	const traceId = await getTraceId();
	const { supabase, user } = await requireTutor();

	if (!user) {
		return { error: "You need to be signed in to manage students." };
	}

	const log = createRequestLogger(traceId, user.id);
	const normalizedEmail = input.email.trim().toLowerCase();
	const providedMutationId = input.clientMutationId?.trim();
	const idempotencyKey =
		providedMutationId || `idempotency-student-${user.id}-${normalizedEmail}`;

	logStep(log, "ensureStudent:start", {
		email: normalizedEmail,
		hasClientMutationId: !!providedMutationId,
	});

	const adminClient = createServiceRoleClient();
	if (!adminClient) {
		logStep(log, "ensureStudent:no_admin_client", {});
		return { error: "Service unavailable. Please try again." };
	}

	// Safety Law: Wrap with idempotency to prevent duplicate students on retry
	const { cached, response } = await withIdempotency(
		adminClient,
		idempotencyKey,
		async () => {
			return await createStudentCore(
				adminClient,
				supabase,
				user.id,
				normalizedEmail,
				input,
				log,
				traceId
			);
		},
		traceId
	);

	if (cached) {
		logStep(log, "ensureStudent:idempotent_hit", {
			idempotencyKeySource: providedMutationId ? "client" : "deterministic",
		});
	}

	return response;
}

/**
 * Core student creation logic (called within idempotency wrapper).
 */
async function createStudentCore(
	adminClient: NonNullable<ReturnType<typeof createServiceRoleClient>>,
	supabase: Awaited<ReturnType<typeof requireTutor>>["supabase"],
	userId: string,
	normalizedEmail: string,
	input: EnsureStudentInput,
	log: ReturnType<typeof createRequestLogger>,
	traceId: string
): Promise<EnsureStudentResult> {
	// Check for existing student
	try {
		const existing = await getStudentByEmail(adminClient, normalizedEmail, userId);
		if (existing) {
			logStep(log, "ensureStudent:existing_found", { studentId: existing.id });
			return { data: existing };
		}
	} catch (error) {
		logStepError(log, "ensureStudent:lookup_failed", error, { email: normalizedEmail });
		return { error: "Failed to check existing student. Please try again." };
	}

	// Fetch tutor profile for welcome email settings
	let tutorProfile: Awaited<ReturnType<typeof getTutorProfileForStudentInvite>> =
		null;
	try {
		tutorProfile = await getTutorProfileForStudentInvite(supabase, userId);
	} catch (error) {
		logStepError(log, "ensureStudent:tutor_profile_failed", error, { userId });
	}

	// Create the student
	let student: StudentRecord;
	try {
		student = await createStudent(adminClient, {
			tutor_id: userId,
			full_name: input.full_name,
			email: normalizedEmail,
			phone: input.phone ?? null,
			timezone: input.timezone ?? "UTC",
			status: "active",
			source: "manual",
		});
		logStep(log, "ensureStudent:created", { studentId: student.id });
	} catch (error) {
		const err = error as { code?: string; message?: string };
		logStepError(log, "ensureStudent:create_failed", error, { email: normalizedEmail });

		// Handle specific error codes
		if (err?.code === "23505") {
			return { error: "A student with this email already exists." };
		}
		if (err?.code === "42501") {
			return { error: "Authorization failed. Please try signing out and back in." };
		}
		return { error: `We couldn't create that student: ${err?.message || "Unknown error"}` };
	}

	// Audit Law: Record student creation
	try {
		await recordAudit(adminClient, {
			actorId: userId,
			targetId: student.id,
			entityType: "student",
			actionType: "create",
			beforeState: null,
			afterState: sanitizeInput(student) as Record<string, unknown>,
			metadata: {
				source: "manual",
				email: normalizedEmail,
			},
		});
	} catch (auditError) {
		logStepError(log, "ensureStudent:audit_failed", auditError, { studentId: student.id });
		// Don't fail the operation for audit errors
	}

	// Send welcome email if enabled
	if (student.email && tutorProfile?.auto_welcome_enabled && !student.email_opt_out) {
		try {
			const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "");
			const bookingUrl =
				baseUrl && tutorProfile?.username
					? `${baseUrl}/book/${tutorProfile.username}`
					: `${baseUrl || "https://tutorlingua.co"}/student/login`;

			const nameParam = student.full_name
				? `&name=${encodeURIComponent(student.full_name)}`
				: "";
			const requestAccessUrl =
				baseUrl && tutorProfile?.username
					? `${baseUrl}/student/request-access?tutor=${encodeURIComponent(
							tutorProfile.username
						)}&tutor_id=${userId}&email=${encodeURIComponent(normalizedEmail)}${nameParam}`
					: `${baseUrl || "https://tutorlingua.co"}/student/signup`;

			sendStudentInviteEmail({
				studentEmail: student.email,
				studentName: student.full_name,
				tutorName: tutorProfile?.full_name || "Your tutor",
				tutorEmail: tutorProfile?.email,
				requestAccessUrl,
				bookingUrl,
			}).catch((err) => {
				logStepError(log, "ensureStudent:invite_email_failed", err, {
					studentId: student.id,
				});
			});

			logStep(log, "ensureStudent:invite_email_sent", { studentId: student.id });
		} catch (emailError) {
			logStepError(log, "ensureStudent:invite_email_error", emailError, {
				studentId: student.id,
			});
		}
	}

	// Create conversation thread
	try {
		await createConversationThread(adminClient, userId, student.id);
		logStep(log, "ensureStudent:thread_created", { studentId: student.id });
	} catch (threadError) {
		logStepError(log, "ensureStudent:thread_failed", threadError, {
			studentId: student.id,
		});
		// Don't fail the operation for thread errors
	}

	logStep(log, "ensureStudent:success", { studentId: student.id });
	return { data: student };
}
