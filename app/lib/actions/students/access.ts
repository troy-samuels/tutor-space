"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import {
	sendAccessApprovedEmail,
	sendAccessDeniedEmail,
} from "@/lib/emails/access-emails";
import {
	getStudentWithTutorProfile,
	getAccessRequest,
	updateStudentAccessStatus,
	updateAccessRequest,
	getStudentById,
} from "@/lib/repositories/students";
import { recordAudit } from "@/lib/repositories/audit";
import {
	getTraceId,
	createRequestLogger,
	logStep,
	logStepError,
} from "@/lib/logger";

// ============================================================================
// Types
// ============================================================================

type SupabaseAuthClient = Awaited<ReturnType<typeof createClient>>;
type ServiceRoleClient = NonNullable<ReturnType<typeof createServiceRoleClient>>;

// ============================================================================
// Approve Student Access
// ============================================================================

/**
 * Approve a student's calendar access request.
 *
 * Compliance:
 * - Repository Law: Uses repository functions for all DB operations
 * - Observability Law: Has traceId, logStep, logStepError
 * - Safety Law: N/A (not a create operation)
 * - Security Law: N/A (tutor-authenticated only)
 * - Audit Law: Records audit for access approval
 */
export async function approveStudentAccess(params: {
	requestId: string;
	studentId: string;
	notes?: string;
}) {
	const traceId = await getTraceId();
	const supabase = await createClient();
	const adminClient = createServiceRoleClient();

	if (!adminClient) {
		return { error: "Service unavailable" };
	}

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return { error: "You must be logged in to approve requests" };
	}

	const log = createRequestLogger(traceId, user.id);
	logStep(log, "approveStudentAccess:start", {
		requestId: params.requestId,
		studentId: params.studentId,
	});

	try {
		// Verify student exists and belongs to tutor
		const studentRecord = await getStudentWithTutorProfile(
			adminClient,
			params.studentId,
			user.id
		);

		if (!studentRecord) {
			logStep(log, "approveStudentAccess:student_not_found", { studentId: params.studentId });
			return { error: "Student not found or access denied" };
		}

		// Verify access request exists
		const accessRequest = await getAccessRequest(adminClient, params.requestId, user.id);
		if (!accessRequest) {
			logStep(log, "approveStudentAccess:request_not_found", { requestId: params.requestId });
			return { error: "Access request not found" };
		}

		const beforeStatus = studentRecord.calendar_access_status;
		const now = new Date().toISOString();

		// Update student access status
		await updateStudentAccessStatus(adminClient, params.studentId, user.id, "approved", {
			approvedBy: user.id,
			approvedAt: now,
		});

		logStep(log, "approveStudentAccess:student_updated", { studentId: params.studentId });

		// Update access request
		await updateAccessRequest(adminClient, params.requestId, user.id, {
			status: "approved",
			resolvedAt: now,
			resolvedBy: user.id,
			tutorNotes: params.notes,
		});

		logStep(log, "approveStudentAccess:request_updated", { requestId: params.requestId });

		// Audit Law: Record access approval
		await recordAudit(adminClient, {
			actorId: user.id,
			targetId: params.studentId,
			entityType: "student",
			actionType: "update_status",
			beforeState: { calendar_access_status: beforeStatus },
			afterState: { calendar_access_status: "approved" },
			metadata: {
				change_type: "access_approved",
				requestId: params.requestId,
				notes: params.notes ?? null,
			},
		});

		// Send approval email
		const tutor = Array.isArray(studentRecord.profiles)
			? studentRecord.profiles[0]
			: studentRecord.profiles;

		if (tutor && tutor.email) {
			const bookingUrl = `${process.env.NEXT_PUBLIC_APP_URL}/book/${tutor.username}`;

			await sendAccessApprovedEmail({
				studentName: studentRecord.full_name || "Student",
				studentEmail: studentRecord.email,
				tutorName: tutor.full_name || "Tutor",
				tutorEmail: tutor.email,
				tutorNotes: params.notes,
				bookingUrl,
				paymentInstructions: {
					general: tutor.payment_general_instructions || undefined,
					venmoHandle: tutor.payment_venmo_handle || undefined,
					paypalEmail: tutor.payment_paypal_email || undefined,
					zellePhone: tutor.payment_zelle_phone || undefined,
					stripePaymentLink: tutor.payment_stripe_link || undefined,
					customPaymentUrl: tutor.payment_custom_url || undefined,
				},
			});

			logStep(log, "approveStudentAccess:email_sent", { studentId: params.studentId });
		}

		revalidatePath("/students/access-requests");
		logStep(log, "approveStudentAccess:success", { studentId: params.studentId });
		return { success: true };
	} catch (error) {
		logStepError(log, "approveStudentAccess:error", error, {
			studentId: params.studentId,
			requestId: params.requestId,
		});
		return { error: "An unexpected error occurred" };
	}
}

