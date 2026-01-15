"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { rateLimitServerAction } from "@/lib/middleware/rate-limit";
import { recordAudit } from "@/lib/repositories/audit";
import { getProfileRole, updateLastLogin, getEmailByUsername } from "@/lib/repositories/profiles";
import {
	getTraceId,
	createRequestLogger,
	logStep,
	logStepError,
} from "@/lib/logger";
import { sanitizeRedirectPath } from "@/lib/auth/redirects";
import type { User } from "@supabase/supabase-js";
import { withTimeout, getClientIp, getUserAgent } from "./helpers";
import { resolveStudentRedirect, resolveTutorRedirect } from "./utils";
import type { AuthActionState } from "./types";
import { USERNAME_PATTERN, isEmailIdentifier } from "./types";

type AdminClient = NonNullable<ReturnType<typeof createServiceRoleClient>>;

const LIST_USERS_PER_PAGE = 200;
const MAX_LIST_USERS_PAGES = 10;

async function findUserByEmail(
	adminClient: AdminClient,
	email: string,
	log: ReturnType<typeof createRequestLogger>
): Promise<User | null> {
	for (let page = 1; page <= MAX_LIST_USERS_PAGES; page += 1) {
		const { data, error } = await withTimeout(
			adminClient.auth.admin.listUsers({ page, perPage: LIST_USERS_PER_PAGE }),
			2000,
			`Supabase admin listUsers page ${page}`
		);

		if (error) {
			const supabaseError = error as { message?: string; status?: number };
			const isNotFound = /not\s+found/i.test(supabaseError?.message ?? "");
			if (!isNotFound && supabaseError?.status !== 404) {
				logStepError(log, "signIn:admin_lookup_failed", error, { email, page });
			}
			break;
		}

		const existingUser = data?.users?.find(
			(user) => user.email?.toLowerCase() === email
		);
		if (existingUser) {
			return existingUser;
		}

		if (!data?.users || data.users.length < LIST_USERS_PER_PAGE) {
			break;
		}
	}

	return null;
}

// ============================================================================
// Sign In
// ============================================================================

/**
 * Sign in with email and password.
 *
 * Security Measures:
 * - Rate limiting: 5 requests per 15 minutes per IP
 * - Audit logging: Records login_success and login_failed events
 * - Observability: Full traceId logging with IP tracking
 * - Repository pattern: Uses getProfileRole for role lookup
 *
 * @param _prevState - Previous form state (for React form actions)
 * @param formData - Form data containing email, password, and optional redirect
 */
