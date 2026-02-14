/**
 * Pure utility functions for auth module.
 * These are NOT server actions - they're shared utilities.
 */

import { getAppUrl } from "@/lib/auth/redirects";
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