// ============================================================================
// Deny Student Access
// ============================================================================

/**
 * Deny a student's calendar access request.
 *
 * Compliance:
 * - Repository Law: Uses repository functions for all DB operations
 * - Observability Law: Has traceId, logStep, logStepError
 * - Safety Law: N/A (not a create operation)
 * - Security Law: N/A (tutor-authenticated only)
 * - Audit Law: Records audit for access denial
 */
export async function denyStudentAccess(params: {
	requestId: string;
	studentId: string;
	reason: string;
}) {
	const traceId = await getTraceId();
	const supabase = await createClient();
	const adminClient = createServiceRoleClient();

	if (!adminClient) {
		return { error: "Service unavailable" };
	}

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return { error: "You must be logged in to deny requests" };
	}

	const log = createRequestLogger(traceId, user.id);
	logStep(log, "denyStudentAccess:start", {
		requestId: params.requestId,
		studentId: params.studentId,
	});

	try {
		// Verify student exists and get current status
		const studentRecord = await getStudentWithTutorProfile(
			adminClient,
			params.studentId,
			user.id
		);

		if (!studentRecord) {
			logStep(log, "denyStudentAccess:student_not_found", { studentId: params.studentId });
			return { error: "Student not found or access denied" };
		}

		const beforeStatus = studentRecord.calendar_access_status;

		// Verify access request exists
		const accessRequest = await getAccessRequest(adminClient, params.requestId, user.id);
		if (!accessRequest) {
			logStep(log, "denyStudentAccess:request_not_found", { requestId: params.requestId });
			return { error: "Access request not found" };
		}

		const now = new Date().toISOString();

		// Update student access status
		await updateStudentAccessStatus(adminClient, params.studentId, user.id, "denied");
		logStep(log, "denyStudentAccess:student_updated", { studentId: params.studentId });

		// Audit Law: Record access denial
		await recordAudit(adminClient, {
			actorId: user.id,
			targetId: params.studentId,
			entityType: "student",
			actionType: "update_status",
			beforeState: { calendar_access_status: beforeStatus },
			afterState: { calendar_access_status: "denied" },
			metadata: {
				change_type: "access_revoked",
				requestId: params.requestId,
				reason: params.reason,
			},
		});

		// Update access request
		await updateAccessRequest(adminClient, params.requestId, user.id, {
			status: "denied",
			resolvedAt: now,
			resolvedBy: user.id,
			tutorNotes: params.reason,
		});

		logStep(log, "denyStudentAccess:request_updated", { requestId: params.requestId });

		// Send denial email
		const tutor = Array.isArray(studentRecord.profiles)
			? studentRecord.profiles[0]
			: studentRecord.profiles;

		if (tutor && tutor.email) {
			await sendAccessDeniedEmail({
				studentName: studentRecord.full_name || "Student",
				studentEmail: studentRecord.email,
				tutorName: tutor.full_name || "Tutor",
				tutorEmail: tutor.email,
				tutorNotes: params.reason,
				instagramHandle: tutor.instagram_handle || undefined,
				websiteUrl: tutor.website_url || undefined,
			});

			logStep(log, "denyStudentAccess:email_sent", { studentId: params.studentId });
		}

		revalidatePath("/students/access-requests");
		logStep(log, "denyStudentAccess:success", { studentId: params.studentId });
		return { success: true };
	} catch (error) {
		logStepError(log, "denyStudentAccess:error", error, {
			studentId: params.studentId,
			requestId: params.requestId,
		});
		return { error: "An unexpected error occurred" };
	}
}

