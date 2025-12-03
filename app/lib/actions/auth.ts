"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import type { User } from "@supabase/supabase-js";
import { getFounderOfferLimit, getFounderPlanName } from "@/lib/pricing/founder";

const DASHBOARD_ROUTE = "/dashboard";

export type AuthActionState = {
  error?: string;
  success?: string;
};

export async function signUp(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const supabase = await createClient();

  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = (formData.get("password") as string) ?? "";
  const fullName = (formData.get("full_name") as string)?.trim();
  const username = (formData.get("username") as string)?.trim().toLowerCase();
  const role = (formData.get("role") as string) || "tutor";
  const planFromForm = (formData.get("plan") as string) || "";
  const founderPlan = getFounderPlanName();
  const desiredPlan = role === "tutor" ? planFromForm || founderPlan : planFromForm || "professional";

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

  const adminClient = createServiceRoleClient();
  const emailRedirectTo = `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/dashboard`;

  let existingUser: User | null = null;

  let usernameTaken = false;
  let founderSlotsRemaining: number | null = null;

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

      if (role === "tutor" && desiredPlan === founderPlan) {
        const { count, error: founderCountError } = await adminClient
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("plan", founderPlan);

        if (founderCountError && founderCountError.code !== "PGRST116") {
          console.error("[Auth] Failed to count founder slots", founderCountError);
        }

        if (typeof count === "number") {
          const limit = getFounderOfferLimit();
          founderSlotsRemaining = Math.max(limit - count, 0);
        }
      }
    } catch (error) {
      console.error("[Auth] Unexpected error while checking existing user", error);
    }
  }

  if (role === "tutor" && desiredPlan === founderPlan) {
    const limit = getFounderOfferLimit();
    const remaining = founderSlotsRemaining ?? limit;
    if (remaining <= 0) {
      return {
        error:
          "The 2-month free + lifetime founder offer has been fully claimed. Join the waitlist and we'll email you when new spots open.",
      };
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

  // If user has a pending lifetime purchase, use founder_lifetime plan
  const finalPlan = hasPendingLifetimePurchase ? founderPlan : (desiredPlan || "professional");

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
  redirect(DASHBOARD_ROUTE);
}

export async function signIn(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const supabase = await createClient();

  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = (formData.get("password") as string) ?? "";

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

  // Update last_login_at for tutors (for churn tracking)
  if (signInData?.user?.id) {
    const serviceClient = createServiceRoleClient();
    if (serviceClient) {
      await serviceClient
        .from("profiles")
        .update({ last_login_at: new Date().toISOString() })
        .eq("id", signInData.user.id)
        .eq("role", "tutor");
    }
  }

  revalidatePath("/", "layout");
  redirect(DASHBOARD_ROUTE);
}

export async function signOut() {
  const supabase = await createClient();

  // Supabase will now properly clear ALL cookie chunks via setAll
  await supabase.auth.signOut({ scope: "local" });

  revalidatePath("/", "layout");
  redirect("/");
}

type OAuthProvider = "google";

export async function signInWithOAuth(provider: OAuthProvider) {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
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
