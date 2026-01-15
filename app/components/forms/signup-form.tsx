"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signUp } from "@/lib/actions/auth";
import { FormStatusAlert } from "@/components/forms/form-status-alert";
import { PasswordInput } from "@/components/forms/password-input";
import { useAuthForm } from "@/components/forms/use-auth-form";
import { useAvailabilityCheck, type AvailabilityStatus } from "@/lib/hooks/useAvailabilityCheck";
import { normalizeSignupUsername } from "@/lib/utils/username-slug";
const USERNAME_PATTERN = /^[a-z0-9-]{3,32}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const prepareEmailValue = (value: string) => value.trim().toLowerCase();
const prepareUsernameValue = (value: string) => value.trim();
const shouldCheckEmail = (value: string) => value.length > 0;
const shouldCheckUsername = (value: string) => value.length >= 3;

const validateEmailValue = (value: string) =>
  EMAIL_PATTERN.test(value)
    ? null
    : { status: "invalid" as const, message: "Please enter a valid email address." };

const validateUsernameValue = (value: string) =>
  USERNAME_PATTERN.test(value)
    ? null
    : {
        status: "invalid" as const,
        message:
          "Usernames must be 3-32 characters and can only include lowercase letters, numbers, or dashes.",
      };

async function checkEmailAvailability(email: string) {
  const response = await fetch(`/api/email/check?email=${encodeURIComponent(email)}`, {
    method: "GET",
    cache: "no-store",
  });

  const payload: {
    exists?: boolean;
    status?: string;
    username?: string;
    message?: string;
  } | null = await response.json().catch(() => null);

  if (!response.ok) {
    return {
      status: (payload?.status === "invalid" ? "invalid" : "error") as AvailabilityStatus,
      message: payload?.message ?? "Unable to verify email.",
      data: null,
    };
  }

  if (payload?.exists) {
    return {
      status: "taken" as const,
      message: payload.message ?? "This email is already registered.",
      data: payload.username ?? null,
    };
  }

  return { status: "available" as const, message: "", data: null };
}

async function checkUsernameAvailability(value: string) {
  const response = await fetch(`/api/username/check?username=${encodeURIComponent(value)}`, {
    method: "GET",
    cache: "no-store",
  });

  const payload: {
    available?: boolean;
    status?: AvailabilityStatus | "invalid" | "error";
    message?: string;
  } | null = await response.json().catch(() => null);

  if (!response.ok) {
    const status = (payload?.status === "invalid" ? "invalid" : "error") as AvailabilityStatus;
    return {
      status,
      message:
        payload?.message ??
        (status === "invalid"
          ? "Usernames must be 3-32 characters using lowercase letters, numbers, or dashes."
          : "We couldn't verify that username. Please try again."),
      data: null,
    };
  }

  return {
    status: (payload?.available ? "available" : "taken") as AvailabilityStatus,
    message: payload?.available
      ? `Great choice! @${value} is available.`
      : "That username is already taken. Try another.",
    data: null,
  };
}

type PlanTier = "pro" | "studio";
type BillingCycle = "monthly" | "annual";

type SignupFormProps = {
  tier?: PlanTier;
  billingCycle?: BillingCycle;
  checkoutSessionId?: string;
  lifetimeIntent?: boolean;
  lifetimeSource?: string;
};