// ============================================================================
// Suspend Student Access
// ============================================================================

/**
 * Suspend a student's calendar access.
 *
 * Compliance:
 * - Repository Law: Uses repository functions for all DB operations
 * - Observability Law: Has traceId, logStep, logStepError
 * - Safety Law: N/A (not a create operation)
 * - Security Law: N/A (tutor-authenticated only)
 * - Audit Law: Records audit for access suspension
 */
export async function suspendStudentAccess(studentId: string) {
	const traceId = await getTraceId();
	const supabase = await createClient();
	const adminClient = createServiceRoleClient();

	if (!adminClient) {
		return { error: "Service unavailable" };
	}

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return { error: "You must be logged in" };
	}

	const log = createRequestLogger(traceId, user.id);
	logStep(log, "suspendStudentAccess:start", { studentId });

	try {
		// Get current status for audit
		const student = await getStudentById(adminClient, studentId, user.id);
		if (!student) {
			logStep(log, "suspendStudentAccess:student_not_found", { studentId });
			return { error: "Student not found" };
		}

		const beforeStatus = student.calendar_access_status;

		// Update status
		await updateStudentAccessStatus(adminClient, studentId, user.id, "suspended");
		logStep(log, "suspendStudentAccess:status_updated", { studentId });

		// Audit Law: Record access suspension
		await recordAudit(adminClient, {
			actorId: user.id,
			targetId: studentId,
			entityType: "student",
			actionType: "update_status",
			beforeState: { calendar_access_status: beforeStatus },
			afterState: { calendar_access_status: "suspended" },
			metadata: {
				change_type: "access_suspended",
			},
		});

		revalidatePath("/students");
		revalidatePath("/students/access-requests");

		logStep(log, "suspendStudentAccess:success", { studentId });
		return { success: true };
	} catch (error) {
		logStepError(log, "suspendStudentAccess:error", error, { studentId });
		return { error: "An unexpected error occurred" };
	}
}

// ============================================================================
// Reactivate Student Access
// ============================================================================

/**
 * Reactivate a suspended student's access.
 *
 * Compliance:
 * - Repository Law: Uses repository functions for all DB operations
 * - Observability Law: Has traceId, logStep, logStepError
 * - Safety Law: N/A (not a create operation)
 * - Security Law: N/A (tutor-authenticated only)
 * - Audit Law: Records audit for access reactivation
 */
export async function reactivateStudentAccess(studentId: string) {
	const traceId = await getTraceId();
	const supabase = await createClient();
	const adminClient = createServiceRoleClient();

	if (!adminClient) {
		return { error: "Service unavailable" };
	}

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return { error: "You must be logged in" };
	}

	const log = createRequestLogger(traceId, user.id);
	logStep(log, "reactivateStudentAccess:start", { studentId });

	try {
		// Get current status for audit
		const student = await getStudentById(adminClient, studentId, user.id);
		if (!student) {
			logStep(log, "reactivateStudentAccess:student_not_found", { studentId });
			return { error: "Student not found" };
		}

		const beforeStatus = student.calendar_access_status;

		// Update status
		await updateStudentAccessStatus(adminClient, studentId, user.id, "approved");
		logStep(log, "reactivateStudentAccess:status_updated", { studentId });

		// Audit Law: Record access reactivation
		await recordAudit(adminClient, {
			actorId: user.id,
			targetId: studentId,
			entityType: "student",
			actionType: "update_status",
			beforeState: { calendar_access_status: beforeStatus },
			afterState: { calendar_access_status: "approved" },
			metadata: {
				change_type: "access_reactivated",
			},
		});

		revalidatePath("/students");
		revalidatePath("/students/access-requests");

		logStep(log, "reactivateStudentAccess:success", { studentId });
		return { success: true };
	} catch (error) {
		logStepError(log, "reactivateStudentAccess:error", error, { studentId });
		return { error: "An unexpected error occurred" };
	}
}

