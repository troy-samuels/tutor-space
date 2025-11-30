"use client";
import { useActionState, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { signUp, type AuthActionState } from "@/lib/actions/auth";
import { FounderOfferNotice } from "@/components/pricing/FounderOfferNotice";
import { getFounderPlanName } from "@/lib/pricing/founder";

const initialState: AuthActionState = { error: undefined, success: undefined };
const USERNAME_PATTERN = /^[a-z0-9-]{3,32}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
type UsernameStatus = "idle" | "checking" | "available" | "taken" | "invalid" | "error";
type EmailStatus = "idle" | "checking" | "available" | "taken" | "invalid" | "error";

export function SignupForm() {
  const [state, formAction, isPending] = useActionState<AuthActionState, FormData>(
    signUp,
    initialState
  );
  const [showPassword, setShowPassword] = useState(false);
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
    // Convert to lowercase and keep only allowed characters
    return localPart.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 32);
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
      } catch (error) {
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
    const sanitizedValue = rawValue.toLowerCase().replace(/[^a-z0-9-]/g, "");
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
  const plan = getFounderPlanName();

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="plan" value={plan} />

      <FounderOfferNotice variant="card" />

      <div className="space-y-2">
        <label htmlFor="full_name" className="block text-sm font-medium text-foreground">
          Full name
        </label>
        <input
          id="full_name"
          name="full_name"
          type="text"
          required
          className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="Jane Doe"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-medium text-foreground">
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
          className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
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
        <label htmlFor="username" className="block text-sm font-medium text-foreground">
          Username
        </label>
        <div className="relative rounded-md border border-input bg-background px-3 py-2 shadow-sm focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
          <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">
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
            className="block w-full border-0 bg-transparent pl-6 pr-0 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            placeholder="username"
            pattern="^[a-z0-9\-]+$"
            title="Use 3-32 lowercase letters, numbers, or dashes."
            autoComplete="username"
            aria-describedby={usernameDescriptionIds}
          />
        </div>
        <p className="text-xs text-muted-foreground" id="signup-username-helper">
          This becomes your public profile link: <span className="font-semibold">tutorlingua.com/@username</span>
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
        <label htmlFor="password" className="block text-sm font-medium text-foreground">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            minLength={6}
            className="block w-full rounded-md border border-input bg-background px-3 py-2 pr-10 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            type="button"
            className="absolute inset-y-0 right-2 inline-flex items-center text-muted-foreground hover:text-foreground"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Terms and Privacy Acceptance */}
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          id="terms"
          name="terms"
          required
          className="mt-1 h-4 w-4 rounded border-input text-primary focus:ring-primary focus:ring-offset-0 cursor-pointer"
        />
        <label htmlFor="terms" className="text-xs text-muted-foreground cursor-pointer">
          I agree to the{" "}
          <Link
            href="/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary font-semibold hover:underline"
          >
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary font-semibold hover:underline"
          >
            Privacy Policy
          </Link>
          . I understand TutorLingua provides the platform only and is not a party to, nor liable
          for, agreements between tutors and students.
        </label>
      </div>

      {state?.error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

      {state?.success && (
        <p className="rounded-md bg-emerald-100 px-3 py-2 text-sm text-emerald-700">
          {state.success}
        </p>
      )}

      <button
        type="submit"
        className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
        disabled={Boolean(state?.success) || isPending}
      >
        {isPending ? "Creating..." : "Create account"}
      </button>

    </form>
  );
}