export async function signIn(
	_prevState: AuthActionState,
	formData: FormData
): Promise<AuthActionState> {
	const traceId = await getTraceId();
	const clientIp = await getClientIp();
	const userAgent = await getUserAgent();

	// Support both "identifier" (new) and "email" (legacy) field names
	const identifier = (
		(formData.get("identifier") as string) ??
		(formData.get("email") as string)
	)?.trim().toLowerCase() ?? "";
	const password = (formData.get("password") as string) ?? "";
	const redirectTarget = sanitizeRedirectPath(formData.get("redirect"));

	const log = createRequestLogger(traceId, identifier);
	logStep(log, "signIn:start", { identifier, ip: clientIp, hasRedirect: !!redirectTarget });

	// Rate limiting: 5 requests per 15 minutes
	const headersList = await headers();
	const rateLimitResult = await rateLimitServerAction(headersList, {
		limit: 5,
		window: 15 * 60 * 1000, // 15 minutes
		prefix: "auth:signin",
	});

	const adminClient = createServiceRoleClient();
	const auditActorId = identifier || "unknown";
	const recordLoginFailure = async (
		reason: string,
		metadata?: Record<string, unknown>
	) => {
		if (!adminClient) return;
		await recordAudit(adminClient, {
			actorId: auditActorId,
			targetId: null,
			entityType: "account",
			actionType: "login_failed",
			metadata: {
				ip: clientIp,
				userAgent,
				traceId,
				reason,
				...(metadata ?? {}),
			},
		});
	};

	if (!rateLimitResult.success) {
		logStep(log, "signIn:rate_limited", { identifier: auditActorId, ip: clientIp });
		await recordLoginFailure("rate_limited");

		return {
			error: rateLimitResult.error || "Too many login attempts. Please try again later.",
		};
	}

	// Validate identifier is not empty
	if (!identifier) {
		logStep(log, "signIn:empty_identifier", {});
		await recordLoginFailure("empty_identifier");
		return { error: "Please enter your email or username." };
	}

	// Resolve identifier to email
	let email: string;

	if (isEmailIdentifier(identifier)) {
		// Identifier is an email address
		email = identifier;
	} else if (USERNAME_PATTERN.test(identifier)) {
		// Identifier is a username - resolve to email
		logStep(log, "signIn:resolving_username", { username: identifier });

		if (!adminClient) {
			logStep(log, "signIn:admin_client_unavailable", {});
			await recordLoginFailure("admin_client_unavailable", { username: identifier });
			return { error: "Unable to verify credentials. Please try again." };
		}

		try {
			const resolvedEmail = await getEmailByUsername(adminClient, identifier);
			if (!resolvedEmail) {
				// Don't reveal whether username exists - use generic error
				logStep(log, "signIn:username_not_found", { username: identifier });
				await recordLoginFailure("username_not_found", { username: identifier });
				return { error: "Invalid credentials." };
			}
			email = resolvedEmail;
			logStep(log, "signIn:username_resolved", { username: identifier });
		} catch (resolveError) {
			logStepError(log, "signIn:username_resolve_error", resolveError, { username: identifier });
			await recordLoginFailure("username_resolve_error", { username: identifier });
			return { error: "Unable to verify credentials. Please try again." };
		}
	} else {
		// Invalid identifier format
		logStep(log, "signIn:invalid_identifier", { identifier });
		await recordLoginFailure("invalid_identifier", { identifier });
		return { error: "Please enter a valid email or username." };
	}

	const supabase = await createClient();
	let existingUser: User | null = null;

	// Check if user exists (for better error messages)
	if (adminClient && email) {
		try {
			existingUser = await findUserByEmail(adminClient, email, log);
		} catch (lookupError) {
			logStepError(log, "signIn:admin_lookup_error", lookupError, { email });
		}
	}

	// Attempt sign in
	let { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
		email,
		password,
	});

	// Handle unconfirmed email - auto-confirm and retry
	if (signInError) {
		const rawMessage = signInError.message ?? "";
		const message = rawMessage.toLowerCase();

		if (message.includes("email not confirmed") && adminClient && existingUser?.id) {
			logStep(log, "signIn:auto_confirm_email", { userId: existingUser.id });

			await adminClient.auth.admin.updateUserById(existingUser.id, {
				email_confirm: true,
			});

			const retry = await supabase.auth.signInWithPassword({
				email,
				password,
			});

			signInData = retry.data;
			signInError = retry.error;
		}
	}

	// Handle login failure
	if (signInError) {
		const rawMessage = signInError.message ?? "";
		const message = rawMessage.toLowerCase();

		logStep(log, "signIn:failed", { email, error: rawMessage });

		// Audit: Record failed login
		if (adminClient) {
			await recordAudit(adminClient, {
				actorId: email,
				targetId: null,
				entityType: "account",
				actionType: "login_failed",
				metadata: {
					ip: clientIp,
					userAgent,
					traceId,
					reason: "invalid_credentials",
					userExists: !!existingUser,
				},
			});
		}

		if (message.includes("invalid login credentials")) {
			return { error: "Invalid email or password." };
		}

		return { error: "Unable to sign in. Please try again or reset your password." };
	}

	// Get user role using repository pattern
	const metadataRole = (signInData?.user?.user_metadata as { role?: string } | null)?.role ?? null;
	let role: string | null = typeof metadataRole === "string" ? metadataRole : null;

	if (!role && signInData?.user?.id) {
		// Use repository function instead of direct Supabase call
		const client = adminClient || supabase;
		try {
			role = await getProfileRole(client, signInData.user.id);
		} catch (profileError) {
			logStepError(log, "signIn:profile_role_lookup_failed", profileError, {
				userId: signInData.user.id,
			});
		}
	}

	// Update last login timestamp for tutors (churn tracking)
	if (signInData?.user?.id) {
		const serviceClient = adminClient ?? createServiceRoleClient();
		if (serviceClient) {
			// Use repository function instead of direct Supabase call
			await updateLastLogin(serviceClient, signInData.user.id);
		}
	}

	// Audit: Record successful login
	if (adminClient && signInData?.user?.id) {
		await recordAudit(adminClient, {
			actorId: signInData.user.id,
			targetId: signInData.user.id,
			entityType: "account",
			actionType: "login_success",
			metadata: {
				ip: clientIp,
				userAgent,
				traceId,
				method: "password",
				role: role ?? "unknown",
			},
		});
	}

	const destination =
		role === "student"
			? resolveStudentRedirect(redirectTarget)
			: resolveTutorRedirect(redirectTarget);

	logStep(log, "signIn:success", {
		userId: signInData?.user?.id,
		role,
		destination,
	});

	revalidatePath("/", "layout");
	return { success: "Login successful", redirectTo: destination };
}

// ============================================================================
// Sign Out
// ============================================================================

/**
 * Sign out the current user.
 *
 * Clears all session cookies and redirects to home.
 */
export async function signOut(): Promise<void> {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	const traceId = await getTraceId();
	const log = createRequestLogger(traceId, user?.id ?? "unknown");
	logStep(log, "signOut:start", { userId: user?.id });

	// Supabase will properly clear ALL cookie chunks via setAll
	await supabase.auth.signOut({ scope: "local" });

	logStep(log, "signOut:success", { userId: user?.id });

	revalidatePath("/", "layout");
	redirect("/#page-top");
}

// ============================================================================
// Get Current User
// ============================================================================

/**
 * Get the currently authenticated user.
 *
 * @returns The current user or null if not authenticated
 */
export async function getCurrentUser() {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	return user;
}
