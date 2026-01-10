"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { rateLimitServerAction } from "@/lib/middleware/rate-limit";
import { recordAudit } from "@/lib/repositories/audit";
import { isUsernameTaken, updateSignupCheckout } from "@/lib/repositories/profiles";
import {
	getLifetimePurchaseByEmail,
	insertLifetimePurchase,
	updateLifetimePurchase,
	getPendingLifetimePurchaseByEmail,
	claimLifetimePurchase,
} from "@/lib/repositories/lifetime-purchases";
import {
	getTraceId,
	createRequestLogger,
	logStep,
	logStepError,
} from "@/lib/logger";
import { ensureSignupCheckoutSession, resolveSignupPriceId } from "@/lib/services/signup-checkout";
import { stripe } from "@/lib/stripe";
import { createLifetimeCheckoutSession } from "@/lib/payments/lifetime-checkout";
import { getAppUrl } from "@/lib/auth/redirects";
import { normalizeSignupUsername } from "@/lib/utils/username-slug";
import { getTrialDays } from "@/lib/utils/stripe-config";
import type { User } from "@supabase/supabase-js";
import type { ServiceRoleClient } from "@/lib/supabase/admin";
import type { PlatformBillingPlan } from "@/lib/types/payments";
import type { AuthActionState, EmailVerificationState } from "./types";
import {
	ONBOARDING_ROUTE,
	EMAIL_PATTERN,
} from "./types";
import { getClientIp, getUserAgent } from "./helpers";
import { isStripeConfigured, buildAuthCallbackUrlFromHeaders } from "./utils";

// ============================================================================
// Types
// ============================================================================

interface LifetimeCheckoutData {
	stripeCustomerId: string | null;
	amountPaid: number | null;
	currency: string | null;
	source: string | null;
}

// ============================================================================
// Internal Helpers
// ============================================================================

/**
 * Start subscription checkout flow during signup.
 */
async function startSubscriptionCheckout(params: {
	user: User;
	plan: PlatformBillingPlan;
	fullName?: string | null;
	adminClient: ServiceRoleClient | null;
	traceId: string;
}): Promise<string | null> {
	const { user, plan, fullName, adminClient, traceId } = params;
	const log = createRequestLogger(traceId, user.id);

	logStep(log, "startSubscriptionCheckout:start", { plan, userId: user.id });

	// Skip checkout for free or lifetime flows
	if (
		plan === "professional" ||
		plan === "tutor_life" ||
		plan === "studio_life" ||
		plan === "founder_lifetime" ||
		plan === "all_access"
	) {
		logStep(log, "startSubscriptionCheckout:skip_free_lifetime", { plan });
		return null;
	}

	if (!isStripeConfigured()) {
		logStep(log, "startSubscriptionCheckout:stripe_not_configured", {});
		return null;
	}

	const priceId = resolveSignupPriceId(plan);

	if (!priceId) {
		logStep(log, "startSubscriptionCheckout:no_price_id", { plan });
		return null;
	}

	const trialPeriodDays = getTrialDays(plan);
	const appUrl = getAppUrl();
	const successUrl = `${appUrl}/signup/verify?session_id={CHECKOUT_SESSION_ID}`;
	const cancelUrl = `${appUrl}/signup?checkout=cancelled`;

	try {
		const checkoutUrl = await ensureSignupCheckoutSession({
			user,
			plan,
			priceId,
			trialPeriodDays,
			successUrl,
			cancelUrl,
			fullName,
			adminClient,
			context: "signup",
		});

		if (checkoutUrl) {
			logStep(log, "startSubscriptionCheckout:success", { checkoutUrl: "***" });
		}

		return checkoutUrl;
	} catch (error) {
		logStepError(log, "startSubscriptionCheckout:error", error, { plan });
		return null;
	}
}

// ============================================================================
// Sign Up
// ============================================================================

/**
 * Create a new user account.
 *
 * Security Measures:
 * - STRICT rate limiting: 3 requests per 15 minutes per IP (prevents bot signup)
 * - Audit logging: Records account_created with initial profile data
 * - Observability: Full traceId logging with IP tracking
 * - Repository pattern: Uses profile and lifetime purchase repositories
 *
 * @param _prevState - Previous form state (for React form actions)
 * @param formData - Form data containing email, password, full_name, username, etc.
 */
