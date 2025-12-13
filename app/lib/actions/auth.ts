"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import type { User } from "@supabase/supabase-js";
import { rateLimitServerAction } from "@/lib/middleware/rate-limit";
import type { PlatformBillingPlan } from "@/lib/types/payments";

const DASHBOARD_ROUTE = "/calendar";
const STUDENT_HOME_ROUTE = "/student/search";

function sanitizeRedirectPath(path: FormDataEntryValue | null): string | null {
  if (typeof path !== "string") return null;
  const trimmed = path.trim();

  // Require a relative path on this domain
  if (!trimmed.startsWith("/")) return null;
  if (trimmed.startsWith("//")) return null;
  if (trimmed.includes("://")) return null;

  return trimmed || null;
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

export type AuthActionState = {
  error?: string;
  success?: string;
  redirectTo?: string;
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
  const username = (formData.get("username") as string)?.trim().toLowerCase();
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
  const emailRedirectTo = `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/dashboard`;

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
          "This email is already registered but not confirmed yet. We couldn't resend the confirmation email—please try again shortly.",
      };
    }

    return {
      success:
        "This email is already registered but still waiting for confirmation. We just sent you a fresh confirmation email—check your inbox.",
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
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo,
        },
      });

      if (!resendError) {
        return {
          success:
            "This email is already registered but still waiting for confirmation. We just sent you a fresh confirmation email—check your inbox.",
        };
      }

      console.error("[Auth] Failed to resend confirmation email after signup error", resendError);
      return {
        error:
          "That email is already registered. Please log in instead, or request another confirmation email.",
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

            const { error: fallbackSignInError } = await supabase.auth.signInWithPassword({
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
            return { success: "Account created", redirectTo: DASHBOARD_ROUTE };
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

  if (!data.session) {
    return {
      success:
        "Check your email to confirm your account. Once confirmed, come back here and log in.",
    };
  }

  revalidatePath("/", "layout");
  return { success: "Account created", redirectTo: DASHBOARD_ROUTE };
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
      const { data, error: adminError } = await adminClient.auth.admin.listUsers();

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
    const emailRedirectTo = `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/dashboard`;

    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo,
      },
    });

    if (resendError) {
      console.error("[Auth] Failed to resend confirmation email during sign-in", resendError);
      return {
        error:
          "Your account is almost ready, but we couldn’t resend the confirmation email. Try again in a moment or contact hello@tutorlingua.co.",
      };
    }

    return {
      success:
        "We just sent a new confirmation email. Please confirm your TutorLingua account before logging in.",
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
        error:
          "Please confirm your email before logging in. Check your inbox for the TutorLingua confirmation link.",
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
  const callbackUrl = new URL("/auth/callback", process.env.NEXT_PUBLIC_APP_URL);
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