export function SignupForm({
  tier = "pro",
  billingCycle = "monthly",
  checkoutSessionId,
  lifetimeIntent,
  lifetimeSource,
}: SignupFormProps) {
  const [state, formAction, isPending] = useAuthForm(signUp);
  const [isShaking, setIsShaking] = useState(false);
  const router = useRouter();

  // Handle success redirect (immediate)
  useEffect(() => {
    if (state?.redirectTo) {
      router.replace(state.redirectTo);
    }
  }, [state?.redirectTo, router]);

  // Trigger shake on error
  useEffect(() => {
    if (state?.error) {
      setIsShaking(true);
      const timer = setTimeout(() => setIsShaking(false), 500);
      return () => clearTimeout(timer);
    }
  }, [state?.error]);
  const [usernameManuallyEdited, setUsernameManuallyEdited] = useState(false);
  const emailCheck = useAvailabilityCheck<string | null>({
    prepareValue: prepareEmailValue,
    shouldCheck: shouldCheckEmail,
    validate: validateEmailValue,
    checkingMessage: "Checking...",
    errorMessage: "Unable to verify email. Please try again.",
    check: checkEmailAvailability,
  });

  const usernameCheck = useAvailabilityCheck({
    debounceMs: 350,
    normalize: normalizeSignupUsername,
    prepareValue: prepareUsernameValue,
    shouldCheck: shouldCheckUsername,
    validate: validateUsernameValue,
    checkingMessage: "Checking availability...",
    errorMessage: "We couldn't verify that username. Please try again.",
    check: checkUsernameAvailability,
  });

  // Derive a username-friendly string from an email address
  const deriveUsernameFromEmail = useCallback((email: string): string => {
    const localPart = email.split("@")[0] || "";
    return normalizeSignupUsername(localPart);
  }, []);

  // Handle email changes and auto-populate username if not manually edited
  const handleEmailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const email = event.target.value;
    emailCheck.setValue(email);

    // Only auto-populate username if user hasn't manually edited it
    if (!usernameManuallyEdited) {
      const derivedUsername = deriveUsernameFromEmail(email);
      usernameCheck.setValue(derivedUsername);
    }
  };

  // Check email availability on blur
  const handleEmailBlur = () => {
    void emailCheck.runCheck();
  };

  const handleUsernameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = event.target.value;
    usernameCheck.setValue(rawValue);
    // Mark as manually edited so email changes don't overwrite it
    setUsernameManuallyEdited(true);
  };

  const handleUsernameBlur = async () => {
    void usernameCheck.runCheck();
  };

  const emailStatusClass =
    emailCheck.status === "available"
      ? "text-emerald-600"
      : emailCheck.status === "taken" ||
          emailCheck.status === "invalid" ||
          emailCheck.status === "error"
        ? "text-destructive"
        : "text-muted-foreground";

  const existingUsername = emailCheck.data;

  const usernameStatusClass =
    usernameCheck.status === "available"
      ? "text-emerald-600"
      : usernameCheck.status === "taken" ||
          usernameCheck.status === "invalid" ||
          usernameCheck.status === "error"
        ? "text-destructive"
        : "text-muted-foreground";
  const usernameDescriptionIds = usernameCheck.message
    ? "signup-username-helper signup-username-status"
    : "signup-username-helper";

  // Compute the plan ID based on tier and billing cycle
  const planId = useMemo(() => {
    if (lifetimeIntent) return "tutor_life";
    return `${tier}_${billingCycle}` as const;
  }, [tier, billingCycle, lifetimeIntent]);

  return (
    <div className="relative">
      <form action={formAction} className={`space-y-6 ${isShaking ? "animate-shake" : ""}`}>
        <input type="hidden" name="plan" value={planId} />
        {checkoutSessionId ? (
          <input type="hidden" name="checkout_session_id" value={checkoutSessionId} />
        ) : null}
        {lifetimeIntent ? (
          <input type="hidden" name="lifetime" value="true" />
        ) : null}
        {lifetimeSource ? (
          <input type="hidden" name="lifetime_source" value={lifetimeSource} />
        ) : null}
        <div className="space-y-2">
          <label
            htmlFor="full_name"
            className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground"
          >
            Full name
          </label>
          <input
            id="full_name"
            name="full_name"
            type="text"
            required
            autoComplete="name"
            className="block h-12 w-full rounded-xl border-0 bg-secondary/50 px-4 text-base text-foreground placeholder:text-muted-foreground shadow-none focus:bg-secondary/70 focus:outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="Jane Doe"
          />
        </div>

      <div className="space-y-2">
        <label
          htmlFor="email"
          className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground"
        >
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          value={emailCheck.value}
          onChange={handleEmailChange}
          onBlur={handleEmailBlur}
          className="block h-12 w-full rounded-xl border-0 bg-secondary/50 px-4 text-base text-foreground placeholder:text-muted-foreground shadow-none focus:bg-secondary/70 focus:outline-none focus:ring-2 focus:ring-primary/30"
          placeholder="you@example.com"
          aria-describedby={emailCheck.message ? "signup-email-status" : undefined}
        />
        {emailCheck.status === "taken" && existingUsername ? (
          <p className={`text-xs ${emailStatusClass}`} id="signup-email-status" aria-live="polite">
            This email is already registered as{" "}
            <span className="font-semibold">@{existingUsername}</span>.{" "}
            <Link href="/login" className="text-primary font-semibold hover:underline">
              Log in instead
            </Link>
          </p>
        ) : emailCheck.message ? (
          <p className={`text-xs ${emailStatusClass}`} id="signup-email-status" aria-live="polite">
            {emailCheck.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label
          htmlFor="username"
          className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground"
        >
          Username
        </label>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-base text-muted-foreground">
            @
          </div>
          <input
            id="username"
            name="username"
            value={usernameCheck.value}
            onChange={handleUsernameChange}
            onBlur={handleUsernameBlur}
            type="text"
            required
            minLength={3}
            maxLength={32}
            className="block h-12 w-full rounded-xl border-0 bg-secondary/50 px-4 pl-10 text-base text-foreground placeholder:text-muted-foreground shadow-none focus:bg-secondary/70 focus:outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="username"
            pattern="^[a-z0-9\-]+$"
            title="Use 3-32 lowercase letters, numbers, or dashes."
            autoComplete="username"
            aria-describedby={usernameDescriptionIds}
          />
        </div>
        <p className="text-xs text-muted-foreground" id="signup-username-helper">
          This becomes your public profile link: <span className="font-semibold">tutorlingua.co/@username</span>
        </p>
        {usernameCheck.message && (
          <p
            className={`text-xs ${usernameStatusClass}`}
            id="signup-username-status"
            aria-live="polite"
          >
            {usernameCheck.message}
          </p>
        )}
      </div>

      <PasswordInput
        id="password"
        name="password"
        label="Password"
        required
        minLength={8}
        autoComplete="new-password"
        fieldClassName="space-y-2"
        labelClassName="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground"
        containerClassName="relative"
        inputClassName="block h-12 w-full rounded-xl border-0 bg-secondary/50 px-4 pr-12 text-base text-foreground placeholder:text-muted-foreground shadow-none focus:bg-secondary/70 focus:outline-none focus:ring-2 focus:ring-primary/30"
        buttonClassName="absolute inset-y-0 right-3 inline-flex items-center text-muted-foreground hover:text-foreground"
      />

      <FormStatusAlert
        tone="error"
        message={state?.error}
        as="p"
        className="animate-in fade-in slide-in-from-top-2 duration-200"
      />

      <div className="space-y-3 rounded-2xl border border-border/60 bg-secondary/30 p-4 text-xs text-muted-foreground">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            name="terms_accepted"
            required
            className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
          />
          <span>
            I agree to the{" "}
            <Link href="/terms" className="underline underline-offset-4">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline underline-offset-4">
              Privacy Policy
            </Link>
            .
          </span>
        </label>
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            name="tutor_recording_consent"
            required
            className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
          />
          <span>
            I am 18+ and consent to TutorLingua using lesson recordings with adult students only
            for internal training to improve accuracy and for marketing clips.
          </span>
        </label>
      </div>

      <button
        type="submit"
        className="w-full h-12 rounded-full bg-primary px-4 text-base font-medium text-primary-foreground shadow-lg shadow-primary/20 transition hover:scale-[1.01] hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
        disabled={Boolean(state?.success) || isPending}
      >
        {isPending ? "Creating..." : "Start Free Trial"}
      </button>

      </form>
    </div>
  );
}
