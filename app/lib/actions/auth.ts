"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { ensureSignupCheckoutSession, resolveSignupPriceId } from "@/lib/services/signup-checkout";
import type { ServiceRoleClient } from "@/lib/supabase/admin";
import type { User } from "@supabase/supabase-js";
import { rateLimitServerAction } from "@/lib/middleware/rate-limit";
import { stripe } from "@/lib/stripe";
import { createLifetimeCheckoutSession } from "@/lib/payments/lifetime-checkout";
import {
  getAppUrl,
  sanitizeRedirectPath,
  type UserRole,
} from "@/lib/auth/redirects";
import { normalizeSignupUsername } from "@/lib/utils/username-slug";
import { sendEmail } from "@/lib/email/send";
import { VerifyEmailEmail, VerifyEmailEmailText } from "@/emails/verify-email";
import type { PlatformBillingPlan } from "@/lib/types/payments";
import { getTrialDays } from "@/lib/utils/stripe-config";

const DASHBOARD_ROUTE = "/calendar";
const ONBOARDING_ROUTE = "/onboarding";
const STUDENT_HOME_ROUTE = "/student/search";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Only require the secret key here; price IDs are validated separately.
function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

function isStudentPath(path: string) {
  return path === "/" || path.startsWith("/student") || path.startsWith("/book/");
}

function resolveStudentRedirect(target: string | null) {
  if (target && isStudentPath(target)) {
    return target;
  }
  return STUDENT_HOME_ROUTE;
}

function resolveTutorRedirect(target: string | null) {
  return target || DASHBOARD_ROUTE;
}

