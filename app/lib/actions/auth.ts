"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { getOrCreateStripeCustomer, stripe } from "@/lib/stripe";
import type { ServiceRoleClient } from "@/lib/supabase/admin";
import type { User } from "@supabase/supabase-js";
import { rateLimitServerAction } from "@/lib/middleware/rate-limit";
import {
  buildAuthCallbackUrl,
  buildVerifyEmailUrl,
  getAppUrl,
  sanitizeRedirectPath,
  type UserRole,
} from "@/lib/auth/redirects";
import { normalizeSignupUsername } from "@/lib/utils/username-slug";
import { sendEmail } from "@/lib/email/send";
import { VerifyEmailEmail, VerifyEmailEmailText } from "@/emails/verify-email";
import type { PlatformBillingPlan } from "@/lib/types/payments";

const DASHBOARD_ROUTE = "/calendar";
const ONBOARDING_ROUTE = "/onboarding";
const STUDENT_HOME_ROUTE = "/student/search";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Check stripe config at runtime, not module load time
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

  const subject =
    params.role === "student"
      ? "Confirm your TutorLingua student email"
      : "Confirm your TutorLingua email";

  const html = VerifyEmailEmail({
    confirmUrl: actionLink,
    role: params.role,
  });
  const text = VerifyEmailEmailText({
    confirmUrl: actionLink,
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
  if (plan === "professional" || plan === "tutor_life" || plan === "studio_life" || plan === "founder_lifetime" || plan === "all_access") {
    console.log("[Auth] Skipping checkout - free/lifetime plan");
    return null;
  }

  if (!stripeConfigured) {
    console.warn("[Auth] Stripe is not configured; skipping checkout and continuing to onboarding.");
    console.log("[Auth] Current STRIPE_SECRET_KEY value:", process.env.STRIPE_SECRET_KEY ? "SET" : "NOT SET");
    return null;
  }

  const priceId =
    plan === "pro_monthly"
      ? process.env.STRIPE_PRO_MONTHLY_PRICE_ID?.trim()
      : plan === "pro_annual"
        ? process.env.STRIPE_PRO_ANNUAL_PRICE_ID?.trim()
        : plan === "studio_monthly"
          ? process.env.STRIPE_STUDIO_MONTHLY_PRICE_ID?.trim()
          : plan === "studio_annual"
            ? process.env.STRIPE_STUDIO_ANNUAL_PRICE_ID?.trim()
            : null;

  console.log("[Auth] Resolved priceId:", priceId);

  if (!priceId) {
    console.warn("[Auth] Missing Stripe price ID for plan", plan);
    console.log("[Auth] Available price IDs - PRO_MONTHLY:", process.env.STRIPE_PRO_MONTHLY_PRICE_ID ? "SET" : "NOT SET");
    return null;
  }

  const trialPeriodDays = plan.endsWith("_annual") ? 14 : 7;
  const appUrl = getAppUrl();
  const successUrl = `${appUrl}/onboarding?subscription=success`;
  const cancelUrl = `${appUrl}/signup?checkout=cancelled`;

  try {
    const customer = await getOrCreateStripeCustomer({
      userId: user.id,
      email: user.email ?? "",
      name: fullName ?? (user.user_metadata?.full_name as string | undefined),
      metadata: { profileId: user.id },
    });

    if (adminClient) {
      const { error: updateError } = await adminClient
        .from("profiles")
        .update({ stripe_customer_id: customer.id })
        .eq("id", user.id);

      if (updateError) {
        console.error("[Auth] Failed to sync stripe_customer_id during signup", updateError);
      }
    }

    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      mode: "subscription",
      payment_method_collection: "always",
      allow_promotion_codes: true,
      success_url: successUrl,
      cancel_url: cancelUrl,
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: trialPeriodDays,
      },
      metadata: {
        userId: user.id,
        plan,
      },
    });

    console.log("[Auth] Checkout session created, URL:", session.url);
    return session.url ?? null;
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
  const desiredPlan: PlatformBillingPlan = ((): PlatformBillingPlan => {
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
  const emailRedirectTo = buildAuthCallbackUrl(ONBOARDING_ROUTE);
  const verifyEmailRedirect = buildVerifyEmailUrl({
    role: "tutor",
    email,
    next: ONBOARDING_ROUTE,
  });

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
    if (existingUser.email_confirmed_at) {
      return {
        error: "That email is already registered. Please log in instead.",
      };
    }

    const fastSendResult = await sendFastVerificationEmail({
      email,
      role: role === "student" ? "student" : "tutor",
      emailRedirectTo,
    });

    if (!fastSendResult.success) {
      if (fastSendResult.error) {
        console.warn("[Auth] Fast verification email send failed", fastSendResult.error);
      }

      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo,
        },
      });

      if (resendError) {
        console.error("[Auth] Failed to resend confirmation email", resendError);
        return {
          error:
            "This email is already registered but not confirmed yet. We tried to finalize it—please try logging in again or contact support.",
        };
      }
    }

    return {
      success: "This email is already registered but still waiting for confirmation.",
      redirectTo: verifyEmailRedirect,
    };
  }

  // Check for pending lifetime purchase before signup
  let hasPendingLifetimePurchase = false;
  if (adminClient) {
    const { data: pendingPurchase } = await adminClient
      .from("lifetime_purchases")
      .select("id")
      .eq("email", email)
      .eq("claimed", false)
      .maybeSingle();

    hasPendingLifetimePurchase = Boolean(pendingPurchase);
  }

  // If user has a pending lifetime purchase, grant lifetime access on signup.
  const finalPlan: PlatformBillingPlan = hasPendingLifetimePurchase ? lifetimePlan : desiredPlan;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        username,
        role,
        plan: finalPlan,
      },
      emailRedirectTo,
    },
  });

  if (error) {
    const message = error.message ?? "We couldn't create your account.";
    const normalized = message.toLowerCase();

    if (normalized.includes("already registered")) {
      const fastSendResult = await sendFastVerificationEmail({
        email,
        role: role === "student" ? "student" : "tutor",
        emailRedirectTo,
      });

      if (!fastSendResult.success) {
        if (fastSendResult.error) {
          console.warn(
            "[Auth] Fast verification email send failed after signup error",
            fastSendResult.error
          );
        }

        const { error: resendError } = await supabase.auth.resend({
          type: "signup",
          email,
          options: {
            emailRedirectTo,
          },
        });

        if (resendError) {
          console.error("[Auth] Failed to resend confirmation email after signup error", resendError);
          return {
            error: "That email is already registered. Please confirm your email to continue.",
          };
        }
      }

      return {
        success: "This email is already registered. Please confirm your email to continue.",
        redirectTo: verifyEmailRedirect,
      };
    }

    if (normalized.includes("rate limit")) {
      if (adminClient) {
        try {
          const { data: adminCreated, error: adminCreateError } = await adminClient.auth.admin
            .createUser({
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
            console.error("[Auth] Fallback admin signup failed after rate limit", adminCreateError);
          } else if (adminCreated?.user) {
            if (hasPendingLifetimePurchase) {
              await adminClient
                .from("lifetime_purchases")
                .update({
                  claimed: true,
                  claimed_by: adminCreated.user.id,
                  claimed_at: new Date().toISOString(),
                })
                .eq("email", email)
                .eq("claimed", false);
            }

            const { data: fallbackSignInData, error: fallbackSignInError } = await supabase.auth
              .signInWithPassword({
                email,
                password,
              });

            if (fallbackSignInError) {
              console.error("[Auth] Fallback sign-in failed after admin signup", fallbackSignInError);
              return {
                success: "Account created. Please log in to continue.",
                redirectTo: "/login",
              };
            }

            revalidatePath("/", "layout");

            // Redirect to Stripe checkout if needed (paid plan)
            const checkoutUrl = await startSubscriptionCheckout({
              user: adminCreated.user,
              plan: finalPlan,
              fullName,
              adminClient,
            });

            if (checkoutUrl) {
              return { success: "Account created", redirectTo: checkoutUrl };
            }

            return { success: "Account created", redirectTo: ONBOARDING_ROUTE };
          }
        } catch (fallbackError) {
          console.error("[Auth] Unexpected fallback signup error after rate limit", fallbackError);
        }
      }

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

  // Mark lifetime purchase as claimed if applicable
  if (hasPendingLifetimePurchase && adminClient && data.user) {
    await adminClient
      .from("lifetime_purchases")
      .update({
        claimed: true,
        claimed_by: data.user.id,
        claimed_at: new Date().toISOString(),
      })
      .eq("email", email)
      .eq("claimed", false);

    console.log(`[Auth] Lifetime purchase claimed for ${email}`);
  }

  // Send fast verification email if no session (email not confirmed yet)
  if (!data.session && data.user) {
    const fastSendResult = await sendFastVerificationEmail({
      email,
      role: role === "student" ? "student" : "tutor",
      emailRedirectTo,
    });

    if (fastSendResult.success) {
      console.log(`[Auth] Fast verification email sent to ${email}`);
    } else if (fastSendResult.error) {
      console.warn(`[Auth] Fast verification email failed for ${email}:`, fastSendResult.error);
      // Don't fail signup - Supabase already sent its own email as fallback
    }
  }

  if (!data.session) {
    return {
      success: "Check your email to confirm your account.",
      redirectTo: verifyEmailRedirect,
    };
  }

  revalidatePath("/", "layout");

  // Redirect to Stripe checkout if needed (paid plan)
  // If we have a session, we must have a user
  if (data.user) {
    const checkoutUrl = await startSubscriptionCheckout({
      user: data.user,
      plan: finalPlan,
      fullName,
      adminClient,
    });

    if (checkoutUrl) {
      return { success: "Account created", redirectTo: checkoutUrl };
    }
  }

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

  if (existingUser && !existingUser.email_confirmed_at) {
    return {
      success: "Check your email to confirm your account.",
      redirectTo: buildVerifyEmailUrl({
        role: "tutor",
        email,
        next: ONBOARDING_ROUTE,
      }),
    };
  }

  const { data: signInData, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    const rawMessage = error.message ?? "";
    const message = rawMessage.toLowerCase();

    if (message.includes("email not confirmed")) {
      return {
        success: "Check your email to confirm your account.",
        redirectTo: buildVerifyEmailUrl({
          role: "tutor",
          email,
          next: ONBOARDING_ROUTE,
        }),
      };
    }

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
  const role = formData.get("role") === "student" ? "student" : "tutor";
  const nextPath =
    sanitizeRedirectPath(formData.get("next")) ??
    (role === "student" ? STUDENT_HOME_ROUTE : ONBOARDING_ROUTE);

  if (!email) {
    return { error: "Please enter an email address." };
  }

  if (!EMAIL_PATTERN.test(email)) {
    return { error: "Please enter a valid email address." };
  }

  const supabase = await createClient();
  const emailRedirectTo = buildAuthCallbackUrl(nextPath);

  const fastSendResult = await sendFastVerificationEmail({
    email,
    role,
    emailRedirectTo,
  });

  if (!fastSendResult.success) {
    if (fastSendResult.error) {
      console.warn("[Auth] Fast verification email send failed", fastSendResult.error);
    }

    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo,
      },
    });

    if (error) {
      console.error("[Auth] Failed to resend confirmation email", error);
      return {
        error: "We couldn't resend the confirmation email yet. Please try again in a minute.",
      };
    }
  }

  return { success: "Confirmation email sent. Please check your inbox." };
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
