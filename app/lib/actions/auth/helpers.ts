"use server";

import { headers } from "next/headers";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";
import { VerifyEmailEmail, VerifyEmailEmailText } from "@/emails/verify-email";
import { getAppUrl, type UserRole } from "@/lib/auth/redirects";
import { DASHBOARD_ROUTE, STUDENT_HOME_ROUTE } from "./types";

// ============================================================================
// Stripe Configuration
// ============================================================================

/**
 * Check if Stripe is configured with secret key.
 */
export function isStripeConfigured(): boolean {
	return Boolean(process.env.STRIPE_SECRET_KEY);
}

// ============================================================================
// Path & Redirect Utilities
// ============================================================================

/**
 * Check if a path is a student-facing route.
 */
export function isStudentPath(path: string): boolean {
	return path === "/" || path.startsWith("/student") || path.startsWith("/book/");
}

/**
 * Resolve redirect destination for students.
 */
export function resolveStudentRedirect(target: string | null): string {
	if (target && isStudentPath(target)) {
		return target;
	}
	return STUDENT_HOME_ROUTE;
}

/**
 * Resolve redirect destination for tutors.
 */
export function resolveTutorRedirect(target: string | null): string {
	return target || DASHBOARD_ROUTE;
}

/**
 * Resolve the auth callback base URL from request headers.
 */
export function resolveAuthCallbackBase(headersList: Headers): string {
	const forwardedHost = headersList.get("x-forwarded-host");
	const forwardedProto = headersList.get("x-forwarded-proto");

	if (forwardedHost) {
		const protocol = forwardedProto || (forwardedHost.includes("localhost") ? "http" : "https");
		return `${protocol}://${forwardedHost}`;
	}

	const host = headersList.get("host");
	if (host) {
		const protocol = forwardedProto || (host.includes("localhost") ? "http" : "https");
		return `${protocol}://${host}`;
	}

	return getAppUrl();
}

/**
 * Build auth callback URL from headers with next path parameter.
 */
export function buildAuthCallbackUrlFromHeaders(
	headersList: Headers,
	nextPath: string
): string {
	const baseUrl = resolveAuthCallbackBase(headersList);
	const url = new URL("/auth/callback", baseUrl);
	url.searchParams.set("next", nextPath);
	return url.toString();
}

// ============================================================================
// URL Utilities
// ============================================================================

/**
 * Converts a raw Supabase verification URL to our proxy URL.
 * This makes email links more trustworthy by showing our domain.
 *
 * Input:  https://[project].supabase.co/auth/v1/verify?token=xxx&type=magiclink&redirect_to=...
 * Output: https://tutorlingua.co/api/auth/verify?token=xxx&type=magiclink&redirect_to=...
 */
export function convertToProxyVerifyUrl(supabaseUrl: string): string {
	try {
		const parsed = new URL(supabaseUrl);
		const token = parsed.searchParams.get("token");
		const type = parsed.searchParams.get("type");
		const redirectTo = parsed.searchParams.get("redirect_to");

		if (!token) {
			// Fallback to original URL if parsing fails
			return supabaseUrl;
		}

		const appUrl = getAppUrl();
		const proxyUrl = new URL("/api/auth/verify", appUrl);
		proxyUrl.searchParams.set("token", token);
		if (type) proxyUrl.searchParams.set("type", type);
		if (redirectTo) proxyUrl.searchParams.set("redirect_to", redirectTo);

		return proxyUrl.toString();
	} catch {
		// If URL parsing fails, return original
		return supabaseUrl;
	}
}

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