function resolveAuthCallbackBase(headersList: Headers): string {
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

function buildAuthCallbackUrlFromHeaders(headersList: Headers, nextPath: string) {
  const baseUrl = resolveAuthCallbackBase(headersList);
  const url = new URL("/auth/callback", baseUrl);
  url.searchParams.set("next", nextPath);
  return url.toString();
}

/**
 * Converts a raw Supabase verification URL to our proxy URL.
 * This makes email links more trustworthy by showing our domain.
 *
 * Input:  https://[project].supabase.co/auth/v1/verify?token=xxx&type=magiclink&redirect_to=...
 * Output: https://tutorlingua.co/api/auth/verify?token=xxx&type=magiclink&redirect_to=...
 */
function convertToProxyVerifyUrl(supabaseUrl: string): string {
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

async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
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

async function sendFastVerificationEmail(params: {
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
  // From: https://[project].supabase.co/auth/v1/verify?token=...
  // To:   https://tutorlingua.co/api/auth/verify?token=...
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

async function startSubscriptionCheckout(params: {
  user: User;
  plan: PlatformBillingPlan;
  fullName?: string | null;
  adminClient: ServiceRoleClient | null;
}): Promise<string | null> {
  const { user, plan, fullName, adminClient } = params;

  // Debug: Log the plan and stripe configuration
  const stripeConfigured = isStripeConfigured();
  console.log("[Auth] startSubscriptionCheckout called with plan:", plan);
  console.log("[Auth] stripeConfigured:", stripeConfigured);
  console.log("[Auth] STRIPE_SECRET_KEY exists:", Boolean(process.env.STRIPE_SECRET_KEY));

  // Skip checkout for free or lifetime flows
  if (
    plan === "professional" ||
    plan === "tutor_life" ||
    plan === "studio_life" ||
    plan === "founder_lifetime" ||
    plan === "all_access"
  ) {
    console.log("[Auth] Skipping checkout - free/lifetime plan");
    return null;
  }

  if (!stripeConfigured) {
    console.warn("[Auth] Stripe is not configured; skipping checkout and continuing to onboarding.");
    console.log("[Auth] Current STRIPE_SECRET_KEY value:", process.env.STRIPE_SECRET_KEY ? "SET" : "NOT SET");
    return null;
  }

  const priceId = resolveSignupPriceId(plan);

  console.log("[Auth] Resolved priceId:", priceId);

  if (!priceId) {
    console.warn("[Auth] Missing Stripe price ID for plan", plan);
    console.log("[Auth] Available price IDs - PRO_MONTHLY:", process.env.STRIPE_PRO_MONTHLY_PRICE_ID ? "SET" : "NOT SET");
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
      console.log("[Auth] Checkout session ready, URL:", checkoutUrl);
    }

    return checkoutUrl;
  } catch (error) {
    console.error("[Auth] Failed to start signup checkout", error);
    console.error("[Auth] Error details:", JSON.stringify(error, null, 2));
    return null;
  }
}

export type AuthActionState = {
  error?: string;
  success?: string;
  redirectTo?: string;
};

export type EmailVerificationState = {
  error?: string;
  success?: string;
};

export async function signUp(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const headersList = await headers();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const passwordRaw = (formData.get("password") as string) ?? "";
  const password = passwordRaw.trim();
  const fullName = (formData.get("full_name") as string)?.trim();
  const rawUsername = (formData.get("username") as string) ?? "";
  const username = normalizeSignupUsername(rawUsername);
  const role = (formData.get("role") as string) || "tutor";
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
  const desiredPlan: PlatformBillingPlan = ((): PlatformBillingPlan => {
    if (lifetimeIntent) return "tutor_life";
    const candidate = planFromForm.trim();
    const allowed: PlatformBillingPlan[] = [
      "professional",
      "pro_monthly",
      "pro_annual",
      "studio_monthly",
      "studio_annual",
      // Note: lifetime access is normally granted after purchase, but keep the type safe.
      "tutor_life",
    ];
    return (allowed as string[]).includes(candidate) ? (candidate as PlatformBillingPlan) : "professional";
  })();
  const lifetimePlan: PlatformBillingPlan = "tutor_life";

  const rateLimitResult = await rateLimitServerAction(headersList, {
    limit: 5,
    window: 60 * 1000, // 5 attempts per minute
    prefix: "signup",
  });

  if (!rateLimitResult.success) {
    return {
      error:
        rateLimitResult.error ??
        "Too many sign-up attempts right now. Please wait a moment and try again.",
    };
  }

  if (!email) {
    return { error: "Please enter an email address." };
  }

  if (!username) {
    return { error: "Please choose a username." };
  }

  const usernamePattern = /^[a-z0-9-]{3,32}$/;
  if (!usernamePattern.test(username)) {
    return {
      error:
        "Usernames must be 3-32 characters and can only include lowercase letters, numbers, or dashes.",
    };
  }

  if (password.length < 8) {
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
    return {
      error: "Please choose a stronger password with a mix of letters, numbers, and symbols.",
    };
  }

  const supabase = await createClient();
  const adminClient = createServiceRoleClient();
  const emailRedirectTo = buildAuthCallbackUrlFromHeaders(headersList, ONBOARDING_ROUTE);

  let existingUser: User | null = null;

  let usernameTaken = false;

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
          console.error("[Auth] Failed to check existing user", existingUserError);
        }
      }

      existingUser = data?.users?.find(user => user.email === email) ?? null;

      if (!existingUser) {
        const { data: usernameMatch, error: usernameError } = await adminClient
          .from("profiles")
          .select("id")
          .eq("username", username)
          .maybeSingle();

        if (usernameError && usernameError.code !== "PGRST116") {
          console.error("[Auth] Failed to check username availability", usernameError);
        }

        usernameTaken = Boolean(usernameMatch);
      }

    } catch (error) {
      console.error("[Auth] Unexpected error while checking existing user", error);
    }
  }

  if (usernameTaken) {
    return { error: "That username is already taken. Please choose another." };
  }

  if (existingUser) {
    return {
      error: "That email is already registered. Please log in instead.",
    };
  }

  const lifetimeCheckoutPlans = new Set([
    "tutor_life",
    "founder_lifetime",
    "studio_life",
    "all_access",
  ]);
  let hasVerifiedLifetimeCheckout = false;
  let lifetimeCheckoutData: {
    stripeCustomerId?: string | null;
    amountPaid?: number | null;
    currency?: string | null;
    source?: string | null;
  } | null = null;

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
      }
    } catch (error) {
      console.error("[Auth] Failed to verify lifetime checkout session", error);
    }
  }

  // Check for pending lifetime purchase before signup
  let hasPendingLifetimePurchase = hasVerifiedLifetimeCheckout;
  if (adminClient) {
    if (hasVerifiedLifetimeCheckout && lifetimeCheckoutData) {
      const { data: existingPurchase } = await adminClient
        .from("lifetime_purchases")
        .select("id, claimed")
        .eq("email", email)
        .maybeSingle();

      if (!existingPurchase) {
        const { error: insertError } = await adminClient
          .from("lifetime_purchases")
          .insert({
            email,
            stripe_session_id: checkoutSessionId,
            stripe_customer_id: lifetimeCheckoutData.stripeCustomerId,
            amount_paid: lifetimeCheckoutData.amountPaid,
            currency: lifetimeCheckoutData.currency,
            source: lifetimeCheckoutData.source ?? "checkout_redirect",
            purchased_at: new Date().toISOString(),
            claimed: false,
          });

        if (insertError) {
          console.error("[Auth] Failed to record lifetime purchase", insertError);
        }
      } else if (!existingPurchase.claimed) {
        const { error: updateError } = await adminClient
          .from("lifetime_purchases")
          .update({
            stripe_session_id: checkoutSessionId,
            stripe_customer_id: lifetimeCheckoutData.stripeCustomerId,
            amount_paid: lifetimeCheckoutData.amountPaid,
            currency: lifetimeCheckoutData.currency,
            source: lifetimeCheckoutData.source ?? "checkout_redirect",
          })
          .eq("id", existingPurchase.id);

        if (updateError) {
          console.error("[Auth] Failed to update lifetime purchase", updateError);
        }
      }
    }

    const { data: pendingPurchase } = await adminClient
      .from("lifetime_purchases")
      .select("id")
      .eq("email", email)
      .eq("claimed", false)
      .maybeSingle();

    hasPendingLifetimePurchase = hasPendingLifetimePurchase || Boolean(pendingPurchase);
  }

  // If user has a pending lifetime purchase, grant lifetime access on signup.
  const finalPlan: PlatformBillingPlan =
    hasPendingLifetimePurchase || lifetimeIntent ? lifetimePlan : desiredPlan;

  let createdUser: User | null = null;
  let hasSession = false;

  if (adminClient) {
    const { data: adminCreated, error: adminCreateError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        username,
        role,
        plan: finalPlan,
      },
    });

    if (adminCreateError) {
      const message = adminCreateError.message ?? "We couldn't create your account.";
      const normalized = message.toLowerCase();

      if (normalized.includes("already registered")) {
        return { error: "That email is already registered. Please log in instead." };
      }

      console.error("[Auth] Admin signup failed", adminCreateError);
    } else {
      createdUser = adminCreated?.user ?? null;
    }
  }

  if (!createdUser) {
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          username,
          role,
          plan: finalPlan,
        },
        // emailRedirectTo removed - prevents Supabase from sending verification email
      },
    });

    if (signupError || !signupData.user) {
      const message = signupError?.message ?? "We couldn't create your account.";
      const normalized = message.toLowerCase();

      if (normalized.includes("already registered")) {
        return { error: "That email is already registered. Please log in instead." };
      }

      if (normalized.includes("rate limit")) {
        return {
          error:
            "We’re receiving too many sign-up attempts right now. Please wait 60 seconds and try again.",
        };
      }

      if (normalized.includes("password is known to be weak")) {
        return {
          error: "Please choose a stronger password that isn’t a common phrase or sequence.",
        };
      }

      return { error: message };
    }

    createdUser = signupData.user;
    hasSession = Boolean(signupData.session);

    // Confirm email via admin API if fallback was used (prevents verification email)
    if (createdUser && adminClient) {
      await adminClient.auth.admin.updateUserById(createdUser.id, {
        email_confirm: true,
      });
    }
  }

  if (!createdUser) {
    return { error: "We couldn't create your account. Please try again." };
  }

  // Mark lifetime purchase as claimed if applicable
  if (hasPendingLifetimePurchase && adminClient) {
    await adminClient
      .from("lifetime_purchases")
      .update({
        claimed: true,
        claimed_by: createdUser.id,
        claimed_at: new Date().toISOString(),
      })
      .eq("email", email)
      .eq("claimed", false);

    console.log(`[Auth] Lifetime purchase claimed for ${email}`);
  }

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
      console.error("[Auth] Failed to sign in after signup", signInError);
      return {
        error:
          "We created your account but couldn't sign you in yet. Please try logging in.",
      };
    }
  }

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
      return { error: checkoutResult.error || "Unable to start lifetime checkout." };
    }

    if (!checkoutResult.session.url) {
      return { error: "Unable to start lifetime checkout. Please try again." };
    }

    if (adminClient) {
      await adminClient
        .from("profiles")
        .update({
          signup_checkout_session_id: checkoutResult.session.id,
          signup_checkout_status: "open",
          signup_checkout_plan: lifetimePlan,
          signup_checkout_started_at: new Date().toISOString(),
          signup_checkout_expires_at: checkoutResult.session.expiresAt,
        })
        .eq("id", createdUser.id);
    }

    return { success: "Account created", redirectTo: checkoutResult.session.url };
  }

  // Redirect to Stripe checkout if needed (paid plan)
  const checkoutUrl = await startSubscriptionCheckout({
    user: createdUser,
    plan: finalPlan,
    fullName,
    adminClient,
  });

  if (checkoutUrl) {
    return { success: "Account created", redirectTo: checkoutUrl };
  }

  revalidatePath("/", "layout");

  return { success: "Account created", redirectTo: ONBOARDING_ROUTE };
}

