"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { rateLimitServerAction } from "@/lib/middleware/rate-limit";
import { recordAudit } from "@/lib/repositories/audit";
import { getProfileRole, updateLastLogin } from "@/lib/repositories/profiles";
import {
	getTraceId,
	createRequestLogger,
	logStep,
	logStepError,
} from "@/lib/logger";
import { getAppUrl } from "@/lib/auth/redirects";
import {
	resolveStudentRedirect,
	resolveTutorRedirect,
	getClientIp,
	getUserAgent,
} from "./helpers";
import type { AuthActionState } from "./types";

// ============================================================================
// Types
// ============================================================================

type OAuthProvider = "google";

// ============================================================================
// Sign In with OAuth (Redirect Flow)
// ============================================================================

/**
 * Initiate OAuth sign-in flow.
 * Redirects to OAuth provider's consent screen.
 *
 * @param provider - OAuth provider (currently only "google")
 * @param redirectTarget - Optional path to redirect after successful sign-in
 */
export async function signInWithOAuth(
	provider: OAuthProvider,
	redirectTarget?: string
): Promise<{ error?: string } | never> {
	const traceId = await getTraceId();
	const log = createRequestLogger(traceId, "oauth");
	const clientIp = await getClientIp();

	logStep(log, "signInWithOAuth:start", { provider, ip: clientIp });

	const supabase = await createClient();

	// Build callback URL with redirect parameter
	const callbackUrl = new URL("/auth/callback", getAppUrl());
	if (redirectTarget) {
		callbackUrl.searchParams.set("next", redirectTarget);
	}

	const { data, error } = await supabase.auth.signInWithOAuth({
		provider,
		options: {
			redirectTo: callbackUrl.toString(),
		},
	});

	if (error) {
		logStepError(log, "signInWithOAuth:failed", error, { provider });
		return { error: error.message };
	}

	if (data.url) {
		logStep(log, "signInWithOAuth:redirect", { provider, url: data.url });
		redirect(data.url);
	}

	return { error: "Failed to initiate OAuth flow" };
}

// ============================================================================
// Sign In with Google ID Token (Direct Token Exchange)
// ============================================================================

/**
 * Sign in with a Google ID token obtained from Google Identity Services.
 * This avoids redirecting through Supabase's domain during OAuth.
 *
 * Security Measures:
 * - Rate limiting: 10 requests per 15 minutes
 * - Audit logging: Records login_success and login_failed events
 * - Observability: Full traceId logging with IP tracking
 * - Repository pattern: Uses getProfileRole for role lookup
 *
 * @param idToken - The JWT ID token from Google
 * @param nonce - The nonce used during the Google sign-in flow (unhashed)
 * @param redirectTarget - Optional path to redirect after sign-in
 */
export async function signInWithGoogleIdToken(
	idToken: string,
	nonce: string,
	redirectTarget?: string
): Promise<AuthActionState> {
	const traceId = await getTraceId();
	const clientIp = await getClientIp();
	const userAgent = await getUserAgent();
	const log = createRequestLogger(traceId, "google-oauth");

	logStep(log, "signInWithGoogleIdToken:start", { ip: clientIp });

	// Rate limiting: 10 requests per 15 minutes (more generous for OAuth)
	const headersList = await headers();
	const rateLimitResult = await rateLimitServerAction(headersList, {
		limit: 10,
		window: 15 * 60 * 1000, // 15 minutes
		prefix: "auth:oauth",
	});

	if (!rateLimitResult.success) {
		logStep(log, "signInWithGoogleIdToken:rate_limited", { ip: clientIp });
		return {
			error: rateLimitResult.error || "Too many login attempts. Please try again later.",
		};
	}

	const supabase = await createClient();
	const adminClient = createServiceRoleClient();

	const { data, error } = await supabase.auth.signInWithIdToken({
		provider: "google",
		token: idToken,
		nonce,
	});

	if (error) {
		logStepError(log, "signInWithGoogleIdToken:failed", error, {});

		// Audit: Record failed OAuth login
		if (adminClient) {
			await recordAudit(adminClient, {
				actorId: "unknown",
				targetId: null,
				entityType: "account",
				actionType: "login_failed",
				metadata: {
					ip: clientIp,
					userAgent,
					traceId,
					method: "google_oauth",
					reason: error.message,
				},
			});
		}

		return {
			error: error.message || "Failed to sign in with Google. Please try again.",
		};
	}

	if (!data.user) {
		logStep(log, "signInWithGoogleIdToken:no_user", {});
		return { error: "Unable to authenticate. Please try again." };
	}

	// Determine user role using repository pattern
	const metadataRole = data.user.user_metadata?.role as string | undefined;
	let role: string | null = metadataRole ?? null;

	if (!role) {
		const client = adminClient || supabase;
		try {
			role = await getProfileRole(client, data.user.id);
		} catch (profileError) {
			logStepError(log, "signInWithGoogleIdToken:profile_role_lookup_failed", profileError, {
				userId: data.user.id,
			});
		}
	}

	// Update last_login_at for tutors (churn tracking)
	const serviceClient = adminClient ?? createServiceRoleClient();
	if (serviceClient) {
		await updateLastLogin(serviceClient, data.user.id);
	}

	// Audit: Record successful OAuth login
	if (adminClient) {
		await recordAudit(adminClient, {
			actorId: data.user.id,
			targetId: data.user.id,
			entityType: "account",
			actionType: "login_success",
			metadata: {
				ip: clientIp,
				userAgent,
				traceId,
				method: "google_oauth",
				role: role ?? "unknown",
				email: data.user.email,
			},
		});
	}

	// Determine redirect destination based on role
	const destination =
		role === "student"
			? resolveStudentRedirect(redirectTarget ?? null)
			: resolveTutorRedirect(redirectTarget ?? null);

	logStep(log, "signInWithGoogleIdToken:success", {
		userId: data.user.id,
		role,
		destination,
	});

	revalidatePath("/", "layout");
	return { success: "Login successful", redirectTo: destination };
}
