"use server";

import { headers } from "next/headers";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";
import { VerifyEmailEmail, VerifyEmailEmailText } from "@/emails/verify-email";
import type { UserRole } from "@/lib/auth/redirects";
import { convertToProxyVerifyUrl } from "./utils";

// ============================================================================
// Async Utilities
// ============================================================================

/**
 * Wrap a promise with a timeout.
 * Throws if the promise doesn't resolve within the specified time.
 */
export async function withTimeout<T>(
	promise: Promise<T>,
	ms: number,
	label: string
): Promise<T> {
	let timeoutId: NodeJS.Timeout | null = null;
	const timeoutPromise = new Promise<never>((_, reject) => {
		timeoutId = setTimeout(() => {
			reject(new Error(`${label} timed out after ${ms}ms`));
		}, ms);
	});

	try {
		return await Promise.race([promise, timeoutPromise]);
	} finally {
		if (timeoutId) {
			clearTimeout(timeoutId);
		}
	}
}

// ============================================================================
// Email Verification
// ============================================================================

/**
 * Send a fast verification email using Resend directly.
 * Bypasses Supabase's email queue for faster delivery.
 */
export async function sendFastVerificationEmail(params: {
	email: string;
	role: UserRole;
	emailRedirectTo: string;
}): Promise<{ success: boolean; error?: string }> {
	if (!process.env.RESEND_API_KEY) {
		return { success: false, error: "Resend API key is not configured." };
	}

	const adminClient = createServiceRoleClient();
	if (!adminClient) {
		return { success: false, error: "Service role client is not configured." };
	}

	const { data, error } = await adminClient.auth.admin.generateLink({
		type: "magiclink",
		email: params.email,
		options: {
			redirectTo: params.emailRedirectTo,
		},
	});

	const actionLink = data?.properties?.action_link;
	if (error || !actionLink) {
		return {
			success: false,
			error: error?.message ?? "Unable to generate a verification link.",
		};
	}

	// Convert raw Supabase URL to our proxy URL for better UX
	const proxyUrl = convertToProxyVerifyUrl(actionLink);

	const subject =
		params.role === "student"
			? "Confirm your TutorLingua student email"
			: "Confirm your TutorLingua email";

	const html = VerifyEmailEmail({
		confirmUrl: proxyUrl,
		role: params.role,
	});
	const text = VerifyEmailEmailText({
		confirmUrl: proxyUrl,
		role: params.role,
	});

	const sendResult = await sendEmail({
		to: params.email,
		subject,
		html,
		text,
		category: "auth_verification",
		allowSuppressed: true,
	});

	if (!sendResult.success) {
		return {
			success: false,
			error: sendResult.error ?? "Failed to send verification email.",
		};
	}

	return { success: true };
}

// ============================================================================
// IP Extraction
// ============================================================================

/**
 * Extract client IP from request headers.
 * Used for rate limiting and audit logging.
 */
export async function getClientIp(): Promise<string> {
	const headersList = await headers();
	return (
		headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
		headersList.get("x-real-ip") ||
		"unknown"
	);
}

/**
 * Extract user agent from request headers.
 * Used for audit logging.
 */
export async function getUserAgent(): Promise<string> {
	const headersList = await headers();
	return headersList.get("user-agent") || "unknown";
}