// ============================================================================
// Legacy Export for Dependency Injection Pattern
// ============================================================================

/**
 * Approve student access with dependency injection.
 * Used for testing with mock email functions.
 */
export async function approveStudentAccessWithClients(
	supabase: SupabaseAuthClient,
	adminClient: ServiceRoleClient,
	params: { requestId: string; studentId: string; notes?: string },
	options: { sendApprovedEmail?: typeof sendAccessApprovedEmail } = {}
) {
	const sendApprovedEmail = options.sendApprovedEmail ?? sendAccessApprovedEmail;
	const traceId = await getTraceId();

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return { error: "You must be logged in to approve requests" };
	}

	const log = createRequestLogger(traceId, user.id);
	logStep(log, "approveStudentAccessWithClients:start", {
		requestId: params.requestId,
		studentId: params.studentId,
	});

	try {
		const studentRecord = await getStudentWithTutorProfile(
			adminClient,
			params.studentId,
			user.id
		);

		if (!studentRecord) {
			return { error: "Student not found or access denied" };
		}

		const accessRequest = await getAccessRequest(adminClient, params.requestId, user.id);
		if (!accessRequest) {
			return { error: "Access request not found" };
		}

		const beforeStatus = studentRecord.calendar_access_status;
		const now = new Date().toISOString();

		await updateStudentAccessStatus(adminClient, params.studentId, user.id, "approved", {
			approvedBy: user.id,
			approvedAt: now,
		});

		await updateAccessRequest(adminClient, params.requestId, user.id, {
			status: "approved",
			resolvedAt: now,
			resolvedBy: user.id,
			tutorNotes: params.notes,
		});

		// Audit Law: Record access approval
		await recordAudit(adminClient, {
			actorId: user.id,
			targetId: params.studentId,
			entityType: "student",
			actionType: "update_status",
			beforeState: { calendar_access_status: beforeStatus },
			afterState: { calendar_access_status: "approved" },
			metadata: {
				change_type: "access_approved",
				requestId: params.requestId,
			},
		});

		const tutor = Array.isArray(studentRecord.profiles)
			? studentRecord.profiles[0]
			: studentRecord.profiles;

		if (tutor && tutor.email) {
			const bookingUrl = `${process.env.NEXT_PUBLIC_APP_URL}/book/${tutor.username}`;

			await sendApprovedEmail({
				studentName: studentRecord.full_name || "Student",
				studentEmail: studentRecord.email,
				tutorName: tutor.full_name || "Tutor",
				tutorEmail: tutor.email,
				tutorNotes: params.notes,
				bookingUrl,
				paymentInstructions: {
					general: tutor.payment_general_instructions || undefined,
					venmoHandle: tutor.payment_venmo_handle || undefined,
					paypalEmail: tutor.payment_paypal_email || undefined,
					zellePhone: tutor.payment_zelle_phone || undefined,
					stripePaymentLink: tutor.payment_stripe_link || undefined,
					customPaymentUrl: tutor.payment_custom_url || undefined,
				},
			});
		}

		revalidatePath("/students/access-requests");
		logStep(log, "approveStudentAccessWithClients:success", { studentId: params.studentId });
		return { success: true };
	} catch (error) {
		logStepError(log, "approveStudentAccessWithClients:error", error, {
			studentId: params.studentId,
		});
		return { error: "An unexpected error occurred" };
	}
}