export async function signIn(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const supabase = await createClient();

  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = (formData.get("password") as string) ?? "";
  const redirectTarget = sanitizeRedirectPath(formData.get("redirect"));

  const adminClient = createServiceRoleClient();
  let existingUser: User | null = null;

  if (adminClient && email) {
    try {
        const { data, error: adminError } = await withTimeout(
          adminClient.auth.admin.listUsers(),
          2000,
          "Supabase admin listUsers"
        );

      if (adminError) {
        const supabaseError = adminError as { message?: string; status?: number };
        const isNotFound = /not\s+found/i.test(supabaseError?.message ?? "");
        if (!isNotFound && supabaseError?.status !== 404) {
          console.error("[Auth] Admin lookup failed during sign-in", adminError);
        }
      }

      existingUser = data?.users?.find(user => user.email === email) ?? null;
    } catch (lookupError) {
      console.error("[Auth] Unexpected admin lookup error during sign-in", lookupError);
    }
  }

  let { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    const rawMessage = signInError.message ?? "";
    const message = rawMessage.toLowerCase();

    if (message.includes("email not confirmed") && adminClient && existingUser?.id) {
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

  if (signInError) {
    const rawMessage = signInError.message ?? "";
    const message = rawMessage.toLowerCase();

    if (message.includes("invalid login credentials")) {
      if (existingUser) {
        return {
          error:
            "That email and password don’t match. If you’ve forgotten your password, use the reset link or create a new one.",
        };
      }

      return {
        error: "That email and password don’t match. Double-check your details or reset your password.",
      };
    }

    return {
      error:
        rawMessage ||
        "We couldn’t log you in just yet. Try again in a moment or reset your password.",
    };
  }

  // Note: We don't verify the session here because signInWithPassword() already
  // handles session creation. Calling getSession() immediately after can fail
  // due to a race condition where cookies haven't been flushed yet.

  const metadataRole =
    (signInData?.user?.user_metadata as { role?: string } | null)?.role ?? null;
  let role: string | null = typeof metadataRole === "string" ? metadataRole : null;

  if (!role && adminClient && signInData?.user?.id) {
    const { data: profile } = await adminClient
      .from("profiles")
      .select("role")
      .eq("id", signInData.user.id)
      .single();

    role = (profile?.role as string | null) ?? null;
  }

  if (!role && signInData?.user?.id) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", signInData.user.id)
      .single();

    role = (profile?.role as string | null) ?? null;
  }

  // Update last_login_at for tutors (for churn tracking)
  if (signInData?.user?.id) {
    const serviceClient = adminClient ?? createServiceRoleClient();
    if (serviceClient) {
      await serviceClient
        .from("profiles")
        .update({ last_login_at: new Date().toISOString() })
        .eq("id", signInData.user.id)
        .eq("role", "tutor");
    }
  }

  const destination =
    role === "student"
      ? resolveStudentRedirect(redirectTarget)
      : resolveTutorRedirect(redirectTarget);

  revalidatePath("/", "layout");
  return { success: "Login successful", redirectTo: destination };
}

export async function resendSignupConfirmation(
  _prevState: EmailVerificationState,
  formData: FormData
): Promise<EmailVerificationState> {
  const headersList = await headers();
  const rateLimitResult = await rateLimitServerAction(headersList, {
    limit: 3,
    window: 10 * 60 * 1000, // 3 requests per 10 minutes
    prefix: "resend-confirmation",
  });

  if (!rateLimitResult.success) {
    return { error: rateLimitResult.error };
  }

  const email = (formData.get("email") as string | null)?.trim().toLowerCase() ?? "";
  if (!email) {
    return { error: "Please enter an email address." };
  }

  if (!EMAIL_PATTERN.test(email)) {
    return { error: "Please enter a valid email address." };
  }

  return { success: "Email confirmation is no longer required. Please sign in." };
}

export async function signOut() {
  const supabase = await createClient();

  // Supabase will now properly clear ALL cookie chunks via setAll
  await supabase.auth.signOut({ scope: "local" });

  revalidatePath("/", "layout");
  redirect("/");
}

type OAuthProvider = "google";

export async function signInWithOAuth(provider: OAuthProvider, redirectTarget?: string) {
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
    return { error: error.message };
  }

  if (data.url) {
    redirect(data.url);
  }
}

