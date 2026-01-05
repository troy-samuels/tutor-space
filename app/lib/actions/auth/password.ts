"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { rateLimitServerAction } from "@/lib/middleware/rate-limit";
import { recordAudit } from "@/lib/repositories/audit";
import {
	getTraceId,
	createRequestLogger,
	logStep,
	logStepError,
} from "@/lib/logger";
import { getClientIp, getUserAgent } from "./helpers";
import type { AuthActionState } from "./types";
import { DASHBOARD_ROUTE, EMAIL_PATTERN } from "./types";

// ============================================================================
// Reset Password
// ============================================================================

/**
 * Request a password reset email.
 *
 * Security Measures:
 * - STRICT rate limiting: 3 requests per hour per IP (prevents email bombing)
 * - Audit logging: Records all password reset requests
 * - Observability: Full traceId logging for debugging
 *
 * @param _prevState - Previous form state (for React form actions)
 * @param formData - Form data containing email
 */
export async function resetPassword(
	_prevState: AuthActionState,
	formData: FormData
): Promise<AuthActionState> {
	const traceId = await getTraceId();
	const email = (formData.get("email") as string)?.trim().toLowerCase() ?? "";
	const log = createRequestLogger(traceId, email);
	const clientIp = await getClientIp();

	logStep(log, "resetPassword:start", { email, ip: clientIp });

	// Validate email format
	if (!email || !EMAIL_PATTERN.test(email)) {
		logStep(log, "resetPassword:invalid_email", { email });
		return { error: "Please enter a valid email address." };
	}

	// STRICT rate limiting: 3 requests per hour to prevent email bombing
	const headersList = await headers();
	const rateLimitResult = await rateLimitServerAction(headersList, {
		limit: 3,
		window: 60 * 60 * 1000, // 1 hour
		prefix: "auth:password-reset",
	});

	if (!rateLimitResult.success) {
		logStep(log, "resetPassword:rate_limited", { ip: clientIp });

		// Audit: Record rate-limited attempt
		const adminClient = createServiceRoleClient();
		if (adminClient) {
			await recordAudit(adminClient, {
				actorId: email, // Use email as identifier for unauthenticated requests
				targetId: null,
				entityType: "account",
				actionType: "password_reset_requested",
				metadata: {
					ip: clientIp,
					traceId,
					rateLimited: true,
					reason: "rate_limit_exceeded",
				},
			});
		}

		return {
			error: rateLimitResult.error || "Too many password reset requests. Please try again later.",
		};
	}

	const supabase = await createClient();
	const adminClient = createServiceRoleClient();

	try {
		const { error } = await supabase.auth.resetPasswordForEmail(email, {
			redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
		});

		if (error) {
			logStepError(log, "resetPassword:supabase_error", error, { email });

			// Audit: Record failed attempt
			if (adminClient) {
				await recordAudit(adminClient, {
					actorId: email,
					targetId: null,
					entityType: "account",
					actionType: "password_reset_requested",
					metadata: {
						ip: clientIp,
						traceId,
						success: false,
						error: error.message,
					},
				});
			}

			return { error: error.message };
		}

		// Audit: Record successful password reset request
		if (adminClient) {
			await recordAudit(adminClient, {
				actorId: email,
				targetId: null,
				entityType: "account",
				actionType: "password_reset_requested",
				metadata: {
					ip: clientIp,
					traceId,
					success: true,
				},
			});
		}

		logStep(log, "resetPassword:success", { email });
		return { success: "Password reset email sent. Please check your inbox." };
	} catch (error) {
		logStepError(log, "resetPassword:unexpected_error", error, { email });
		return { error: "An unexpected error occurred. Please try again." };
	}
}

// ============================================================================
// Update Password
// ============================================================================

/**
 * Update user password (after reset or in settings).
 *
 * Security Measures:
 * - Rate limiting: 5 requests per 15 minutes (prevents brute force)
 * - Audit logging: Records all password changes with before/after state
 * - Observability: Full traceId logging for debugging
 *
 * COMPLIANCE NOTE: Password changes are CRITICAL audit events for GDPR/SOC2.
 *
 * @param _prevState - Previous form state (for React form actions)
 * @param formData - Form data containing password and confirm_password
 */
export async function updatePassword(
	_prevState: AuthActionState,
	formData: FormData
): Promise<AuthActionState> {
	const traceId = await getTraceId();
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	const log = createRequestLogger(traceId, user?.id ?? "unknown");
	const clientIp = await getClientIp();
	const userAgent = await getUserAgent();

	logStep(log, "updatePassword:start", { userId: user?.id, ip: clientIp });

	// Must be authenticated
	if (!user) {
		logStep(log, "updatePassword:not_authenticated", {});
		return { error: "You must be signed in to update your password." };
	}

	// Rate limiting: 5 requests per 15 minutes
	const headersList = await headers();
	const rateLimitResult = await rateLimitServerAction(headersList, {
		limit: 5,
		window: 15 * 60 * 1000, // 15 minutes
		prefix: "auth:password-update",
	});

	if (!rateLimitResult.success) {
		logStep(log, "updatePassword:rate_limited", { userId: user.id, ip: clientIp });
		return {
			error: rateLimitResult.error || "Too many password change attempts. Please try again later.",
		};
	}

	const password = (formData.get("password") as string) ?? "";
	const confirmPassword = (formData.get("confirm_password") as string) ?? "";

	if (password !== confirmPassword) {
		logStep(log, "updatePassword:password_mismatch", { userId: user.id });
		return { error: "Passwords do not match." };
	}

	if (password.length < 8) {
		logStep(log, "updatePassword:password_too_short", { userId: user.id });
		return { error: "Password must be at least 8 characters." };
	}

	const adminClient = createServiceRoleClient();

	try {
		const { error } = await supabase.auth.updateUser({ password });

		if (error) {
			logStepError(log, "updatePassword:supabase_error", error, { userId: user.id });

			// Audit: Record failed password change
			if (adminClient) {
				await recordAudit(adminClient, {
					actorId: user.id,
					targetId: user.id,
					entityType: "account",
					actionType: "password_change",
					beforeState: null,
					afterState: null,
					metadata: {
						ip: clientIp,
						userAgent,
						traceId,
						success: false,
						error: error.message,
					},
				});
			}

			return { error: error.message };
		}

		// Audit: Record successful password change (CRITICAL for compliance)
		if (adminClient) {
			await recordAudit(adminClient, {
				actorId: user.id,
				targetId: user.id,
				entityType: "account",
				actionType: "password_change",
				beforeState: null, // Never log actual passwords
				afterState: { changedAt: new Date().toISOString() },
				metadata: {
					ip: clientIp,
					userAgent,
					traceId,
					success: true,
				},
			});
		}

		logStep(log, "updatePassword:success", { userId: user.id });

		revalidatePath("/", "layout");
		redirect(DASHBOARD_ROUTE);
	} catch (error) {
		// Check if it's a redirect (Next.js throws on redirect)
		if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
			throw error;
		}

		logStepError(log, "updatePassword:unexpected_error", error, { userId: user.id });
		return { error: "An unexpected error occurred. Please try again." };
	}
}
