"use client";
import { useActionState, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { signUp, type AuthActionState } from "@/lib/actions/auth";
import { normalizeSignupUsername } from "@/lib/utils/username-slug";

const initialState: AuthActionState = {
  error: undefined,
  success: undefined,
  redirectTo: undefined,
};
const USERNAME_PATTERN = /^[a-z0-9-]{3,32}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
type UsernameStatus = "idle" | "checking" | "available" | "taken" | "invalid" | "error";
type EmailStatus = "idle" | "checking" | "available" | "taken" | "invalid" | "error";

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
  const [state, formAction, isPending] = useActionState<AuthActionState, FormData>(
    signUp,
    initialState
  );
  const [showPassword, setShowPassword] = useState(false);
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
  const [emailValue, setEmailValue] = useState("");
  const [emailStatus, setEmailStatus] = useState<EmailStatus>("idle");
  const [emailMessage, setEmailMessage] = useState("");
  const [existingUsername, setExistingUsername] = useState<string | null>(null);
  const [usernameValue, setUsernameValue] = useState("");
  const [usernameManuallyEdited, setUsernameManuallyEdited] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>("idle");
  const [usernameMessage, setUsernameMessage] = useState("");
  const lastRequestId = useRef(0);
  const lastEmailRequestId = useRef(0);
  const debounceRef = useRef<number | null>(null);

  const resetUsernameFeedback = useCallback(() => {
    setUsernameStatus("idle");
    setUsernameMessage("");
  }, []);

  const resetEmailFeedback = useCallback(() => {
    setEmailStatus("idle");
    setEmailMessage("");
    setExistingUsername(null);
  }, []);

  // Check if email is already registered
  const checkEmailAvailability = useCallback(async (email: string, requestId: number) => {
    try {
      const response = await fetch(
        `/api/email/check?email=${encodeURIComponent(email)}`,
        { method: "GET", cache: "no-store" }
      );

      const payload: {
        exists?: boolean;
        status?: string;
        username?: string;
        message?: string;
      } | null = await response.json().catch(() => null);

      if (lastEmailRequestId.current !== requestId) return;

      if (!response.ok) {
        setEmailStatus(payload?.status === "invalid" ? "invalid" : "error");
        setEmailMessage(payload?.message ?? "Unable to verify email.");
        return;
      }

      if (payload?.exists) {
        setEmailStatus("taken");
        setExistingUsername(payload.username ?? null);
        setEmailMessage(payload.message ?? "This email is already registered.");
      } else {
        setEmailStatus("available");
        setEmailMessage("");
        setExistingUsername(null);
      }
    } catch {
      if (lastEmailRequestId.current !== requestId) return;
      setEmailStatus("error");
      setEmailMessage("Unable to verify email. Please try again.");
    }
  }, []);

  // Derive a username-friendly string from an email address
  const deriveUsernameFromEmail = useCallback((email: string): string => {
    const localPart = email.split("@")[0] || "";
    return normalizeSignupUsername(localPart);
  }, []);

  // Handle email changes and auto-populate username if not manually edited
  const handleEmailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const email = event.target.value;
    setEmailValue(email);

    // Reset email feedback when typing
    if (emailStatus !== "idle") {
      resetEmailFeedback();
    }

    // Only auto-populate username if user hasn't manually edited it
    if (!usernameManuallyEdited) {
      const derivedUsername = deriveUsernameFromEmail(email);
      setUsernameValue(derivedUsername);
      if (usernameStatus !== "idle") {
        resetUsernameFeedback();
      }
    }
  };

  // Check email availability on blur
  const handleEmailBlur = () => {
    const email = emailValue.trim().toLowerCase();

    if (!email) {
      resetEmailFeedback();
      return;
    }

    if (!EMAIL_PATTERN.test(email)) {
      setEmailStatus("invalid");
      setEmailMessage("Please enter a valid email address.");
      return;
    }

    const requestId = Date.now();
    lastEmailRequestId.current = requestId;
    setEmailStatus("checking");
    setEmailMessage("Checking...");
    void checkEmailAvailability(email, requestId);
  };

  const performAvailabilityRequest = useCallback(
    async (value: string, requestId: number) => {
      try {
        const response = await fetch(
          `/api/username/check?username=${encodeURIComponent(value)}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const payload: {
          available?: boolean;
          status?: UsernameStatus | "invalid" | "error";
          message?: string;
        } | null = await response.json().catch(() => null);

        if (lastRequestId.current !== requestId) {
          return;
        }

        if (!response.ok) {
          const status = payload?.status === "invalid" ? "invalid" : "error";
          setUsernameStatus(status);
          setUsernameMessage(
            payload?.message ??
              (status === "invalid"
                ? "Usernames must be 3-32 characters using lowercase letters, numbers, or dashes."
                : "We couldn't verify that username. Please try again.")
          );
          return;
        }

        setUsernameStatus(payload?.available ? "available" : "taken");
        setUsernameMessage(
          payload?.available
            ? `Great choice! @${value} is available.`
            : "That username is already taken. Try another."
        );
      } catch {
        if (lastRequestId.current !== requestId) {
          return;
        }
        setUsernameStatus("error");
        setUsernameMessage("We couldn't verify that username. Please try again.");
      }
    },
    []
  );

  const handleUsernameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = event.target.value;
    const sanitizedValue = normalizeSignupUsername(rawValue);
    setUsernameValue(sanitizedValue);
    // Mark as manually edited so email changes don't overwrite it
    setUsernameManuallyEdited(true);
    if (usernameStatus !== "idle") {
      resetUsernameFeedback();
    }
  };

  const handleUsernameBlur = async () => {
    const value = usernameValue.trim();

    if (!value) {
      resetUsernameFeedback();
      return;
    }

    if (value.length < 3) {
      setUsernameStatus("idle");
      setUsernameMessage("");
      return;
    }

    if (!USERNAME_PATTERN.test(value)) {
      setUsernameStatus("invalid");
      setUsernameMessage(
        "Usernames must be 3-32 characters and can only include lowercase letters, numbers, or dashes."
      );
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }

    const requestId = Date.now();
    lastRequestId.current = requestId;
    setUsernameStatus("checking");
    setUsernameMessage("Checking availability...");
    void performAvailabilityRequest(value, requestId);
  };

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }

    if (!usernameValue) {
      resetUsernameFeedback();
      return;
    }

    if (usernameValue.length < 3) {
      setUsernameStatus("idle");
      setUsernameMessage("");
      return;
    }

    if (!USERNAME_PATTERN.test(usernameValue)) {
      setUsernameStatus("invalid");
      setUsernameMessage(
        "Usernames must be 3-32 characters and can only include lowercase letters, numbers, or dashes."
      );
      return;
    }

    const requestId = Date.now();
    lastRequestId.current = requestId;
    setUsernameStatus("checking");
    setUsernameMessage("Checking availability...");

    debounceRef.current = window.setTimeout(() => {
      void performAvailabilityRequest(usernameValue, requestId);
    }, 350);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
  }, [usernameValue, performAvailabilityRequest, resetUsernameFeedback]);

  const emailStatusClass =
    emailStatus === "available"
      ? "text-emerald-600"
      : emailStatus === "taken" || emailStatus === "invalid" || emailStatus === "error"
        ? "text-destructive"
        : "text-muted-foreground";

  const usernameStatusClass =
    usernameStatus === "available"
      ? "text-emerald-600"
      : usernameStatus === "taken" || usernameStatus === "invalid" || usernameStatus === "error"
        ? "text-destructive"
        : "text-muted-foreground";
  const usernameDescriptionIds = usernameMessage
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
          value={emailValue}
          onChange={handleEmailChange}
          onBlur={handleEmailBlur}
          className="block h-12 w-full rounded-xl border-0 bg-secondary/50 px-4 text-base text-foreground placeholder:text-muted-foreground shadow-none focus:bg-secondary/70 focus:outline-none focus:ring-2 focus:ring-primary/30"
          placeholder="you@example.com"
          aria-describedby={emailMessage ? "signup-email-status" : undefined}
        />
        {emailStatus === "taken" && existingUsername ? (
          <p className={`text-xs ${emailStatusClass}`} id="signup-email-status" aria-live="polite">
            This email is already registered as{" "}
            <span className="font-semibold">@{existingUsername}</span>.{" "}
            <Link href="/login" className="text-primary font-semibold hover:underline">
              Log in instead
            </Link>
          </p>
        ) : emailMessage ? (
          <p className={`text-xs ${emailStatusClass}`} id="signup-email-status" aria-live="polite">
            {emailMessage}
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
            value={usernameValue}
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
        {usernameMessage && (
          <p
            className={`text-xs ${usernameStatusClass}`}
            id="signup-username-status"
            aria-live="polite"
          >
            {usernameMessage}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label
          htmlFor="password"
          className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground"
        >
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            minLength={8}
            autoComplete={showPassword ? "off" : "new-password"}
            className="block h-12 w-full rounded-xl border-0 bg-secondary/50 px-4 pr-12 text-base text-foreground placeholder:text-muted-foreground shadow-none focus:bg-secondary/70 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button
            type="button"
            className="absolute inset-y-0 right-3 inline-flex items-center text-muted-foreground hover:text-foreground"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {state?.error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive animate-in fade-in slide-in-from-top-2 duration-200">
          {state.error}
        </p>
      )}

      <p className="mt-6 text-center text-xs text-muted-foreground">
        By joining, you agree to our{" "}
        <Link href="/terms" className="underline underline-offset-4">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline underline-offset-4">
          Privacy Policy
        </Link>
        , including AI processing of your data and learning content.
      </p>

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