export async function signUp(
	_prevState: AuthActionState,
	formData: FormData
): Promise<AuthActionState> {
	const traceId = await getTraceId();
	const clientIp = await getClientIp();
	const userAgent = await getUserAgent();
	const headersList = await headers();

	const email = (formData.get("email") as string)?.trim().toLowerCase() ?? "";
	const passwordRaw = (formData.get("password") as string) ?? "";
	const password = passwordRaw.trim();
	const fullName = (formData.get("full_name") as string)?.trim() ?? "";
	const rawUsername = (formData.get("username") as string) ?? "";
	const username = normalizeSignupUsername(rawUsername);
	const role = (formData.get("role") as string) || "tutor";
	const termsAccepted = (() => {
		const value = (formData.get("terms_accepted") as string | null) ?? "";
		return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
	})();
	const tutorRecordingConsent = (() => {
		const value = (formData.get("tutor_recording_consent") as string | null) ?? "";
		return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
	})();
	const isTutorRole = role === "tutor";
	const planFromForm = (formData.get("plan") as string) || "";
	const lifetimeIntentRaw = (formData.get("lifetime") as string) || "";
	const lifetimeIntent = ["1", "true", "yes"].includes(lifetimeIntentRaw.trim().toLowerCase());
	const lifetimeSource = (formData.get("lifetime_source") as string) || "";
	const normalizedLifetimeSource = (() => {
		const candidate = lifetimeSource.trim();
		const allowedSources = new Set(["campaign_banner", "lifetime_landing_page"]);
		return allowedSources.has(candidate) ? candidate : "";
	})();
	const checkoutSessionIdRaw =
		(formData.get("checkout_session_id") as string | null) ??
		(formData.get("session_id") as string | null) ??
		"";
	const checkoutSessionId = checkoutSessionIdRaw.trim();

	const log = createRequestLogger(traceId, email);
	logStep(log, "signUp:start", { email, ip: clientIp, hasCheckoutSession: !!checkoutSessionId });

	// Resolve desired plan
	const desiredPlan: PlatformBillingPlan = ((): PlatformBillingPlan => {
		if (lifetimeIntent) return "tutor_life";
		const candidate = planFromForm.trim();
		const allowed: PlatformBillingPlan[] = [
			"professional",
			"pro_monthly",
			"pro_annual",
			"studio_monthly",
			"studio_annual",
			"tutor_life",
		];
		return (allowed as string[]).includes(candidate) ? (candidate as PlatformBillingPlan) : "professional";
	})();
	const lifetimePlan: PlatformBillingPlan = "tutor_life";

	// STRICT rate limiting: 3 requests per 15 minutes (prevents bot signup)
	const rateLimitResult = await rateLimitServerAction(headersList, {
		limit: 3,
		window: 15 * 60 * 1000, // 15 minutes
		prefix: "auth:signup",
	});

	if (!rateLimitResult.success) {
		logStep(log, "signUp:rate_limited", { ip: clientIp });
		return {
			error:
				rateLimitResult.error ??
				"Too many sign-up attempts right now. Please wait a moment and try again.",
		};
	}

	// Validate email
	if (!email || !EMAIL_PATTERN.test(email)) {
		logStep(log, "signUp:invalid_email", { email });
		return { error: "Please enter a valid email address." };
	}

	// Validate username
	if (!username) {
		logStep(log, "signUp:missing_username", {});
		return { error: "Please choose a username." };
	}

	const usernamePattern = /^[a-z0-9-]{3,32}$/;
	if (!usernamePattern.test(username)) {
		logStep(log, "signUp:invalid_username", { username });
		return {
			error:
				"Usernames must be 3-32 characters and can only include lowercase letters, numbers, or dashes.",
		};
	}

	// Validate password
	if (password.length < 8) {
		logStep(log, "signUp:password_too_short", {});
		return { error: "Passwords must be at least 8 characters long." };
	}

	const weakPasswords = new Set([
		"password",
		"password1",
		"password123",
		"qwerty",
		"qwerty123",
		"123456",
		"1234567",
		"12345678",
		"123456789",
		"iloveyou",
		"letmein",
		"welcome",
		"admin",
	]);

	const normalizedPassword = password.toLowerCase();
	if (weakPasswords.has(normalizedPassword.replace(/\s+/g, ""))) {
		logStep(log, "signUp:weak_password", {});
		return {
			error: "Please choose a stronger password with a mix of letters, numbers, and symbols.",
		};
	}

	if (isTutorRole && !termsAccepted) {
		logStep(log, "signUp:missing_terms_consent", { role });
		return { error: "Please accept the Terms of Service and Privacy Policy to continue." };
	}

	if (isTutorRole && !tutorRecordingConsent) {
		logStep(log, "signUp:missing_recording_consent", { role });
		return { error: "Please confirm the lesson recording consent to continue." };
	}

	const supabase = await createClient();
	const adminClient = createServiceRoleClient();
	const emailRedirectTo = buildAuthCallbackUrlFromHeaders(headersList, ONBOARDING_ROUTE);

	let existingUser: User | null = null;
	let usernameTaken = false;

	// Check for existing user and username availability using repository
	if (adminClient) {
		try {
			const { data, error: existingUserError } =
				await adminClient.auth.admin.listUsers();

			if (existingUserError) {
				const supabaseError = existingUserError as {
					status?: number;
					message?: string;
				};
				const status = supabaseError?.status;
				const message = supabaseError?.message ?? "";
				const isNotFound = /not\s+found/i.test(message);

				if (!isNotFound && status !== 404) {
					logStepError(log, "signUp:admin_lookup_error", existingUserError, { email });
				}
			}

			existingUser = data?.users?.find((user) => user.email === email) ?? null;

			if (!existingUser) {
				// Use repository function for username check
				usernameTaken = await isUsernameTaken(adminClient, username);
			}
		} catch (error) {
			logStepError(log, "signUp:user_check_error", error, { email });
		}
	}

	if (usernameTaken) {
		logStep(log, "signUp:username_taken", { username });
		return { error: "That username is already taken. Please choose another." };
	}

	if (existingUser) {
		// Return success-like message to prevent email enumeration
		logStep(log, "signUp:completed", { email });
		return {
			success: "Please check your email to complete registration.",
		};
	}

	// Check for verified lifetime checkout and pending lifetime purchase
	const lifetimeCheckoutPlans = new Set([
		"tutor_life",
		"founder_lifetime",
		"studio_life",
		"all_access",
	]);
	let hasVerifiedLifetimeCheckout = false;
	let lifetimeCheckoutData: LifetimeCheckoutData | null = null;

	if (checkoutSessionId && process.env.STRIPE_SECRET_KEY?.trim()) {
		try {
			const session = await stripe.checkout.sessions.retrieve(checkoutSessionId);
			const sessionPlan = session.metadata?.plan ?? null;
			const isLifetimePlan = sessionPlan ? lifetimeCheckoutPlans.has(sessionPlan) : false;
			const isPaid =
				session.payment_status === "paid" || session.payment_status === "no_payment_required";
			const isComplete = session.status === "complete";
			const isPaymentMode = session.mode === "payment";

			if (isLifetimePlan && isPaid && isComplete && isPaymentMode) {
				hasVerifiedLifetimeCheckout = true;
				lifetimeCheckoutData = {
					stripeCustomerId: typeof session.customer === "string" ? session.customer : null,
					amountPaid: session.amount_total ?? null,
					currency: session.currency ?? null,
					source: session.metadata?.source ?? null,
				};
				logStep(log, "signUp:lifetime_checkout_verified", { sessionPlan });
			}
		} catch (error) {
			logStepError(log, "signUp:checkout_verify_error", error, { checkoutSessionId });
		}
	}

	// Handle lifetime purchase record using repository
	let hasPendingLifetimePurchase = hasVerifiedLifetimeCheckout;
	if (adminClient) {
		if (hasVerifiedLifetimeCheckout && lifetimeCheckoutData) {
			const existingPurchase = await getLifetimePurchaseByEmail(adminClient, email);

			if (!existingPurchase) {
				try {
					await insertLifetimePurchase(adminClient, {
						email,
						stripe_session_id: checkoutSessionId,
						stripe_customer_id: lifetimeCheckoutData.stripeCustomerId,
						amount_paid: lifetimeCheckoutData.amountPaid,
						currency: lifetimeCheckoutData.currency,
						source: lifetimeCheckoutData.source ?? "checkout_redirect",
						purchased_at: new Date().toISOString(),
						claimed: false,
					});
					logStep(log, "signUp:lifetime_purchase_inserted", { email });
				} catch (error) {
					logStepError(log, "signUp:lifetime_purchase_insert_error", error, { email });
				}
			} else if (!existingPurchase.claimed) {
				try {
					await updateLifetimePurchase(adminClient, existingPurchase.id, {
						stripe_session_id: checkoutSessionId,
						stripe_customer_id: lifetimeCheckoutData.stripeCustomerId,
						amount_paid: lifetimeCheckoutData.amountPaid,
						currency: lifetimeCheckoutData.currency,
						source: lifetimeCheckoutData.source ?? "checkout_redirect",
					});
					logStep(log, "signUp:lifetime_purchase_updated", { email });
				} catch (error) {
					logStepError(log, "signUp:lifetime_purchase_update_error", error, { email });
				}
			}
		}

		// Check for pending lifetime purchase using repository
		const pendingPurchase = await getPendingLifetimePurchaseByEmail(adminClient, email);
		hasPendingLifetimePurchase = hasPendingLifetimePurchase || Boolean(pendingPurchase);
	}

	// Determine final plan
	const finalPlan: PlatformBillingPlan =
		hasPendingLifetimePurchase || lifetimeIntent ? lifetimePlan : desiredPlan;

	logStep(log, "signUp:plan_resolved", { desiredPlan, finalPlan, hasPendingLifetimePurchase });

	const consentTimestamp = new Date().toISOString();
	const tutorRecordingConsentFinal = isTutorRole && tutorRecordingConsent;
	const termsAcceptedAt = isTutorRole && termsAccepted ? consentTimestamp : null;
	const tutorRecordingConsentAt = tutorRecordingConsentFinal ? consentTimestamp : null;
	const userMetadata = {
		full_name: fullName,
		username,
		role,
		plan: finalPlan,
		terms_accepted_at: termsAcceptedAt,
		tutor_recording_consent: tutorRecordingConsentFinal,
		tutor_recording_consent_at: tutorRecordingConsentAt,
	};

	let createdUser: User | null = null;
	let hasSession = false;

	// Create user via admin API or fallback to regular signup
	if (adminClient) {
		const { data: adminCreated, error: adminCreateError } = await adminClient.auth.admin.createUser({
			email,
			password,
			email_confirm: true,
			user_metadata: userMetadata,
		});

		if (adminCreateError) {
			const message = adminCreateError.message ?? "We couldn't create your account.";
			const normalized = message.toLowerCase();

			if (normalized.includes("already registered")) {
				logStep(log, "signUp:already_registered", { email });
				return { error: "That email is already registered. Please log in instead." };
			}

			logStepError(log, "signUp:admin_create_error", adminCreateError, { email });
		} else {
			createdUser = adminCreated?.user ?? null;
		}
	}

	if (!createdUser) {
		const { data: signupData, error: signupError } = await supabase.auth.signUp({
			email,
			password,
			options: {
				data: userMetadata,
			},
		});

		if (signupError || !signupData.user) {
			const message = signupError?.message ?? "We couldn't create your account.";
			const normalized = message.toLowerCase();

			if (normalized.includes("already registered")) {
				logStep(log, "signUp:already_registered", { email });
				return { error: "That email is already registered. Please log in instead." };
			}

			if (normalized.includes("rate limit")) {
				logStep(log, "signUp:supabase_rate_limit", { email });
				return {
					error:
						"We're receiving too many sign-up attempts right now. Please wait 60 seconds and try again.",
				};
			}

			if (normalized.includes("password is known to be weak")) {
				logStep(log, "signUp:weak_password_supabase", { email });
				return {
					error: "Please choose a stronger password that isn't a common phrase or sequence.",
				};
			}

			logStepError(log, "signUp:signup_error", signupError, { email });
			return { error: message };
		}

		createdUser = signupData.user;
		hasSession = Boolean(signupData.session);

		// Confirm email via admin API if fallback was used
		if (createdUser && adminClient) {
			await adminClient.auth.admin.updateUserById(createdUser.id, {
				email_confirm: true,
			});
		}
	}

	if (!createdUser) {
		logStep(log, "signUp:no_user_created", { email });
		return { error: "We couldn't create your account. Please try again." };
	}

	// Claim lifetime purchase using repository
	if (hasPendingLifetimePurchase && adminClient) {
		try {
			await claimLifetimePurchase(adminClient, email, createdUser.id);
			logStep(log, "signUp:lifetime_claimed", { email, userId: createdUser.id });
		} catch (error) {
			logStepError(log, "signUp:lifetime_claim_error", error, { email });
		}
	}

	// Create session if not already created
	if (!hasSession) {
		let { error: signInError } = await supabase.auth.signInWithPassword({
			email,
			password,
		});

		if (signInError && adminClient) {
			const message = signInError.message?.toLowerCase() ?? "";
			if (message.includes("email not confirmed")) {
				await adminClient.auth.admin.updateUserById(createdUser.id, {
					email_confirm: true,
				});

				const retry = await supabase.auth.signInWithPassword({
					email,
					password,
				});

				signInError = retry.error ?? null;
			}
		}

		if (signInError) {
			logStepError(log, "signUp:signin_error", signInError, { email });
			return {
				error:
					"We created your account but couldn't sign you in yet. Please try logging in.",
			};
		}
	}

	// Audit: Record successful account creation
	if (adminClient) {
		await recordAudit(adminClient, {
			actorId: createdUser.id,
			targetId: createdUser.id,
			entityType: "account",
			actionType: "account_created",
			afterState: {
				email,
				username,
				role,
				plan: finalPlan,
				hasLifetimePurchase: hasPendingLifetimePurchase,
				termsAcceptedAt,
				tutorRecordingConsent: tutorRecordingConsentFinal,
				tutorRecordingConsentAt,
			},
			metadata: {
				ip: clientIp,
				userAgent,
				traceId,
				method: "password",
			},
		});
	}

	// Handle lifetime checkout if intent but no pending purchase
	if (lifetimeIntent && !hasPendingLifetimePurchase) {
		const appUrl = getAppUrl().replace(/\/$/, "");
		const checkoutResult = await createLifetimeCheckoutSession({
			successUrl: `${appUrl}/onboarding?checkout=success`,
			cancelUrl: `${appUrl}/signup?checkout=cancelled&lifetime=true`,
			userId: createdUser.id,
			customerEmail: email,
			source: normalizedLifetimeSource || "campaign_banner",
			acceptLanguage: headersList.get("accept-language"),
			flow: "signup",
		});

		if ("error" in checkoutResult) {
			logStepError(log, "signUp:lifetime_checkout_error", checkoutResult.error, { email });
			return { error: checkoutResult.error || "Unable to start lifetime checkout." };
		}

		if (!checkoutResult.session.url) {
			logStep(log, "signUp:no_checkout_url", { email });
			return { error: "Unable to start lifetime checkout. Please try again." };
		}

		// Update profile with checkout data using repository
		if (adminClient) {
			await updateSignupCheckout(adminClient, createdUser.id, {
				sessionId: checkoutResult.session.id,
				status: "open",
				plan: lifetimePlan,
				startedAt: new Date().toISOString(),
				expiresAt: checkoutResult.session.expiresAt,
			});
		}

		logStep(log, "signUp:lifetime_checkout_redirect", { email });
		return { success: "Account created", redirectTo: checkoutResult.session.url };
	}

	// Redirect to Stripe checkout if needed (paid plan)
	const checkoutUrl = await startSubscriptionCheckout({
		user: createdUser,
		plan: finalPlan,
		fullName,
		adminClient,
		traceId,
	});

	if (checkoutUrl) {
		logStep(log, "signUp:subscription_checkout_redirect", { email, plan: finalPlan });
		return { success: "Account created", redirectTo: checkoutUrl };
	}

	logStep(log, "signUp:success", { email, userId: createdUser.id, plan: finalPlan });

	revalidatePath("/", "layout");
	return { success: "Account created", redirectTo: ONBOARDING_ROUTE };
}