/**
 * Sign in with a Google ID token obtained from Google Identity Services.
 * This avoids redirecting through Supabase's domain during OAuth.
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
  const supabase = await createClient();
  const adminClient = createServiceRoleClient();

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: "google",
    token: idToken,
    nonce,
  });

  if (error) {
    console.error("[Auth] signInWithIdToken failed:", error);
    return {
      error: error.message || "Failed to sign in with Google. Please try again.",
    };
  }

  if (!data.user) {
    return { error: "Unable to authenticate. Please try again." };
  }

  // Determine user role from metadata or profile
  const metadataRole = data.user.user_metadata?.role as string | undefined;
  let role: string | null = metadataRole ?? null;

  if (!role && adminClient) {
    const { data: profile } = await adminClient
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    role = (profile?.role as string | null) ?? null;
  }

  if (!role) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    role = (profile?.role as string | null) ?? null;
  }

  // Update last_login_at for tutors (for churn tracking)
  const serviceClient = adminClient ?? createServiceRoleClient();
  if (serviceClient) {
    await serviceClient
      .from("profiles")
      .update({ last_login_at: new Date().toISOString() })
      .eq("id", data.user.id)
      .eq("role", "tutor");
  }

  // Determine redirect destination based on role
  const destination =
    role === "student"
      ? resolveStudentRedirect(redirectTarget ?? null)
      : resolveTutorRedirect(redirectTarget ?? null);

  revalidatePath("/", "layout");
  return { success: "Login successful", redirectTo: destination };
}

export async function resetPassword(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const supabase = await createClient();
  const email = (formData.get("email") as string)?.trim().toLowerCase();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: "Password reset email sent. Please check your inbox." };
}

export async function updatePassword(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const supabase = await createClient();
  const password = (formData.get("password") as string) ?? "";
  const confirmPassword = (formData.get("confirm_password") as string) ?? "";

  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect(DASHBOARD_ROUTE);
}

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
