/**
 * Auth Module - Barrel Export
 *
 * This module provides secure authentication functionality with:
 * - Rate limiting on all sensitive operations
 * - Audit logging for compliance (GDPR/SOC2)
 * - Structured observability with traceId
 * - Repository pattern for database operations
 *
 * @module lib/actions/auth
 */

// Types
export type { AuthActionState, EmailVerificationState } from "./types";
export {
	DASHBOARD_ROUTE,
	ONBOARDING_ROUTE,
	STUDENT_HOME_ROUTE,
	EMAIL_PATTERN,
} from "./types";

// Session Management
export { signIn, signOut, getCurrentUser } from "./session";

// Registration (signup with strict rate limiting + audit)
export { signUp, resendSignupConfirmation } from "./registration";

// Password Management (CRITICAL security operations)
export { resetPassword, updatePassword } from "./password";

// OAuth Flows
export { signInWithOAuth, signInWithGoogleIdToken } from "./oauth";

// Utilities (sync functions)
export {
	isStripeConfigured,
	isStudentPath,
	resolveStudentRedirect,
	resolveTutorRedirect,
	resolveAuthCallbackBase,
	buildAuthCallbackUrlFromHeaders,
	convertToProxyVerifyUrl,
} from "./utils";

// Helpers (async server actions)
export {
	withTimeout,
	getClientIp,
	getUserAgent,
	sendFastVerificationEmail,
} from "./helpers";