// ============================================================================
// Resend Signup Confirmation
// ============================================================================

/**
 * Resend signup confirmation email.
 *
 * Note: Email confirmation is no longer required - this returns a helpful message.
 *
 * Security Measures:
 * - Rate limiting: 3 requests per 10 minutes
 * - Observability: traceId logging
 *
 * @param _prevState - Previous form state (for React form actions)
 * @param formData - Form data containing email
 */
export async function resendSignupConfirmation(
	_prevState: EmailVerificationState,
	formData: FormData
): Promise<EmailVerificationState> {
	const traceId = await getTraceId();
	const clientIp = await getClientIp();
	const headersList = await headers();

	const email = (formData.get("email") as string | null)?.trim().toLowerCase() ?? "";
	const log = createRequestLogger(traceId, email);

	logStep(log, "resendSignupConfirmation:start", { email, ip: clientIp });

	const rateLimitResult = await rateLimitServerAction(headersList, {
		limit: 3,
		window: 10 * 60 * 1000, // 3 requests per 10 minutes
		prefix: "auth:resend-confirmation",
	});

	if (!rateLimitResult.success) {
		logStep(log, "resendSignupConfirmation:rate_limited", { ip: clientIp });
		return { error: rateLimitResult.error };
	}

	if (!email) {
		logStep(log, "resendSignupConfirmation:missing_email", {});
		return { error: "Please enter an email address." };
	}

	if (!EMAIL_PATTERN.test(email)) {
		logStep(log, "resendSignupConfirmation:invalid_email", { email });
		return { error: "Please enter a valid email address." };
	}

	logStep(log, "resendSignupConfirmation:success", { email });
	return { success: "Email confirmation is no longer required. Please sign in." };
}
