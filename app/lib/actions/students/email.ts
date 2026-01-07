"use server";

import { headers } from "next/headers";
import { resend, EMAIL_CONFIG } from "@/lib/resend";
import { QuickInviteEmail, QuickInviteEmailText } from "@/emails/quick-invite";
import { ServerActionLimiters } from "@/lib/middleware/rate-limit";
import {
	getTraceId,
	createRequestLogger,
	logStep,
	logStepError,
} from "@/lib/logger";

// ============================================================================
// Send Quick Invite Email
// ============================================================================

/**
 * Send a quick invite email with booking link from the dashboard.
 *
 * Compliance:
 * - Repository Law: N/A (no database operations)
 * - Observability Law: Has traceId, logStep, logStepError
 * - Safety Law: N/A (not a create operation with side effects)
 * - Security Law: Rate limited to prevent email spam
 * - Audit Law: N/A (email sending, not status change)
 */
export async function sendQuickInviteEmail(
	email: string,
	tutorName: string,
	bookingUrl: string
): Promise<{ success: boolean; error?: string }> {
	const traceId = await getTraceId();
	const log = createRequestLogger(traceId, "quick-invite");

	logStep(log, "sendQuickInviteEmail:start", {
		recipientEmail: email,
		tutorName,
	});

	// Security Law: Rate limit to prevent email spam
	const headersList = await headers();
	const rateLimitResult = await ServerActionLimiters.email(headersList);
	if (!rateLimitResult.success) {
		logStep(log, "sendQuickInviteEmail:rate_limited", {});
		return {
			success: false,
			error: rateLimitResult.error || "Too many email attempts. Please try again later.",
		};
	}

	// Basic email validation
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	if (!emailRegex.test(email)) {
		logStep(log, "sendQuickInviteEmail:invalid_email", { email });
		return { success: false, error: "Please enter a valid email address" };
	}

	try {
		const html = QuickInviteEmail({ tutorName, bookingUrl });
		const text = QuickInviteEmailText({ tutorName, bookingUrl });

		const { error } = await resend.emails.send({
			from: EMAIL_CONFIG.from,
			to: email.trim().toLowerCase(),
			subject: `${tutorName} invited you to book a lesson`,
			html,
			text,
		});

		if (error) {
			logStepError(log, "sendQuickInviteEmail:send_failed", error, { email });
			return { success: false, error: "Failed to send email. Please try again." };
		}

		logStep(log, "sendQuickInviteEmail:success", { email });
		return { success: true };
	} catch (error) {
		logStepError(log, "sendQuickInviteEmail:error", error, { email });
		return { success: false, error: "An unexpected error occurred" };
	}
}
