// ============================================================================
// Auth Action State Types
// ============================================================================

/**
 * Standard return type for auth server actions.
 */
export type AuthActionState = {
	error?: string;
	success?: string;
	redirectTo?: string;
};

/**
 * Return type for email verification actions.
 */
export type EmailVerificationState = {
	error?: string;
	success?: string;
};

// ============================================================================
// Input Types
// ============================================================================

/**
 * Parsed sign-in form data.
 */
export interface SignInInput {
	readonly email: string;
	readonly password: string;
	readonly redirectTarget?: string | null;
}

/**
 * Parsed sign-up form data.
 */
export interface SignUpInput {
	readonly email: string;
	readonly password: string;
	readonly fullName: string;
	readonly username: string;
	readonly role: "tutor" | "student";
	readonly plan?: string | null;
	readonly redirectTarget?: string | null;
	readonly checkoutSessionId?: string | null;
	readonly lifetimeIntent?: boolean;
}

/**
 * Parsed password reset form data.
 */
export interface PasswordResetInput {
	readonly email: string;
}

/**
 * Parsed password update form data.
 */
export interface PasswordUpdateInput {
	readonly password: string;
	readonly confirmPassword: string;
}

// ============================================================================
// Constants
// ============================================================================

export const DASHBOARD_ROUTE = "/calendar";
export const ONBOARDING_ROUTE = "/onboarding";
export const STUDENT_HOME_ROUTE = "/student/search";
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
